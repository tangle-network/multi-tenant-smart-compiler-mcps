import os from "node:os";
import { resolve } from "node:path";

export const projectsRoot =
  process.env.NODE_ENV === "production"
    ? "/noir"
    : resolve(os.tmpdir(), "noir");

console.log("projectsRoot", projectsRoot);

export const ALLOWED_COMMANDS = ["make", "cargo", "bb", "nargo"];

export const getMcpNoirBWrapArgs = (cmd: string[], workspacePath: string) => {
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
    "--ro-bind", "/usr/local/rustup", "/usr/local/rustup",

    // rust folders
    "--ro-bind", "/sys", "/sys",
    "--ro-bind", "/proc", "/proc",
    "--ro-bind", "/etc/alternatives", "/etc/alternatives",

    // noir 
    "--ro-bind", `${homeDir}/.nargo/bin`, `${homeDir}/.nargo/bin`,
    "--ro-bind", `${homeDir}/.bb/bb`, `${homeDir}/.bb/bb`,
    "--ro-bind", `${homeDir}/.foundry`, `${homeDir}/.foundry`,

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
    "--setenv", "PATH", `${homeDir}/.nargo/bin:${homeDir}/.bb/bb:${homeDir}/.foundry/bin:/usr/local/cargo/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
    "--setenv", "CARGO_HOME", `${homeDir}/.cargo`,

    // command to run
    ...cmd,
  ];
};