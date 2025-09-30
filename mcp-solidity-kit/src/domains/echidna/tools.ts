import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  sanitizeProjectId,
  getWorkspacePath,
  validateWorkspacePath,
  zTerminalId,
} from "mcp-fs";
import { handleEchidnaTest } from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export async function initEchidnaTools(server: McpServer) {
  server.tool(
    "echidna_test",
    "Fuzz test contracts with Echidna property-based testing. Use for: finding edge cases, testing invariants, discovering unexpected behaviors. Generates millions of random inputs. Complements unit tests",
    {
      terminalId: zTerminalId,
      target_files: z
        .string()
        .describe(
          "Files to fuzz: 'test/Invariants.sol' for single, 'test/**/*.sol' for all tests. Must contain echidna_* functions"
        ),
      contract: z
        .string()
        .optional()
        .describe(
          "Name of the contract to test (if not all). E.g., 'MyContract'."
        ),
      config_file: z
        .string()
        .optional()
        .describe(
          "Path to Echidna configuration file (e.g., 'echidna.config.yaml'). Relative to workspace root."
        ),
      test_limit: z
        .number()
        .int()
        .optional()
        .describe("Number of sequences to check before stopping."),
      timeout: z
        .number()
        .int()
        .optional()
        .describe("Timeout for the entire Echidna execution in seconds."),
      corpus_dir: z
        .string()
        .optional()
        .describe(
          "Directory to store/load the campaign corpus. Relative to workspace root."
        ),
      workers: z
        .number()
        .int()
        .optional()
        .describe("Number of workers to use."),
      solc_args: z
        .string()
        .optional()
        .describe(
          "Arguments to pass to solc (e.g., '--optimize --optimize-runs 200'). Ensure proper quoting."
        ),
      crytic_args: z
        .string()
        .optional()
        .describe(
          "Arguments to pass to crytic-compile (e.g., '--foundry-skip-test --foundry-skip-script'). Ensure proper quoting."
        ),
      disable_slither: z
        .boolean()
        .optional()
        .describe("Disable Slither analysis during Echidna execution."),
      test_mode: z
        .string()
        .optional()
        .describe(
          "Test mode for Echidna (e.g., 'assertion', 'dtest', 'optimization')."
        ),
      format: z
        .string()
        .optional()
        .describe("Output format (e.g., 'text', 'json').")
        .default("text"),
    },
    async (params, request) => {
      const userId = getUserIdFromRequest(request);

      // The `target_files` param for Echidna command itself should be exactly what the user provides.
      // If it's a relative path, it will be relative to `workspaceToUse` because of `cd`.
      // If it's absolute, `cd` doesn't affect it, which is also fine.
      let echidnaArgs = ``;

      if (params.contract) {
        echidnaArgs += ` --contract ${params.contract}`;
      }
      if (params.config_file) {
        // Config file path should be relative to the workspacePath if not absolute
        echidnaArgs += ` --config ${params.config_file}`;
      }
      if (params.test_limit !== undefined) {
        echidnaArgs += ` --test-limit ${params.test_limit}`;
      }
      if (params.timeout !== undefined) {
        echidnaArgs += ` --timeout ${params.timeout}`;
      }
      if (params.corpus_dir) {
        echidnaArgs += ` --corpus-dir ${params.corpus_dir}`;
      }
      if (params.workers !== undefined) {
        echidnaArgs += ` --workers ${params.workers}`;
      }
      if (params.solc_args) {
        echidnaArgs += ` --solc-args "${params.solc_args}"`;
      }
      if (params.crytic_args) {
        echidnaArgs += ` --crytic-args "${params.crytic_args}"`;
      }
      if (params.disable_slither) {
        echidnaArgs += ` --disable-slither`;
      }
      if (params.test_mode) {
        echidnaArgs += ` --test-mode ${params.test_mode}`;
      }
      if (params.format) {
        echidnaArgs += ` --format ${params.format}`;
      }

      return handleEchidnaTest(
        userId,
        params.terminalId,
        params.target_files,
        echidnaArgs
      );
    }
  );
}
