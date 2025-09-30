import { z } from "zod";
import { resolveRpcUrl } from "../../utils.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { zEthereumAddress, zTerminalId } from "mcp-fs";
import {
  handleCast4byte,
  handleCastBalance,
  handleCastCall,
  handleCastChain,
  handleCastComputeAddress,
  handleCastContract,
  handleCastConvertEthUnits,
  handleCastLogs,
  handleCastReceipt,
  handleCastRun,
  // handleCastSendTransaction,
  handleCastSig,
  handleCastStorage,
} from "./handlers.js";
import { getUserIdFromRequest } from "mcp-http";

export const initCastTools = async (server: McpServer) => {
  // Tool: Call a contract function (read-only)
  server.tool(
    "cast_call",
    "Read contract state via function call. Use for: querying balances, checking ownership, getting config values. No gas cost, instant results. Returns decoded output or raw hex",
    {
      terminalId: zTerminalId,
      contractAddress: zEthereumAddress,
      functionSignature: z
        .string()
        .describe(
          "Function sig: 'balanceOf(address)', 'owner()', 'totalSupply()'. Include param types"
        ),
      args: z
        .array(z.string())
        .optional()
        .describe(
          "Function args in order: ['0xaddr...', '100'] for transfer(address,uint256)"
        ),
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "Network RPC endpoint. Defaults to local Anvil (localhost:8545)"
        ),
      blockNumber: z
        .string()
        .optional()
        .describe(
          "Query at block: 'latest' (default), 'pending', block number, or '0x...' hash"
        ),
      from: z
        .string()
        .optional()
        .describe(
          "Simulate call from this address (for access control checks)"
        ),
    },
    async (
      {
        terminalId,
        contractAddress,
        functionSignature,
        args = [],
        rpcUrl,
        blockNumber,
        from,
      },
      request
    ) => {
      const userId = getUserIdFromRequest(request);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";

      if (args.length > 0) {
        cmdArgs += " " + args.join(" ");
      }

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      if (blockNumber) {
        cmdArgs += ` --block ${blockNumber}`;
      }

      if (from) {
        cmdArgs += ` --from ${from}`;
      }

      return handleCastCall(
        userId,
        terminalId,
        contractAddress,
        functionSignature,
        cmdArgs
      );
    }
  );

  // // Tool: Send a transaction to a contract function
  // server.tool(
  //   "cast_send",
  //   "Send a transaction to a contract function",
  //   {
  //     contractAddress: z.string().describe("Address of the contract"),
  //     functionSignature: z
  //       .string()
  //       .describe("Function signature (e.g., 'transfer(address,uint256)')"),
  //     args: z.array(z.string()).optional().describe("Function arguments"),
  //     from: z.string().optional().describe("Sender address or private key"),
  //     value: z
  //       .string()
  //       .optional()
  //       .describe("Ether value to send with the transaction (in wei)"),
  //     rpcUrl: z
  //       .string()
  //       .optional()
  //       .describe("JSON-RPC URL (default: http://localhost:8545)"),
  //     gasLimit: z.string().optional().describe("Gas limit for the transaction"),
  //     gasPrice: z
  //       .string()
  //       .optional()
  //       .describe("Gas price for the transaction (in wei)"),
  //     confirmations: z
  //       .number()
  //       .optional()
  //       .describe("Number of confirmations to wait for"),
  //   },
  //   async ({
  //     contractAddress,
  //     functionSignature,
  //     args = [],
  //     from,
  //     value,
  //     rpcUrl,
  //     gasLimit,
  //     gasPrice,
  //     confirmations,
  //   }) => {
  //     const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
  //     let cmdArgs = "";

  //     if (args.length > 0) {
  //       cmdArgs += " " + args.join(" ");
  //     }

  //     if (from) {
  //       cmdArgs += ` --from ${from}`;
  //     }

  //     if (value) {
  //       cmdArgs += ` --value ${value}`;
  //     }

  //     if (resolvedRpcUrl) {
  //       cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
  //     }

  //     if (gasLimit) {
  //       cmdArgs += ` --gas-limit ${gasLimit}`;
  //     }

  //     if (gasPrice) {
  //       cmdArgs += ` --gas-price ${gasPrice}`;
  //     }

  //     if (confirmations) {
  //       cmdArgs += ` --confirmations ${confirmations}`;
  //     }

  //     return handleCastSendTransaction(contractAddress, functionSignature, cmdArgs);
  //   },
  // );

  // Tool: Check the ETH balance of an address
  server.tool(
    "cast_balance",
    "Query ETH balance of address. Use for: checking wallet funds, verifying payment received, monitoring contract ETH. Returns wei by default, readable ETH with formatEther",
    {
      terminalId: zTerminalId,
      address: z.string().describe("Ethereum address to check balance for"),
      rpcUrl: z
        .string()
        .optional()
        .describe(
          "Network to query. Local Anvil default, or mainnet/testnet RPC"
        ),
      blockNumber: z
        .string()
        .optional()
        .describe(
          "Historical balance at block: 'latest', block number, or hash"
        ),
      formatEther: z
        .boolean()
        .optional()
        .describe("True=human readable ETH (18 decimals), False=wei (default)"),
    },
    async (
      { terminalId, address, rpcUrl, blockNumber, formatEther = false },
      req
    ) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      if (blockNumber) {
        cmdArgs += ` --block ${blockNumber}`;
      }

      if (formatEther) {
        cmdArgs += " --ether";
      }

      return handleCastBalance(userId, terminalId, address, cmdArgs);
    }
  );

  // Tool: Get transaction receipt
  server.tool(
    "cast_receipt",
    "Fetch transaction receipt details. Use for: checking tx success/failure, getting gas used, finding emitted events, contract deployment address. Essential for tx verification",
    {
      terminalId: zTerminalId,
      txHash: z.string().describe("Transaction hash"),
      rpcUrl: z
        .string()
        .optional()
        .describe("Network where tx was sent. Must match original network"),
      confirmations: z
        .number()
        .optional()
        .describe(
          "Wait for N block confirmations before returning (ensures finality)"
        ),
      field: z
        .string()
        .optional()
        .describe(
          "Extract specific field: 'status' (1=success/0=fail), 'gasUsed', 'blockNumber', 'contractAddress'"
        ),
    },
    async ({ terminalId, txHash, rpcUrl, confirmations, field }, req) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      if (confirmations) {
        cmdArgs += ` --confirmations ${confirmations}`;
      }

      if (field) {
        cmdArgs += ` ${field}`;
      }

      return handleCastReceipt(userId, terminalId, txHash, cmdArgs);
    }
  );

  // Tool: Read a contract's storage at a given slot
  server.tool(
    "cast_storage",
    "Read raw storage slot value. Use for: debugging storage layout, accessing private vars, verifying upgradeable proxy implementation. Requires knowledge of Solidity storage packing",
    {
      terminalId: zTerminalId,
      address: z.string().describe("Contract address"),
      slot: z.string().describe("Storage slot to read"),
      rpcUrl: z.string().optional().describe("Network endpoint for reading"),
      blockNumber: z
        .string()
        .optional()
        .describe("Read historical storage at specific block"),
    },
    async ({ terminalId, address, slot, rpcUrl, blockNumber }, req) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = `storage ${address} ${slot}`;

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      if (blockNumber) {
        cmdArgs += ` --block ${blockNumber}`;
      }

      return handleCastStorage(userId, terminalId, address, slot, cmdArgs);
    }
  );

  // Tool: Run a published transaction in a local environment and print the trace
  server.tool(
    "cast_run",
    "Replay & trace existing transaction locally. Use for: debugging failed txs, analyzing gas usage, understanding execution flow. Shows all internal calls, state changes, events",
    {
      terminalId: zTerminalId,
      txHash: z.string().describe("Transaction hash to replay"),
      rpcUrl: z.string().describe("JSON-RPC URL"),
      quick: z
        .boolean()
        .optional()
        .describe(
          "Fast mode: use only previous block state (may differ from original execution)"
        ),
      debug: z
        .boolean()
        .optional()
        .describe(
          "Interactive debugger: step through opcodes, inspect stack/memory"
        ),
      labels: z
        .array(z.string())
        .optional()
        .describe(
          "Human-readable labels: ['0xaddr:TokenContract', '0xaddr2:Owner']"
        ),
    },
    async (
      { terminalId, txHash, rpcUrl, quick = false, debug = false, labels = [] },
      req
    ) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      if (quick) {
        cmdArgs += " --quick";
      }

      if (debug) {
        cmdArgs += " --debug";
      }

      // Add labels if provided
      for (const label of labels) {
        cmdArgs += ` --label ${label}`;
      }

      return handleCastRun(userId, terminalId, txHash, cmdArgs);
    }
  );

  // Tool: Get logs by signature or topic
  server.tool(
    "cast_logs",
    "Query blockchain event logs. Use for: tracking transfers, monitoring contract events, analyzing historical activity. Returns decoded events matching filters",
    {
      terminalId: zTerminalId,
      signature: z
        .string()
        .describe(
          "Event sig 'Transfer(address,address,uint256)' or topic0 hash '0xddf2...'. Auto-hashes if needed"
        ),
      topics: z
        .array(z.string())
        .optional()
        .describe(
          "Filter by indexed params: [null, '0xaddr'] matches any topic0, specific topic1"
        ),
      address: z
        .string()
        .optional()
        .describe("Only events from this contract (0x...)"),
      fromBlock: z
        .string()
        .optional()
        .describe("Start block: number, 'earliest', or '1hour' ago"),
      toBlock: z
        .string()
        .optional()
        .describe("End block: number, 'latest' (default), 'pending'"),
      rpcUrl: z
        .string()
        .optional()
        .describe("Network to search. Note: large ranges may hit RPC limits"),
    },
    async (
      {
        terminalId,
        signature,
        topics = [],
        address,
        fromBlock,
        toBlock,
        rpcUrl,
      },
      req
    ) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";

      if (topics.length > 0) {
        cmdArgs += " " + topics.join(" ");
      }

      if (address) {
        cmdArgs += ` --address ${address}`;
      }

      if (fromBlock) {
        cmdArgs += ` --from-block ${fromBlock}`;
      }

      if (toBlock) {
        cmdArgs += ` --to-block ${toBlock}`;
      }

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      return handleCastLogs(userId, terminalId, signature, cmdArgs);
    }
  );

  // Tool: Lookup function or event signatures
  server.tool(
    "cast_sig",
    "Calculate 4-byte selector or event topic. Use for: building raw tx data, decoding unknown functions, filtering logs. Returns keccak256 hash of signature",
    {
      terminalId: zTerminalId,
      signature: z
        .string()
        .describe(
          "Exact signature: 'transfer(address,uint256)' for functions, 'Transfer(address,address,uint256)' for events"
        ),
      isEvent: z
        .boolean()
        .optional()
        .describe(
          "True=32-byte event topic0, False=4-byte function selector (default)"
        ),
    },
    async ({ terminalId, signature, isEvent = false }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCastSig(userId, terminalId, signature, isEvent);
    }
  );

  // Tool: Get event or function signature using 4byte directory
  server.tool(
    "cast_4byte",
    "Reverse-lookup signature from selector hash. Use for: identifying unknown functions in tx data, decoding events from topics. Queries 4byte.directory database",
    {
      terminalId: zTerminalId,
      selector: z
        .string()
        .describe(
          "Hash to lookup: '0xa9059cbb' (4-byte function) or '0xddf252...' (32-byte event topic)"
        ),
      isEvent: z
        .boolean()
        .optional()
        .describe(
          "True=search event signatures, False=search functions (auto-detects from length)"
        ),
    },
    async ({ terminalId, selector, isEvent = false }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCast4byte(userId, terminalId, selector, isEvent);
    }
  );

  // Tool: Get chain information
  server.tool(
    "cast_chain",
    "Identify connected blockchain network. Use for: confirming correct network, getting chain ID for signing, network validation. Returns name (mainnet/sepolia) or ID (1/11155111)",
    {
      terminalId: zTerminalId,
      rpcUrl: z
        .string()
        .optional()
        .describe("RPC endpoint to query. Defaults to local Anvil"),
      returnId: z
        .boolean()
        .optional()
        .describe(
          "True=numeric chain ID for EIP-155, False=human name (default)"
        ),
    },
    async ({ terminalId, rpcUrl, returnId = false }, req) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";
      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      return handleCastChain(userId, terminalId, returnId, cmdArgs);
    }
  );

  // Tool: Get contract bytecode size
  server.tool(
    "contract_size",
    "Check deployed contract size in bytes. Use for: verifying within 24KB limit, optimization checks, confirming deployment. Returns size or 0 if EOA/not deployed",
    {
      terminalId: zTerminalId,
      address: z.string().describe("Contract address"),
      rpcUrl: z
        .string()
        .optional()
        .describe("Network where contract is deployed"),
    },
    async ({ terminalId, address, rpcUrl }, req) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = "";
      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      return handleCastContract(userId, terminalId, address, cmdArgs);
    }
  );

  // Tool: Calculate contract address
  server.tool(
    "compute_address",
    "Predict CREATE deployment address before deploying. Use for: pre-funding addresses, setting permissions, deterministic deployments. Based on deployer + nonce",
    {
      terminalId: zTerminalId,
      deployerAddress: z.string().describe("Address of the deployer"),
      nonce: z
        .string()
        .optional()
        .describe(
          "Deployer's nonce at deployment time. Auto-fetches current if not specified"
        ),
      rpcUrl: z
        .string()
        .optional()
        .describe("Network to fetch current nonce from (if not provided)"),
    },
    async ({ terminalId, deployerAddress, nonce, rpcUrl }, req) => {
      const userId = getUserIdFromRequest(req);
      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let cmdArgs = ``;

      if (nonce) {
        cmdArgs += ` --nonce ${nonce}`;
      }

      if (resolvedRpcUrl) {
        cmdArgs += ` --rpc-url ${resolvedRpcUrl}`;
      }

      return handleCastComputeAddress(
        userId,
        terminalId,
        deployerAddress,
        cmdArgs
      );
    }
  );

  // Tool: Convert between units (wei, gwei, ether)
  server.tool(
    "convert_eth_units",
    "Convert between ETH denominations. Use for: calculating gas costs, formatting user amounts, tx value conversions. Handles 18 decimal precision correctly",
    {
      terminalId: zTerminalId,
      value: z.string().describe("Value to convert"),
      fromUnit: z.enum(["wei", "gwei", "ether"]).describe("Source unit"),
      toUnit: z.enum(["wei", "gwei", "ether"]).describe("Target unit"),
    },
    async ({ terminalId, value, fromUnit, toUnit }, req) => {
      const userId = getUserIdFromRequest(req);
      return handleCastConvertEthUnits(
        userId,
        terminalId,
        value,
        fromUnit,
        toUnit
      );
    }
  );
};
