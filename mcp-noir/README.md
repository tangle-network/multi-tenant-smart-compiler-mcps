# Noir zkVM MCP Server

MCP Server Implementation for Noir zero-knowledge virtual machine development. Enables creation and management of temporary projects with Noir integration, execution of common Nargo commands, and Barretenberg proving tools via the MCP protocol.

## Installation

### Prerequisites

- Node.js v22 or above
- pnpm
- TypeScript
- Docker
- Rust and Cargo (for local development)
- Noir CLI (nargo) (for local development)
- Barretenberg (bb) (for local development)
- Foundry (for local development)

### Setup

```bash
# Clone the repository
git clone https://github.com/tangle-network/blueprint-agent

# Navigate to the mcp-noir package
cd packages/mcp-noir

# Create .env file
cp .env.example .env

# Install dependencies
pnpm install
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
      "noir-zkvm": {
        "command": "node",
        "args": ["packages/mcp-noir/dist/index.js"]
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
| `NODE_ENV`             | Sets the environment mode. In production, projects are stored in `/noir`.                                    | `development`     |
| `RATE_LIMIT_DISABLED`  | Disables rate limiting.                                                                                      | `false`           |

## Tools

### Project Management Tools

| Tool                 | Description                                      | Parameters                                           |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| `create-project`     | Creates a new project and returns the project ID | `name: string`, `files: Record<string, string>`      |
| `delete-project`     | Deletes a project by project ID                  | `projectId: string`                                  |
| `edit-project-files` | Edits multiple files in a project                | `projectId: string`, `files: Record<string, string>` |

### Noir Development Tools

| Tool            | Description                                                         | Parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nargo-check`   | Check a local package and all of its dependencies for errors        | `terminalId: string`, `package?: string`, `workspace?: boolean`, `expressionWidth?: number`, `boundedCodegen?: boolean`, `force?: boolean`, `printAcir?: boolean`, `denyWarnings?: boolean`, `silenceWarnings?: boolean`, `debugComptimeInFile?: string`, `skipUnderconstrainedCheck?: boolean`, `skipBrilligConstraintsCheck?: boolean`, `countArrayCopies?: boolean`, `enableBrilligConstraintsCheckLookback?: boolean`, `pedanticSolving?: boolean`, `unstableFeatures?: string`, `overwrite?: boolean`                                                                           |
| `nargo-compile` | Compile the program and its secret execution trace into ACIR format | `terminalId: string`, `package?: string`, `workspace?: boolean`, `expressionWidth?: number`, `boundedCodegen?: boolean`, `force?: boolean`, `printAcir?: boolean`, `denyWarnings?: boolean`, `silenceWarnings?: boolean`, `debugComptimeInFile?: string`, `skipUnderconstrainedCheck?: boolean`, `skipBrilligConstraintsCheck?: boolean`, `countArrayCopies?: boolean`, `enableBrilligConstraintsCheckLookback?: boolean`, `pedanticSolving?: boolean`, `unstableFeatures?: string`                                                                                                  |
| `nargo-execute` | Executes a circuit to calculate its return value                    | `terminalId: string`, `witnessName?: string`, `proverName?: string`, `package?: string`, `workspace?: boolean`, `expressionWidth?: number`, `boundedCodegen?: boolean`, `force?: boolean`, `printAcir?: boolean`, `denyWarnings?: boolean`, `silenceWarnings?: boolean`, `debugComptimeInFile?: string`, `skipUnderconstrainedCheck?: boolean`, `skipBrilligConstraintsCheck?: boolean`, `countArrayCopies?: boolean`, `enableBrilligConstraintsCheckLookback?: boolean`, `pedanticSolving?: boolean`, `unstableFeatures?: string`, `oracleResolver?: string`, `oracleFile?: string` |

### Barretenberg Proving Tools

| Tool                         | Description                           | Parameters                                                                       |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| `bb-prove`                   | Generate proof and save proof         | `terminalId: string`, `backend: string`, `witness: string`, `output: string`     |
| `bb-write-vk`                | Write the verification key to a file  | `terminalId: string`, `backend: string`, `output: string`, `oracleHash?: string` |
| `bb-write-solidity-verifier` | Write the solidity verifier to a file | `terminalId: string`, `vkey: string`, `output: string`                           |

### Foundry Development Tools

| Tool           | Description                                     | Parameters                                     |
| -------------- | ----------------------------------------------- | ---------------------------------------------- |
| `forge-build`  | Builds a Solidity project using Foundry         | `projectId: string`                            |
| `forge-test`   | Runs tests for a Solidity project using Foundry | `projectId: string`                            |
| `forge-deploy` | Deploys a Solidity project using Foundry        | `projectId: string`, `network: string`         |
| `cast-send`    | Sends transactions using Cast                   | `to: string`, `value: string`, `data?: string` |
| `cast-call`    | Makes read-only calls using Cast                | `to: string`, `data: string`                   |

### Anvil Tools

| Tool           | Description                                    | Parameters                           |
| -------------- | ---------------------------------------------- | ------------------------------------ |
| `anvil-start`  | Starts an Anvil local blockchain               | `port?: number`, `accounts?: number` |
| `anvil-stop`   | Stops the running Anvil instance               | None                                 |
| `anvil-status` | Checks if Anvil is running and gets its status | None                                 |

### Shell Tools

| Tool          | Description                                           | Parameters                             |
| ------------- | ----------------------------------------------------- | -------------------------------------- |
| `run_command` | Executes shell commands (limited to allowed commands) | `command: string`, `projectId: string` |

## Resources

| Resource             | URI Template                              | Description                                 |
| -------------------- | ----------------------------------------- | ------------------------------------------- |
| `list-projects`      | `project://projects`                      | Returns an array of existing project IDs    |
| `project-files`      | `project://{projectId}/files`             | Lists all file paths under a given project  |
| `file-content`       | `project://{projectId}/file/{+filePath*}` | Returns contents of the specified file path |
| `cargo-metadata`     | `cargo://{projectId}/metadata`            | Returns Cargo metadata for a project        |
| `cargo-dependencies` | `cargo://{projectId}/dependencies`        | Returns Cargo dependencies for a project    |

## Noir Development Features

The server provides comprehensive support for Noir zkVM development:

- **Circuit Compilation**: Compile Noir circuits to ACIR format with various optimization flags
- **Circuit Execution**: Execute circuits with custom witness data and prover inputs
- **Static Analysis**: Check circuits for errors, warnings, and optimization opportunities
- **Proving Integration**: Generate and verify zero-knowledge proofs using Barretenberg
- **Smart Contract Integration**: Generate Solidity verifiers for onchain proof verification

### Common Noir Parameters

Many Noir tools support common parameters for fine-tuning compilation and execution:

- `--package`: Specify the package to operate on
- `--workspace`: Operate on all packages in the workspace
- `--expression-width`: Set the backend expression width for optimization
- `--bounded-codegen`: Generate bounded ACIR for specific backends
- `--print-acir`: Display the generated ACIR for debugging
- `--deny-warnings`: Treat warnings as errors
- `--skip-underconstrained-check`: Skip underconstrained value checks (use with caution)
- `--pedantic-solving`: Enable pedantic ACVM solving for correctness verification
