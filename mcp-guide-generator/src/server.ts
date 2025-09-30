import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGuideTools } from "./domains/guide-generation/tools.js";

export const createServer = (app?: any) => {
  const server = new McpServer(
    {
      name: "Guide Generator MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  registerGuideTools(server);
  return server;
};