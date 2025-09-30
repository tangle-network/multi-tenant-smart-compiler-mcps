# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-cli-agents: CLI agent framework
FROM ${REGISTRY}/base-system:latest

WORKDIR /app

# Copy the pre-built dist file
COPY packages/mcp-cli-agents/dist/index.js /usr/local/bin/cli-agents-mcp-server.mjs
RUN chmod +x /usr/local/bin/cli-agents-mcp-server.mjs

# Health check
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

USER appuser

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/cli-agents-mcp-server.mjs"]