import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { registerProjectResources, registerProjectTools } from "mcp-fs";
import { type ExpressApp } from "mcp-http";
import * as os from "os";
import * as path from "path";
import { initAderynTools } from "./domains/aderyn/index.js";
import { initAnvilHttp } from "./domains/anvil/http.js";
import { initAnvilTools } from "./domains/anvil/index.js";
import { initCastTools } from "./domains/cast/index.js";
import { initCastResources } from "./domains/cast/resources.js";
import { initEchidnaTools } from "./domains/echidna/index.js";
import { initFoundryTools } from "./domains/forge/index.js";
import { initMythrilTools } from "./domains/mythril/index.js";
import { initSlitherTools } from "./domains/slither/index.js";

dotenv.config();

export const createServer = async (app: ExpressApp): Promise<McpServer> => {
  const server = new McpServer(
    {
      name: "Foundry MCP Server with Auditing Tools",
      version: "0.1.0",
    },
    {
      instructions: `
  This server provides tools for Solidity developers using the Foundry toolkit and various auditing tools:
  - forge: Smart contract development framework (compile, test, deploy)
  - cast: EVM interaction tool (call contracts, send transactions, query chain data)
  - anvil: Local Ethereum test node (run a local chain for development)
  - slither: Static analysis tool (detect vulnerabilities and code issues)
  - mythril: Symbolic execution tool (security analysis, find vulnerabilities, via Docker)
  - echidna: Property-based testing tool (fuzz testing for smart contracts)
  
  You can interact with local or remote EVM chains, deploy contracts, perform common operations, analyze smart contract code, and audit contracts for vulnerabilities using static analysis, symbolic execution, and property-based testing.
  
  When a user asks for help with a specific tool, or for a task that a tool can perform, use the corresponding tool. 
  If asked to analyze or audit code, consider which tool is most appropriate (Slither for quick static checks, Mythril for deeper symbolic execution, Echidna for property testing).
  
  Forge Workspace: All operations are performed within a Foundry workspace located at ${path.join(os.homedir(), ".mcp-foundry-workspace")}. You can create files, install dependencies, and run tools within this context.
  
  Key tool functionalities:
  - slither_analyze: Run Slither static analysis.
  - slither_print: Use Slither printers for specific info (e.g., inheritance, function summaries).
  - mythril_analyze: Run Mythril symbolic execution analysis (via Docker).
  - echidna_test: Run Echidna property-based tests.
  - aderyn_analyze: Run Aderyn static analysis.
  - install_dependency: Install a dependency for the Forge workspace.
  - General Foundry tools: cast_call, cast_send, forge_script, forge_build, forge_test.
  
  Remember to check if tools are installed/accessible before attempting to use them. Paths for files should generally be relative to the workspace root.
    `,
      capabilities: {
        logging: undefined,
        tools: {
          listChanged: true,
        },
        resources: {
          subscribe: true,
          listChanged: true,
        },
      },
    }
  );

  // Initialize all tools
  registerProjectTools(server);
  await initAnvilTools(server);
  await initFoundryTools(server);
  await initEchidnaTools(server);
  await initAderynTools(server);
  await initSlitherTools(server);
  await initMythrilTools(server);
  await initCastTools(server);

  // Initialize HTTP endpoints
  initAnvilHttp(app);

  registerProjectResources(server);
  initCastResources(server);

  // Define prompts for the AI agent
  server.prompt("slither_guidance", () => ({
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: `You are an expert in using Slither for smart contract auditing. A user wants to run Slither. 
    Your goal is to help them construct a Slither command using the 'slither_analyze' or 'slither_print' tools. 
    Key parameters for 'slither_analyze':
    - target: (Required) Path to contract/directory (e.g., 'src/MyContract.sol', '.'). Can also be 'NETWORK:0xAddress'.
    - detectors_to_run: Comma-separated detectors (e.g., 'reentrancy-eth,timestamp').
    - detectors_to_exclude: Comma-separated detectors to exclude.
    - foundry_compile_all: Boolean, true to compile tests/scripts.
    - json_output_path: Path for JSON output, '-' for stdout.
    Key parameters for 'slither_print':
    - target: (Required) Path to contract/directory.
    - printers_to_run: (Required) Comma-separated printers (e.g., 'function-summary,vars-and-auth').
    Workspace is at users' home. Files should be relative to this.
    If they want to list detectors or printers, use 'slither_list_detectors' or 'slither_list_printers' (no params).
    Default to 'slither_analyze' if unsure. Ask clarifying questions if the target or specific options are unclear.`,
        },
      },
    ],
  }));

  server.prompt("mythril_guidance", () => ({
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: `You are an expert in using Mythril for smart contract security analysis. A user wants to run Mythril.
    Mythril is run via Docker. The main tool is 'mythril_analyze'.
    Key parameters for 'mythril_analyze':
    - target_path: (Required) Path to the Solidity file relative to the workspace root (e.g., 'src/MyContract.sol').
    - output_format: 'text', 'markdown', 'json', 'html'.
    - execution_timeout: Timeout for symbolic execution in seconds.
    - max_depth: Max depth for symbolic execution.
    Workspace (mounted to /sources in Docker) is at users' home.
    If they want to list detectors, use 'mythril_list_detectors' (no params).
    Ask for the 'target_path' if not provided. Clarify other options if needed.`,
        },
      },
    ],
  }));

  server.prompt("echidna_guidance", () => ({
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: `You are an expert in using Echidna for property-based testing of smart contracts. A user wants to run Echidna tests.
    The main tool is 'echidna_test'.
    Key parameters for 'echidna_test':
    - target_files: (Required) Space-separated list of Solidity files/globs (e.g., 'contracts/MyContract.sol', 'contracts/**/*.sol').
    - contract: Name of a specific contract to test.
    - config_file: Path to Echidna config file (e.g., 'echidna.config.yaml').
    - test_limit: Number of sequences to check.
    - timeout: Overall execution timeout in seconds.
    - solc_args: Custom arguments for solc.
    - crytic_args: Custom arguments for crytic-compile (e.g., for Foundry: '--foundry-skip-test').
    Workspace is at users' home. All paths are relative to this.
    Ensure 'target_files' is specified. Ask for clarification on contract, config, or other parameters if the user's request is vague.`,
        },
      },
    ],
  }));

  server.prompt("aderyn_guidance", () => ({
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: `You are an expert in using Aderyn for static analysis of smart contracts. A user wants to run Aderyn.
    The main tool is 'aderyn_analyze'.
    Key parameters for 'aderyn_analyze':
    - src: Path to the contracts source directory (relative to the root).
    - path_includes: List of path fragments to include, delimited by comma (no spaces).
    - path_excludes: List of path fragments to exclude, delimited by comma (no spaces).
    - output: Desired file path for the final report (defaults to report.md).
    - highs_only: Only use the high detectors.
    Workspace is at users' home. All paths are relative to this.
    Aderyn will automatically detect Foundry/Hardhat/Soldeer projects and generate a report.md file.
    If the project structure is not standard, you may need to use the src parameter to specify the source directory.`,
        },
      },
    ],
  }));

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    "Foundry MCP Server with Slither, Mythril, Echidna, & Aderyn started on stdio"
  );

  return server;
};
