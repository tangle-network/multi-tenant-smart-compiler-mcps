import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerCargoTools } from "mcp-cargo";
import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { registerAnchorTools } from "./domains/anchor/tools.js";
import { registerSolanaTools } from "./domains/solana/tools.js";

export const createServer = async () => {
  const server = new McpServer(
    {
      name: "Anchor Agent MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: undefined,
        tools: {
          listChanged: true,
        },
        resources: {
          subscribe: true,
          listChanged: true,
        },
      },
    }
  );

  registerProjectTools(server);
  registerProjectResources(server);

  registerCargoTools(server);

  registerAnchorTools(server);
  registerSolanaTools(server);

  return server;
};
