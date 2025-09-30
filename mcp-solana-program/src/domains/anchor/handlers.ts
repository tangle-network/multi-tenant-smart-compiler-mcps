import { executeCommand } from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";
import { ANCHOR_BIN } from "./constants.js";

export const handleAnchorBuild = async (
  userId: string,
  terminalId: string
): Promise<CallToolResult> => {
  const buildResult = await handleAnchorBuildCmd(userId, terminalId);

  return {
    content: [
      {
        type: "text",
        text: buildResult.message,
      },
    ],
    isError: !buildResult.success,
  };
};

export const handleAnchorTest = async (
  userId: string,
  terminalId: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    ANCHOR_BIN,
    `test ${args}`
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

export const handleAnchorDeploy = async (
  userId: string,
  terminalId: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    ANCHOR_BIN,
    `deploy ${args}`
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

export const handleAnchorKeysList = async (
  userId: string,
  terminalId: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    ANCHOR_BIN,
    `keys list`
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

export const handleAnchorKeysSync = async (
  userId: string,
  terminalId: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    ANCHOR_BIN,
    `keys sync`
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

export const handleYarnInstall = async (userId: string, terminalId: string) => {
  return executeCommand(userId, terminalId, "yarn", "install");
};

export const handleAnchorBuildCmd = async (
  userId: string,
  terminalId: string
) => {
  return executeCommand(userId, terminalId, ANCHOR_BIN, "build");
};
