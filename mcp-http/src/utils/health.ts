export interface HealthCheckOptions {
  host?: string;
  path?: string;
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Wait until an HTTP health endpoint returns 2xx.
 */
export async function waitForServiceHealth(
  port: number,
  options: HealthCheckOptions = {}
): Promise<void> {
  const host = options.host ?? "localhost";
  const path = options.path ?? "/health";
  const timeoutMs = options.timeoutMs ?? 60_000;
  const intervalMs = options.intervalMs ?? 1_000;

  const url = `http://${host}:${port}${path}`;
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Health check timed out after ${timeoutMs}ms: ${url}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
