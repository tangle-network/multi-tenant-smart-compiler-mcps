import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleAderynAnalyze } from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";
import { zTerminalId } from "mcp-fs";

export async function initAderynTools(server: McpServer) {
  server.tool(
    "aderyn_analyze",
    "Rust-based security scanner for Solidity. Use for: fast vulnerability detection, CI/CD integration, markdown reports. Complementary to Slither - different detection patterns. Generates report.md",
    {
      terminalId: zTerminalId,
      src: z
        .string()
        .optional()
        .describe(
          "Contract folder to scan: 'src', 'contracts'. Defaults to project root"
        ),
      path_includes: z
        .string()
        .optional()
        .describe(
          "List of path fragments to include, delimited by comma (no spaces)."
        ),
      path_excludes: z
        .string()
        .optional()
        .describe(
          "List of path fragments to exclude, delimited by comma (no spaces)."
        ),
      output: z
        .string()
        .optional()
        .describe(
          "Desired file path for the final report. Defaults to report.md."
        ),
      highs_only: z
        .boolean()
        .optional()
        .describe("Only use the high detectors."),
      skip_update_check: z
        .boolean()
        .optional()
        .describe(
          "After generating report, skip checking if a new version of Aderyn is available."
        ),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      const terminalId = params.terminalId;

      let aderynArgs = "";

      if (params.src) {
        aderynArgs += ` --src ${params.src}`;
      }
      if (params.path_includes) {
        aderynArgs += ` --path-includes ${params.path_includes}`;
      }
      if (params.path_excludes) {
        aderynArgs += ` --path-excludes ${params.path_excludes}`;
      }
      if (params.output) {
        aderynArgs += ` --output ${params.output}`;
      }
      if (params.highs_only) {
        aderynArgs += ` --highs-only`;
      }
      if (params.skip_update_check) {
        aderynArgs += ` --skip-update-check`;
      }

      return handleAderynAnalyze(userId, terminalId, aderynArgs);
    }
  );
}
