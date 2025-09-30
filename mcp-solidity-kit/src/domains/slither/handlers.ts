import { type CallToolResult } from "mcp-http/types";
import { executeCommand } from "mcp-fs";
import {
  SLITHER_PATH,
} from "./constants.js";

export const handleSlitherAnalyze = async (
  userId: string,
  terminalId: string,
  targetPath: string,
  args: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    SLITHER_PATH,
    `${targetPath} ${args}`,
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

export const handleSlitherListDetectors = async (
  userId: string,
  terminalId: string,
): Promise<CallToolResult> => {
  const command = `--list-detectors`;
  const result = await executeCommand(
    userId,
    terminalId,
    SLITHER_PATH,
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

export const handleSlitherListPrinters = async (
  userId: string,
  terminalId: string,
): Promise<CallToolResult> => {
  const command = `--list-printers`;
  const result = await executeCommand(
    userId,
    terminalId,
    SLITHER_PATH,
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

export const handleSlitherAnalyzeWithPrinters = async (
  userId: string,
  terminalId: string,
  targetPath: string,
  printersToRun: string,
  args: string,
): Promise<CallToolResult> => {
  // run commands from the foundry workspace
  const result = await executeCommand(
    userId,
    terminalId,
    SLITHER_PATH,
    `analyze ${targetPath} --print ${printersToRun} ${args}`,
  );

  // Printers often output a lot, successful or not.
  // The main distinction for `isError` should be if the command itself failed to run.
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
    ],
    // Don't mark as error if there's any message, as printers might "fail" but still output useful info.
    // Only a true execution failure should be an error.
    isError: !result.success && !result.message,
  };
};
