#!/bin/bash
set -e

# MCP Orchestrator - Manage all MCP services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
USE_PUBLISHED=${USE_PUBLISHED:-"false"}
REGISTRY=${REGISTRY:-"ghcr.io/tangle-network"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# MCP services and their ports (as separate arrays for compatibility)
MCP_SERVICES=(
  "mcp-solidity-kit"
  "mcp-tangle-blueprint"
  "mcp-solana-program"
  "mcp-sui-program"
  "mcp-stylus"
  "mcp-risc-zero"
  "mcp-succinct"
  "mcp-noir"
  # "mcp-cli-agents" # Disabled due to dependency issues
)

MCP_PORTS=(
  4001
  4002
  4003
  4004
  4005
  4006
  4007
  4008
  # 4010 # mcp-cli-agents port
)

# Get port for a service
get_port() {
  local service=$1
  for i in "${!MCP_SERVICES[@]}"; do
    if [ "${MCP_SERVICES[$i]}" = "$service" ]; then
      echo "${MCP_PORTS[$i]}"
      return
    fi
  done
  echo ""
}

# Function to check if port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0  # Port is in use
  else
    return 1  # Port is free
  fi
}

# Function to build all MCP images
build_all() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Building all MCP Docker images${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # First ensure TypeScript is built (skip if it fails)
  echo -e "${YELLOW}Building TypeScript/JavaScript...${NC}"
  for mcp in "${MCP_SERVICES[@]}"; do
    if [ -f "packages/$mcp/package.json" ]; then
      (cd "packages/$mcp" && pnpm install) || {
        echo -e "${RED}Failed to install dependencies for $mcp${NC}"
      }
    (cd "packages/$mcp" && pnpm build) || {
      echo -e "${RED}Failed to build $mcp, skipping...${NC}"
    } else
      echo -e "${YELLOW}No package.json for $mcp, skipping...${NC}"
    fi
  done
  # Build Docker images
  for mcp in "${MCP_SERVICES[@]}"; do
    echo -e "${YELLOW}Building $mcp...${NC}"
    if [ -f "packages/$mcp/Dockerfile" ]; then
      (cd "packages/$mcp" && DOCKER_BUILDKIT=1 docker build -f Dockerfile -t "tangle-network/$mcp:latest" .) || {
        echo -e "${RED}Failed to build $mcp${NC}"
      }
    else
      echo -e "${YELLOW}No Dockerfile for $mcp, skipping...${NC}"
    fi
  done
  
  echo -e "${GREEN}✓ Build complete${NC}"
}

# Function to start all services
start_all() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Starting all MCP services${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # Check for port conflicts
  echo -e "${YELLOW}Checking ports...${NC}"
  local conflicts=0
  for mcp in "${MCP_SERVICES[@]}"; do
    local port=$(get_port $mcp)
    if check_port $port; then
      echo -e "${RED}✗ Port $port is already in use (needed for $mcp)${NC}"
      conflicts=$((conflicts + 1))
    else
      echo -e "${GREEN}✓ Port $port is available ($mcp)${NC}"
    fi
  done
  
  if [ $conflicts -gt 0 ]; then
    echo -e "${RED}Cannot start: $conflicts port conflicts found${NC}"
    echo -e "${YELLOW}Run '$0 stop' to stop existing services${NC}"
    return 1
  fi
  
  # Start with docker-compose
  echo -e "${YELLOW}Starting services with docker-compose...${NC}"
  
  if [ "$USE_PUBLISHED" = "true" ]; then
    echo -e "${BLUE}Using published images from $REGISTRY:$IMAGE_TAG${NC}"
    
    # Pull images from registry and tag them locally
    echo -e "${YELLOW}Pulling images from registry...${NC}"
    for service in "${MCP_SERVICES[@]}"; do
      echo -e "  Pulling ${REGISTRY}/${service}:${IMAGE_TAG}..."
      if docker pull ${REGISTRY}/${service}:${IMAGE_TAG}; then
        # Tag for local use by docker-compose
        docker tag ${REGISTRY}/${service}:${IMAGE_TAG} tangle-network/${service}:latest
        echo -e "  ${GREEN}✓ ${service} pulled and tagged${NC}"
      else
        echo -e "  ${YELLOW}⚠ Could not pull ${service} (may not exist in registry)${NC}"
      fi
    done
    
    # Use the original compose file since we've tagged images locally
    docker compose -f docker-compose.mcp.yml up -d
  else
    echo -e "${BLUE}Using locally built images${NC}"
    docker compose -f docker-compose.mcp.yml up -d
  fi
  
  # Wait for services to be healthy
  echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
  sleep 5
  
  # Check health
  check_health
}

