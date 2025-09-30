import { spawnSync } from "node:child_process";
import { stat as fsStat, readdir } from "node:fs/promises";
import path, { join } from "node:path";
import { stringify } from "superjson";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import crypto from "node:crypto";

/**
 * @dev only use in internal MCP with specified commands, not for user to pipe commands
 */
const execAsyncAsRoot = promisify(exec);
export const execAsync = (userId: string, cmd: string) => {
  console.info("Executing command as root for user", userId, cmd);
  return execAsyncAsRoot(`su - ${userId} --c "${cmd}"`)
}

export async function projectExists(projectPath: string) {
  try {
    const stat = await fsStat(projectPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function listFilesRecursive(dir: string, includeHidden: boolean = false): Promise<string[]> {
  try {
    const dirEntries = await readdir(dir, { withFileTypes: true });
    // Filter entries based on includeHidden parameter
    const filteredEntries = includeHidden 
      ? dirEntries 
      : dirEntries.filter(entry => !entry.name.startsWith('.'));
    
    const files = await Promise.all(
      filteredEntries.map(async (entry) => {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          console.log(`Recursing into directory: ${fullPath}`);
          const subFiles = await listFilesRecursive(fullPath, includeHidden);
          console.log(`Found ${subFiles.length} files in ${fullPath}:`, subFiles);
          return subFiles;
        } else if (entry.isFile()) {
          console.log(`Found file: ${fullPath}`);
          return [fullPath];
        }

        return [];
      }),
    );

    const flattened = files.flat();
    console.log(`Total files found in ${dir}: ${flattened.length}`, flattened);
    return flattened;
  } catch (error) {
    console.error(`Error listing files in ${dir}:`, error);
    return [];
  }
}

export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error(stringify(error));
}

export const cargoDir = () => {
  const cargoHome = spawnSync("echo", ["$CARGO_HOME"]).stdout.toString().trim();
  return path.join(cargoHome, "bin");
};

export const getWorkspacePath = (
  userId: string,
  workspace: string,
): {
  workspace: string;
} => {
  const HOME = "/home"
  const workspacePath = path.join(HOME, userId, workspace);

  // Ensure the resolved workspace path is within the project root
  const resolvedProjectRoot = path.resolve(HOME);
  const resolvedWorkspace = path.resolve(workspacePath);

  if (
    !resolvedWorkspace.startsWith(resolvedProjectRoot + path.sep) &&
    resolvedWorkspace !== resolvedProjectRoot
  ) {
    throw new Error(
      `Workspace path resolves outside project root: ${workspacePath}`,
    );
  }

  return { workspace: workspacePath };
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const generateUniqueRandomId = (
  uids: string[],
  maxTries: number = 100,
) => {
  let randomId = crypto.randomUUID();
  let i = 0;
  while (uids.includes(randomId)) {
    if (i >= maxTries) {
      throw new Error("Failed to generate a unique random ID");
    }

    randomId = crypto.randomUUID();
    i++;
  }
  return randomId;
};

export const transferFolderOwnership = async (userId: string, path: string) => {
  await execAsyncAsRoot(`chown -R ${userId}:external-users ${path}`);
  await execAsyncAsRoot(`chmod -R 700 ${path}`);
};

export const ensureExistUser = async (userId: string) => {
  // all file create user should named like this to prevent deep args passing
  return execAsyncAsRoot(`/usr/local/bin/create-linux-user.sh ${userId}`);
};