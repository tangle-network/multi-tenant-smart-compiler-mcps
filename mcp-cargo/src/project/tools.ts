import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureError, zTerminalId } from "mcp-fs";
import { executeCommand } from "mcp-fs";
import z from "zod";
import { CARGO_PATH } from "./constants.js";
import { getUserIdFromRequest } from "mcp-http";

const handleCargoCommand = async (
  userId: string,
  terminalId: string,
  subcommand: string,
  compilationOpt: string[] = []
) => {
  try {
    const formattedCompilationOpt = compilationOpt.map((opt) =>
      opt.startsWith("--") ? opt : `--${opt}`
    );
    const cargoArgs = [subcommand, ...formattedCompilationOpt].join(" ");
    const { success, message } = await executeCommand(
      userId,
      terminalId,
      CARGO_PATH,
      cargoArgs
    );

    return {
      isError: !success,
      content: [{ type: "text" as const, text: message || "" }],
    };
  } catch (unknownError) {
    const error = ensureError(unknownError);

    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error: ${error.message}` }],
    };
  }
};

export function registerCargoTools(server: McpServer) {
  // Tool: cargo-build
  server.tool(
    "cargo-build",
    "Compile Rust project to binary/library. PREREQUISITE: Must have terminalId from create-terminal tool for a valid Rust project. Use for: generating executables, checking build errors, preparing for deployment. Run AFTER code changes, BEFORE cargo-run/test. Creates target/ directory with artifacts. Workflow: create-project → create-terminal → cargo-build",
    {
      terminalId: zTerminalId,
      compilationOpt: z
        .array(z.string())
        .optional()
        .describe(
          "Compilation options to pass to cargo. i.e  --release --target x86_64-unknown-linux-gnu --features=testnet,txpool -- --foo bar"
        ),
    },
    async ({ terminalId, compilationOpt }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCargoCommand(userId, terminalId, "build", compilationOpt);
    }
  );

  // Tool: cargo-check
  server.tool(
    "cargo-check",
    "Checks compile errors of a Rust project using cargo. PREREQUISITE: Must have terminalId from create-terminal tool for a valid Rust project. Faster than cargo-build as it doesn't generate binaries. Use for: quick error checking during development. Workflow: create-project → create-terminal → cargo-check",
    {
      terminalId: zTerminalId,
      compilationOpt: z
        .array(z.string())
        .optional()
        .describe(
          "Compilation options to pass to cargo. i.e  --release --target x86_64-unknown-linux-gnu --features=testnet,txpool -- --foo bar"
        ),
    },
    async ({ terminalId, compilationOpt }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCargoCommand(userId, terminalId, "check", compilationOpt);
    }
  );

  // Tool: cargo-clippy
  server.tool(
    "cargo-clippy",
    "Runs clippy to check for common mistakes, style issues, and suggests improvements for more idiomatic Rust code. PREREQUISITE: Must have terminalId from create-terminal tool for a valid Rust project. Use for: code quality analysis, finding common mistakes, enforcing best practices. Workflow: create-project → create-terminal → cargo-clippy",
    {
      terminalId: zTerminalId,
      compilationOpt: z
        .array(z.string())
        .optional()
        .describe(
          "Compilation options to pass to cargo. i.e  --release --target x86_64-unknown-linux-gnu --features=testnet,txpool -- --foo bar"
        ),
    },
    async ({ terminalId, compilationOpt }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCargoCommand(userId, terminalId, "clippy", compilationOpt);
    }
  );

  // Tool: cargo-test
  server.tool(
    "cargo-test",
    "Runs tests for a Rust project using cargo. PREREQUISITE: Must have terminalId from create-terminal tool for a valid Rust project with tests. Use for: running unit tests, integration tests, doc tests. Workflow: create-project → create-terminal → [cargo-build] → cargo-test",
    {
      terminalId: zTerminalId,
      compilationOpt: z
        .array(z.string())
        .optional()
        .describe(
          "Compilation options to pass to cargo. i.e  --release --target x86_64-unknown-linux-gnu --features=testnet,txpool -- --foo bar"
        ),
    },
    async ({ terminalId, compilationOpt }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCargoCommand(userId, terminalId, "test", compilationOpt);
    }
  );

  // Tool: cargo-run
  server.tool(
    "cargo-run",
    "Build and execute Rust binary. PREREQUISITE: Must have terminalId from create-terminal tool for a valid Rust project with main() function. Use for: running main(), testing CLI apps, executing examples. Combines cargo-build + execution. For Blueprint jobs, prefer specialized runtime tools. Workflow: create-project → create-terminal → cargo-run",
    {
      terminalId: zTerminalId,
      compilationOpt: z
        .array(z.string())
        .optional()
        .describe(
          "Compilation options to pass to cargo. i.e  --release --target x86_64-unknown-linux-gnu --features=testnet,txpool -- --foo bar"
        ),
    },
    async ({ terminalId, compilationOpt }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCargoCommand(userId, terminalId, "run", compilationOpt);
    }
  );

  // Tool: cargo
  server.tool(
    "cargo",
    "Execute any cargo subcommand. PREREQUISITE: Must have terminalId from create-terminal tool for a valid Rust project. Use for: 'fmt' (formatting), 'doc' (generate docs), 'tree' (dep graph), 'clean' (remove target/), 'add <crate>' (add dependency). Fallback for specialized cargo operations. Workflow: create-project → create-terminal → cargo <subcommand>",
    {
      terminalId: zTerminalId,
      subcommand: z.string(),
      compilationOpt: z
        .array(z.string())
        .optional()
        .describe(
          "Compilation options to pass to cargo. i.e  --release --target x86_64-unknown-linux-gnu --features=testnet,txpool -- --foo bar"
        ),
    },
    async ({ terminalId, subcommand, compilationOpt }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCargoCommand(userId, terminalId, subcommand, compilationOpt);
    }
  );

  // Tool: set RUST log
  server.tool(
    "set-rust-log",
    "Sets the RUST_LOG environment variable for a project. PREREQUISITE: Must have terminalId from create-terminal tool. Use for: enabling debug logging, controlling log levels for Rust applications. Common values: 'debug', 'info', 'warn', 'error', 'trace'. Workflow: create-project → create-terminal → set-rust-log",
    { logLevel: z.string(), terminalId: zTerminalId },
    async ({ terminalId, logLevel }, req) => {
      const userId = getUserIdFromRequest(req);
      const resp = await executeCommand(
        userId,
        terminalId,
        "export",
        `RUST_LOG=${logLevel}`
      );
      return {
        isError: !resp.success,
        content: [{ type: "text", text: resp.message || "" }],
      };
    }
  );
}
