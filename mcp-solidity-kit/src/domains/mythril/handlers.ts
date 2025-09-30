import { executeCommand } from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";
import { MYTHRIL_PATH } from "./constants.js";

export const handleMythrilAnalyze = async (
  userId: string,
  terminalId: string,
  targetPath: string,
  args: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    MYTHRIL_PATH,
    `analyze ${targetPath} ${args}`,
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

export const handleMythrilListDetectors = async (
  userId: string,
  terminalId: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    MYTHRIL_PATH,
    "list-detectors",
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
