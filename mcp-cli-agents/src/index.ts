import { startMCPServer } from "mcp-http";
import { createServer } from "./server.js";

// Create a wrapper function that accepts the Express app (required by mcp-http)
const serverFactory = () => {
  return createServer({
    agentType: "claude-code", // Default to Claude Code, can be configured via env vars
    mcpConfigPath: "./mcp-config.json",
    baseSystemPrompt: "You are a helpful coding assistant.",
    enableBoltConversion: false,
  });
};

startMCPServer(serverFactory);
