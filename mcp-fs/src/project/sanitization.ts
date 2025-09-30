import path from "node:path";
import os from "node:os";

/**
 * Sanitizes a project ID to prevent path traversal attacks
 * @param projectId The project ID to sanitize
 * @returns Sanitized project ID
 */
export function sanitizeProjectId(projectId: string): string {
  // Remove null bytes and other dangerous characters
  const cleaned = projectId.replace(/[\x00-\x1f\x7f-\x9f]/g, "");

  // Normalize path to prevent traversal
  const normalized = path.normalize(cleaned);

  // Ensure the path doesn't contain traversal attempts
  validateTraversal(normalized);

  // Additional check for common dangerous patterns
  if (/[;&|`$(){}[\]\\]/.test(normalized)) {
    throw new Error(
      `Invalid project ID: ${projectId}. Project ID contains unsafe characters.`,
    );
  }

  return normalized;
}

/**
 * Validates and sanitizes port numbers
 * @param port The port number to validate
 * @returns Validated port number
 */
export function sanitizePort(port: number): number {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port: ${port}. Port must be an integer between 1 and 65535.`,
    );
  }
  return port;
}

/**
 * Escapes shell arguments to prevent command injection
 * @param arg The argument to escape
 * @returns Escaped argument safe for shell execution
 */
/**
 * Escapes shell arguments to prevent command injection
 * @param arg The argument to escape
 * @returns Escaped argument safe for shell execution
 */
export function escapeShellArg(arg: string): string {
  if (os.platform() === "win32") {
    // Windows: wrap in double quotes and escape internal double quotes
    // See: https://docs.microsoft.com/en-us/cpp/cpp/parsing-cpp-command-line-arguments
    return `"${arg.replace(/(["^])/g, "^$1")}"`;
  } else {
    // Unix: wrap in single quotes and escape single quotes inside
    return `'${arg.replace(/'/g, `'\\''`)}'`;
  }
}

/**
 * Validates that a workspace path is safe and within the allowed project root
 * @param projectRoot The allowed project root directory
 * @param workspacePath The workspace path to validate
 */
export function validateWorkspacePath(
  projectRoot: string,
  workspacePath: string,
): void {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedWorkspace = path.resolve(workspacePath);

  // Ensure the workspace is within the project root
  if (
    !resolvedWorkspace.startsWith(resolvedProjectRoot + path.sep) &&
    resolvedWorkspace !== resolvedProjectRoot
  ) {
    throw new Error(
      `Workspace path ${workspacePath} is not within the allowed project root ${projectRoot}.`,
    );
  }
}

export function validateCommand(command: string) {
  if (!/^[a-zA-Z0-9_\-\s]+$/.test(command)) {
    throw new Error(
      `Invalid command: ${command}. Command contains unsafe characters.`,
    );
  }
}

export function validateArgs(args: string) {
  if (!/^[a-zA-Z0-9_\-\s:\.\/&"@=]*$/.test(args)) {
    throw new Error(
      `Invalid arguments: ${args}. Arguments contain unsafe characters.`,
    );
  }
}

export function validateTraversal(p: string) {
  if (p.includes("..") || path.isAbsolute(p)) {
    throw new Error(`Invalid path: ${p}. Path contains unsafe characters.`);
  }
}

export function sanitizePid(pid: unknown): number {
  const parsed = Number(pid);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid PID: ${pid}. PID must be a positive integer.`);
  }
  return parsed;
}