# Function to stop all services
stop_all() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Stopping all MCP services${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # Try to stop with default project name
  docker compose -f docker-compose.mcp.yml down 2>/dev/null || true
  
  # Also try common project name variations
  docker compose -p blueprint-agent -f docker-compose.mcp.yml down 2>/dev/null || true
  docker compose -p clone-blueprint-agent -f docker-compose.mcp.yml down 2>/dev/null || true
  
  # Also stop any standalone containers or containers with different naming
  for mcp in "${MCP_SERVICES[@]}"; do
    # Stop by exact name
    docker stop $mcp 2>/dev/null || true
    # Stop with common prefixes
    docker stop blueprint-agent-${mcp}-1 2>/dev/null || true
    docker stop clone-blueprint-agent-${mcp}-1 2>/dev/null || true
  done
  
  echo -e "${GREEN}✓ All services stopped${NC}"
}

# Function to check health of all services
check_health() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}MCP Service Health Check${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  local healthy=0
  local unhealthy=0
  
  for mcp in "${MCP_SERVICES[@]}"; do
    local port=$(get_port $mcp)
    echo -n -e "${YELLOW}Checking $mcp on port $port...${NC} "
    
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1; then
      echo -e "${GREEN}✓ Healthy${NC}"
      healthy=$((healthy + 1))
    else
      echo -e "${RED}✗ Unhealthy or not running${NC}"
      unhealthy=$((unhealthy + 1))
    fi
  done
  
  echo
  echo -e "${BOLD}Summary:${NC}"
  echo -e "${GREEN}Healthy: $healthy${NC}"
  echo -e "${RED}Unhealthy: $unhealthy${NC}"
  
  if [ $unhealthy -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    return 0
  else
    echo -e "${RED}⚠ Some services are not healthy${NC}"
    return 1
  fi
}

# Function to show logs
show_logs() {
  local service=$1
  if [ -z "$service" ]; then
    docker compose -f docker-compose.mcp.yml logs -f
  else
    docker compose -f docker-compose.mcp.yml logs -f $service
  fi
}

# Function to restart a service
restart_service() {
  local service=$1
  echo -e "${YELLOW}Restarting $service...${NC}"
  docker compose -f docker-compose.mcp.yml restart $service
  echo -e "${GREEN}✓ $service restarted${NC}"
}

# Function to test MCP connections
test_connections() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Testing MCP SSE Connections${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  for mcp in "${MCP_SERVICES[@]}"; do
    local port=$(get_port $mcp)
    echo -e "${YELLOW}Testing $mcp SSE endpoint...${NC}"
    
    # Try to connect to SSE endpoint
    timeout 2 curl -s -H "Accept: text/event-stream" \
      "http://localhost:$port/sse" 2>/dev/null | head -5 || {
      echo -e "${RED}Failed to connect to $mcp SSE${NC}"
    }
    echo
  done
}

# Main menu
case "${1:-help}" in
  build)
    build_all
    ;;
  
  start)
    start_all
    ;;
  
  stop)
    stop_all
    ;;
  
  restart)
    stop_all
    sleep 2
    start_all
    ;;
  
  health)
    check_health
    ;;
  
  logs)
    show_logs "$2"
    ;;
  
  test)
    test_connections
    ;;
  
  restart-service)
    if [ -z "$2" ]; then
      echo -e "${RED}Usage: $0 restart-service <service-name>${NC}"
      exit 1
    fi
    restart_service "$2"
    ;;
  
  status)
    docker compose -f docker-compose.mcp.yml ps
    ;;
  
  help|*)
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}MCP Orchestrator${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  build              Build all MCP Docker images"
    echo "  start              Start all MCP services"
    echo "  stop               Stop all MCP services"
    echo "  restart            Restart all MCP services"
    echo "  health             Check health of all services"
    echo "  logs [service]     Show logs (all or specific service)"
    echo "  test               Test SSE connections"
    echo "  restart-service    Restart a specific service"
    echo
    echo "Environment Variables:"
    echo "  USE_PUBLISHED      Use published images instead of local (default: false)"
    echo "  REGISTRY           Docker registry (default: ghcr.io/tangle-network)"
    echo "  IMAGE_TAG          Image tag to use (default: latest)"
    echo
    echo "Examples:"
    echo "  # Use local images (default)"
    echo "  $0 start"
    echo
    echo "  # Use published images from registry"
    echo "  USE_PUBLISHED=true $0 start"
    echo
    echo "  # Use specific tag from registry"
    echo "  USE_PUBLISHED=true IMAGE_TAG=sha-abc123 $0 start"
    echo "  status             Show docker-compose status"
    echo "  help               Show this help message"
    echo
    echo "Services and Ports:"
    for i in "${!MCP_SERVICES[@]}"; do
      printf "  %-20s Port %d\n" "${MCP_SERVICES[$i]}" "${MCP_PORTS[$i]}"
    done
    ;;
esac
