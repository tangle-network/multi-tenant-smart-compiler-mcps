import { executeCommand, killProcess, sleep } from "mcp-fs";
import type { CallToolResult } from "mcp-http/types";
import { getNitroInfo } from "./utils.js";

export async function handleNitroLocalnetStart(userId: string, terminalId: string, port: number): Promise<CallToolResult> {
  const nitroInfo = await getNitroInfo(userId);
  if (nitroInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "Nitro localnet is already running.",
        },
      ],
      isError: false,
    };
  }

  const result = await executeCommand(
    userId,
    terminalId,
    `NITRO_PORT=${port} bash`,
    `/usr/local/bin/run-dev-node.sh`
  );

  if (!result.success) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to start Nitro. It may still be running.`,
        },
      ],
      isError: true,
    };
  }

  // Give it a moment to start
  await sleep(1000);

  const newNitroInfo = await getNitroInfo(userId);
  if (newNitroInfo.running) {
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
          text: "Failed to start Nitro. It may still be running.",
        },
      ],
      isError: true,
    };
  }
};

export const handleNitroLocalnetStop = async (userId: string): Promise<CallToolResult> => {
  const nitroInfo = await getNitroInfo(userId);
  if (!nitroInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "No Nitro instance is currently running.",
        },
      ],
      isError: true,
    };
  }

  await killProcess(userId, "nitro --dev");

  // Check if it was stopped successfully
  await sleep(500);
  const newNitroInfo = await getNitroInfo(userId);

  if (!newNitroInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "Nitro has been stopped successfully.",
        },
      ],
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: "Failed to stop Nitro. It may still be running.",
        },
      ],
      isError: true,
    };
  }
};

export async function handleNitroLocalnetStatus(userId: string): Promise<CallToolResult> {
  const nitroInfo = await getNitroInfo(userId);
  return {
    content: [
      {
        type: "text",
        text: `Nitro is ${nitroInfo.running ? "running" : "not running"}.`,
      },
    ],
  };
}