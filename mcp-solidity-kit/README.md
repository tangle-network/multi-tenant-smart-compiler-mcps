# Solidity Kit MCP Server

MCP Server Implementation for Solidity smart contract development with Foundry toolkit and comprehensive auditing tools. Enables creation and management of temporary Solidity projects, execution of common Foundry commands, and advanced security analysis via the MCP protocol.

## Installation

### Prerequisites

- Node.js v22 or above
- pnpm
- TypeScript
- Docker
- Foundry (for local development)
- Slither (for local development)
- Mythril (for local development)
- Echidna (for local development)
- Aderyn (for local development)

### Setup

```bash
# Clone the repository
git clone https://github.com/tangle-network/blueprint-agent

# Navigate to the mcp-solidity-kit package
cd packages/mcp-solidity-kit

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
```

## Development

Run the server in watch mode with hot-reloading:

```bash
pnpm dev
```

## Build

Compile TypeScript source to JavaScript:

```bash
pnpm build
```

## Usage

Run the server directly:

```bash
node dist/index.js
```

By default, the server listens on STDIO. You can integrate it with any MCP client that supports STDIO transports.

### Using with Cursor

Add the following to your `.vscode/mcp.json` (or to your user settings) to register the server:

```json
{
  "mcp": {
    "servers": {
      "solidity-kit": {
        "command": "node",
        "args": ["packages/mcp-solidity-kit/dist/index.js"]
      }
    }
  }
}
```

### With MCP Inspector

Build the project first:

```bash
pnpm build
```

then run the MCP Inspector:

```bash
pnpx @modelcontextprotocol/inspector node dist/index.js
```

