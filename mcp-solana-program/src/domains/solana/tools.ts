import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zSvmProgramId } from "../../zods.js";
import z from "zod";
import {
  handleSolanaLocalnetStart,
  handleSolanaLocalnetStatus,
  handleSolanaLocalnetStop,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";
import { zTerminalId } from "mcp-fs";
import getPort from "get-port";
import { DEFAULT_RPC_PORT } from "./constants.js";

export function registerSolanaTools(server: McpServer) {
  // Tool: start a localnet
  server.tool(
    "solana_localnet_start",
    "Launch local Solana validator for testing. Use for: program development, testing without devnet costs, debugging. Provides funded accounts, instant finality. MUST start before program deployment",
    {
      terminalId: zTerminalId,
      reset: z.boolean().default(true),
      silent: z.boolean().default(false),
      clonePrograms: z.array(zSvmProgramId).optional(),
      port: z
        .number()
        .describe(
          "Network port to use for the localnet. Default is a random port"
        )
        .optional(),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        const port = await getPort({ port: params.port || DEFAULT_RPC_PORT });

        let solanaCmd = ` --rpc-port ${port}`;
        if (params.reset) {
          solanaCmd += " --reset";
        }
        if (params.clonePrograms) {
          for (const programId of params.clonePrograms) {
            solanaCmd += ` --clone ${programId}`;
          }
        }

        return handleSolanaLocalnetStart(userId, params.terminalId, solanaCmd);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error starting Solana localnet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: stop localnet
  server.tool(
    "solana_localnet_stop",
    "Shutdown local Solana validator. Use for: cleanup after testing, freeing resources, stopping background process. Loses all state unless saved. Always stop when done",
    {},
    async (_, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleSolanaLocalnetStop(userId);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error stopping Solana localnet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get current Solana localnet status
  server.tool(
    "solana_localnet_status",
    "Check validator status and network info. Use for: verifying node is running before operations, getting RPC URL, checking slot height. Returns running state, endpoints, current slot",
    {},
    (_, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleSolanaLocalnetStatus(userId);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting Solana localnet status: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
