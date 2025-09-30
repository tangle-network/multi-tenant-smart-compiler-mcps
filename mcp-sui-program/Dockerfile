# syntax=docker/dockerfile:1.4
ARG REGISTRY=ghcr.io/tangle-network

# mcp-sui-program: Needs Sui CLI
FROM ${REGISTRY}/sui-base:latest

# Copy compiled server
COPY ./dist/index.js /usr/local/bin/sui-program-mcp-server.mjs

# Prepare sui package as non-root user
RUN if [ ! -d "/opt/https___github_com_MystenLabs_sui_git_db951a5ea6b125f6253a6b7f436ddba46eb0feb3" ]; then \
    git clone https://github.com/MystenLabs/sui.git /opt/https___github_com_MystenLabs_sui_git_db951a5ea6b125f6253a6b7f436ddba46eb0feb3; \
    cd /opt/https___github_com_MystenLabs_sui_git_db951a5ea6b125f6253a6b7f436ddba46eb0feb3; \
    git checkout db951a5ea6b125f6253a6b7f436ddba46eb0feb3; \
    git config --global --add safe.directory '*'; \
  fi

# Copy small helper scripts
COPY ./bin/initDefaultClientConfig.sh /usr/local/bin/initDefaultClientConfig.sh
COPY ./bin/generateNewSuiKeypair.sh /usr/local/bin/generateNewSuiKeypair.sh
RUN chmod +x /usr/local/bin/initDefaultClientConfig.sh /usr/local/bin/generateNewSuiKeypair.sh

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
# Sui ports
EXPOSE 9000
EXPOSE 9184

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/usr/local/bin/sui-program-mcp-server.mjs"]