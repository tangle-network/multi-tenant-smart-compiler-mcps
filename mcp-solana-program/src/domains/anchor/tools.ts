import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  sanitizeProjectId,
  validateWorkspacePath,
  zProjectId,
  getWorkspacePath,
  zBlockchainNetwork,
  zTerminalId,
} from "mcp-fs";
import { normalizeNetwork } from "./utils.js";
import z from "zod";
import {
  handleAnchorBuild,
  handleAnchorDeploy,
  handleAnchorKeysList,
  handleAnchorTest,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export function registerAnchorTools(server: McpServer) {
  // Tool: build the Anchor project
  server.tool(
    "anchor_build",
    "Compile Anchor Solana program to bytecode. Use for: checking compilation errors, generating IDL, preparing for deployment. Creates target/ with program artifacts. Run AFTER code changes",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleAnchorBuild(userId, params.terminalId);
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
    }
  );

  // Tool: test the Anchor project
  server.tool(
    "anchor_test",
    "Run Anchor TypeScript/JavaScript tests. Use for: validating program logic, integration testing, regression testing. Runs against localnet. Essential before deployment",
    {
      terminalId: zTerminalId,
      skipDeploy: z.boolean().default(false),
      skipLocalValidator: z.boolean().default(false),
      network: zBlockchainNetwork,
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.skipDeploy) {
          args += " --skip-deploy";
        }

        if (params.skipLocalValidator) {
          args += " --skip-local-validator";
        }

        const network = normalizeNetwork(params.network);
        // allow to run test on localnet only
        args += ` --provider.cluster ${network}`;

        return handleAnchorTest(userId, params.terminalId, args);
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
    }
  );

  // Tool: deploy the Anchor project
  server.tool(
    "anchor_deploy",
    "Deploy Anchor program to Solana network. Use for: publishing to localnet/devnet/mainnet, updating program code, initial deployment. Costs SOL for deployment",
    {
      terminalId: zTerminalId,
      network: zBlockchainNetwork,
      // perform deploy on a specific program
      programName: z
        .string()
        .optional()
        .describe(
          "Deploy specific program only (for multi-program workspaces)"
        ),
      programKeypair: z
        .string()
        .optional()
        .describe(
          "The keypair file to use for the program. Default to the program keypair in the workspace."
        ),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.programName) {
          args += ` --program-name ${params.programName}`;
        }
        if (params.programKeypair) {
          args += ` --program-keypair ${params.programKeypair}`;
        }
        if (params.network) {
          args += ` --provider.cluster ${normalizeNetwork(params.network)}`;
        }

        return handleAnchorDeploy(userId, params.terminalId, args);
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
    }
  );

  // Tool: Anchor key lists
  server.tool(
    "anchor_keys_list",
    "Show program keypairs and addresses. Use for: getting program IDs for client code, verifying deployment addresses, managing program keys. Returns program names and public keys",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleAnchorKeysList(userId, params.terminalId);
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
    }
  );

  // Tool: Anchor keys sync
  server.tool(
    "anchor_keys_sync",
    "List the keys in the Anchor project.",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleAnchorKeysList(userId, params.terminalId);
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
    }
  );
}
