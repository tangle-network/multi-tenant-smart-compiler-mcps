import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zEthereumAddress, zTerminalId } from "mcp-fs";
import {
  handleStylusActivate,
  handleStylusCacheBid,
  handleStylusCacheStatus,
  handleStylusCacheSuggestBid,
  handleStylusCheck,
  handleStylusConstructor,
  handleStylusDeploy,
  handleStylusExportAbi,
  handleStylusGetInitcode,
  handleStylusVerifyDeployment,
} from "./handlers.js";
import { z } from "zod";
import { NITRO_DEFAULT_RPC_URL } from "../nitro/constants.js";
import { getUserIdFromRequest } from "mcp-http";

export async function registerStylusTools(server: McpServer) {
  // Tool: Check the Stylus project
  server.tool(
    "stylus_check",
    "Validate Stylus Rust project for Arbitrum deployment. Use for: checking compilation errors, verifying contract compatibility, ensuring proper exports. Run BEFORE deployment",
    {
      terminalId: zTerminalId,
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        return handleStylusCheck(userId, params.terminalId);
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

  // Tool: Export Solidity ABI of the Stylus project
  server.tool(
    "stylus_export_abi",
    "Generate Solidity ABI for Rust contract. Use for: frontend integration, contract interaction, creating TypeScript types. Essential for dApp development with Stylus",
    {
      terminalId: zTerminalId,
      outputFile: z
        .string()
        .optional()
        .describe("The output file (defaults to stdout)"),
      isJson: z
        .boolean()
        .optional()
        .describe(" Write a JSON ABI instead using solc. Requires solc")
        .default(false),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.outputFile) {
          args += ` --output ${params.outputFile}`;
        }
        if (params.isJson) {
          args += " --json";
        }

        return handleStylusExportAbi(userId, params.terminalId, args);
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

  // Tool: Print the signature of the constructor
  server.tool(
    "stylus_constructor",
    "Print the signature of the constructor",
    {
      terminalId: zTerminalId,
      outputFile: z
        .string()
        .optional()
        .describe("The output file (defaults to stdout)"),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.outputFile) {
          args += ` --output ${params.outputFile}`;
        }

        return handleStylusConstructor(userId, params.terminalId, args);
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

  // Tool: Activate an already deployed contract
  server.tool(
    "stylus_activate",
    "Activate an already deployed contract",
    {
      terminalId: zTerminalId,
      contractAddress: zEthereumAddress,
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "The RPC URL to use for activation. Defaults to the Nitro localnet RPC URL.",
        ),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const userId = getUserIdFromRequest(req);

        const rpcUrl = params.rpcUrl || NITRO_DEFAULT_RPC_URL;
        const args = ` --address ${params.contractAddress} --endpoint ${rpcUrl}`;

        return handleStylusActivate(userId, params.terminalId, args);
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

  // Tool: Places a bid on a Stylus contract to cache it in the Arbitrum chain's wasm cache manager
  server.tool(
    "stylus_cache_bid",
    "Places a bid on a Stylus contract to cache it in the Arbitrum chain's wasm cache manager",
    {
      terminalId: zTerminalId,
      contractAddress: zEthereumAddress,
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "The RPC URL to use for bidding. Defaults to the Nitro localnet RPC URL.",
        ),
      bidAmount: z.number().describe("The amount to bid in wei."),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const rpcUrl = params.rpcUrl || NITRO_DEFAULT_RPC_URL;
        const bidAmount = params.bidAmount;
        const args = `${params.contractAddress} ${bidAmount} --endpoint ${rpcUrl}`;

        return handleStylusCacheBid(userId, params.terminalId, args);
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

  // Tool: Get the status of the Stylus contract's cache
  server.tool(
    "stylus_cache_status",
    "Get the status of the Stylus contract's cache",
    {
      terminalId: zTerminalId,
      contractAddress: zEthereumAddress,
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "The RPC URL to use for getting the status. Defaults to the Nitro localnet RPC URL.",
        ),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const rpcUrl = params.rpcUrl || NITRO_DEFAULT_RPC_URL;
        const args = `--address ${params.contractAddress} --endpoint ${rpcUrl}`;
        return handleStylusCacheStatus(userId, params.terminalId, args);
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

  // Tool: Suggest a bid for the Stylus contract's cache
  server.tool(
    "stylus_cache_suggest_bid",
    "Suggest a bid for the Stylus contract's cache",
    {
      terminalId: zTerminalId,
      contractAddress: zEthereumAddress,
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "The RPC URL to use for suggesting a bid. Defaults to the Nitro localnet RPC URL.",
        ),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const rpcUrl = params.rpcUrl || NITRO_DEFAULT_RPC_URL;
        const args = `${params.contractAddress} --endpoint ${rpcUrl}`;
        return handleStylusCacheSuggestBid(userId, params.terminalId, args);
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

  // Tool: Generate and print initcode for the contract
  server.tool(
    "stylus_get_initcode",
    "Get the initcode for the contract",
    {
      terminalId: zTerminalId,
      outputFile: z
        .string()
        .optional()
        .describe("The output file (defaults to stdout)"),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const userId = getUserIdFromRequest(req);

        let args = ``;
        if (params.outputFile) {
          args += ` --output ${params.outputFile}`;
        }

        return handleStylusGetInitcode(userId, params.terminalId, args);
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

  // Tool: Deploy the Stylus project
  server.tool(
    "stylus_deploy",
    "Deploy Stylus Rust contract to Arbitrum. Use for: publishing to testnet/mainnet, creating contract instances, initial deployment. Costs ETH for deployment",
    {
      terminalId: zTerminalId,
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "The RPC URL to use for deployment. Defaults to the Nitro localnet RPC URL.",
        ),
      deployerSalt: z
        .string()
        .optional()
        .describe(
          "The salt passed to the stylus deployer [default: 0x0000000000000000000000000000000000000000000000000000000000000000]",
        ),
      constructorArgs: z
        .string()
        .optional()
        .describe("The constructor arguments passed to the stylus deployer"),
      constructorValue: z
        .number()
        .optional()
        .describe(
          "The amount of Ether sent to the contract through the constructor [default: 0]",
        ),
      constructorSignature: z
        .string()
        .optional()
        .describe("The constructor signature when using the --wasm-file flag"),
      isNotActive: z
        .boolean()
        .optional()
        .describe("If set, do not activate the program after deploying it")
        .default(false),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const userId = getUserIdFromRequest(req);

        let args = `--endpoint ${params.rpcUrl || NITRO_DEFAULT_RPC_URL}`;

        if (params.deployerSalt) {
          args += ` --deployer-salt ${params.deployerSalt}`;
        }
        if (params.constructorArgs) {
          args += ` --constructor-args ${params.constructorArgs}`;
        }
        if (params.constructorValue) {
          args += ` --constructor-value ${params.constructorValue}`;
        }
        if (params.constructorSignature) {
          args += ` --constructor-signature ${params.constructorSignature}`;
        }
        if (!params.isNotActive) {
          args += ` --no-activate`;
        }

        return handleStylusDeploy(userId, params.terminalId, args);
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

  // Tool: Verify the deployment of a Stylus contract
  server.tool(
    "stylus_verify_deployment",
    "Verify the deployment of a Stylus contract",
    {
      terminalId: zTerminalId,
      txHash: z.string().describe("Hash of the deployment transaction"),
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "The RPC URL to use for verification. Defaults to the Nitro localnet RPC URL.",
        ),
      maxFeePerGas: z
        .number()
        .optional()
        .describe("The maximum fee per gas gwei to use for verification"),
    },
    async (params, req) => {
      const userId = getUserIdFromRequest(req);
      try {
        const userId = getUserIdFromRequest(req);

        const rpcUrl = params.rpcUrl || NITRO_DEFAULT_RPC_URL;
        let args = `--deployment-tx ${params.txHash} --endpoint ${rpcUrl}`;
        if (params.maxFeePerGas) {
          args += ` --max-fee-per-gas-gwei ${params.maxFeePerGas}`;
        }

        return handleStylusVerifyDeployment(userId, params.terminalId, args);
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
