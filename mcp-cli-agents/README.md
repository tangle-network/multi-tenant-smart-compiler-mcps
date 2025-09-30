# MCP CLI Agents

Agent-parameterized MCP servers for task delegation to CLI-based AI coding agents.

## Usage

Each MCP server instance is dedicated to a specific agent type with pre-configured tools:

```bash
# Claude SDK with filesystem, GitHub, and Serena AI tools
AGENT_TYPE=claude-code MCP_CONFIG_PATH=./mcp-config.json node dist/index.js

# Gemini CLI with basic tools
AGENT_TYPE=gemini-cli node dist/index.js

# Codex with basic tools
AGENT_TYPE=codex node dist/index.js
```

## Configuration

```bash
AGENT_TYPE=claude-code                    # Required: agent type
MCP_CONFIG_PATH=./mcp-config.json         # Optional: path to MCP config file
SYSTEM_PROMPT="You are a helpful assistant" # Optional: custom system prompt
ENABLE_BOLT_CONVERSION=true               # Optional: convert output to bolt artifacts
DEFAULT_ARTIFACT_ID=my-project            # Optional: default artifact ID
DEFAULT_ARTIFACT_TITLE="My Project"      # Optional: default artifact title
```

## MCP Configuration

Create `mcp-config.json` with your MCP servers:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/projects"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GH_TOKEN": "your-token" }
    },
    "serena": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--network",
        "host",
        "-v",
        "/path/to/projects:/workspaces/projects",
        "ghcr.io/oraios/serena:latest",
        "serena-mcp-server",
        "--transport",
        "stdio"
      ]
    }
  }
}
```

## Tools

- `execute` - Delegate a task to the configured agent
- `status` - Get agent capabilities and configuration

## Pre-configured Tools by Agent

**Claude SDK:** Read, Write, Bash, filesystem MCP, GitHub MCP, Serena AI MCP  
**Gemini CLI:** Read, Write, Bash  
**Codex CLI:** Read, Write, Bash

## Resources

- `{agent-type}://capabilities` - Agent capabilities and available tools

## Example Usage

```typescript
// Delegate a coding task
await mcpClient.callTool("execute", {
  task: "Create a React component for user authentication with TypeScript",
});

// Check what the agent can do
await mcpClient.callTool("status");
```

The system is designed for **task delegation** rather than configuration - the AI simply delegates tasks to pre-configured, capable agents.

## 🧪 **Testing**

### **Development Testing (Fast)**

```bash
# Unit tests with CLI simulation (no real CLI tools required)
pnpm test:cli-agents

# Claude SDK streaming tests
pnpm test:claude-integration

# All local tests
pnpm test
```

### **Integration Testing (Docker)**

```bash
# Build Docker environment with all CLI tools
pnpm docker:build

# Run comprehensive integration tests (requires API keys)
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"

pnpm docker:test:detailed
```

### **What the Integration Tests Do**

1. **Claude SDK** → Creates comprehensive Node.js API with:
   - Express.js server with middleware
   - Full CRUD routes and controllers
   - Authentication and validation
   - Tests and documentation
   - File size and structure analysis

2. **Codex CLI** → Builds utility library with:
   - Advanced math, string, array functions
   - Comprehensive JSDoc comments
   - Jest test files and TypeScript definitions
   - Function counting and code analysis

3. **Gemini CLI** → Generates documentation suite with:
   - Multiple markdown files (README, CONTRIBUTING, etc.)
   - GitHub templates and workflows
   - Word count and content analysis
   - Markdown structure validation

See `DOCKER_TESTING.md` for detailed documentation.
