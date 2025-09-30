# Sui Move Program MCP Server

MCP Server Implementation for Sui Move Program development. Enables creation and management of temporary Sui Move projects and execution of common Sui CLI commands via the MCP protocol.

## Installation

### Prerequisites

- Node.js v22 or above
- pnpm
- TypeScript
- Docker
- Sui CLI (for local development)

### Setup

```bash
# Clone the repository
git clone https://github.com/tangle-network/blueprint-agent

# Navigate to the mcp-sui-program package
cd packages/mcp-sui-program

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
      "sui-program": {
        "command": "node",
        "args": ["packages/mcp-sui-program/dist/index.js"]
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

> [!NOTE] Please read `Makefile` for more details.

Build the image:

```bash
pnpm build && make build-image
```

Run the container:

```bash
make start-container
```

E2E setup:

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
| `NODE_ENV`             | Sets the environment mode. In production, projects are stored in `/sui`.                                     | `development`     |
| `RATE_LIMIT_DISABLED`  | Disables rate limiting.                                                                                      | `false`           |

## Tools

### Project Management Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `create-project`     | Creates a new Sui Move project and returns the project ID         | `name: string`, `files: Record<string, string>`      |
| `delete-project`     | Deletes a project by project ID                                   | `projectId: string`                                  |
| `edit-project-files` | Edits multiple files in a project                                 | `projectId: string`, `files: Record<string, string>` |

### Sui Move Development Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `sui_move_build`     | Builds a Sui Move project using Sui CLI                           | `projectId: string`                                  |
| `sui_move_test`      | Runs Sui Move tests with optional filtering and coverage          | `projectId: string`, `filter?: string`, `isCoverage?: boolean`, `isVerbose?: boolean` |
| `sui_client_publish` | Deploys a Sui Move project to the blockchain                      | `projectId: string`, `network: string`, `isDevMode?: boolean`, `isForce?: boolean`, `gasBudget?: number`, `isSkipDependencyVerification?: boolean`, `withUnpublishedDependencies?: boolean`, `verifyDeps?: boolean` |

### Sui Localnet Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `sui_localnet_start` | Starts a local Sui network for development                        | `reset?: boolean`, `silent?: boolean`                |
| `sui_localnet_stop`  | Stops the running Sui localnet                                    | None                                                 |
| `sui_localnet_status`| Checks if Sui localnet is running and gets its status            | None                                                 |

### Shell Tools

| Tool                 | Description                                                       | Parameters                                           |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `run_command`        | Executes shell commands (limited to Sui CLI commands)             | `command: string`, `projectId: string`               |

## Resources

| Resource        | URI Template                              | Description                                 |
| --------------- | ----------------------------------------- | ------------------------------------------- |
| `list-projects` | `project://projects`                      | Returns an array of existing project IDs    |
| `project-files` | `project://{projectId}/files`             | Lists all file paths under a given project  |
| `file-content`  | `project://{projectId}/file/{+filePath*}` | Returns contents of the specified file path |
