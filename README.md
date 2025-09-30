# Multi-Tenant Smart Contract Compiler MCPs

MCP servers for building, testing, and auditing smart contracts across multiple blockchain platforms. Isolated Docker environments with platform-specific toolchains, multi-tenant workspaces, and HTTP/SSE transport.

## Platforms

| Package | Platform | Tools | Port |
|---------|----------|-------|------|
| **mcp-solidity-kit** | Ethereum/EVM | Hardhat, Foundry, Slither | 4001 |
| **mcp-tangle-blueprint** | Tangle Network | Substrate, cargo-tangle, ink! | 4002 |
| **mcp-solana-program** | Solana | Anchor, solana-test-validator | 4003 |
| **mcp-sui-program** | Sui Move | sui-move, Sui CLI | 4004 |
| **mcp-stylus** | Arbitrum Stylus | cargo-stylus, WASM, Foundry | 4005 |
| **mcp-noir** | Aztec Noir | Nargo, bb prover | 4008 |
| **mcp-risc-zero** | RISC Zero zkVM | cargo-risczero | 4006 |
| **mcp-succinct** | Succinct SP1 | cargo-prove, sp1-sdk | 4007 |

**Shared libraries:** `mcp-fs` (filesystem + multi-tenancy), `mcp-http` (transport), `mcp-cargo` (Rust tooling)

## Quick Start

```bash
# Install and build
pnpm install && pnpm build

# Start all services
./scripts/mcp-orchestrator.sh start

# Check health
curl http://localhost:4001/health
```

## Multi-Tenancy

Each MCP supports isolated workspaces via HTTP headers:

```bash
# Multi-tenant: isolated /home/alice/ workspace
curl -H "x-user-id: alice" -H "x-api-key: secret" http://localhost:4001/...

# Single-tenant: shared /home/guest/ workspace
curl -H "x-user-id: guest" http://localhost:4001/...
```

Details: [MULTI_TENANCY.md](./MULTI_TENANCY.md)

## Docker

**Build System:** Auto-detects Depot.dev → Docker Build Cloud → buildx → regular Docker

```bash
./scripts/build.sh all              # Build cache layers + MCPs
./scripts/build.sh all --push       # Push to registry
./scripts/build.sh --local          # Native platform only
```

**Orchestration:**
```bash
./scripts/mcp-orchestrator.sh start           # Start all
./scripts/mcp-orchestrator.sh health          # Health check
./scripts/mcp-orchestrator.sh logs [service]  # View logs
```

**Base Images:** Layered caching (`ghcr.io/tangle-network`):
- `base-system` → `rust-base`/`ethereum-base`/`tangle-base`/etc.
- Pre-built toolchains reduce build time from 20min → <2min

## Development

**Local (no Docker):**
```bash
cd mcp-solidity-kit && pnpm dev
```

**Docker:**
```bash
./scripts/build.sh mcp --local
docker-compose -f docker-compose.mcp.yml up mcp-solidity-kit
```

**Add New Platform:**
1. `cp -r mcp-template mcp-new-platform`
2. Add to `scripts/build.sh` (CACHE_LAYERS, MCP_SERVICES)
3. Add to `docker-compose.mcp.yml`

## Repository Structure

```
mcp-solidity-kit/       # Ethereum: Hardhat, Foundry, Slither
mcp-tangle-blueprint/   # Tangle: Substrate + EVM
mcp-solana-program/     # Solana: Anchor
mcp-sui-program/        # Sui Move
mcp-stylus/             # Arbitrum Stylus: Rust → WASM
mcp-noir/               # Aztec Noir: zkSNARKs
mcp-risc-zero/          # RISC Zero zkVM
mcp-succinct/           # Succinct SP1
mcp-cargo/              # Shared Rust tooling
mcp-fs/                 # Shared filesystem + multi-tenancy
mcp-http/               # Shared HTTP transport
mcp-template/           # Boilerplate
scripts/                # Build orchestration
```

## License

MIT
