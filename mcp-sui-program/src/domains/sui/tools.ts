import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sanitizeSuiFuncTestFilter } from "./sanitization.js";
import { zBlockchainNetwork, zTerminalId } from "mcp-fs";
import {
  handleSuiClientCall,
  handleSuiClientPublish,
  handleSuiLocalnetStart,
  handleSuiLocalnetStatus,
  handleSuiLocalnetStop,
  handleSuiMoveBuild,
  handleSuiMoveTest,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";
import getPort from "get-port";
import {
  DEFAULT_FAUCET_PORT,
  DEFAULT_RPC_PORT,
  SUI_BIN,
} from "../../constants.js";
import { updateSuiClientConfig } from "./utils.js";
import { execAsync } from "mcp-fs";

export function registerSuiTools(server: McpServer) {
  // Tool: build the Sui project
  server.tool(
    "sui_move_build",
    "Build the Sui project.",
    { terminalId: zTerminalId },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleSuiMoveBuild(userId, params.terminalId);
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

  // Tool: run tests
  server.tool(
    "sui_move_test",
    "Execute Sui Move unit tests. Use for: validating contract logic, regression testing, code coverage analysis. Tests must be annotated with #[test]. Essential before deployment",
    {
      terminalId: zTerminalId,
      filter: z
        .string()
        .optional()
        .describe(
          "Run specific tests: 'module::function' for single test, 'module' for module tests. Example: 'coin::test_transfer'"
        )
        .refine((val) => !val || /^[a-zA-Z0-9_:]+$/.test(val), {
          message:
            "Filter must contain only alphanumeric characters, underscores, and colons",
        }),
      isCoverage: z
        .boolean()
        .optional()
        .describe(
          "Run tests including code coverage. Please note that coverage cannot run along with filter."
        ),
      isVerbose: z
        .boolean()
        .optional()
        .describe("Run tests with verbose output."),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let suiArgs = "";
        if (params.filter) {
          // Sanitize the filter to prevent command injection
          const sanitizedFilter = sanitizeSuiFuncTestFilter(params.filter);
          suiArgs += ` ${sanitizedFilter}`;
        }
        if (params.isCoverage) {
          suiArgs += " --coverage";
        }
        if (params.isVerbose) {
          suiArgs += " --verbose";
        }

        return handleSuiMoveTest(userId, params.terminalId, suiArgs);
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

  // Tool: deploy the Sui project
  server.tool(
    "sui_client_publish",
    "Publish Sui Move package to blockchain. Use for: deploying to localnet/devnet/mainnet, creating onchain modules, initial deployment. Costs SUI for gas fees",
    {
      terminalId: zTerminalId,
      network: zBlockchainNetwork,
      isDevMode: z
        .boolean()
        .optional()
        .describe(
          "Compile in 'dev' mode. The 'dev-addresses' and 'dev-dependencies' fields will be used if this flag is set. This flag is useful for development of packages that expose named addresses that are not set to a specific value"
        ),
      isForce: z
        .boolean()
        .optional()
        .describe(
          "Force the deployment of the project. This will overwrite the existing deployment."
        ),
      gasBudget: z
        .number()
        .optional()
        .describe(
          "An optional gas budget for this transaction (in MIST). If gas budget is not provided, the tool will first perform a dry run to estimate the gas cost, and then it will execute the transaction. Please note that this incurs a small cost in performance due to the additional dry run call"
        ),
      isSkipDependencyVerification: z
        .boolean()
        .optional()
        .describe(
          "Publish the package without checking whether dependency source code compiles to the onchain bytecode"
        ),
      withUnpublishedDependencies: z
        .boolean()
        .optional()
        .describe(
          "Also publish transitive dependencies that have not already been published"
        ),
      verifyDeps: z
        .boolean()
        .optional()
        .describe(
          "Check that the dependency source code compiles to the onchain bytecode before publishing the package (currently the default behavior)"
        ),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let suiArgs = "";

        if (params.isDevMode) {
          suiArgs += " --dev";
        }
        if (params.isForce) {
          suiArgs += " --force";
        }
        if (params.gasBudget) {
          suiArgs += ` --gas-budget ${params.gasBudget}`;
        }
        if (params.isSkipDependencyVerification) {
          suiArgs += " --skip-dependency-verification";
        }
        if (params.withUnpublishedDependencies) {
          suiArgs += " --with-unpublished-dependencies";
        }
        if (params.verifyDeps) {
          suiArgs += " --verify-deps";
        }

        return handleSuiClientPublish(
          userId,
          params.terminalId,
          params.network,
          suiArgs
        );
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

  // Tool: client call
  server.tool(
    "sui_client_call",
    "Invoke a function",
    {
      terminalId: zTerminalId,
      package: z.string().describe("SUI package. I.e 0x123456789abcdef"),
      module: z.string().describe("Module name of package. I.e example"),
      function: z.string().describe("Function to invoke. I.e init"),
      gasBudget: z
        .number()
        .optional()
        .describe("Gas budget for transaction. Default to 100000000"),
      args: z
        .array(
          z
            .string()
            .describe('Args for the function. I.e ["arg1", "arg2"]')
            .optional()
        )
        .optional(),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = ` --package ${params.package} --module ${params.module} --function ${params.function} `;
        args += ` --gas-budget ${params.gasBudget || "100000000"}`;
        if (params.args && params.args.length > 0) {
          args += ` ${params.args.join(" ")}`;
        }

        return handleSuiClientCall(userId, params.terminalId, args);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error starting Sui localnet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: run localnet
  server.tool(
    "sui_localnet_start",
    "Launch local Sui network for testing. Use for: Move contract development, testing without testnet costs, debugging. Provides funded accounts, instant finality. MUST start before deployment",
    {
      terminalId: zTerminalId,
      reset: z
        .boolean()
        .default(true)
        .describe("Reset the localnet and start a new one."),
      faucetPort: z
        .number()
        .optional()
        .describe("Port for the faucet. Default to a random port"),
      rpcPort: z
        .number()
        .optional()
        .describe("Port for the RPC. Default to a random port"),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let suiArgs = "";

        if (params.reset) {
          suiArgs += "--force-regenesis";
        }

        const [rpcPort, faucetPort] = await Promise.all([
          getPort({ port: params.rpcPort || DEFAULT_RPC_PORT }),
          getPort({ port: params.faucetPort || DEFAULT_FAUCET_PORT }),
        ]);

        suiArgs += ` --fullnode-rpc-port=${rpcPort} --with-faucet=0.0.0.0:${faucetPort}`;

        await updateSuiClientConfig(userId, rpcPort);

        const result = await handleSuiLocalnetStart(
          userId,
          params.terminalId,
          suiArgs
        );

        if (!result.isError) {
          await execAsync(userId, `${SUI_BIN} client switch --env localnet`);
          await execAsync(
            userId,
            `${SUI_BIN} client faucet --url http://0.0.0.0:${faucetPort}/gas`
          );
        }

        return result;
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error starting Sui localnet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: stop localnet
  server.tool(
    "sui_localnet_stop",
    "Stop the Sui localnet.",
    {},
    async (_, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleSuiLocalnetStop(userId);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error stopping Sui localnet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get current Sui localnet status
  server.tool(
    "sui_localnet_status",
    "Check validator status and network info. Use for: verifying node is running before operations, getting RPC endpoint, checking epoch. Returns running state, URLs, current epoch",
    {},
    async (_, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleSuiLocalnetStatus(userId);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting Sui localnet: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
