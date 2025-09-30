# Multi-Tenant Smart Contract Compiler MCPs

MCP (Model Context Protocol) servers enabling AI agents to build, test, and audit smart contracts across multiple blockchain platforms. Each MCP provides isolated development environments with platform-specific toolchains via Docker.

## Overview

This monorepo provides specialized MCPs for different smart contract environments. Each MCP exposes file system operations, compiler toolchains, testing frameworks, and security auditing tools through a standardized HTTP/SSE interface. Docker images leverage multi-stage builds with aggressive layer caching for fast incremental builds via Depot.dev or Docker Build Cloud.

**Key Features:**
- Platform-specific compilation and testing environments
- Isolated tenant workspaces with dynamic user creation
- Multi-architecture support (linux/amd64, linux/arm64)
- Incremental cached builds with base image layers
- HTTP/SSE transport for MCP communication
- Orchestration via docker-compose with health checks

## Repository Structure

```
.
├── mcp-solidity-kit/       # Ethereum/EVM: Hardhat, Foundry, Slither
├── mcp-tangle-blueprint/   # Tangle Network: Substrate + EVM tools
├── mcp-solana-program/     # Solana: Anchor framework, test validator
├── mcp-sui-program/        # Sui Move: sui-move compiler, testing
├── mcp-stylus/             # Arbitrum Stylus: Rust → WASM → EVM
├── mcp-noir/               # Aztec Noir: ZK circuits with Nargo
├── mcp-risc-zero/          # RISC Zero zkVM: guest/host programs
├── mcp-succinct/           # Succinct SP1: zkVM for verifiable compute
├── mcp-cargo/              # Rust/Cargo tooling (shared dependency)
├── mcp-fs/                 # File system operations (shared)
├── mcp-http/               # HTTP transport layer (shared)
├── mcp-template/           # Boilerplate for new MCPs
├── mcp-guide-generator/    # Documentation generator
└── scripts/                # Build orchestration and caching
```

## Packages

### Smart Contract Platforms

#### **mcp-solidity-kit**
Ethereum/EVM development toolkit with Hardhat, Foundry (forge/anvil/cast), Slither security analyzer, Etherscan verification, and OpenZeppelin contracts.

**Base Image:** `ethereum-base` (Node.js + Foundry + Slither)
**Port:** 4001
**Tools:** Hardhat, Foundry, Slither, solc

#### **mcp-tangle-blueprint**
Tangle Network blueprint development combining Substrate pallets with EVM compatibility. Includes cargo-tangle, substrate-contracts-node, and EVM tooling.

**Base Image:** `tangle-base` (Rust + Node.js + Substrate)
**Port:** 4002
**Tools:** cargo-tangle, substrate, ink!, Solidity

#### **mcp-solana-program**
Solana program development with Anchor framework, solana-test-validator, and SPL libraries. Includes Rust and Anchor CLI.

**Base Image:** `solana-base` (Rust + Solana CLI + Anchor)
**Port:** 4003
**Tools:** solana, anchor, cargo, spl-token

#### **mcp-sui-program**
Sui Move smart contract development with sui-move compiler, testing framework, and Sui CLI for devnet/testnet deployment.

**Base Image:** `sui-base` (Rust + Sui CLI)
**Port:** 4004
**Tools:** sui, move-analyzer, sui-move

#### **mcp-stylus**
Arbitrum Stylus development enabling Rust smart contracts compiled to WASM for EVM compatibility. Includes cargo-stylus and Solidity interop testing.

**Base Image:** `stylus-base` (Rust + stylus tools)
**Port:** 4005
**Tools:** cargo-stylus, wasm-opt, Foundry

#### **mcp-noir**
Aztec Noir zkSNARK circuit development with Nargo compiler, prover/verifier generation, and witness computation.

**Base Image:** `noir-base` (Nargo + bb prover)
**Port:** 4008
**Tools:** nargo, bb, noir_wasm

#### **mcp-risc-zero**
RISC Zero zkVM for verifiable computation. Includes guest program execution and proof generation for Rust programs.

**Base Image:** `risczero-base` (Rust + cargo-risczero)
**Port:** 4006
**Tools:** cargo-risczero, risc0-zkvm

