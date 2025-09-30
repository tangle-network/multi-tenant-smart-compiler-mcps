# MCP Docker Scripts

Production-ready scripts for building and orchestrating MCP services with layered caching.

## Quick Start

```bash
# Build everything (cache layers + MCP services)
./scripts/build.sh

# Start all MCP services
./scripts/mcp-orchestrator.sh start

# Run integration tests
cd packages/task-orchestrator && pnpm test mcp-integration
```

## Layered Cache Architecture

The system uses a layered Docker caching strategy to minimize build times:

```
base-system (Node.js, Python, system tools)
    └── rust-base (Rust toolchain + common crates)
        ├── ethereum-base (Foundry suite)
        │   ├── stylus-base (Arbitrum Stylus)
        │   ├── tangle-base (Substrate + Foundry tools)
        │   ├── risczero-base (RISC Zero zkVM)
        │   └── succinct-base (SP1 prover)
        ├── solana-base (Solana CLI)
        ├── sui-base (Sui CLI)
        └── noir-base (Noir proving system)
```

## Available Scripts

### mcp-orchestrator.sh

**Main orchestration script** - Manages the complete MCP service lifecycle.

```bash
# Build all MCP Docker images
./scripts/mcp-orchestrator.sh build

# Start all services
./scripts/mcp-orchestrator.sh start

# Health check all services
./scripts/mcp-orchestrator.sh health

# View logs
./scripts/mcp-orchestrator.sh logs [service-name]

# Test SSE connections
./scripts/mcp-orchestrator.sh test

# Stop all services
./scripts/mcp-orchestrator.sh stop
```

**Service Ports:**

- mcp-solidity-kit: 4001
- mcp-tangle-blueprint: 4002
- mcp-solana-program: 4003
- mcp-sui-program: 4004
- mcp-stylus: 4005
- mcp-risc-zero: 4006
- mcp-succinct: 4007
- mcp-noir: 4008
- mcp-cli-agents: 4010

### build.sh

**Unified build script** with automatic detection of the best build method (Depot.dev, Docker Build Cloud, or local Docker).

```bash
# Build everything (cache layers + MCP services)
./scripts/build.sh

# Build and push to registry
./scripts/build.sh --push

# Build only for native platform (faster)
./scripts/build.sh --local

# Force local Docker builds
./scripts/build.sh --no-cloud --local

# Build only cache layers
./scripts/build.sh cache

# Build only MCP services
./scripts/build.sh mcp

# Get help and see all options
./scripts/build.sh --help
```

**Build Methods (Auto-detected):**
- **Depot.dev**: Fastest, native ARM and Intel builders
- **Docker Build Cloud**: Fast parallel builds
- **Local buildx**: QEMU emulation (slower)
- **Basic Docker**: Native platform only

### docker-quick-start.sh

Quick launcher for individual MCP containers during development.

```bash
# Interactive menu
./scripts/docker-quick-start.sh

# Start specific service
./scripts/docker-quick-start.sh mcp-solidity-kit
```

### setup-local-mcps.sh

Configures the frontend app to use local MCP servers.

```bash
# Sets up .dev.vars with local URLs
./scripts/setup-local-mcps.sh
```

### test-cache-benefit.sh

Benchmarks the cache layer performance improvements.

```bash
# Compare build times with and without cache
./scripts/test-cache-benefit.sh
```

## Important Notes

### ⚠️ Docker Resource Requirements

- **Disk space**: ~10GB for all cache layers + 2-3GB per service
- **RAM**: 16GB+ recommended for building cache layers
- **Initial cache build**: 30-60 minutes (one-time)
- **Subsequent builds**: 1-2 minutes with cache
- **Docker Desktop**: Allocate at least 12GB RAM in settings

### 🚀 Performance Benefits

With layered caching:

- **First build**: 30-45 minutes per service → 5-10 minutes
- **Rebuilds**: 5-10 minutes → 1-2 minutes
- **Dependency updates**: Only rebuild affected layers
- **Shared layers**: Multiple services share common base layers

### ✅ Multi-Tenant Architecture

All MCPs support multi-tenant workspaces:

- Isolated workspaces at `/workspace/{userId}/`
- Shared dependency cache across tenants
- Safe concurrent operations
- Resource optimization through caching

### 🔧 Troubleshooting

**Docker build failures:**

```bash
# Build only for your native platform (faster)
./scripts/build.sh --local

# Check Docker disk usage
docker system df

# Clean up unused images
docker system prune -a
```

**Port conflicts:**

```bash
# Check which ports are in use
./scripts/mcp-orchestrator.sh health

# Stop conflicting services
./scripts/mcp-orchestrator.sh stop
```

**Service not responding:**

```bash
# Check logs for specific service
./scripts/mcp-orchestrator.sh logs mcp-solidity-kit

# Restart specific service
./scripts/mcp-orchestrator.sh restart-service mcp-solidity-kit
```

## Complete Workflow

1. **Build everything:**

   ```bash
   # Automatically uses best available method
   ./scripts/build.sh
   # Or build and push to registry
   ./scripts/build.sh --push
   ```

2. **Alternative: Build with orchestrator:**

   ```bash
   # If you prefer using the orchestrator
   ./scripts/mcp-orchestrator.sh build
   ```

3. **Start services:**

   ```bash
   # Start all MCPs
   ./scripts/mcp-orchestrator.sh start

   # Verify health
   ./scripts/mcp-orchestrator.sh health
   ```

4. **Run integration tests:**

   ```bash
   cd packages/task-orchestrator
   pnpm test mcp-integration
   ```

5. **Start the frontend:**

   ```bash
   pnpm setup:db
   pnpm dev
   ```

6. **Access locally at** `http://localhost:5173`

## Architecture Details

The system implements:

- **Layered Docker caching** for fast builds
- **Multi-tenant support** with isolated workspaces
- **SSE communication** for real-time updates
- **Health monitoring** for all services
- **Integration testing** for multi-MCP coordination
- **Orchestration scripts** for easy management
