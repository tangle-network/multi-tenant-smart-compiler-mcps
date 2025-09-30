#!/bin/bash
set -e

# Unified Docker Build Script - Automatically uses the best available method
# Usage: ./scripts/build.sh [cache|mcp|all] [--push]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
REGISTRY=${REGISTRY:-"ghcr.io/tangle-network"}
BUILD_TYPE="all"
PUSH=false
LOCAL_ONLY=false
NO_CLOUD=false

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --push)
      PUSH=true
      ;;
    --local)
      LOCAL_ONLY=true
      ;;
    --no-cloud)
      NO_CLOUD=true
      ;;
    --help|-h|help)
      BUILD_TYPE="help"
      ;;
    cache|mcp|all)
      BUILD_TYPE="$arg"
      ;;
  esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Tangle MCP Unified Builder${NC}"
echo -e "${BLUE}========================================${NC}"

# Auto-detect best build method
detect_build_method() {
  # Skip cloud options if --no-cloud is set
  if [ "$NO_CLOUD" = "false" ]; then
    # 1. Check for Depot.dev (fastest)
    if command -v depot &> /dev/null; then
      BUILD_METHOD="depot"
      echo -e "${GREEN}🚀 Using Depot.dev (fastest - native ARM & Intel builders)${NC}"
      # Check if we have a project configured
      if ! depot list 2>/dev/null | grep -q "tangle-network"; then
        echo -e "${YELLOW}   Note: Run 'depot init' and select the tangle-network org to configure${NC}"
      fi
      return
    fi
    
    # 2. Check for Docker Build Cloud (very fast)
    if docker buildx ls | grep -q "cloud-"; then
      BUILDER_NAME=$(docker buildx ls | grep "cloud-" | head -1 | awk '{print $1}' | tr -d '*')
      BUILD_METHOD="cloud"
      echo -e "${GREEN}☁️  Using Docker Build Cloud (fast)${NC}"
      return
    fi
  else
    echo -e "${YELLOW}⚡ Skipping cloud build options (--no-cloud flag set)${NC}"
  fi
  
  # 3. Check for buildx builder (good)
  if docker buildx ls | grep -q "multiarch-builder"; then
    BUILDER_NAME="multiarch-builder"
    BUILD_METHOD="buildx"
    echo -e "${YELLOW}📦 Using local buildx (slower for cross-platform)${NC}"
    return
  fi
  
  # 4. Fallback to regular docker (slowest)
  BUILD_METHOD="docker"
  echo -e "${YELLOW}🐢 Using regular Docker (slowest, QEMU for cross-platform)${NC}"
  echo -e "${BLUE}💡 TIP: Install Depot for fastest builds:${NC}"
  echo -e "${BLUE}   curl -L https://depot.dev/install-cli.sh | sh${NC}"
  echo -e "${BLUE}   depot init${NC}  # Then select tangle-network org"
}

