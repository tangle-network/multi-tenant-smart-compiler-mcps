import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Security utility for handling private keys and secrets
 */
export class SecurityLogManager {
  private static logFile: string | null = null;
  private static secrets: Set<string> = new Set();

  /**
   * Initialize the security manager with a log file
   */
  static async initialize(identifier: string, logDir?: string): Promise<void> {
    const logDirectory = logDir || path.join(os.homedir(), ".mcp-logs");

    try {
      await fs.mkdir(logDirectory, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logFile = path.join(logDirectory, `${identifier}-${timestamp}.log`);
  }

  /**
   * Register a secret to be masked in logs
   */
  static registerSecret(secret: string): void {
    if (secret && secret.length > 0) {
      this.secrets.add(secret);
    }
  }

  /**
   * Register common secret patterns
   */
  static registerCommonSecrets(): void {
    // Register environment variables that might contain secrets
    const envSecrets = [
      "PRIVATE_KEY",
      "SECRET_KEY",
      "API_KEY",
      "ACCESS_TOKEN",
      "PASSWORD",
      "DATABASE_URL",
      "JWT_SECRET",
      "MNEMONIC",
    ];

    envSecrets.forEach((envVar) => {
      const value = process.env[envVar];
      if (value) {
        this.registerSecret(value);
      }
    });
  }

  /**
   * Mask secrets in a string
   */
  static maskSecrets(text: string): string {
    let maskedText = text;

    this.secrets.forEach((secret) => {
      if (secret && secret.length > 0) {
        const mask = "*".repeat(Math.min(secret.length, 8));
        maskedText = maskedText.replace(
          new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          mask,
        );
      }
    });

    return maskedText;
  }

  /**
   * Securely log a message to file
   */
  static async secureLog(
    message: string,
    level: "info" | "warn" | "error" | "debug" = "debug",
    context?: Record<string, any>,
  ): Promise<void> {
    if (!this.logFile) {
      console.error(
        "Log file not initialized. Please call initialize() first.",
      );
      return;
    }

    const timestamp = new Date().toISOString();
    const maskedMessage = this.maskSecrets(message);
    const maskedContext = context
      ? JSON.stringify(
          context,
          (key, value) => {
            // Mask any values that look like secrets
            if (typeof value === "string" && this.secrets.has(value)) {
              return "*".repeat(Math.min(value.length, 8));
            }
            return value;
          },
          2,
        )
      : "";

    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${maskedMessage}${maskedContext ? `\nContext: ${maskedContext}` : ""}\n`;

    console[level](logEntry);

    try {
      await fs.appendFile(this.logFile!, logEntry);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error("Failed to write to log file:", error);
      console.log(`[${level.toUpperCase()}] ${maskedMessage}`);
    }
  }

  /**
   * Create a secure command string that masks secrets
   */
  static createSecureCommand(cmd: string, args: string): string {
    const fullCommand = `${cmd} ${args}`;
    return this.maskSecrets(fullCommand);
  }

  /**
   * Get the current log file path
   */
  static getLogFilePath(): string | null {
    return this.logFile;
  }

  /**
   * Clear registered secrets (useful for testing)
   */
  static clearSecrets(): void {
    this.secrets.clear();
  }
}

/**
 * Utility function to safely handle private keys in command execution
 */
export function sanitizeEvmPrivateKey(privateKey: string | undefined): string {
  if (!privateKey) {
    return "";
  }

  // Register the private key for masking
  SecurityLogManager.registerSecret(privateKey);

  return privateKey;
}

/**
 * Utility function to create a secure command with private key handling
 */
export function createSecureCommandWithPrivateKey(
  baseCommand: string,
  privateKey: string | undefined,
  additionalArgs: string = "",
): { command: string; maskedCommand: string } {
  const sanitizedKey = sanitizeEvmPrivateKey(privateKey);
  const fullCommand =
    `${baseCommand} --private-key ${sanitizedKey} ${additionalArgs}`.trim();
  const maskedCommand = SecurityLogManager.createSecureCommand(
    baseCommand,
    `--private-key *** ${additionalArgs}`.trim(),
  );

  return {
    command: fullCommand,
    maskedCommand,
  };
}
