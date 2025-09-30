import { executeCommand, createSecureCommandWithPrivateKey } from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";
import { STYLUS_BIN } from "./constants.js";
import { STYLUS_DEV_PRIVATE_KEY } from "../nitro/constants.js";

export async function handleStylusCheck(userId: string, terminalId: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `check`,
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

export async function handleStylusExportAbi(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `export-abi ${args}`,
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

export async function handleStylusDeploy(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const privateKey = usingPrivateKey();

  const { command } = createSecureCommandWithPrivateKey(
    `deploy ${args} --no-verify`,
    privateKey
  );

  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    command,
  );

  return {
    content: [
      {
        type: "text",
        text: `Deployed successfully: ${result.message}`,
      },
    ],
    isError: !result.success,
  };
}

export async function handleStylusConstructor(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `constructor ${args}`,
  );

  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
    ],
  };
}

export async function handleStylusActivate(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const privateKey = usingPrivateKey();

  const { command } = createSecureCommandWithPrivateKey(
    `activate ${args}`,
    privateKey
  );

  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
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
}

export async function handleStylusCacheBid(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const privateKey = usingPrivateKey();

  const { command } = createSecureCommandWithPrivateKey(
    `cache bid ${args}`,
    privateKey
  );

  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
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
}

export async function handleStylusCacheStatus(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `cache status ${args}`,
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

export async function handleStylusCacheSuggestBid(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `cache suggest-bid ${args}`,
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

export async function handleStylusGetInitcode(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `get-initcode ${args}`,
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

export async function handleStylusVerifyDeployment(userId: string, terminalId: string, args: string): Promise<CallToolResult> {
  const result = await executeCommand(
    userId,
    terminalId,
    STYLUS_BIN,
    `verify ${args} --no-verify`,
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

const usingPrivateKey = (): string => {
  return STYLUS_DEV_PRIVATE_KEY;
};
