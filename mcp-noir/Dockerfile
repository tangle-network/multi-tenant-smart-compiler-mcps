# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-noir: Needs Noir/Nargo tools
FROM ${REGISTRY}/noir-base:latest

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/noir-mcp-server.mjs

# Create group and default guest user
RUN groupadd -r external-users || true
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh && \
    /usr/local/bin/create-linux-user.sh guest

WORKDIR /

# Environment and healthcheck
ENV NODE_ENV=${NODE_ENV:-production} \
    PORT=${PORT:-3000}

EXPOSE ${PORT}

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/noir-mcp-server.mjs"]