# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-solana-program: Needs Solana CLI + Anchor
FROM ${REGISTRY}/solana-base:latest

WORKDIR /

# Use Solana binaries from base image (solana-base already has them installed)
RUN solana --version && solana-test-validator --version

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/solana-program-mcp-server.mjs

# Create group and default guest user
RUN groupadd -r external-users || true
COPY ./bin/create-linux-user.sh /usr/local/bin/create-linux-user.sh
RUN chmod +x /usr/local/bin/create-linux-user.sh && \
    /usr/local/bin/create-linux-user.sh guest

# Prepare solana key
RUN solana-keygen new -o /root/.config/solana/id.json  --silent --no-bip39-passphrase --force

WORKDIR /

# Environment and healthcheck
ENV NODE_ENV=${NODE_ENV:-production} \
    PORT=${PORT:-3000}

EXPOSE ${PORT}
# Solana ports
EXPOSE 9000
EXPOSE 9184

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/solana-program-mcp-server.mjs"]