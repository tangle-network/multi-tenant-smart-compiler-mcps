# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-tangle-blueprint: Needs Tangle + Ethereum tools + Rust
FROM ${REGISTRY}/tangle-base:latest

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/tangle-mcp-server.mjs

# Prepare user management script (guest will be created on-demand at runtime)
RUN groupadd -r external-users || true
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh

WORKDIR /

# Environment and healthcheck
ENV NODE_ENV=${NODE_ENV:-production} \
    PORT=${PORT:-3000}

EXPOSE ${PORT}

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/tangle-mcp-server.mjs"]