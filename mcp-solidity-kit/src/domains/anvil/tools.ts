import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAnvilInfo } from "./utils.js";
import { z } from "zod";
import {
  handleAnvilStart,
  handleAnvilStatus,
  handleAnvilStop,
} from "./handlers.js";
import { resolve } from "node:path";
import { getUserIdFromRequest } from "mcp-http";
import { zTerminalId } from "mcp-fs";
import getPort from "get-port";

export const initAnvilTools = async (server: McpServer) => {
  // Tool: Start a new Anvil instance
  server.tool(
    "anvil_start",
    "Launch local Ethereum test network. Use for: testing contracts locally, simulating mainnet, development without gas costs. Provides funded accounts, instant mining. MUST start before forge_script/cast operations",
    {
      terminalId: zTerminalId,
      port: z
        .number()
        .optional()
        .describe("Port to listen on. Default to a random port"),
      blockTime: z
        .number()
        .optional()
        .describe(
          "Auto-mine interval in seconds. 0=instant mining on tx (default), 12=mainnet-like"
        ),
      forkUrl: z
        .string()
        .optional()
        .describe(
          "Fork mainnet/testnet state: 'https://eth-mainnet.g.alchemy.com/v2/KEY'. Test against real contracts"
        ),
      forkBlockNumber: z
        .number()
        .optional()
        .describe(
          "Fork at specific block for reproducible testing. Omit for latest"
        ),
      accounts: z
        .number()
        .optional()
        .describe("Test accounts to create (10 default). Each gets 10000 ETH"),
      mnemonic: z
        .string()
        .optional()
        .describe("BIP39 mnemonic phrase to generate accounts from"),
      stateFile: z
        .string()
        .optional()
        .describe(
          "Path to a JSON file containing the initial state to load. I.e state/my-state.json  "
        ),
    },
    async (
      {
        port,
        blockTime,
        forkUrl,
        forkBlockNumber,
        accounts,
        mnemonic,
        stateFile,
        terminalId,
      },
      request
    ) => {
      const userId = getUserIdFromRequest(request);

      const randomPort = await getPort({ port: port || 8545 });
      let args = `--port ${randomPort}`;

      if (blockTime !== undefined) {
        args += ` --block-time ${blockTime}`;
      }

      if (forkUrl) {
        args += ` --fork-url "${forkUrl}"`;

        if (forkBlockNumber !== undefined) {
          args += ` --fork-block-number ${forkBlockNumber}`;
        }
      }

      if (accounts !== undefined) {
        args += ` --accounts ${accounts}`;
      }

      if (mnemonic) {
        args += ` --mnemonic "${mnemonic}"`;
      }

      if (stateFile) {
        args += ` --state ${resolve(userId, stateFile)}`;
      }

      try {
        return handleAnvilStart(userId, terminalId, args);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error starting Anvil: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Stop an Anvil instance
  server.tool(
    "anvil_stop",
    "Stop a running Anvil instance",
    {
      terminalId: zTerminalId,
    },
    async ({ terminalId }, request) => {
      const userId = getUserIdFromRequest(request);
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

      try {
        return handleAnvilStop(userId, terminalId);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error stopping Anvil: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get current Anvil status
  server.tool(
    "anvil_status",
    "Check Anvil node status. Use for: verifying node is running before operations, getting RPC URL, checking fork config. Returns running state, port, accounts if active",
    {},
    async (_, request) => {
      const userId = getUserIdFromRequest(request);
      return handleAnvilStatus(userId);
    }
  );
};
