import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { registerCargoTools } from "mcp-cargo";
import {
  initCastTools,
  initFoundryTools,
} from "mcp-solidity-kit";
import { registerStylusTools } from "./domains/stylus/tools.js";
import { registerNitroTools } from "./domains/nitro/tools.js";

export const createServer = async () => {
  const server = new McpServer(
    {
      name: "Stylus smart contract Agent MCP Server",
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

  // Register resources and tools for the stylus project
  await registerStylusTools(server);
  await registerNitroTools(server);
  
  // Register resources and tools for the solidity project
  await initFoundryTools(server);
  await initCastTools(server);

  return server;
};
