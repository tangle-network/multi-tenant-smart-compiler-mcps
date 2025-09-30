import { executeCommand, executeCommandStandalone } from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";

// RISC Zero mode handlers
export const handleSetRiscZeroMode = async (userId: string, terminalId: string, isDevMode: boolean): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    "export",
    `RISC0_DEV_MODE=${isDevMode.toString()}`
  )

  return {
    content: [{
      type: 'text',
      text: result?.message
    }],
    isError: !result.success
  }
  
};

export const handleGetRiscZeroMode = async (userId: string): Promise<CallToolResult> => {
  const result = await executeCommandStandalone(
    userId,
    "echo",
    "$RISC0_DEV_MODE"
  )
  return {
    content: [
      {
        type: "text",
        text: result?.message ?? "false",
      },
    ],
    isError: !result?.success
  };
};
