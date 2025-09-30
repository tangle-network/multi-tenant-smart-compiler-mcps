import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getNitroInfo } from "./utils.js";
import { NITRO_DEFAULT_PORT } from "./constants.js";
import { handleNitroLocalnetStart, handleNitroLocalnetStatus, handleNitroLocalnetStop } from "./handlers.js";
import { z } from "zod";
import { zTerminalId } from "mcp-fs";
import { getUserIdFromRequest } from "mcp-http";
import getPort from "get-port";

export async function registerNitroTools(server: McpServer) {
  // Tool: Start the Nitro localnet
  server.tool(
    "nitro_localnet_start",
    "Start the Nitro localnet.",
    {
      terminalId: zTerminalId,
      port: z.number().optional().describe("The port to use for the localnet. Defaults to a random port"),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        const port = await getPort({ port: params.port || NITRO_DEFAULT_PORT });
        return handleNitroLocalnetStart(
          userId,
          params.terminalId,
          port,
        );
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Tool: Stop the Nitro localnet
  server.tool(
    "nitro_localnet_stop",
    "Stop the Nitro localnet.",
    {},
    async (_, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        const nitroInfo = await getNitroInfo(userId);
        if (nitroInfo.running) {
          return handleNitroLocalnetStop(userId);
        } else {
          return {
            content: [
              {
                type: "text",
                text: "Nitro localnet is not running.",
              },
            ],
            isError: false,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Tool: Get the status of the Nitro localnet
  server.tool(
    "nitro_localnet_status",
    "Get the status of the Nitro localnet.",
    {},
    async (_, req) => {
      const userId = getUserIdFromRequest(req);
      return handleNitroLocalnetStatus(userId);
    },
  );
}