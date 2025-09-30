import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { handleGetRiscZeroMode, handleSetRiscZeroMode } from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";
import { zTerminalId } from "mcp-fs";

export function registerRiscZeroTools(server: McpServer) {
  // Tool: set Risc Zero mode
  server.tool(
    "risc-zero-mode-set",
    "Configure RISC Zero proving mode. Use for: switching between dev (fast, insecure) and production (slow, secure) proving. Dev mode for testing, production for deployment",
    {
      terminalId: zTerminalId,
      isDevMode: z.boolean().default(false),
    },
    ({ isDevMode, terminalId }, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleSetRiscZeroMode(userId, terminalId, isDevMode);
      } catch (error) {
        console.error("Error setting Risc Zero mode:", error);
        return {
          content: [
            {
              type: "text",
              text: "Error setting Risc Zero mode.",
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Tool: get Risc Zero mode
  server.tool(
    "risc-zero-mode-get",
    "Check current RISC Zero proving configuration. Use for: verifying mode before operations, troubleshooting performance. Returns dev vs production mode status",
    {},
    (_, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleGetRiscZeroMode(userId);
      } catch (error) {
        console.error("Error getting Risc Zero mode:", error);
        return {
          content: [
            {
              type: "text",
              text: "Error getting Risc Zero mode.",
            },
          ],
          isError: true,
        };
      }
    },
  );
}
