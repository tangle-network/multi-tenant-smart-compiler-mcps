import { execAsync } from "mcp-fs";

export async function getAnvilInfo(userId: string) {
  try {
    const { stdout } = await execAsync(
      userId,
      `ps -u ${userId} ux | grep anvil | grep -v grep | grep -v ' Z '`,
    );
    if (!stdout) {
      return { running: false };
    }

    const portMatch = stdout.match(/--port\s+(\d+)/);
    const port = portMatch ? portMatch[1] : "8545";

    return {
      running: true,
      port,
      url: `http://localhost:${port}`,
    };
  } catch (error) {
    return { running: false };
  }
}
