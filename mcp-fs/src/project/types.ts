import type { Serializable } from "node:child_process";

export type SpawnProcessEvent =
  | {
      type: "close";
      code?: number | null;
      signal?: string | null;
      tid?: string;
    }
  | { type: "error"; error: Error; tid?: string }
  | { type: "exit"; code?: number | null; signal?: string | null; tid?: string }
  | { type: "message"; message: Serializable; tid?: string }
  | { type: "spawn"; tid?: string }
  | { type: "stdout"; data: string; tid?: string }
  | { type: "stderr"; data: string; tid?: string }
  | { type: "disconnect"; tid?: string };

export type SpawnProcessCallback = (event: SpawnProcessEvent) => void;
