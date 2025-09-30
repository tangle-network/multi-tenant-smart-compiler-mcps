import { writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import type { McpConfiguration } from "@blueprint-agent/context-lego";
import { McpManager } from "@blueprint-agent/context-lego";
import {
  ClaudeHandler,
  type ClaudeExecutionOptions,
} from "./claude-handler.js";
import { ProgressTracker } from "./progress-tracker.js";
import { ArtifactManager } from "./artifact-manager.js";
import { TaskResult, ArtifactMetadata } from "./types/progress.js";

export type AgentType = "claude-code" | "gemini-cli" | "codex";

export interface AgentConfig {
  mcpConfig?: McpConfiguration;
  systemPrompt?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  addDirs?: string[];
  model?: string;
  permissionMode?: "plan" | "approve" | "deny";
  dangerouslySkipPermissions?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  artifacts?: ArtifactMetadata[];
}

export interface ExecutionOptions {
  mcpConfigPath?: string;
  workingDir?: string;
  maxTurns?: number;
  enableProgressTracking?: boolean;
  createArtifacts?: boolean;
  session?: {
    sessionId: string;
    isActive: boolean;
    lastActivity: Date;
  };
}

// Pre-configured agent settings optimized for each type
const AGENT_CONFIGS: Record<AgentType, Partial<AgentConfig>> = {
  "claude-code": {
    // Claude Code handled by SDK, this is just for reference
  },
  "gemini-cli": {
    model: "gemini-pro",
    permissionMode: "plan",
  },
  codex: {
    model: "gpt-4",
    permissionMode: "plan",
  },
};

export class Agent extends EventEmitter {
  private agentType: AgentType;
  private config: AgentConfig;
  private claudeHandler?: ClaudeHandler;
  private artifactManager: ArtifactManager;

  constructor(agentType: AgentType, config?: Partial<AgentConfig>) {
    super();
    this.agentType = agentType;
    this.config = {
      ...AGENT_CONFIGS[agentType],
      ...config,
    };

    this.artifactManager = new ArtifactManager();

    // Initialize Claude handler if this is a Claude Code agent
    if (agentType === "claude-code") {
      // Use the mcp-config.json file in the current directory
      const mcpManager = new McpManager("./mcp-config.json");
      this.claudeHandler = new ClaudeHandler(mcpManager);
    }
  }

  private getAgentDisplayName(agentType: AgentType): string {
    switch (agentType) {
      case "claude-code":
        return "Claude Code";
      case "gemini-cli":
        return "Gemini CLI";
      case "codex":
        return "OpenAI Codex";
      default:
        return agentType;
    }
  }

  async initialize(): Promise<void> {
    await this.artifactManager.initialize();
  }

  async execute(
    prompt: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Handle Claude Code with SDK
    if (this.agentType === "claude-code" && this.claudeHandler) {
      try {
        const claudeOptions: ClaudeExecutionOptions = {
          prompt,
          workingDirectory: options.workingDir,
          systemPrompt: this.config.systemPrompt,
          session: options.session
            ? {
                sessionId: options.session.sessionId,
                isActive: true,
                lastActivity: new Date(),
              }
            : undefined,
        };

        const result = await this.claudeHandler.execute(claudeOptions);
        return {
          success: result.success,
          output: result.output,
          error: result.error,
          duration: result.duration,
        };
      } catch (error) {
        return {
          success: false,
          output: "",
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        };
      }
    }

    // Handle other CLI agents with spawn
    const command = this.getCommand();
    const args = this.buildCommandArgs(prompt, options);

    try {
      return new Promise<ExecutionResult>((resolve) => {
        let output = "";
        let error = "";
        let resolved = false;
        const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout

        const childProcess = spawn(command, args, {
          cwd: options.workingDir,
          stdio: ["pipe", "pipe", "pipe"],
          detached: process.platform !== "win32", // Create process group on Unix-like systems
        });

        // Set up timeout handling
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;

            // Kill the process and all child processes using process group
            try {
              if (process.platform === "win32") {
                // On Windows, use taskkill to kill the entire process tree
                spawn("taskkill", [
                  "/pid",
                  childProcess.pid?.toString() || "",
                  "/f",
                  "/t",
                ]);
              } else {
                // On Unix-like systems, kill the entire process group
                if (childProcess.pid) {
                  process.kill(-childProcess.pid, "SIGKILL"); // Negative PID kills the process group
                }
              }
            } catch (killError) {
              console.warn("Failed to kill child process group:", killError);
              // Fallback to killing just the main process
              try {
                childProcess.kill("SIGKILL");
              } catch (fallbackError) {
                console.warn("Failed to kill main process:", fallbackError);
              }
            }

            resolve({
              success: false,
              output,
              error: `Process timed out after ${timeoutMs / 1000} seconds`,
              duration: Date.now() - startTime,
            });
          }
        }, timeoutMs);

        childProcess.stdout?.on("data", (data: Buffer) => {
          output += data.toString();
        });

        childProcess.stderr?.on("data", (data: Buffer) => {
          error += data.toString();
        });

        childProcess.on("close", (code: number | null) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);

            const duration = Date.now() - startTime;
            if (code === 0) {
              resolve({
                success: true,
                output,
                duration,
              });
            } else {
              resolve({
                success: false,
                output,
                error: error || `Process exited with code ${code}`,
                duration,
              });
            }
          }
        });

        childProcess.on("error", (err: Error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);

            resolve({
              success: false,
              output,
              error: err.message,
              duration: Date.now() - startTime,
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private getCommand(): string {
    // Return the actual CLI command for different agents (excluding Claude Code)
    const name = this.getAgentDisplayName(this.agentType);
    if (name === "OpenAI Codex") return "npx";
    if (name === "Gemini CLI") return "npx";
    throw new Error(`Unknown agent type: ${this.agentType}`);
  }

  private buildCommandArgs(
    prompt: string,
    options: ExecutionOptions
  ): string[] {
    // Validate prompt for security
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt must be a non-empty string");
    }

    // Use whitelist approach for command validation (more secure than blacklist)
    const allowedCharPattern = /^[a-zA-Z0-9\s\-_.,!?@#%^*+=\[\]{}'":\/\\]+$/;
    if (!allowedCharPattern.test(prompt)) {
      throw new Error(
        "Prompt contains disallowed characters - only alphanumeric, spaces, and common punctuation allowed"
      );
    }

    // Validate working directory if provided
    if (options.workingDir) {
      if (typeof options.workingDir !== "string") {
        throw new Error("Working directory must be a string");
      }
      if (
        options.workingDir.includes("..") ||
        options.workingDir.startsWith("/") ||
        options.workingDir.includes(";")
      ) {
        throw new Error("Working directory contains invalid characters");
      }
    }

    const args: string[] = [];
    const agentName = this.getAgentDisplayName(this.agentType);

    // Build args based on agent type (Claude Code handled separately)
    if (agentName === "OpenAI Codex") {
      args.push("--yes", "@openai/codex@latest");
      args.push("exec");
      args.push("--skip-git-repo-check");
      args.push("--full-auto");
      if (options.workingDir) {
        args.push("-C", options.workingDir);
      }
      args.push(prompt);
    } else if (agentName === "Gemini CLI") {
      args.push(
        "--yes",
        "@google/gemini-cli@latest",
        "--yolo",
        "--prompt",
        prompt
      );
    }

    return args;
  }

  getName(): string {
    return this.getAgentDisplayName(this.agentType);
  }

  getArtifactManager(): ArtifactManager {
    return this.artifactManager;
  }

  async getArtifactContent(request: {
    artifactId: string;
    files?: string[];
    maxFiles?: number;
  }) {
    return this.artifactManager.getArtifactContent(request);
  }

  getArtifactMetadata(id: string) {
    return this.artifactManager.getArtifactMetadata(id);
  }

  getAllArtifacts() {
    return Array.from(this.artifactManager["registry"].values());
  }

  getMCPConfig(): McpConfiguration | undefined {
    return this.config.mcpConfig;
  }

  async executeTask(
    prompt: string,
    options: ExecutionOptions = {}
  ): Promise<TaskResult> {
    const taskId = `task-${Date.now()}`;
    const tracker = new ProgressTracker(taskId);

    // Set up progress tracking if enabled
    if (options.enableProgressTracking) {
      tracker.on("progress", (update) => {
        // Emit progress events for UI consumption
        this.emit("progress", update);
      });
    }

    tracker.progress("initialization", "Setting up task environment");

    try {
      // Execute the underlying agent
      const result = await this.execute(prompt, options);

      if (!result.success) {
        return {
          success: false,
          summary: `Task failed: ${result.error}`,
          details: result.output,
          duration: tracker.getDuration(),
          error: result.error,
        };
      }

      tracker.progress("completion", "Task completed successfully", {
        milestone: "task-complete",
      });

      // Create artifact if requested and files were created
      let artifactMetadata;
      if (options.createArtifacts && options.workingDir) {
        tracker.progress("artifacts", "Creating artifact from generated files");

        try {
          artifactMetadata = await this.artifactManager.createArtifact(
            this.agentType,
            options.workingDir
          );

          tracker.progress("artifacts", "Artifact created successfully", {
            filesCount: artifactMetadata.filesCreated,
            milestone: "artifact-ready",
          });
        } catch (error) {
          console.warn("Failed to create artifact:", error);
        }
      }

      // Generate token-efficient summary
      const summary = this.generateTaskSummary(result, artifactMetadata);
      const integrationNotes = this.generateIntegrationNotes(artifactMetadata);

      return {
        success: true,
        summary,
        details: tracker.getTokenEfficientSummary(),
        artifacts: artifactMetadata,
        integrationNotes,
        duration: tracker.getDuration(),
      };
    } catch (error) {
      return {
        success: false,
        summary: "Task execution failed",
        details: error instanceof Error ? error.message : String(error),
        duration: tracker.getDuration(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private generateTaskSummary(result: ExecutionResult, artifact?: any): string {
    const baseInfo = `${this.getAgentDisplayName(this.agentType)} task completed`;

    if (artifact) {
      const sizeKB = Math.round(artifact.totalSize / 1024);
      return `${baseInfo}: ${artifact.filesCreated} files created (${sizeKB}KB)`;
    }

    const outputLength = result.output.length;
    const outputKB = Math.round(outputLength / 1024);
    return `${baseInfo}: Generated ${outputKB}KB output`;
  }

  private generateIntegrationNotes(artifact?: any): string | undefined {
    if (!artifact) return undefined;

    const totalFiles = artifact.filesCreated;
    const keyFiles = artifact.keyFiles;

    if (totalFiles === 0) return undefined;

    // Show first few files as examples, indicate total count
    const exampleFiles = keyFiles.slice(0, 3);
    const moreCount = Math.max(0, totalFiles - 3);

    let notes = `Files created: ${exampleFiles.join(", ")}`;
    if (moreCount > 0) {
      notes += ` (+${moreCount} more)`;
    }

    return notes;
  }
}

export function createAgent(
  agentType: AgentType,
  config: AgentConfig = {}
): Agent {
  return new Agent(agentType, config);
}
