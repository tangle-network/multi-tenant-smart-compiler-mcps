# RISC Zero zkVM MCP Server

MCP Server Implementation for RISC Zero zkVM development. Enables creation and management of temporary Rust projects with RISC Zero integration, execution of common Cargo commands, and Solidity development tools via the MCP protocol.

## Installation

### Prerequisites

- Node.js v22 or above
- pnpm
- TypeScript
- Docker
- Rust and Cargo (for local development)
- RISC Zero CLI (for local development)
- Foundry (for local development)

### Setup

```bash
# Clone the repository
git clone https://github.com/tangle-network/blueprint-agent

# Navigate to the mcp-risc-zero package
cd packages/mcp-risc-zero

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
      "risc-zero-zkvm": {
        "command": "node",
        "args": ["packages/mcp-risc-zero/dist/index.js"]
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
| `NODE_ENV`             | Sets the environment mode. In production, projects are stored in `/risc-zero`.                               | `development`     |
| `RATE_LIMIT_DISABLED`  | Disables rate limiting.                                                                                      | `false`           |

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

### RISC Zero Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `risc-zero-mode-set` | Sets the RISC Zero development mode                               | `isDevMode: boolean`                                 |
| `risc-zero-mode-get` | Gets the current RISC Zero development mode                       | None                                                 |

### Foundry Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `forge-build`        | Builds a Solidity project using Foundry                           | `projectId: string`                                  |
| `forge-test`         | Runs tests for a Solidity project using Foundry                   | `projectId: string`                                  |
| `forge-deploy`       | Deploys a Solidity project using Foundry                          | `projectId: string`, `network: string`               |
| `cast-send`          | Sends transactions using Cast                                     | `to: string`, `value: string`, `data?: string`       |
| `cast-call`          | Makes read-only calls using Cast                                  | `to: string`, `data: string`                         |

### Anvil Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `anvil-start`        | Starts an Anvil local blockchain                                  | `port?: number`, `accounts?: number`                 |
| `anvil-stop`         | Stops the running Anvil instance                                  | None                                                 |
| `anvil-status`       | Checks if Anvil is running and gets its status                   | None                                                 |

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

## RISC Zero Development Mode

The server supports two development modes for RISC Zero:

- **Production Mode** (`isDevMode: false`): Optimized for production builds and deployments
- **Development Mode** (`isDevMode: true`): Includes additional debugging information and development features

You can switch between modes using the `risc-zero-mode-set` tool and check the current mode with `risc-zero-mode-get`.
