# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-risc-zero: Needs RISC Zero + Ethereum tools
FROM ${REGISTRY}/risczero-base:latest

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/risc-zero-mcp-server.mjs

# Create group and default guest user
RUN groupadd -r external-users
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh && \
    /usr/local/bin/create-linux-user.sh guest

WORKDIR /

# Environment and healthcheck
ENV NODE_ENV=${NODE_ENV:-production} \
    PORT=${PORT:-3000}

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Prepare user management script (guest will be created on-demand at runtime)
RUN groupadd -r external-users || true
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/risc-zero-mcp-server.mjs

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/risc-zero-mcp-server.mjs"]