#### **mcp-succinct**
Succinct SP1 zkVM for general-purpose verifiable compute. Supports Rust guest programs with host-side proof generation.

**Base Image:** `succinct-base` (Rust + cargo-prove)
**Port:** 4007
**Tools:** cargo-prove, sp1-sdk

### Shared Libraries

#### **mcp-cargo**
Rust/Cargo project management tools. Provides build, test, and dependency operations for Rust-based MCPs.

**Type:** Library (workspace dependency)

#### **mcp-fs**
File system operations with multi-tenant isolation, workspace management, and shell command execution.

**Type:** Library (workspace dependency)

#### **mcp-http**
HTTP/SSE transport implementation for MCP SDK. Handles request routing, rate limiting, and SuperJSON serialization.

**Type:** Library (workspace dependency)

### Utilities

#### **mcp-template**
Boilerplate template for creating new MCP servers. Includes project structure, Dockerfile, and shared library integration.

#### **mcp-guide-generator**
Generates markdown documentation from codebase structure and inline docs using guide-generator CLI.

**Port:** 3002 (configurable)

## Docker Infrastructure

### Base Images (Layer Cache Strategy)

Each MCP builds on a specialized base image containing platform-specific toolchains:

- **base-system**: Ubuntu 22.04 + tini + system deps
- **rust-base**: base-system + Rust 1.80+, cargo
- **ethereum-base**: base-system + Node.js 20, Foundry, Slither
- **tangle-base**: rust-base + Substrate, cargo-tangle, ink!
- **solana-base**: rust-base + Solana CLI 2.0+, Anchor
- **sui-base**: rust-base + Sui CLI
- **noir-base**: base-system + Nargo, bb prover
- **risczero-base**: rust-base + cargo-risczero
- **succinct-base**: rust-base + SP1 toolchain
- **stylus-base**: rust-base + cargo-stylus, Foundry

Base images are pre-built and cached in the registry (`ghcr.io/tangle-network`) with `buildcache` tags for layer reuse.

### Build System

Located in `scripts/build.sh`, the unified build script auto-detects optimal build method:

1. **Depot.dev** (fastest): Native ARM/Intel builders, no QEMU emulation
2. **Docker Build Cloud**: Parallel cloud builds
3. **Local buildx**: QEMU-based cross-compilation
4. **Regular Docker**: Native platform only

**Cache Strategy:**
- `--cache-from type=registry,ref=${REGISTRY}/${name}:buildcache`
- `--cache-to type=registry,ref=${REGISTRY}/${name}:buildcache,mode=max`
- Supports cross-build cache reuse (Depot → buildx → docker)

**Usage:**
```bash
# Build all (cache layers + MCPs)
./scripts/build.sh all

# Build and push to registry
./scripts/build.sh all --push

# Build only for native platform (faster)
./scripts/build.sh --local

# Build without cloud (force local Docker)
./scripts/build.sh --no-cloud

# Build only base layers
./scripts/build.sh cache

# Build only MCP services
./scripts/build.sh mcp
```

**Environment Variables:**
- `REGISTRY`: Docker registry (default: `ghcr.io/tangle-network`)

### Orchestration

`scripts/mcp-orchestrator.sh` manages all MCP services via docker-compose:

```bash
# Build all Docker images
./scripts/mcp-orchestrator.sh build

# Start all services
./scripts/mcp-orchestrator.sh start

# Use published images from registry
USE_PUBLISHED=true ./scripts/mcp-orchestrator.sh start

# Check service health
./scripts/mcp-orchestrator.sh health

# View logs
./scripts/mcp-orchestrator.sh logs [service-name]

# Stop all services
./scripts/mcp-orchestrator.sh stop

# Test SSE connections
./scripts/mcp-orchestrator.sh test
```

**Service Ports:**
- 4001: mcp-solidity-kit
- 4002: mcp-tangle-blueprint
- 4003: mcp-solana-program
- 4004: mcp-sui-program
- 4005: mcp-stylus
- 4006: mcp-risc-zero
- 4007: mcp-succinct
- 4008: mcp-noir

### Multi-Architecture Support

