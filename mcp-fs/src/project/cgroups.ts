import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants as FsConstants } from "node:fs";
import path from "node:path";

export interface TenantLimits {
  cpuWeight?: number;
  cpuMax?: string; // e.g. "max" or "200000 100000"
  memoryHigh?: string; // bytes as string or "max"
  memoryMax?: string; // bytes as string or "max"
  pidsMax?: number; // integer or -1 for unlimited
}

const CGROUP_ROOT = "/sys/fs/cgroup";
const TENANTS_DIR = path.join(CGROUP_ROOT, "tenants");

export function isCgroupV2Supported(): boolean {
  try {
    // unified hierarchy exposes cgroup.controllers at root
    return require("node:fs").existsSync(
      path.join(CGROUP_ROOT, "cgroup.controllers")
    );
  } catch {
    return false;
  }
}

async function enableControllersOn(
  parentDir: string,
  controllers: string[]
): Promise<void> {
  try {
    const available = (
      await readFile(path.join(parentDir, "cgroup.controllers"))
    )
      .toString()
      .trim()
      .split(/\s+/);
    const toEnable = controllers.filter((c) => available.includes(c));
    if (toEnable.length === 0) return;
    const subtree = path.join(parentDir, "cgroup.subtree_control");
    for (const c of toEnable) {
      try {
        await writeFile(subtree, `+${c}`);
      } catch {}
    }
  } catch {}
}

export function getEnvTenantLimits(): TenantLimits {
  const read = (key: string): string | undefined => {
    const v = process.env[key];
    return v && v.length > 0 ? v : undefined;
  };

  const parseIntEnv = (key: string): number | undefined => {
    const v = read(key);
    if (!v) return undefined;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const limits: TenantLimits = {
    cpuWeight: parseIntEnv("TENANT_CPU_WEIGHT"),
    cpuMax: read("TENANT_CPU_MAX"),
    memoryHigh: read("TENANT_MEM_HIGH"),
    memoryMax: read("TENANT_MEM_MAX"),
    pidsMax: parseIntEnv("TENANT_PIDS_MAX"),
  };
  return limits;
}

async function safeWrite(filePath: string, value: string): Promise<void> {
  try {
    await access(filePath, FsConstants.W_OK);
    await writeFile(filePath, value);
  } catch {
    // ignore if not present or not writable in current environment
  }
}

export async function ensureTenantCgroup(
  userId: string,
  limits: TenantLimits
): Promise<void> {
  if (!isCgroupV2Supported()) return;

  await mkdir(TENANTS_DIR, { recursive: true });
  await enableControllersOn(CGROUP_ROOT, ["cpu", "memory", "pids", "io"]);
  await enableControllersOn(TENANTS_DIR, ["cpu", "memory", "pids", "io"]);

  const userDir = path.join(TENANTS_DIR, userId);
  await mkdir(userDir, { recursive: true });

  if (typeof limits.cpuWeight === "number") {
    await safeWrite(path.join(userDir, "cpu.weight"), String(limits.cpuWeight));
  }
  if (typeof limits.cpuMax === "string") {
    await safeWrite(path.join(userDir, "cpu.max"), limits.cpuMax);
  }
  if (typeof limits.memoryHigh === "string") {
    await safeWrite(path.join(userDir, "memory.high"), limits.memoryHigh);
  }
  if (typeof limits.memoryMax === "string") {
    await safeWrite(path.join(userDir, "memory.max"), limits.memoryMax);
  }
  if (typeof limits.pidsMax === "number") {
    await safeWrite(
      path.join(userDir, "pids.max"),
      limits.pidsMax < 0 ? "max" : String(limits.pidsMax)
    );
  }
}

export async function attachPidToTenant(
  userId: string,
  pid: number
): Promise<void> {
  if (!isCgroupV2Supported()) return;
  const userDir = path.join(TENANTS_DIR, userId);
  await safeWrite(path.join(userDir, "cgroup.procs"), String(pid));
}
