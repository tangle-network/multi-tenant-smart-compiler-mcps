import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zTerminalId } from "mcp-fs";
import { z } from "zod";
import {
  handleNargoCheck,
  handleNargoCompile,
  handleNargoExecute,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

// Common parameter schemas
const commonNoirParams = {
  package: z
    .string()
    .optional()
    .describe(
      "The name of the package to run the command on. By default run on the first one found moving up along the ancestors of the current directory",
    ),
  workspace: z
    .boolean()
    .optional()
    .describe("Run on all packages in the workspace"),
  expressionWidth: z
    .number()
    .optional()
    .describe("Specify the backend expression width that should be targeted"),
  boundedCodegen: z
    .boolean()
    .optional()
    .describe(
      "Generate ACIR with the target backend expression width. The default is to generate ACIR without a bound and split expressions after code generation. Activating this flag can sometimes provide optimizations for certain programs",
    ),
  force: z.boolean().optional().describe("Force a full recompilation"),
  printAcir: z
    .boolean()
    .optional()
    .describe("Display the ACIR for compiled circuit"),
  denyWarnings: z.boolean().optional().describe("Treat all warnings as errors"),
  silenceWarnings: z.boolean().optional().describe("Suppress warnings"),
  debugComptimeInFile: z
    .string()
    .optional()
    .describe(
      'Enable printing results of comptime evaluation: provide a path suffix for the module to debug, e.g. "package_name/src/main.nr".',
    ),
  skipUnderconstrainedCheck: z
    .boolean()
    .optional()
    .describe(
      "Flag to turn off the compiler check for under constrained values. Warning: This can improve compilation speed but can also lead to correctness errors. This check should always be run on production code.",
    ),
  skipBrilligConstraintsCheck: z
    .boolean()
    .optional()
    .describe(
      "Flag to turn off the compiler check for missing Brillig call constraints. Warning: This can improve compilation speed but can also lead to correctness errors. This check should always be run on production code.",
    ),
  countArrayCopies: z
    .boolean()
    .optional()
    .describe(
      "Count the number of arrays that are copied in an unconstrained context for performance debugging.",
    ),
  enableBrilligConstraintsCheckLookback: z
    .boolean()
    .optional()
    .describe(
      "Flag to turn on the lookback feature of the Brillig call constraints check, allowing tracking argument values before the call happens preventing certain rare false positives (leads to a slowdown on large rollout functions).",
    ),
  pedanticSolving: z
    .boolean()
    .optional()
    .describe(
      "Use pedantic ACVM solving, i.e. double-check some black-box function assumptions when solving. This is disabled by default.",
    ),
  unstableFeatures: z
    .string()
    .optional()
    .describe("Unstable features to enable for this current build."),
};

// Helper function to build command arguments from common params
function buildCommonArgs(params: any): string {
  let args = "";
  if (params.package) {
    args += ` --package ${params.package}`;
  }
  if (params.workspace) {
    args += ` --workspace`;
  }
  if (params.expressionWidth) {
    args += ` --expression-width ${params.expressionWidth}`;
  }
  if (params.boundedCodegen) {
    args += ` --bounded-codegen`;
  }
  if (params.force) {
    args += ` --force`;
  }
  if (params.printAcir) {
    args += ` --print-acir`;
  }
  if (params.denyWarnings) {
    args += ` --deny-warnings`;
  }
  if (params.silenceWarnings) {
    args += ` --silence-warnings`;
  }
  if (params.debugComptimeInFile) {
    args += ` --debug-comptime-in-file ${params.debugComptimeInFile}`;
  }
  if (params.skipUnderconstrainedCheck) {
    args += ` --skip-underconstrained-check`;
  }
  if (params.skipBrilligConstraintsCheck) {
    args += ` --skip-brillig-constraints-check`;
  }
  if (params.countArrayCopies) {
    args += ` --count-array-copies`;
  }
  if (params.enableBrilligConstraintsCheckLookback) {
    args += ` --enable-brillig-constraints-check-lookback`;
  }
  if (params.pedanticSolving) {
    args += ` --pedantic-solving`;
  }
  if (params.unstableFeatures) {
    args += ` --unstable-features ${params.unstableFeatures}`;
  }
  return args;
}

export async function registerNoirTools(server: McpServer) {
  // nargo check
  server.tool(
    "nargo-check",
    "Validate Noir circuit syntax/types without compiling. Use for: quick error detection, type checking, catching issues early. Faster than compile. Run frequently during development",
    {
      terminalId: zTerminalId,
      ...commonNoirParams,
      overwrite: z
        .boolean()
        .optional()
        .describe("Force overwrite of existing files"),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = buildCommonArgs(params);
        if (params.overwrite) {
          args += ` --overwrite`;
        }

        return handleNargoCheck(userId, params.terminalId, args);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "nargo-execute",
    "Run Noir circuit with inputs to generate witness. Use for: testing circuit logic, debugging constraints, generating proofs. Requires Prover.toml with inputs. Essential before proving",
    {
      terminalId: zTerminalId,
      witnessName: z
        .string()
        .optional()
        .describe(
          "Write the execution witness to named file. Defaults to the name of the package being executed.",
        ),
      proverName: z
        .string()
        .optional()
        .describe(
          "The name of the toml file which contains the inputs for the prover. Defaults to Prover.",
        ),
      ...commonNoirParams,
      oracleResolver: z
        .string()
        .optional()
        .describe("JSON RPC url to solve oracle calls."),
      oracleFile: z
        .string()
        .optional()
        .describe("Path to the oracle transcript."),
    },
    async (params, req) => {
      try {
        // Sanitize the project ID to prevent path traversal
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.witnessName) {
          args += ` ${params.witnessName}`;
        }
        if (params.proverName) {
          args += ` --prover-name ${params.proverName}`;
        }
        args += buildCommonArgs(params);
        if (params.oracleResolver) {
          args += ` --oracle-resolver ${params.oracleResolver}`;
        }
        if (params.oracleFile) {
          args += ` --oracle-file ${params.oracleFile}`;
        }
        return handleNargoExecute(userId, params.terminalId, args);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // nargo compile
  server.tool(
    "nargo-compile",
    "Compile Noir to ACIR bytecode for proving. Use for: generating circuit artifacts, preparing for proof generation, optimizing constraints. Creates target/ with compiled circuit. Run before prove/verify",
    {
      terminalId: zTerminalId,
      ...commonNoirParams,
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        const args = buildCommonArgs(params);
        return handleNargoCompile(userId, params.terminalId, args);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
