import {
  killProcess,
  sleep,
  type BlockchainNetworkType,
} from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";
import { executeCommand } from "mcp-fs";
import { SUI_BIN } from "../../constants.js";
import { getSuiLocalnetInfo } from "./utils.js";

export const handleSuiMoveBuild = async (
  userId: string,
  terminalId: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(userId, terminalId, SUI_BIN, "move build");

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

export const handleSuiMoveTest = async (
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    SUI_BIN,
    `move test ${args}`,
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

export const handleSuiClientPublish = async (
  userId: string,
  terminalId: string,
  network: BlockchainNetworkType,
  args: string,
): Promise<CallToolResult> => {
  const switchResult = await executeCommand(
    userId,
    terminalId,
    SUI_BIN,
    `client switch --env ${network}`,
  );
  if (!switchResult.success) {
    return {
      content: [{ type: "text", text: switchResult.message }],
      isError: true,
    };
  }

  const deploymentResult = await executeCommand(
    userId,
    terminalId,
    SUI_BIN,
    `client publish ${args}`,
  );

  return {
    content: [
      {
        type: "text",
        text: deploymentResult.message,
      },
    ],
    isError: !deploymentResult.success,
  };
};

export const handleSuiClientCall = async (userId: string, terminalId: string, args: string): Promise<CallToolResult> => {
  const callResult = await executeCommand(
    userId,
    terminalId,
    SUI_BIN,
    `client call ${args}`,
  );

  return {
    content: [
      {
        type: "text",
        text: callResult.message,
      },
    ],
    isError: !callResult.success,
  };
}

export const handleSuiLocalnetStart = async (
  userId: string,
  terminalId: string,
  args: string,
): Promise<CallToolResult> => {
  // Check if sui is already running
  const suiInfo = await getSuiLocalnetInfo(userId);
  if (suiInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: `Sui localnet is already running on port ${suiInfo.port}.`,
        },
      ],
      isError: true,
    };
  }

  const result = await executeCommand(
    userId,
    terminalId,
    `RUST_LOG="off,sui_node=info" ${SUI_BIN}`,
    `start ${args}`,
  );  

  if (!result.success) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to start Sui localnet. It may still be running.`,
        },
      ],
      isError: true,
    };
  }

  // Give it a moment to start
  await sleep(3000);

  // Check if it started successfully
  const newSuiInfo = await getSuiLocalnetInfo(userId);
  if (newSuiInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
      ],
      isError: false,
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: `Failed to start Sui localnet. Check system logs for details.`,
        },
      ],
      isError: true,
    };
  }
};

export const handleSuiLocalnetStop = async (userId: string): Promise<CallToolResult> => {
  const suiInfo = await getSuiLocalnetInfo(userId);
  if (!suiInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "No Sui localnet instance is currently running.",
        },
      ],
      isError: true,
    };
  }

  await killProcess(userId, "sui start");

  // Check if it was stopped successfully
  await sleep(500);

  const newSuiInfo = await getSuiLocalnetInfo(userId);

  if (!newSuiInfo.running) {
    return {
      content: [
        {
          type: "text",
          text: "Sui localnet has been stopped successfully.",
        },
      ],
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: "Failed to stop Sui localnet. It may still be running.",
        },
      ],
      isError: true,
    };
  }
};

export const handleSuiLocalnetStatus = async (userId: string): Promise<CallToolResult> => {
  const suiInfo = await getSuiLocalnetInfo(userId);
  return {
    content: [
      {
        type: "text",
        text: suiInfo.running ? `Sui localnet is running on port ${suiInfo.port}. RPC URL: ${suiInfo.url}` : "No Sui localnet instance is currently running.",
      },
    ],
  };
};
