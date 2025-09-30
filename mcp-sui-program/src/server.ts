import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { registerSuiTools } from "./domains/sui/tools.js";

export const createServer = async () => {
  const server = new McpServer(
    {
      name: "Sui Move Program MCP Server",
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

  registerSuiTools(server);

  return server;
};
