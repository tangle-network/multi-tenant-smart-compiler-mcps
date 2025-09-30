import { startMCPServer } from "mcp-http";
import { createServer } from "./server.js";

startMCPServer(createServer);