# Unified build function
build_image() {
  local dockerfile=$1
  local name=$2
  local context=${3:-.}
  
  # Determine platforms to build
  if [ "$LOCAL_ONLY" = "true" ]; then
    # Build only for native platform
    local arch=$(uname -m)
    case $arch in
      x86_64) platforms="linux/amd64" ;;
      aarch64|arm64) platforms="linux/arm64" ;;
      *) platforms="linux/amd64" ;;
    esac
    echo -e "${GREEN}Building for native platform only: ${platforms}${NC}"
  else
    platforms="linux/amd64,linux/arm64"
  fi
  
  echo -e "${BLUE}Building ${name}...${NC}"
  
  case $BUILD_METHOD in
    depot)
      # Depot.dev - fastest, native builders for each platform
      # Uses Depot's persistent build cache across runs
      depot build \
        --platform ${platforms} \
        --build-arg REGISTRY=${REGISTRY} \
        --cache-from type=registry,ref=${REGISTRY}/${name}:buildcache \
        --cache-to type=registry,ref=${REGISTRY}/${name}:buildcache,mode=max \
        -f ${dockerfile} \
        -t ${REGISTRY}/${name}:latest \
        -t ${REGISTRY}/${name}:latest-linux-amd64 \
        -t ${REGISTRY}/${name}:latest-linux-arm64 \
        ${PUSH:+--push} \
        ${context}
      ;;
      
    cloud)
      # Docker Build Cloud - very fast, parallel builds
      docker buildx build \
        --builder ${BUILDER_NAME} \
        --platform ${platforms} \
        --build-arg REGISTRY=${REGISTRY} \
        --cache-from type=registry,ref=${REGISTRY}/${name}:buildcache \
        --cache-to type=registry,ref=${REGISTRY}/${name}:buildcache,mode=max \
        -f ${dockerfile} \
        -t ${REGISTRY}/${name}:latest \
        ${PUSH:+--push} \
        ${context}
      ;;
      
    buildx)
      # Local buildx - uses QEMU for non-native platforms
      # Can reuse cache from Depot/Cloud builds
      docker buildx build \
        --platform ${platforms} \
        --build-arg REGISTRY=${REGISTRY} \
        --cache-from type=registry,ref=${REGISTRY}/${name}:buildcache \
        --cache-to type=registry,ref=${REGISTRY}/${name}:buildcache,mode=max \
        -f ${dockerfile} \
        -t ${REGISTRY}/${name}:latest \
        -t tangle-network/${name}:latest \
        ${PUSH:+--push} \
        ${LOCAL_ONLY:+--load} \
        ${context}
      ;;
      
    docker)
      # Regular docker - native platform only
      # Can pull cache from previous Depot/Cloud builds (read-only)
      docker build \
        --build-arg REGISTRY=${REGISTRY} \
        --cache-from type=registry,ref=${REGISTRY}/${name}:buildcache \
        -f ${dockerfile} \
        -t tangle-network/${name}:latest \
        ${context}
      
      if [ "$PUSH" = "true" ]; then
        docker tag tangle-network/${name}:latest ${REGISTRY}/${name}:latest
        docker push ${REGISTRY}/${name}:latest
      fi
      ;;
  esac
}

# Detect build method once
detect_build_method

# Define what to build
CACHE_LAYERS=(
  "base-system"
  "rust-base"
  "ethereum-base"
  "tangle-base"
  "solana-base"
  "sui-base"
  "noir-base"
  "risczero-base"
  "succinct-base"
  "stylus-base"
)

MCP_SERVICES=(
  "mcp-risc-zero"
  "mcp-succinct"
  "mcp-noir"
  "mcp-solana-program"
  "mcp-solidity-kit"
  "mcp-stylus"
  "mcp-sui-program"
  "mcp-tangle-blueprint"
)

