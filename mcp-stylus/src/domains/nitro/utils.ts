import { execAsync } from "mcp-fs";
import { NITRO_DEFAULT_PORT } from "./constants.js";

export async function getNitroInfo(userId: string) {
  try {
    const { stdout } = await execAsync(
      userId,
      `ps -u ${userId} ux | grep nitro | grep -v grep | grep -v ' Z '`,
    );

    if (!stdout) {
      return { running: false };
    }

    const portMatch = stdout.match(/--port\s+(\d+)/);
    const port = portMatch ? portMatch[1] : NITRO_DEFAULT_PORT;

    return {
      running: true,
      port,
      url: `http://localhost:${port}`,
    };
  } catch (error) {
    return { running: false };
  }
}
