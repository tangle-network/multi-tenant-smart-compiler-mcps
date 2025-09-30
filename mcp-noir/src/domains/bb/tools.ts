import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zTerminalId } from "mcp-fs";
import { z } from "zod";
import {
  handleProving,
  handleWriteSolidityVerifier,
  handleWriteVk,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export async function registerBbTools(server: McpServer) {
  // bb-prove
  server.tool(
    "bb-prove",
    "Generate proof and save proof",
    {
      terminalId: zTerminalId,
      backend: z
        .string()
        .describe(
          "The name of the proving backend to use. I.e ./target/hello_world.json",
        ),
      witness: z
        .string()
        .describe(
          "Write the execution witness to named file. I.e ./target/hello_world.gz",
        ),
      output: z
        .string()
        .describe("Write the proof to named file. I.e ./target"),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.backend) {
          args += ` -b ${params.backend}`;
        }
        if (params.witness) {
          args += ` -w ${params.witness}`;
        }
        if (params.output) {
          args += ` -o ${params.output}`;
        }

        return handleProving(userId, params.terminalId, args);
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

  // bb-write-vk
  server.tool(
    "bb-write-vk",
    "Write the verification key to a file",
    {
      terminalId: zTerminalId,
      backend: z
        .string()
        .describe(
          "The name of the proving backend to use. I.e ./target/hello_world.json",
        ),
      output: z
        .string()
        .describe("Write the verification key to named file. I.e ./target"),
      oracleHash: z
        .string()
        .describe("The hash of the oracle to use. I.e keccak")
        .optional(),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.backend) {
          args += ` -b ${params.backend}`;
        }
        if (params.output) {
          args += ` -o ${params.output}`;
        }
        if (params.oracleHash) {
          args += ` --oracle_hash ${params.oracleHash}`;
        }
        return handleWriteVk(userId, params.terminalId, args);
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

  // bb-write-solidity-verifier
  server.tool(
    "bb-write-solidity-verifier",
    "Write the solidity verifier to a file",
    {
      terminalId: zTerminalId,
      vkey: z
        .string()
        .describe("The name of the proving backend to use. I.e ./target/vk"),
      output: z
        .string()
        .describe(
          "Write the solidity verifier to named file. I.e ./target/Verifier.sol",
        ),
    },
    async (params, req) => {
      try {
        const userId = getUserIdFromRequest(req);

        let args = "";
        if (params.vkey) {
          args += ` -k ${params.vkey}`;
        }
        if (params.output) {
          args += ` -o ${params.output}`;
        }

        return handleWriteSolidityVerifier(userId, params.terminalId, args);
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
