import { type CallToolResult } from "mcp-http/types";
import { ECHIDNA_PATH } from "./constants.js";
import { executeCommand } from "mcp-fs";

export const handleEchidnaTest = async (
  userId: string,
  terminalId: string,
  targetFiles: string,
  args: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    ECHIDNA_PATH,
    `${targetFiles} ${args}`,
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
