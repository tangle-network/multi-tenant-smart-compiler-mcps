import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { projectsRoot } from "./constants.js";
import { registerHelloTools } from "./domains/hello/tools.js";

export const createServer = () => {
  const server = new McpServer(
    {
      name: "Blueprint Agent MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  // Register resources and tools for the project
  registerProjectTools(server, { projectsRoot: projectsRoot });
  registerProjectResources(server, { projectsRoot: projectsRoot });

  // Register additional resources and tools specific to the mcp domain
  registerHelloTools(server);

  return server;
};
