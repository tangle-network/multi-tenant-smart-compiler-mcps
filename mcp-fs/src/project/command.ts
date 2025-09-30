import { ensureError, execAsync, generateUniqueRandomId } from "mcp-fs";
import {
  type ChildProcessWithoutNullStreams,
  type Serializable,
  spawn,
} from "node:child_process";
// import { SecurityLogManager } from "./security.js";
import { Mutex } from "async-mutex";
import {
  attachPidToTenant,
  ensureTenantCgroup,
  getEnvTenantLimits,
  isCgroupV2Supported,
} from "./cgroups.js";
import { applyRlimits, getEnvRlimits } from "./limits.js";
import type { SpawnProcessCallback } from "./types.js";

// Terminal output accumulator
interface TerminalOutput {
  stdout: string;
  stderr: string;
}

// Tracks user processes. UserId => id => Process
export const userTerminals: Map<
  string,
  Map<string, ChildProcessWithoutNullStreams>
> = new Map();

// Tracks accumulated terminal output. UserId => id => Output
export const userTerminalOutputs: Map<
  string,
  Map<string, TerminalOutput>
> = new Map();
const userProcessMutex = new Mutex();
async function withUserTerminal<T>(fn: () => T | Promise<T>): Promise<T> {
  return userProcessMutex.runExclusive(fn);
}

export async function listTerminal(userId: string) {
  return Array.from(userTerminals.get(userId)?.keys() || []);
}

export async function killTerminal(userId: string, terminalId: string) {
  return withUserTerminal(() => {
    const child = userTerminals.get(userId)?.get(terminalId);
    if (child) {
      const killed = child.kill("SIGTERM");
      if (killed || child.killed) {
        userTerminals.get(userId)?.delete(terminalId);
        userTerminalOutputs.get(userId)?.delete(terminalId);
        child.removeAllListeners();
        child.stdin?.removeAllListeners();
        child.stdout?.removeAllListeners();
        child.stderr?.removeAllListeners();
        child.stdin?.end();
        child.stdout?.destroy();
        child.stderr?.destroy();
        return { success: true, message: "Terminal killed." };
      } else {
        return {
          success: false,
          message: "Failed to kill terminal process. Please try again later.",
        };
      }
    } else {
      return {
        success: false,
        message: "Terminal not found.",
      };
    }
  });
}

export async function createTerminal(
  userId: string,
  workspaceToUse: string,
  callback?: SpawnProcessCallback
): Promise<{ success: boolean; message: string }> {
  const terminalId = generateUniqueRandomId(
    Array.from(userTerminals.get(userId)?.keys() || [])
  );
  let child: ChildProcessWithoutNullStreams | null = null;

  function cleanup() {
    if (child && !child.killed) {
      child.kill("SIGTERM");
      child = null;
      console.log(`Cleaned up ${terminalId} of ${userId} process.`);
    }
  }

  const preCallBack: SpawnProcessCallback = (event) => {
    if (event.type === "close" || event.type === "exit") {
      void withUserTerminal(() => {
        userTerminals.get(userId)?.delete(terminalId);
        userTerminalOutputs.get(userId)?.delete(terminalId);
      });
    }
    event.tid = terminalId;
    callback?.(event);
  };

  try {
    child = spawn("su", ["-", userId], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
      detached: true,
      env: process.env,
    });

    if (!child.stdin) {
      return {
        success: false,
        message: "stdin is not supported",
      };
    }

    child.stdin.write(`cd ${workspaceToUse}\n`);

    if (!userTerminals.get(userId)) {
      userTerminals.set(userId, new Map([[terminalId, child]]));
    } else {
      userTerminals.get(userId)?.set(terminalId, child);
    }

    // Initialize output storage
    if (!userTerminalOutputs.get(userId)) {
      userTerminalOutputs.set(
        userId,
        new Map([[terminalId, { stdout: "", stderr: "" }]])
      );
    } else {
      userTerminalOutputs
        .get(userId)
        ?.set(terminalId, { stdout: "", stderr: "" });
    }

    // Attach resource controls (best effort)
    try {
      if (typeof child.pid === "number") {
        const cLimits = getEnvTenantLimits();
        if (isCgroupV2Supported()) {
          await ensureTenantCgroup(userId, cLimits);
          await attachPidToTenant(userId, child.pid);
        }
        const rLimits = getEnvRlimits();
        applyRlimits(child.pid, rLimits);
      }
    } catch {}

    child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(
        `${terminalId} of ${userId} process closed with code ${code} and signal ${signal}`
      );
      preCallBack?.({ type: "close", code, signal });
    });
    child.on("error", (error: Error) => {
      console.error(
        `${terminalId} of ${userId} process error: ${error.message}`
      );
      cleanup();
      preCallBack?.({ type: "error", error: ensureError(error) });
    });
    child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(
        `${terminalId} of ${userId} process exited with code ${code} and signal ${signal}`
      );
      cleanup();
      preCallBack?.({ type: "exit", code, signal });
    });
    child.on("message", (message: Serializable) => {
      console.log(`${terminalId} of ${userId} process message: ${message}`);
      preCallBack?.({ type: "message", message });
    });
    child.on("spawn", () => {
      console.log(`${terminalId} of ${userId} process spawned`);
      preCallBack?.({ type: "spawn" });
    });

    // Handle stdout stream
    if (child.stdout) {
      child.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        console.log(`${terminalId} of ${userId} process stdout: ${output}`);

        // Accumulate stdout output
        const terminalOutput = userTerminalOutputs.get(userId)?.get(terminalId);
        if (terminalOutput) {
          terminalOutput.stdout += output;
        }

        preCallBack?.({ type: "stdout", data: output });
      });
    }

    // Handle stderr stream
    if (child.stderr) {
      child.stderr.on("data", (data: Buffer) => {
        const output = data.toString();
        console.log(`${terminalId} of ${userId} process stderr: ${output}`);

        // Accumulate stderr output
        const terminalOutput = userTerminalOutputs.get(userId)?.get(terminalId);
        if (terminalOutput) {
          terminalOutput.stderr += output;
        }

        preCallBack?.({ type: "stderr", data: output });
      });
    }

    child.on("disconnect", () => {
      console.log(`${terminalId} of ${userId} process disconnected`);
      preCallBack?.({ type: "disconnect" });
    });

    // Listen for termination signals to ensure cleanup
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    return {
      success: true,
      message: terminalId,
    };
  } catch (error: any) {
    console.error("Create terminal failed with error:", error);
    return {
      success: false,
      message: "Internal server error.",
    };
  }
}

