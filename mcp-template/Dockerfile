# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-template: Basic template, minimal requirements
FROM ${REGISTRY}/base-system:latest

WORKDIR /app

# Copy the pre-built dist file
COPY dist/index.js /usr/local/bin/template-mcp-server.mjs
RUN chmod +x /usr/local/bin/template-mcp-server.mjs

# Health check
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

USER appuser

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/template-mcp-server.mjs"]