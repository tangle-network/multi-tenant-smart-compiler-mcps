import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getWorkspacePath, validateWorkspacePath } from "mcp-fs";
import { sanitizeProjectId } from "mcp-fs";
import { zTerminalId } from "mcp-fs";
import { FOUNDRY_OUT_DIR } from "../../constants.js";
import {
  handleSlitherAnalyze,
  handleSlitherAnalyzeWithPrinters,
  handleSlitherListDetectors,
  handleSlitherListPrinters,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export async function initSlitherTools(server: McpServer) {
  server.tool(
    "slither_analyze",
    "Security audit with Slither analyzer. Use for: finding vulnerabilities (reentrancy, overflow), code quality issues, gas optimization. Run BEFORE mainnet deployment. Detects 100+ vulnerability patterns",
    {
      terminalId: zTerminalId,
      target: z
        .string()
        .describe(
          "Audit scope: '.' for all contracts, 'src/Token.sol' for specific file, 'mainnet:0xAddr' for deployed"
        ),
      detectors_to_run: z
        .string()
        .optional()
        .describe(
          "Comma-separated list of detectors to run (e.g., 'timestamp,reentrancy-eth'). Defaults to all."
        ),
      detectors_to_exclude: z
        .string()
        .optional()
        .describe("Comma-separated list of detectors to exclude."),
      filter_paths: z
        .string()
        .optional()
        .describe(
          "Regex to exclude results matching file path (e.g., '(mocks/|test/)')."
        ),
      include_paths: z
        .string()
        .optional()
        .describe(
          "Regex to include results matching file path (e.g., '(src/|contracts/)'). Opposite of --filter-paths."
        ),
      solc_remaps: z
        .string()
        .optional()
        .describe(
          "Add Solc remappings (e.g., '@openzeppelin/=lib/openzeppelin-contracts/')."
        ),
      solc_args: z
        .string()
        .optional()
        .describe(
          "Add custom solc arguments (e.g., '--allow-paths /tmp --evm-version paris')."
        ),
      foundry_compile_all: z
        .boolean()
        .optional()
        .describe(
          "Compile all contracts, including tests and scripts (Foundry only). Default: false"
        ),
      json_output_path: z
        .string()
        .optional()
        .describe(
          "Path to export results as a JSON file (e.g., 'slither-out.json'). '-' for stdout."
        ),
      sarif_output_path: z
        .string()
        .optional()
        .describe(
          "Path to export results as a SARIF file (e.g., 'slither-out.sarif'). '-' for stdout."
        ),
      markdown_root: z
        .string()
        .optional()
        .describe("URL for markdown generation if --checklist is used."),
      checklist: z
        .boolean()
        .optional()
        .describe(
          "Generate a markdown page with the detector results. Default: false"
        ),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);

      let args = "--fail-none";

      if (params.detectors_to_run) {
        args += ` --detect ${params.detectors_to_run}`;
      }
      if (params.detectors_to_exclude) {
        args += ` --exclude ${params.detectors_to_exclude}`;
      }
      if (params.filter_paths) {
        args += ` --filter-paths "${params.filter_paths}"`;
      }
      if (params.include_paths) {
        args += ` --include-paths "${params.include_paths}"`;
      }
      if (params.solc_remaps) {
        args += ` --solc-remaps "${params.solc_remaps}"`;
      }
      if (params.solc_args) {
        args += ` --solc-args "${params.solc_args}"`;
      }
      if (params.foundry_compile_all) {
        args += ` --foundry-compile-all`;
      }
      args += ` --foundry-out-directory ${FOUNDRY_OUT_DIR}`;

      if (params.json_output_path) {
        args += ` --json "${params.json_output_path}"`;
      }
      if (params.sarif_output_path) {
        args += ` --sarif "${params.sarif_output_path}"`;
      }
      if (params.checklist) {
        args += ` --checklist`;
        if (params.markdown_root) {
          args += ` --markdown-root "${params.markdown_root}"`;
        }
      }

      return handleSlitherAnalyze(
        userId,
        params.terminalId,
        params.target,
        args
      );
    }
  );

  server.tool(
    "slither_list_detectors",
    "List available Slither detectors.",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      return handleSlitherListDetectors(userId, params.terminalId);
    }
  );

  server.tool(
    "slither_list_printers",
    "List available Slither printers.",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      return handleSlitherListPrinters(userId, params.terminalId);
    }
  );

  server.tool(
    "slither_print",
    "Extract contract info with Slither printers. Use for: understanding code structure, generating docs, analyzing dependencies. Not for vulnerabilities - use slither_analyze instead",
    {
      terminalId: zTerminalId,
      target: z
        .string()
        .describe(
          "Analysis target: '.' for all, 'src/Contract.sol', or deployed 'mainnet:0xAddr'"
        ),
      printers_to_run: z
        .string()
        .describe(
          "Info types: 'function-summary' (all functions), 'vars-and-auth' (access control), 'inheritance-graph' (hierarchy)"
        ),
      solc_remaps: z
        .string()
        .optional()
        .describe(
          "Add Solc remappings (e.g., '@openzeppelin/=lib/openzeppelin-contracts/')."
        ),
      foundry_compile_all: z
        .boolean()
        .optional()
        .describe(
          "Compile all contracts, including tests and scripts (Foundry only). Default: false"
        ),
      json_output_path: z
        .string()
        .optional()
        .describe("Path to export results as a JSON file. '-' for stdout."),
    },
    async (
      {
        terminalId,
        target,
        printers_to_run,
        solc_remaps,
        foundry_compile_all,
        json_output_path,
      },
      request
    ) => {
      const userId = getUserIdFromRequest(request);

      let args = "";

      if (solc_remaps) {
        args += ` --solc-remaps "${solc_remaps}"`;
      }
      if (foundry_compile_all) {
        args += ` --foundry-compile-all`;
      }
      if (json_output_path) {
        args += ` --json "${json_output_path}" --json-types printers`; // ensure json output is for printers
      }

      return handleSlitherAnalyzeWithPrinters(
        userId,
        terminalId,
        target,
        printers_to_run,
        args
      );
    }
  );
}