export async function executeCommand(
  userId: string,
  terminalId: string,
  cmd: string,
  args: string
): Promise<{ success: boolean; message: string }> {
  // // Initialize security manager if not already done
  // await SecurityLogManager.initialize(userId + '_' + terminalId);
  // SecurityLogManager.registerCommonSecrets();

  // Log the masked command for debugging
  // const maskedCommand = SecurityLogManager.createSecureCommand(cmd, args);

  // TODO Replace this with linux OS validation instead
  // // Validate that cmd only contains safe characters (whitelist approach)
  // validateCommand(cmd);

  const fullCmd = `${cmd} ${args}`;
  // // Validate that args only contains safe characters and expected patterns
  // validateArgs(args);

  // const { isInvalidCommand, cmd: parsedCmd } = parseCommand(fullCmd);
  // if (isInvalidCommand) {
  //   return { success: false, message: `Invalid command: ${maskedCommand}` };
  // }

  try {
    const userProcess = userTerminals.get(userId)?.get(terminalId);
    if (!userProcess) {
      return {
        success: false,
        message:
          "Terminal not found, please create one first using `create-terminal` tool.",
      };
    }

    console.debug("Executing command: ", fullCmd);

    userProcess.stdin.write(`${cmd} ${args}\n`);

    return { success: true, message: "Command execution finished." };
  } catch (error: any) {
    console.error("Execute command failed with error:", error);
    return { success: false, message: "Internal server error." };
  }
}

/**
 *  @dev `executeCommandStandalone` is used in read resource only
 */
export async function executeCommandStandalone(
  userId: string,
  cmd: string,
  args: string
): Promise<{ success: boolean; message: string }> {
  const fullCmd = `${cmd} ${args}`;

  try {
    console.debug("Executing command: ", fullCmd);

    const { stdout, stderr } = await execAsync(userId, fullCmd);

    if (stderr) {
      return { success: false, message: stderr.toString() };
    }

    return { success: true, message: stdout.toString() };
  } catch (error: any) {
    console.error("Execute command failed with error:", error);
    return { success: false, message: "Internal server error." };
  }
}

export const killProcess = async (
  userId: string,
  processName: string
): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    const child = spawn("pkill", ["-u", userId, "-f", processName], {
      stdio: "inherit",
    });
    child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(
        `Process ${processName} killed with code ${code} and signal ${signal}`
      );
      resolve(true);
    });
    child.on("error", (err: Error) => {
      reject(err);
    });
  });
};
