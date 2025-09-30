import { spawnSync } from "node:child_process";

export interface RLimitSpec {
  nproc?: number;
  nofile?: number;
  fsize?: string; // bytes or "unlimited"
  as?: string; // bytes or "unlimited"
  cpu?: number; // seconds
}

export function getEnvRlimits(): RLimitSpec {
  const read = (k: string): string | undefined =>
    process.env[k] && process.env[k]!.length > 0 ? process.env[k] : undefined;
  const toInt = (k: string): number | undefined => {
    const v = read(k);
    if (!v) return undefined;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    nproc: toInt("TENANT_NPROC"),
    nofile: toInt("TENANT_NOFILE"),
    fsize: read("TENANT_FSIZE"),
    as: read("TENANT_AS"),
    cpu: toInt("TENANT_CPU_SECS"),
  };
}

export function applyRlimits(pid: number, spec: RLimitSpec): void {
  const flags: string[] = [];
  if (typeof spec.nproc === "number") flags.push("--nproc=" + spec.nproc);
  if (typeof spec.nofile === "number") flags.push("--nofile=" + spec.nofile);
  if (typeof spec.fsize === "string") flags.push("--fsize=" + spec.fsize);
  if (typeof spec.as === "string") flags.push("--as=" + spec.as);
  if (typeof spec.cpu === "number") flags.push("--cpu=" + spec.cpu);
  if (flags.length === 0) return;

  // best-effort; ignore errors in environments without prlimit
  try {
    spawnSync("prlimit", ["--pid", String(pid), ...flags], { stdio: "ignore" });
  } catch {}
}
