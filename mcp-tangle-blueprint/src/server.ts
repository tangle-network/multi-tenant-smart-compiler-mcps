import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerCargoTools } from "mcp-cargo";
import { registerProjectResources, registerProjectTools } from "mcp-fs";
import {
  initAnvilTools,
  initCastTools,
  initFoundryTools,
} from "mcp-solidity-kit";

export const createServer = async () => {
  const server = new McpServer(
    {
      name: "Blueprint Agent MCP Server",
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
    },
  );

  registerCargoTools(server);

  registerProjectTools(server);
  registerProjectResources(server);

  await initFoundryTools(server);
  await initCastTools(server);
  await initAnvilTools(server);

  return server;
};
