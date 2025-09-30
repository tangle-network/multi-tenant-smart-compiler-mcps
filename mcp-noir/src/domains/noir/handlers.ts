import { executeCommand } from "mcp-fs";
import type { CallToolResult } from "mcp-http/types";
import { NARGO_BIN } from "./constants.js";

export async function handleNargoCheck(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    NARGO_BIN,
    `check ${args}`,
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
}

export async function handleNargoExecute(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    NARGO_BIN,
    `execute ${args}`,
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
}

export async function handleNargoCompile(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    NARGO_BIN,
    `compile ${args}`,
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
}