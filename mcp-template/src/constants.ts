import { promises as fs } from "node:fs";
import os from "node:os";
import { resolve } from "node:path";

const temporaryDirectory = await fs.realpath(os.tmpdir());

export const projectsRoot =
  process.env.NODE_ENV === "production"
    ? "/blueprint"
    : resolve(temporaryDirectory, "blueprint");

console.log("projectsRoot", projectsRoot);
