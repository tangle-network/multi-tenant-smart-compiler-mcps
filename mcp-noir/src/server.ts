import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { registerBbTools } from "./domains/bb/tools.js";
import { registerNoirTools } from "./domains/noir/tools.js";

export const createServer = async () => {
  const server = new McpServer(
    {
      name: "Noir MCP Server",
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

  await registerBbTools(server);
  await registerNoirTools(server);

  return server;
};
