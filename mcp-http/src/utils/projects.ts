export interface ResourceContent {
  text?: string;
}

export interface ReadResourceResult {
  contents: ResourceContent[];
}

export interface MCPClientLike {
  readResource(input: { uri: string }): Promise<ReadResourceResult>;
}

export interface WaitForProjectOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Polls project://projects until the given project name appears.
 */
export async function waitForProject(
  client: MCPClientLike,
  projectName: string,
  options: WaitForProjectOptions = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 1_000;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await client.readResource({ uri: "project://projects" });
      const txt = result.contents[0]?.text;
      if (typeof txt === "string" && txt.includes(projectName)) return;
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Project ${projectName} not listed within ${timeoutMs}ms`);
}