All images support `linux/amd64` and `linux/arm64` via multi-platform builds. Use `--local` flag for native-only builds during development.

## Usage

### Quick Start

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Build TypeScript:**
   ```bash
   pnpm build
   ```

3. **Start Services:**
   ```bash
   ./scripts/mcp-orchestrator.sh start
   ```

4. **Verify Health:**
   ```bash
   curl http://localhost:4001/health  # Solidity Kit
   curl http://localhost:4003/health  # Solana
   ```

### Development Workflow

**Option 1: Local Development (no Docker)**
```bash
cd mcp-solidity-kit
pnpm dev  # Runs with tsx watch
```

**Option 2: Docker Development**
```bash
# Build image
./scripts/build.sh mcp --local

# Start single service
docker-compose -f docker-compose.mcp.yml up mcp-solidity-kit

# View logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-solidity-kit
```

**Option 3: Use Published Images**
```bash
USE_PUBLISHED=true IMAGE_TAG=latest ./scripts/mcp-orchestrator.sh start
```

### Creating a New MCP

1. Copy template:
   ```bash
   cp -r mcp-template mcp-new-platform
   ```

2. Update `package.json`:
   ```json
   {
     "name": "mcp-new-platform",
     "description": "MCP server for NewPlatform smart contracts"
   }
   ```

3. Create base image Dockerfile (if needed):
   ```dockerfile
   # docker/newplatform-base.Dockerfile
   ARG REGISTRY=ghcr.io/tangle-network
   FROM ${REGISTRY}/base-system:latest

   # Install platform toolchain
   RUN wget https://platform.dev/install.sh | bash
   ```

4. Add to `scripts/build.sh`:
   ```bash
   CACHE_LAYERS=(
     # ... existing layers
     "newplatform-base"
   )

   MCP_SERVICES=(
     # ... existing services
     "mcp-new-platform"
   )
   ```

5. Add to `docker-compose.mcp.yml` and `scripts/mcp-orchestrator.sh`

## Motivation

AI agents require isolated, reproducible environments to develop smart contracts safely across diverse platforms. This project solves:

1. **Toolchain Complexity**: Each blockchain has unique compilers, testing frameworks, and security tools
2. **Dependency Conflicts**: Different platforms require incompatible tool versions
3. **Multi-Tenancy**: Agents need isolated workspaces to prevent cross-contamination
4. **Build Performance**: Large images (~5-10GB) require aggressive caching for practical CI/CD
5. **Standardization**: Uniform MCP interface across heterogeneous platforms

The layered Docker architecture enables:
- **Incremental Builds**: Base layers cached in registry, MCP layers rebuild in <2min
- **Cross-Platform**: ARM/Intel builds without QEMU via Depot.dev
- **Composability**: Shared libraries (mcp-fs, mcp-http, mcp-cargo) reduce duplication
- **Extensibility**: Template-based addition of new platforms

## Architecture Decisions

**Docker Isolation:**
Each tenant gets dedicated Linux user with isolated filesystem namespace. Reproducible builds eliminate "works on my machine" issues.

**Monorepo Structure:**
Shared TypeScript libraries (mcp-fs, mcp-http, mcp-cargo) and unified build orchestration via pnpm workspaces.

**Depot.dev / Build Cloud:**
Native ARM/Intel builders eliminate QEMU emulation (10-40x faster than local buildx for cross-platform builds).

**Registry Layer Caching:**
Base images (~5-10GB with toolchains) cached in registry. Developers/CI pull cached layers, rebuild only MCP changes (<2min).

## Multi-Tenancy & Authentication

Each MCP supports isolated tenant workspaces via HTTP headers. See [MULTI_TENANCY.md](./MULTI_TENANCY.md) for details.

**Quick overview:**
- **Multi-tenant:** `x-user-id: alice` → isolated `/home/alice/` workspace
- **Single-tenant:** `x-user-id: guest` → shared `/home/guest/` workspace
- **Auth:** `x-api-key` header (optional), `authorization` bearer token format

## License

MIT

## Contributing

See individual package READMEs for platform-specific development guides. PRs welcome for new platforms, optimizations, or bug fixes.
