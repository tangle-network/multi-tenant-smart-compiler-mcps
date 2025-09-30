import { executeCommand } from "mcp-fs";
import type { CallToolResult } from "mcp-http/types";
import { BB_BIN } from "./constants.js";

export async function handleProving(
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    BB_BIN,
    `prove ${args}`,
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

export async function handleWriteVk(
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    BB_BIN,
    `write_vk ${args}`,
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

export async function handleVerify(
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    BB_BIN,
    `verify ${args}`,
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

export async function handleWriteSolidityVerifier(
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    BB_BIN,
    `write_solidity_verifier ${args}`,
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
