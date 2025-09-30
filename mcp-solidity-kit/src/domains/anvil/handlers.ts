import { type CallToolResult } from "mcp-http/types";
import { getAnvilInfo } from "./utils.js";
import { ANVIL_PATH } from "./constants.js";
import { executeCommand, killProcess, sleep } from "mcp-fs";

export const handleAnvilStart = async (
  userId: string,
  terminalId: string,
  args: string
): Promise<CallToolResult> => {
  // Check if anvil is already running
  const anvilInfo = await getAnvilInfo(userId);
  if (anvilInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: `Anvil is already running on port ${anvilInfo.port}.`,
        },
      ],
      isError: true,
    };
  }

  const result = await executeCommand(userId, terminalId, ANVIL_PATH, args);

  if (!result.success) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to start Anvil. Check system logs for details.\n${result.message}`,
        },
      ],
      isError: true,
    };
  }

  // Give it a moment to start
  await sleep(2000);

  // Check if it started successfully
  const newAnvilInfo = await getAnvilInfo(userId);
  if (newAnvilInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
      ],
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: `Failed to start Anvil. Check system logs for details.`,
        },
      ],
      isError: true,
    };
  }
};

export const handleAnvilStop = async (
  userId: string,
  terminalId: string
): Promise<CallToolResult> => {
  const anvilInfo = await getAnvilInfo(userId);
  if (!anvilInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "No Anvil instance is currently running.",
        },
      ],
      isError: true,
    };
  }

  await killProcess(userId, "anvil");

  // Check if it was stopped successfully
  await sleep(500);
  const newAnvilInfo = await getAnvilInfo(userId);

  if (!newAnvilInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "Anvil has been stopped successfully.",
        },
      ],
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: "Failed to stop Anvil. It may still be running.",
        },
      ],
      isError: true,
    };
  }
};

export const handleAnvilStatus = async (
  userId: string
): Promise<CallToolResult> => {
  const anvilInfo = await getAnvilInfo(userId);
  return {
    content: [
      {
        type: "text",
        text: `Anvil is ${anvilInfo.running ? "running" : "not running"}.`,
      },
    ],
  };
};
