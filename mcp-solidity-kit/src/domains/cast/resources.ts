import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { CAST_PATH } from "./constants.js";
import { executeCommandStandalone } from "mcp-fs";
import { getUserIdFromRequest } from "mcp-http";

export const initCastResources = (server: McpServer) => {
  // Resource: Contract source from Etherscan
  server.resource(
    "contract_source",
    new ResourceTemplate("contract://{address}/source", { list: undefined }),
    async (uri, { address }, request) => {
      const userId = getUserIdFromRequest(request);

      try {
        const { success, message } = await executeCommandStandalone(
          userId,
          CAST_PATH,
          `etherscan-source ${address}`,
        );

        if (success) {
          return {
            contents: [
              {
                uri: uri.href,
                text: message,
              },
            ],
          };
        } else {
          return {
            contents: [
              {
                uri: uri.href,
                text: JSON.stringify({
                  error: "Could not retrieve contract source",
                  details: message,
                }),
              },
            ],
          };
        }
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({
                error: "Failed to retrieve contract source",
              }),
            },
          ],
        };
      }
    },
  );
};