# Build based on type
case $BUILD_TYPE in
  cache)
    echo -e "${BOLD}Building cache layers...${NC}"
    for layer in "${CACHE_LAYERS[@]}"; do
      build_image "docker/${layer}.Dockerfile" "${layer}"
    done
    ;;
    
  mcp)
    echo -e "${BOLD}Building MCP services...${NC}"
    for service in "${MCP_SERVICES[@]}"; do
      if [ -d "packages/${service}" ]; then
        build_image "packages/${service}/Dockerfile" "${service}" "packages/${service}"
      fi
    done
    ;;
    
  all)
    echo -e "${BOLD}Building everything...${NC}"
    
    # Build cache layers first
    echo -e "${YELLOW}Phase 1: Cache Layers${NC}"
    for layer in "${CACHE_LAYERS[@]}"; do
      build_image "docker/${layer}.Dockerfile" "${layer}"
    done
    
    # Then build MCP services
    echo -e "${YELLOW}Phase 2: MCP Services${NC}"
    for service in "${MCP_SERVICES[@]}"; do
      if [ -d "packages/${service}" ]; then
        build_image "packages/${service}/Dockerfile" "${service}" "packages/${service}"
      fi
    done
    ;;
    
  help)
    echo -e "${BOLD}Tangle MCP Docker Build System${NC}"
    echo
    echo -e "${BLUE}USAGE:${NC}"
    echo "  $0 [COMMAND] [OPTIONS]"
    echo
    echo -e "${BLUE}COMMANDS:${NC}"
    echo "  all       Build everything (cache layers + MCP services) [default]"
    echo "  cache     Build only base cache layers"
    echo "  mcp       Build only MCP services"
    echo "  help      Show this help message"
    echo
    echo -e "${BLUE}OPTIONS:${NC}"
    echo "  --push      Push images to registry (requires authentication)"
    echo "  --local     Build only for native platform (faster, no cross-platform)"
    echo "  --no-cloud  Use local Docker only (skip Depot/Cloud even if available)"
    echo "  --help      Show this help message"
    echo
    echo -e "${BLUE}ENVIRONMENT VARIABLES:${NC}"
    echo "  REGISTRY  Docker registry to push to (default: ghcr.io/tangle-network)"
    echo "            Examples: ghcr.io/yourorg, docker.io/yourusername"
    echo
    echo -e "${BLUE}BUILD METHODS:${NC}"
    detect_build_method >/dev/null 2>&1
    case $BUILD_METHOD in
      depot)
        echo -e "  ${GREEN}✓ Depot.dev${NC} (detected)"
        echo "    Fastest option - native ARM and Intel builders"
        echo "    No QEMU, parallel builds, distributed cache"
        echo "    Org: tangle-network"
        ;;
      cloud)
        echo -e "  ${GREEN}✓ Docker Build Cloud${NC} (detected)"
        echo "    Very fast - builds on Docker's infrastructure"
        echo "    Both platforms build in parallel without QEMU"
        ;;
      buildx)
        echo -e "  ${YELLOW}⚠ Local buildx${NC} (detected)"
        echo "    Slower - uses QEMU for cross-platform builds"
        echo "    Consider upgrading to Depot or Docker Build Cloud:"
        echo "    ${BLUE}curl -L https://depot.dev/install-cli.sh | sh${NC}"
        echo "    ${BLUE}depot init${NC}  # Then select tangle-network org"
        ;;
      docker)
        echo -e "  ${RED}✗ Basic Docker${NC} (detected)"
        echo "    Slowest - only builds for native platform"
        echo "    To enable fast multi-platform builds:"
        echo "    ${BLUE}curl -L https://depot.dev/install-cli.sh | sh${NC}"
        echo "    ${BLUE}depot init${NC}  # Then select tangle-network org"
        ;;
    esac
    echo
    echo -e "${BLUE}EXAMPLES:${NC}"
    echo "  # Build everything locally"
    echo "  $0"
    echo
    echo "  # Build only for your native ARM/Intel platform (faster)"
    echo "  $0 --local"
    echo
    echo "  # Force local Docker builds (no Depot/Cloud)"
    echo "  $0 --no-cloud --local"
    echo
    echo "  # Build and push to registry"
    echo "  $0 --push"
    echo
    echo "  # Build only cache layers"
    echo "  $0 cache"
    echo
    echo "  # Build with custom registry"
    echo "  REGISTRY=docker.io/myusername $0 --push"
    echo
    echo -e "${BLUE}QUICK START:${NC}"
    echo "  ${BOLD}Option 1: Depot.dev (Fastest - Recommended)${NC}"
    echo "  1. Install Depot CLI:"
    echo "     ${BLUE}curl -L https://depot.dev/install-cli.sh | sh${NC}"
    echo
    echo "  2. Initialize for tangle-network org:"
    echo "     ${BLUE}depot init${NC}"
    echo "     Then select 'tangle-network' organization when prompted"
    echo
    echo "  3. Build and push (2-5 minutes total!):"
    echo "     ${BLUE}$0 --push${NC}"
    echo
    echo "  ${BOLD}Option 2: Docker Build Cloud${NC}"
    echo "  1. Setup cloud builder:"
    echo "     ${BLUE}docker buildx create --driver cloud --name cloud-builder${NC}"
    echo
    echo "  2. Build and push (5-10 minutes):"
    echo "     ${BLUE}$0 --push${NC}"
    echo
    exit 0
    ;;
    
  *)
    echo -e "${RED}Error: Unknown command '$BUILD_TYPE'${NC}"
    echo "Run '$0 --help' for usage information"
    exit 1
    ;;
esac

echo -e "${GREEN}✅ Build complete!${NC}"

# Show summary
case $BUILD_METHOD in
  depot)
    echo -e "${GREEN}Used Depot.dev - native builders, no QEMU, fastest builds!${NC}"
    ;;
  cloud)
    echo -e "${GREEN}Used Docker Build Cloud for fast parallel builds${NC}"
    ;;
  buildx)
    echo -e "${YELLOW}Used local buildx (consider Depot or Docker Build Cloud for speed)${NC}"
    echo -e "${BLUE}Install Depot: curl -L https://depot.dev/install-cli.sh | sh${NC}"
    ;;
  docker)
    echo -e "${YELLOW}Used regular Docker (single platform only)${NC}"
    echo -e "${BLUE}Install Depot for 10-40x faster builds: curl -L https://depot.dev/install-cli.sh | sh${NC}"
    ;;
esac

if [ "$PUSH" = "true" ]; then
  echo -e "${GREEN}Images pushed to ${REGISTRY}${NC}"
else
  echo -e "${YELLOW}Images built locally. Add --push to push to registry${NC}"
fi