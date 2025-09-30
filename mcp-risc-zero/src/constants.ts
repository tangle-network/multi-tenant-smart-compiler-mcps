import { promises as fs } from "node:fs";
import os from "node:os";
import { resolve } from "node:path";

const temporaryDirectory = await fs.realpath(os.tmpdir());

export const getProjectsRoot = async (userId?: string): Promise<string> => {
  if (!userId) {
    // Single-tenant mode (backward compatible)
    const root = process.env.NODE_ENV === "production"
      ? "/risc-zero"
      : resolve(temporaryDirectory, "risc-zero");
    await fs.mkdir(root, { recursive: true });
    return root;
  }
  
  // Multi-tenant mode
  const root = process.env.NODE_ENV === "production"
    ? `/workspace/${userId}`
    : resolve(temporaryDirectory, "risc-zero", userId);
  
  await fs.mkdir(root, { recursive: true });
  return root;
};

// For backward compatibility
export const projectsRoot = await getProjectsRoot();

console.log("projectsRoot", projectsRoot);

export const ALLOWED_SHELL_COMMANDS = ["make", "cargo", "forge", "cast", "anvil"];


export const getRiscZeroBwrapArgs = (
  cmd: string[],
  workspacePath: string,
) => {
  const userId = os.userInfo().uid;
  const homeDir = os.homedir();

  return [
    // system folders
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/usr/local", "/usr/local",
    "--ro-bind", "/opt", "/opt",
    "--ro-bind", "/root", "/root",
    "--ro-bind", "/etc/resolv.conf", "/etc/resolv.conf",
    "--ro-bind", "/etc/ssl", "/etc/ssl",
    "--ro-bind", "/etc/ca-certificates", "/etc/ca-certificates",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/lib64", "/lib64",
    "--ro-bind", "/etc/hosts", "/etc/hosts",
    "--ro-bind", "/etc/passwd", "/etc/passwd",
    "--ro-bind", "/etc/group", "/etc/group",
    "--ro-bind", "/etc/nsswitch.conf", "/etc/nsswitch.conf",

    // rust toolchain directories - bind read-only for binaries and registry
    "--ro-bind", "/usr/local/cargo/bin", "/usr/local/cargo/bin",
    "--bind", "/usr/local/rustup", "/usr/local/rustup",

    // rust folders
    "--ro-bind", "/sys", "/sys",
    "--ro-bind", "/proc", "/proc",
    "--ro-bind", "/etc/alternatives", "/etc/alternatives",

    // workspace. only this is writable
    "--bind",    workspacePath, workspacePath,

    // misc dirs
    "--dir",     "/tmp",
    "--dir",     "/var",
    "--dev",     "/dev",

    // essential symlinks
    "--symlink", "usr/bin", "/bin",
    "--symlink", "usr/sbin", "/sbin",

    // execution context
    "--chdir",   workspacePath,
    "--unshare-user-try",
    "--unshare-pid",
    "--unshare-ipc",
    "--unshare-uts",
    "--die-with-parent",

    // runtime environment
    "--dir", `/run/user/${userId}`,
    "--setenv", "XDG_RUNTIME_DIR", `/run/user/${userId}`,
    "--setenv", "PS1", "VM$ ",
    "--setenv", "PATH", `/usr/local/cargo/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
    "--setenv", "CARGO_HOME", `${homeDir}/.cargo`,

    // command to run
    ...cmd,
  ];
}