Read more about MCP Inspector [here](https://modelcontextprotocol.io/docs/tools/inspector).

### With Docker

> [!NOTE]
> Please take a look at `Makefile` for more details.

Build the image:

```bash
pnpm build && make build-image
```

Run the container:

```bash
make start-container
```

E2E setup container:

```bash
make e2e-setup
```

## Configuration

The server can be configured using the following environment variables:

| Variable               | Description                                                                                                  | Default Value     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `MCP_HTTP_API_KEY`     | Sets an API key for server authentication. If set, requests must include this key in the `x-api-key` header. | (empty)           |
| `RATE_LIMIT_WINDOW_MS` | Configures the time window for rate limiting in milliseconds.                                                | `900000` (15 min) |
| `RATE_LIMIT_LIMIT`     | Sets the maximum number of requests allowed within the rate limit window.                                    | `200`             |
| `ORIGIN`               | Defines the allowed origins for CORS (Cross-Origin Resource Sharing).                                        | `*`               |
| `PORT`                 | Specifies the port on which the server will listen.                                                          | `3000`            |
| `NODE_ENV`             | Sets the environment mode. In production, projects are stored in `/solidity-kit`.                            | `development`     |
| `RATE_LIMIT_DISABLED`  | Disables rate limiting.                                                                                      | `false`           |

## Tools

### Project Management Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `create-project`     | Creates a new Solidity project and returns the project ID         | `name: string`, `files: Record<string, string>`      |
| `delete-project`     | Deletes a project by project ID                                   | `projectId: string`                                  |
| `edit-project-files` | Edits multiple files in a project                                 | `projectId: string`, `files: Record<string, string>` |

### Foundry Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `forge_build`        | Builds a Solidity project using Foundry                           | `projectId: string`                                  |
| `forge_test`         | Runs tests for a Solidity project using Foundry                   | `projectId: string`, `match?: string`, `match_contract?: string`, `match_path?: string`, `verbosity?: number` |
| `forge_script`       | Runs a Forge script from the workspace                            | `projectId: string`, `scriptPath: string`, `sig?: string`, `rpcUrl?: string`, `broadcast?: boolean`, `verify?: boolean` |
| `install_dependency` | Installs a dependency for the Forge workspace                     | `projectId: string`, `dependency: string`            |

### Cast (EVM Interaction) Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `cast_call`          | Calls a contract function (read-only)                             | `contractAddress: string`, `functionSignature: string`, `args?: string[]`, `rpcUrl?: string`, `blockNumber?: string`, `from?: string` |
| `cast_balance`       | Checks the ETH balance of an address                              | `address: string`, `rpcUrl?: string`, `blockNumber?: string`, `formatEther?: boolean` |
| `cast_receipt`       | Gets the transaction receipt                                       | `txHash: string`, `rpcUrl?: string`                  |
| `cast_logs`          | Gets logs from the blockchain                                     | `fromBlock?: string`, `toBlock?: string`, `address?: string`, `topics?: string[]`, `rpcUrl?: string` |
| `cast_storage`       | Gets storage at a specific slot                                   | `address: string`, `slot: string`, `rpcUrl?: string`, `blockNumber?: string` |
| `cast_sig`           | Gets the function selector for a function signature               | `functionSignature: string`                         |
| `cast_4byte`         | Gets the function signature for a 4-byte selector                 | `selector: string`                                   |
| `cast_chain`         | Gets information about the current chain                          | `rpcUrl?: string`                                    |
| `cast_contract`      | Gets contract bytecode and metadata                               | `address: string`, `rpcUrl?: string`                 |
| `cast_compute_address` | Computes the address for a contract deployment                  | `deployer: string`, `nonce: string`, `rpcUrl?: string` |
| `cast_convert_eth_units` | Converts between ETH units                                       | `value: string`, `from: string`, `to: string`        |
| `cast_run`           | Runs arbitrary EVM bytecode                                       | `bytecode: string`, `rpcUrl?: string`, `from?: string`, `value?: string` |

### Anvil (Local Blockchain) Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `anvil_start`        | Starts an Anvil local blockchain                                  | `port?: number`, `accounts?: number`                 |
| `anvil_stop`         | Stops the running Anvil instance                                  | None                                                 |
| `anvil_status`       | Checks if Anvil is running and gets its status                   | None                                                 |

### Security Analysis Tools

#### Slither (Static Analysis)

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `slither_analyze`    | Runs Slither static analysis on a target contract or project      | `projectId: string`, `target: string`, `detectors_to_run?: string`, `detectors_to_exclude?: string`, `filter_paths?: string`, `include_paths?: string`, `solc_remaps?: string`, `solc_args?: string`, `foundry_compile_all?: boolean`, `json_output_path?: string`, `sarif_output_path?: string`, `markdown_root?: string`, `checklist?: boolean` |
| `slither_print`      | Runs Slither printers to get specific contract information       | `projectId: string`, `target: string`, `printers_to_run: string`, `solc_remaps?: string`, `foundry_compile_all?: boolean`, `json_output_path?: string` |
| `slither_list_detectors` | Lists available Slither detectors                              | None                                                 |
| `slither_list_printers` | Lists available Slither printers                              | None                                                 |

#### Mythril (Symbolic Execution)

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `mythril_analyze`    | Runs Mythril symbolic execution analysis (via Docker)            | `projectId: string`, `target_path: string`, `output_format?: string`, `execution_timeout?: number`, `max_depth?: number` |
| `mythril_list_detectors` | Lists available Mythril detectors                            | None                                                 |

#### Echidna (Property-Based Testing)

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `echidna_test`       | Runs Echidna property-based tests                                | `projectId: string`, `target_files: string`, `contract?: string`, `config_file?: string`, `test_limit?: number`, `timeout?: number`, `solc_args?: string`, `crytic_args?: string` |

#### Aderyn (Static Analysis)

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `aderyn_analyze`     | Runs Aderyn static analysis                                      | `projectId: string`, `src?: string`, `path_includes?: string`, `path_excludes?: string`, `output?: string`, `highs_only?: boolean` |

## Resources

| Resource        | URI Template                              | Description                                 |
| --------------- | ----------------------------------------- | ------------------------------------------- |
| `list-projects` | `project://${userId}/projects`                      | Returns an array of existing project IDs    |
| `project-files` | `project://${userId}/{projectId}/files`             | Lists all file paths under a given project  |
| `file-content`  | `project://${userId}/{projectId}/file/{+filePath*}` | Returns contents of the specified file path |
| `cast_chain_info` | `cast://chain-info`                    | Returns information about the current chain |
| `cast_contract_info` | `cast://contract/{address}`           | Returns contract bytecode and metadata      |

## AI Guidance Prompts

The server includes specialized AI guidance prompts for each security analysis tool:

- **slither_guidance**: Expert guidance for using Slither static analysis
- **mythril_guidance**: Expert guidance for using Mythril symbolic execution
- **echidna_guidance**: Expert guidance for using Echidna property-based testing
- **aderyn_guidance**: Expert guidance for using Aderyn static analysis
