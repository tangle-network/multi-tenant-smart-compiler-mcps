import { type CallToolResult } from "mcp-http/types";
import { FORGE_PATH } from "./constants.js";
import { executeCommand, createSecureCommandWithPrivateKey } from "mcp-fs";

export const handleForgeInstall = async (
  userId: string,
  terminalId: string,
  dependency: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    FORGE_PATH,
    `install ${dependency} --no-git`,
  );

  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
    ],
    isError: !result.success,
  };
};

export const handleForgeBuild = async (
  userId: string,
  terminalId: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    FORGE_PATH,
    "build",
  );

  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
    ],
    isError: !result.success,
  };
};

export const handleForgeTest = async (
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    FORGE_PATH,
    `test ${args}`,
  );

  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
    ],
    isError: !result.success,
  };
};

export const handleForgeScript = async (
  userId: string,
  terminalId: string,
  scriptPath: string,
  privateKey: string,
  sig: string = "run()",
  args: string = "",
): Promise<CallToolResult> => {
  const { command } = createSecureCommandWithPrivateKey(
    `script ${scriptPath} --sig "${sig}"`,
    privateKey,
    args,
  );

  const result = await executeCommand(
    userId,
    terminalId,
    FORGE_PATH,
    command,
  );

  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
    ],
    isError: !result.success,
  };
};
