import { executeCommand } from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";
import { ADERYN_PATH } from "./constants.js";

export const handleAderynAnalyze = async (
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    ADERYN_PATH,
    args,
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
