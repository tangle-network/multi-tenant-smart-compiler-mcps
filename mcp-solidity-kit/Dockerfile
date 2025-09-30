# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-solidity-kit: Ethereum/Solidity development and security tools
FROM ${REGISTRY}/ethereum-base:latest

# Environment and healthcheck
ENV NODE_ENV=${NODE_ENV:-production} \
    PORT=${PORT:-3000}

EXPOSE ${PORT}

# Create group and install user creation helper; user will be created at runtime
RUN groupadd -r external-users
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/solidity-kit-mcp-server.mjs

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/solidity-kit-mcp-server.mjs"]