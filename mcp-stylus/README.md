# Stylus Smart Contract MCP Server

MCP Server Implementation for Stylus smart contract development on Arbitrum network. Enables creation and management of temporary Rust projects with Stylus integration, execution of common Cargo commands, and Solidity development tools via the MCP protocol.

## Installation

### Prerequisites

- Node.js v22 or above
- pnpm
- TypeScript
- Docker
- Rust and Cargo (for local development)
- Stylus CLI (for local development)
- Foundry (for local development)
- Nitro (for local development)

### Setup

```bash
# Clone the repository
git clone https://github.com/tangle-network/blueprint-agent

# Navigate to the mcp-stylus package
cd packages/mcp-stylus

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
      "stylus-contract": {
        "command": "node",
        "args": ["packages/mcp-stylus/dist/index.js"]
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
| `NODE_ENV`             | Sets the environment mode. In production, projects are stored in `/stylus`.                                  | `development`     |
| `RATE_LIMIT_DISABLED`  | Disables rate limiting.                                                                                       | `false`           |

## Tools

### Project Management Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `create-project`     | Creates a new Rust project and returns the project ID             | `name: string`, `files: Record<string, string>`      |
| `delete-project`     | Deletes a project by project ID                                   | `projectId: string`                                  |
| `edit-project-files` | Edits multiple files in a project                                 | `projectId: string`, `files: Record<string, string>` |

### Cargo Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `cargo-build`        | Builds a Rust project using Cargo                                 | `projectId: string`                                  |
| `cargo-check`        | Checks compile errors of a Rust project using Cargo               | `projectId: string`                                  |
| `cargo-clippy`       | Runs Clippy to check for common mistakes and suggest improvements | `projectId: string`                                  |
| `cargo-test`         | Runs tests for a Rust project using Cargo                         | `projectId: string`                                  |
| `cargo-run`          | Runs a Rust project using Cargo                                   | `projectId: string`                                  |

### Stylus Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `stylus_check`       | Checks the Stylus project for compilation errors                 | `projectId: string`                                  |
| `stylus_export_abi`  | Exports Solidity ABI of the Stylus project                       | `projectId: string`, `outputFile?: string`, `isJson?: boolean` |
| `stylus_constructor` | Prints the signature of the constructor                          | `projectId: string`, `outputFile?: string`           |
| `stylus_get_initcode`| Gets the initcode for the contract                               | `projectId: string`, `outputFile?: string`           |
| `stylus_deploy`      | Deploys the Stylus project to Arbitrum                           | `projectId: string`, `rpcUrl?: string`, `deployerSalt?: string`, `constructorArgs?: string`, `constructorValue?: number`, `constructorSignature?: string`, `isNotActive?: boolean` |
| `stylus_verify_deployment` | Verifies the deployment of a Stylus contract                | `projectId: string`, `txHash: string`, `rpcUrl?: string`, `maxFeePerGas?: number` |

### Stylus Contract Management Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `stylus_activate`    | Activates an already deployed contract                           | `projectId: string`, `contractAddress: string`, `rpcUrl?: string` |
| `stylus_cache_bid`   | Places a bid on a Stylus contract to cache it                   | `contractAddress: string`, `rpcUrl?: string`, `bidAmount: number` |
| `stylus_cache_status`| Gets the status of the Stylus contract's cache                  | `contractAddress: string`, `rpcUrl?: string`         |
| `stylus_cache_suggest_bid` | Suggests a bid for the Stylus contract's cache              | `contractAddress: string`, `rpcUrl?: string`         |

### Nitro Localnet Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `nitro_localnet_start` | Starts the Nitro localnet for development                      | `port?: number`, `silent?: boolean`                  |
| `nitro_localnet_stop` | Stops the running Nitro localnet                                | None                                                 |
| `nitro_localnet_status` | Gets the status of the Nitro localnet                         | None                                                 |

### Foundry Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `forge-build`        | Builds a Solidity project using Foundry                           | `projectId: string`                                  |
| `forge-test`         | Runs tests for a Solidity project using Foundry                   | `projectId: string`                                  |
| `forge-deploy`       | Deploys a Solidity project using Foundry                          | `projectId: string`, `network: string`               |
| `cast-send`          | Sends transactions using Cast                                     | `to: string`, `value: string`, `data?: string`       |
| `cast-call`          | Makes read-only calls using Cast                                  | `to: string`, `data: string`                         |

### Shell Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `run_command`        | Executes shell commands (limited to allowed commands)             | `command: string`, `projectId: string`               |

## Resources

| Resource        | URI Template                              | Description                                 |
| --------------- | ----------------------------------------- | ------------------------------------------- |
| `list-projects` | `project://projects`                      | Returns an array of existing project IDs    |
| `project-files` | `project://{projectId}/files`             | Lists all file paths under a given project  |
| `file-content`  | `project://{projectId}/file/{+filePath*}` | Returns contents of the specified file path |
| `cargo-metadata`| `cargo://{projectId}/metadata`            | Returns Cargo metadata for a project        |
| `cargo-dependencies`| `cargo://{projectId}/dependencies`    | Returns Cargo dependencies for a project    |
