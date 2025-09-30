import { execAsync } from "mcp-fs";
import { DEFAULT_RPC_PORT } from "../../constants.js";

export async function getSuiLocalnetInfo(userId: string) {
  try {
    // Filter out zombie processes (status Z) and only look for running processes
    const { stdout } = await execAsync(
      userId,
      `ps -u ${userId} ux | grep 'sui start' | grep -v grep | grep -v ' Z '`,
    );
    if (!stdout) {
      return { running: false };
    }

    const portMatch = stdout.match(/--fullnode-rpc-port\s+(\d+)/);
    const port = portMatch ? portMatch[1] : DEFAULT_RPC_PORT;

    return {
      running: true,
      port,
      url: `http://localhost:${port}`,
    };
  } catch (error) {
    return { running: false };
  }
}

export async function updateSuiClientConfig(userId: string, rpcPort: number) {
  return execAsync(
    userId,
    `sed -i '/alias: localnet/,/ws:/{s|^[[:space:]]*rpc:.*|    rpc: "http://127.0.0.1:${rpcPort}"|}' .sui/sui_config/client.yaml`
  )
}