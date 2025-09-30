# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-stylus: Needs Stylus CLI + Ethereum tools
FROM ${REGISTRY}/stylus-base:latest

WORKDIR /

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/stylus-mcp.mjs
COPY ./bin/run-dev-node.sh /usr/local/bin/run-dev-node.sh
COPY ./bin/stylus-deployer-bytecode.txt /usr/local/bin/stylus-deployer-bytecode.txt

# Create group and default guest user
RUN groupadd -r external-users || true
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh && \
    /usr/local/bin/create-linux-user.sh guest

# Environment and healthcheck
ENV NODE_ENV=${NODE_ENV:-production} \
    PORT=${PORT:-3000}

EXPOSE ${PORT}

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/stylus-mcp.mjs"]
