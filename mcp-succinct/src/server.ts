import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { registerCargoTools } from "mcp-cargo";
import { initCastTools, initAnvilTools, initFoundryTools, initAnvilHttp } from "mcp-solidity-kit";
import type { ExpressApp } from "mcp-http";

export const createServer = async (app: ExpressApp) => {
  const server = new McpServer(
    {
      name: "Succinct zkVM Agent MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  // Register resources and tools for the project
  registerProjectTools(server);
  registerProjectResources(server);

  // Register resources and tools for the cargo project
  registerCargoTools(server);

  // Register resources and tools for the solidity project
  await initFoundryTools(server);
  await initCastTools(server);
  await initAnvilTools(server);
  initAnvilHttp(app);

  return server;
};
