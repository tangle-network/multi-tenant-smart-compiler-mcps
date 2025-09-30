import { type CallToolResult } from "mcp-http/types";
import { SOLANA_LOCALNET_BIN } from "./constants.js";
import { getSVMLocalnetInfo } from "./utils.js";
import { execAsync, executeCommand, killProcess, sleep } from "mcp-fs";

export const handleSolanaLocalnetStart = async (userId: string, terminalId: string, args: string): Promise<CallToolResult> => {
  // Check if solana is already running
  const solanaInfo = await getSVMLocalnetInfo(userId);
  if (solanaInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: `Solana localnet is already running on port ${solanaInfo.port}.`,
        },
      ],
      isError: true,
    };
  }


  const result = await executeCommand(
    userId,
    terminalId,
    SOLANA_LOCALNET_BIN,
    args,
  );

  if (!result.success) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to start Solana localnet. Check system logs for details.`,
        },
      ],
      isError: true,
    };
  }

  // Give it a moment to start
  await sleep(1000);

  // Check if it started successfully
  const newSolanaInfo = await getSVMLocalnetInfo(userId);
  if (newSolanaInfo.running) {
    await execAsync(
      userId,
      `solana config set --url http://localhost:${newSolanaInfo.port}`,
    );
    await sleep(1000);
    await execAsync(userId, "solana airdrop 100");

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
          text: `Failed to start Solana localnet. Check system logs for details.`,
        },
      ],
      isError: true,
    };
  }
};

export const handleSolanaLocalnetStop = async (userId: string): Promise<CallToolResult> => {
  const solanaInfo = await getSVMLocalnetInfo(userId);
  if (!solanaInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "No Solana localnet instance is currently running.",
        },
      ],
      isError: true,
    };
  }

  await killProcess(userId, "solana-test-validator");

  // Check if it was stopped successfully
  await sleep(2000);

  const newSolanaInfo = await getSVMLocalnetInfo(userId);

  if (!newSolanaInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "Solana localnet has been stopped successfully.",
        },
      ],
      isError: false,
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: "Failed to stop Solana localnet. It may still be running.",
        },
      ],
      isError: true,
    };
  }
};

export const handleSolanaLocalnetStatus = async (userId: string): Promise<CallToolResult> => {
  const solanaInfo = await getSVMLocalnetInfo(userId);
  return {
    content: [
      {
        type: "text",
        text: solanaInfo.running ? "Solana localnet is running." : "Solana localnet is not running.",
      },
    ],
  };
};
