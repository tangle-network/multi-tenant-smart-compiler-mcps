import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveRpcUrl } from "../../utils.js";
import { zTerminalId } from "mcp-fs";
import {
  handleForgeBuild,
  handleForgeInstall,
  handleForgeScript,
  handleForgeTest,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export async function initFoundryTools(server: McpServer) {
  // Tool: Install dependencies for the workspace
  server.tool(
    "install_dependency",
    "Add Solidity library/dependency via Forge. Use for: OpenZeppelin contracts, Chainlink oracles, Uniswap interfaces. Creates lib/ folder, updates remappings. Run BEFORE importing in .sol files",
    {
      terminalId: zTerminalId,
      dependency: z
        .string()
        .describe(
          "GitHub repo path: 'OpenZeppelin/openzeppelin-contracts', 'smartcontractkit/chainlink', 'Uniswap/v3-core'. Can include @version"
        ),
    },
    async ({ terminalId, dependency }, request) => {
      const userId = getUserIdFromRequest(request);
      try {
        return handleForgeInstall(userId, terminalId, dependency);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error installing dependency: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "forge_build",
    "Build the Foundry project.",
    { terminalId: zTerminalId },
    async ({ terminalId }, request) => {
      const userId = getUserIdFromRequest(request);

      return handleForgeBuild(userId, terminalId);
    }
  );

  server.tool(
    "forge_test",
    "Execute Solidity test suite with gas reporting. Use for: unit testing, fuzz testing, invariant testing. Runs test*.sol files. Shows pass/fail, gas usage, coverage. Essential before deployment",
    {
      terminalId: zTerminalId,
      match: z
        .string()
        .optional()
        .describe(
          "Filter test functions by regex: 'testTransfer' runs matching functions only"
        ),
      match_contract: z
        .string()
        .optional()
        .describe(
          "Filter test contracts: 'Token' runs TokenTest contracts only"
        ),
      match_path: z
        .string()
        .optional()
        .describe(
          "Filter by file path: 'test/unit' runs tests in matching paths"
        ),
      verbosity: z
        .number()
        .optional()
        .describe("Output detail: 0=minimal, 2=default, 3=detailed, 5=traces"),
    },
    async (params, request) => {
      const terminalId = params.terminalId;
      const userId = getUserIdFromRequest(request);

      let forgeArgs = "";

      if (params.match) {
        forgeArgs += ` --match ${params.match}`;
      }
      if (params.match_contract) {
        forgeArgs += ` --match-contract ${params.match_contract}`;
      }
      if (params.match_path) {
        forgeArgs += ` --match-path ${params.match_path}`;
      }
      if (params.verbosity !== undefined) {
        forgeArgs += ` -vv${params.verbosity}`;
      }

      return handleForgeTest(userId, terminalId, forgeArgs);
    }
  );

  // Tool: Run Forge scripts
  server.tool(
    "forge_script",
    "Deploy contracts or execute onchain scripts. Use for: mainnet/testnet deployment, contract upgrades, admin operations. Creates broadcast/ folder with tx details. Test with --broadcast=false first",
    {
      terminalId: zTerminalId,
      scriptPath: z
        .string()
        .describe(
          "Script location: 'script/Deploy.s.sol', 'script/Upgrade.s.sol'"
        ),
      sig: z
        .string()
        .optional()
        .describe(
          "Entry function: 'run()' default, 'deploy()', 'upgrade(address)'"
        ),
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "Network RPC: mainnet/sepolia/localhost:8545. Required for broadcast"
        ),
      broadcast: z
        .boolean()
        .optional()
        .describe("True=send real txs, False=simulate only (test first!)"),
      privateKey: z
        .string()
        .describe("Deployer private key (0x... format). Keep secure!"),
      verify: z
        .boolean()
        .optional()
        .describe("Auto-verify on Etherscan (needs ETHERSCAN_API_KEY env var)"),
    },
    async (
      {
        terminalId,
        scriptPath,
        sig = "run()",
        rpcUrl,
        broadcast = false,
        verify = false,
        privateKey,
      },
      request
    ) => {
      try {
        const userId = getUserIdFromRequest(request);

        const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
        let args = "";

        if (resolvedRpcUrl) {
          args += ` --rpc-url "${resolvedRpcUrl}"`;
        }

        if (broadcast) {
          args += ` --broadcast`;
        }

        if (verify) {
          args += ` --verify`;
        }

        return handleForgeScript(
          userId,
          terminalId,
          scriptPath,
          privateKey,
          sig,
          args
        );
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing script: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
