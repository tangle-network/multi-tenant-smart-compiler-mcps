import { execAsync } from "mcp-fs";
import { DEFAULT_RPC_PORT } from "./constants.js";

export async function getSVMLocalnetInfo(userId: string) {
  try {
    // Filter out zombie processes (status Z) and only look for running processes
    const { stdout } = await execAsync(
      userId,
      `ps -u ${userId} ux | grep 'solana-test-validator' | grep -v grep | grep -v ' Z '`,
    );
    if (!stdout) {
      return { running: false };
    }

    const portMatch = stdout.match(/--rpc-port\s+(\d+)/);
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
