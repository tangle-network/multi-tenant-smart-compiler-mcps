import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  zTerminalId,
} from "mcp-fs";
import {
  handleMythrilAnalyze,
  handleMythrilListDetectors,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export async function initMythrilTools(server: McpServer) {
  server.tool(
    "mythril_analyze",
    "Analyze a smart contract with Mythril. Target path should be relative to the project root (e.g., src/MyContract.sol) unless target_workspace is specified.",
    {
      terminalId: zTerminalId,
      target_path: z
        .string()
        .describe(
          "Path to the Solidity file relative to the workspace (e.g., 'src/MyContract.sol')",
        ),
      output_format: z
        .enum(["text", "markdown", "json", "html"])
        .optional()
        .describe("Output format for the analysis results."),
      execution_timeout: z
        .number()
        .optional()
        .describe("Timeout for symbolic execution in seconds."),
      create_timeout: z
        .number()
        .optional()
        .describe("Timeout for contract creation in seconds."),
      max_depth: z
        .number()
        .optional()
        .describe("Maximum depth for symbolic execution."),
      solver_timeout: z
        .number()
        .optional()
        .describe("Timeout for the SMT solver in ms."),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);

      let mythrilCmdArgs = "";

      if (params.output_format) mythrilCmdArgs += ` -o ${params.output_format}`;
      if (params.execution_timeout)
        mythrilCmdArgs += ` --execution-timeout ${params.execution_timeout}`;
      if (params.create_timeout)
        mythrilCmdArgs += ` --create-timeout ${params.create_timeout}`;
      if (params.max_depth)
        mythrilCmdArgs += ` --max-depth ${params.max_depth}`;
      if (params.solver_timeout)
        mythrilCmdArgs += ` --solver-timeout ${params.solver_timeout}`;

      return handleMythrilAnalyze(
        userId,
        params.terminalId,
        params.target_path,
        mythrilCmdArgs,
      );
    },
  );

  server.tool(
    "mythril_list_detectors",
    "List available Mythril detection modules.",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      return handleMythrilListDetectors(userId, params.terminalId);
    },
  );

  // todo: consider adding `mythril_foundry_analyze` which uses `myth f <target_path>`
  // this might be more specific and easier for foundry projects.
}
