# Multi-Tenancy & Authentication

## Overview

Each MCP supports both **multi-tenant** (isolated users) and **single-tenant** (shared workspace) modes via HTTP header-based authentication.

## Authentication Flow

### Headers

**`x-user-id`** (required)
- Tenant identifier (e.g., `alice`, `bob`, `guest`)
- Creates isolated Linux user with dedicated `/home/{userId}` workspace
- Defaults to `"guest"` if not provided

**`authorization`** (required)
- Format: `Bearer {tenantId}|{scope}|{token}`
- Parsed into MCP auth context for access control
- Defaults to `"Bearer 0|mcp-http|some-random-string"`

**`x-api-key`** (optional)
- Server-level API key set via `MCP_HTTP_API_KEY` env var
- Validates before processing requests

### Implementation (mcp-http)

```typescript
// mcp-http/src/auth.middleware.ts

// API key validation (optional)
export function apiKeyMiddleware(req, res, next) {
  const apiKey = process.env.MCP_HTTP_API_KEY;
  if (apiKey && req.headers['x-api-key'] !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// User identity extraction
export function proxyAuthMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'] || 'guest';
  const authorization = req.headers['authorization'] || 'Bearer 0|mcp-http|default';

  req.auth = {
    token: authorization,
    clientId: req.query.sessionId,
    scopes: [authorization.split('|')[1]],
    extra: { userId }
  };
  next();
}

// Extract userId from MCP request
export const getUserIdFromRequest = (req) => {
  return req.authInfo?.extra?.userId ?? 'guest';
};
```

## Tenant Isolation (mcp-fs)

### Linux User Creation

Each tenant gets a dedicated Linux user in the `external-users` group:

```bash
# mcp-*/bin/create-linux-user.sh
useradd -m -g external-users -s /bin/bash $USERNAME
chmod 700 /home/$USERNAME  # Prevent cross-tenant access
```

Toolchains copied from root to user home:
- **Rust:** `~/.cargo`, `~/.rustup`
- **Node:** `~/.cache/node/corepack`
- **Solidity:** `~/.solc-select`, `~/.svm`, `~/.mythril`

### Workspace Isolation

```typescript
// mcp-fs/src/project/utils.ts

export const getWorkspacePath = (userId: string, workspace: string) => {
  const HOME = "/home";
  const workspacePath = path.join(HOME, userId, workspace);

  // Prevent path traversal outside /home
  const resolvedWorkspace = path.resolve(workspacePath);
  if (!resolvedWorkspace.startsWith(path.resolve(HOME))) {
    throw new Error("Workspace path resolves outside project root");
  }

  return { workspace: workspacePath };
};

export const transferFolderOwnership = async (userId: string, path: string) => {
  await execAsyncAsRoot(`chown -R ${userId}:external-users ${path}`);
  await execAsyncAsRoot(`chmod -R 700 ${path}`);
};

export const ensureExistUser = async (userId: string) => {
  return execAsyncAsRoot(`/usr/local/bin/create-linux-user.sh ${userId}`);
};
```

### Command Execution

All shell commands run as the tenant's Linux user:

```typescript
export const execAsync = (userId: string, cmd: string) => {
  return execAsyncAsRoot(`su - ${userId} --c "${cmd}"`);
};
```

## Usage Patterns

### Multi-Tenant (Isolated Workspaces)

**Client Request:**
```bash
curl -X POST http://localhost:4001/message \
  -H "x-user-id: alice" \
  -H "authorization: Bearer 123|mcp-solidity-kit|abc" \
  -d '{"method":"tools/call","params":{"name":"project_create","arguments":{"projectId":"my-dapp"}}}'
```

**Server Behavior:**
1. Creates Linux user `alice` if not exists
2. Creates workspace at `/home/alice/my-dapp`
3. Sets ownership: `chown -R alice:external-users /home/alice/my-dapp`
4. Sets permissions: `chmod 700 /home/alice/my-dapp`
5. Runs builds as: `su - alice --c "forge build"`

**Result:** User `bob` cannot access `/home/alice/*` (permission denied)

### Single-Tenant (Shared Workspace)

**Client Request:**
```bash
curl -X POST http://localhost:4001/message \
  -H "x-user-id: guest" \
  -H "authorization: Bearer 0|mcp-solidity-kit|default" \
  -d '{"method":"tools/call","params":{"name":"project_create","arguments":{"projectId":"shared-project"}}}'
```

**Server Behavior:**
1. Uses `guest` user (created at container startup)
2. All clients share `/home/guest/*` workspace
3. No isolation between requests

### No Auth (Development)

Set no `MCP_HTTP_API_KEY`:
```bash
docker run -e MCP_HTTP_API_KEY="" mcp-solidity-kit
```

Defaults apply:
- `x-user-id` → `"guest"`
- `authorization` → `"Bearer 0|mcp-http|some-random-string"`

## Security Considerations

### Multi-Tenant Isolation
- ✅ Filesystem: `chmod 700` prevents cross-tenant reads
- ✅ Processes: Commands run via `su - {userId}`
- ⚠️ Network: All tenants share container network namespace
- ⚠️ Resources: No CPU/memory limits per tenant (use Docker cgroups)

### Path Traversal Protection
```typescript
// Validates all workspace paths stay within /home/{userId}
if (!resolvedWorkspace.startsWith(path.resolve(HOME))) {
  throw new Error("Invalid workspace path");
}
```

### Command Injection
- Commands executed via `su - {userId} --c "{cmd}"`
- Ensure `userId` is sanitized (alphanumeric only)
- Avoid direct string interpolation of user input

## Environment Variables

**MCP_HTTP_API_KEY** (optional)
- Enables server-level API key validation
- Check via `x-api-key` header

**PORT** (default: 3000)
- HTTP server port

**NODE_ENV** (default: production)
- Set to `development` for verbose logging

## Example: Building Against Multi-Tenant Auth

```typescript
// Custom MCP using mcp-fs + mcp-http

import { createMCPServer, getUserIdFromRequest } from 'mcp-http';
import { getWorkspacePath, ensureExistUser, execAsync } from 'mcp-fs';

const server = createMCPServer({
  name: 'my-custom-mcp',
  version: '1.0.0'
});

server.addTool({
  name: 'compile_contract',
  async handler(request) {
    const userId = getUserIdFromRequest(request);
    const { projectId } = request.params.arguments;

    // Ensure user exists
    await ensureExistUser(userId);

    // Get isolated workspace
    const { workspace } = getWorkspacePath(userId, projectId);

    // Run compiler as user
    const result = await execAsync(userId, `cd ${workspace} && solc Contract.sol`);

    return { content: [{ type: 'text', text: result.stdout }] };
  }
});
```

## Docker Compose Example

```yaml
services:
  mcp-solidity-kit:
    image: ghcr.io/tangle-network/mcp-solidity-kit:latest
    environment:
      - MCP_HTTP_API_KEY=secret123  # Optional API key
      - PORT=3000
    ports:
      - "4001:3000"
```

**Multi-tenant requests:**
```bash
# Alice's workspace
curl -H "x-user-id: alice" -H "x-api-key: secret123" http://localhost:4001/...

# Bob's workspace (isolated)
curl -H "x-user-id: bob" -H "x-api-key: secret123" http://localhost:4001/...
```

**Single-tenant (all share guest):**
```bash
curl -H "x-user-id: guest" -H "x-api-key: secret123" http://localhost:4001/...
```
