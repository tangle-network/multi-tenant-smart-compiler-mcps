# mcp-fs

File system operations for MCP services with built-in multi-tenancy support.

## Usage

### Single-Tenant Mode (Default)
```typescript
import { registerProjectTools } from 'mcp-fs';

registerProjectTools(server, { 
  projectsRoot: "/blueprint"  // Fixed path
});
```

### Multi-Tenant Mode
```typescript
import { registerProjectTools } from 'mcp-fs';
import { getUserIdFromRequest } from 'mcp-http';

registerProjectTools(server, { 
  projectsRoot: async (req) => {
    const userId = getUserIdFromRequest(req);
    return `/workspace/${userId}`;  // Dynamic per-user path
  }
});
```

## API

Both `registerProjectTools` and `registerProjectResources` accept:
- `projectsRoot: string` - Fixed path for single-tenant
- `projectsRoot: (req) => string | Promise<string>` - Dynamic resolver for multi-tenant

## Features

- **Workspace isolation**: Each user gets `/workspace/{userId}/`
- **Path validation**: Prevents cross-tenant access
- **Backward compatible**: Existing single-tenant code works unchanged
- **Shared cache**: All tenants benefit from Docker layer caching