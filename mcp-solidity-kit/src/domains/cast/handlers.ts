import { executeCommand } from "mcp-fs";
import { type CallToolResult } from "mcp-http/types";
import { CAST_PATH } from "./constants.js";
import { type EthereumAddress } from "mcp-fs";

export const handleCastCall = async (
  userId: string,
  terminalId: string,
  contractAddress: EthereumAddress,
  functionSignature: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `call ${contractAddress} ${functionSignature} ${args}`
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

// export const handleCastSendTransaction = async (
//   contractAddress: EthereumAddress,
//   functionSignature: string,
//   args: string,
// ): Promise<CallToolResult> => {
//   const privateKey = process.env.PRIVATE_KEY;

//   const { command } = createSecureCommandWithPrivateKey(
//     `send ${contractAddress} "${functionSignature}"`,
//     privateKey,
//     args
//   );

//   const result = await executeCommand(
//     CAST_TOOL_NAME,
//     `/`,
//     CAST_PATH,
//     command,
//   );

//   return {
//     content: [
//       {
//         type: "text",
//         text: result.success
//           ? `Transaction sent successfully:\n${result.message}`
//           : `Transaction failed: ${result.message}`,
//       },
//     ],
//     isError: !result.success,
//   };
// };

export const handleCastBalance = async (
  userId: string,
  terminalId: string,
  address: EthereumAddress,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `balance ${address} ${args}`
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

export const handleCastReceipt = async (
  userId: string,
  terminalId: string,
  txHash: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `receipt ${txHash} ${args}`
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

export const handleCastStorage = async (
  userId: string,
  terminalId: string,
  address: EthereumAddress,
  slot: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `storage ${address} ${slot} ${args}`
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

export const handleCastRun = async (
  userId: string,
  terminalId: string,
  txHash: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `run ${txHash} ${args}`
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

export const handleCastLogs = async (
  userId: string,
  terminalId: string,
  signature: string,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `logs "${signature}" ${args}`
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

export const handleCastSig = async (
  userId: string,
  terminalId: string,
  signature: string,
  isEvent: boolean
): Promise<CallToolResult> => {
  const command = isEvent ? `sig-event "${signature}"` : `sig "${signature}"`;

  const result = await executeCommand(userId, terminalId, CAST_PATH, command);

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

export const handleCast4byte = async (
  userId: string,
  terminalId: string,
  selector: string,
  isEvent: boolean
): Promise<CallToolResult> => {
  const command = isEvent ? `4byte-event` : `4byte`;

  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `${command} ${selector}`
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

export const handleCastChain = async (
  userId: string,
  terminalId: string,
  returnId: boolean,
  args: string
): Promise<CallToolResult> => {
  const command = returnId ? `chain-id` : `chain`;
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `${command} ${args}`
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

export const handleCastContract = async (
  userId: string,
  terminalId: string,
  address: EthereumAddress,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `codesize ${address} ${args}`
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

export const handleCastComputeAddress = async (
  userId: string,
  terminalId: string,
  deployerAddress: EthereumAddress,
  args: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `compute-address ${deployerAddress} ${args}`
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

export const handleCastConvertEthUnits = async (
  userId: string,
  terminalId: string,
  value: string,
  fromUnit: string,
  toUnit: string
): Promise<CallToolResult> => {
  const result = await executeCommand(
    userId,
    terminalId,
    CAST_PATH,
    `to-unit ${value}${fromUnit} ${toUnit}`
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
