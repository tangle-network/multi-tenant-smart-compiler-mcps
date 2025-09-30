import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerHelloTools(server: McpServer) {
  server.tool(
    "say-hello",
    "Says hello",
    {
      who: z.string().min(2).default("world"),
    },
    async ({ who }) => {
      return {
        isError: false,
        content: [{ type: "text" as const, text: `Hello, ${who}!` }],
      };
    },
  );
}
