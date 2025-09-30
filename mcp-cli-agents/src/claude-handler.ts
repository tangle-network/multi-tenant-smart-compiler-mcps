import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import { McpManager } from "@blueprint-agent/context-lego";

interface ConversationSession {
  sessionId?: string;
  isActive: boolean;
  lastActivity: Date;
}

interface ClaudeArtifact {
  type: string;
  title: string;
  content: string;
  language?: string;
  path?: string;
}

interface ClaudeQueryOptions {
  outputFormat: "stream-json" | "text";
  permissionMode: "approve" | "bypassPermissions" | "plan";
  dangerouslySkipPermissions?: boolean;
  cwd?: string;
  mcpServers?: Record<string, any>;
  allowedTools?: string[];
  resume?: string;
}

export interface ClaudeExecutionOptions {
  prompt: string;
  workingDirectory?: string;
  systemPrompt?: string;
  session?: ConversationSession;
  abortController?: AbortController;
}

export interface ClaudeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  sessionId?: string;
  artifacts?: ClaudeArtifact[];
}

export class ClaudeHandler {
  private sessions: Map<string, ConversationSession> = new Map();
  private mcpManager: McpManager;
  private cleanupTimer: NodeJS.Timeout;

  constructor(
    mcpManager: McpManager,
    cleanupIntervalMs: number = 15 * 60 * 1000
  ) {
    this.mcpManager = mcpManager;

    // Start automatic cleanup timer with configurable interval
    this.cleanupTimer = setInterval(() => {
      try {
        this.cleanupInactiveSessions();
      } catch (error) {
        console.warn("Session cleanup failed:", error);
      }
    }, cleanupIntervalMs);
  }

  // Method to cleanup resources when handler is destroyed
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.sessions.clear();
  }

  createSession(): ConversationSession {
    const session: ConversationSession = {
      isActive: true,
      lastActivity: new Date(),
    };
    return session;
  }

  async execute(
    options: ClaudeExecutionOptions
  ): Promise<ClaudeExecutionResult> {
    const startTime = Date.now();
    let output = "";
    let sessionId: string | undefined = options.session?.sessionId; // Start with existing session ID

    try {
      const queryOptions: any = {
        outputFormat: "stream-json",
        permissionMode: "bypassPermissions", // Allow actual file execution for testing
      };

      if (options.workingDirectory) {
        queryOptions.cwd = options.workingDirectory;
      }

      // Add MCP server configuration if available
      const mcpServers = this.mcpManager.getServerConfiguration();
      if (mcpServers && Object.keys(mcpServers).length > 0) {
        queryOptions.mcpServers = mcpServers;

        // Allow all MCP tools by default
        const defaultMcpTools = this.mcpManager.getDefaultAllowedTools();
        // Add Claude default tools
        const allTools = [
          "Read",
          "Write",
          "Bash",
          "Computer",
          "CreateArtifact",
          "EditArtifact",
          ...defaultMcpTools,
        ];
        queryOptions.allowedTools = allTools;
      }

      if (options.session?.sessionId) {
        queryOptions.resume = options.session.sessionId;
      }

      // Stream the query and collect output
      for await (const message of query({
        prompt: options.prompt,
        abortController: options.abortController || new AbortController(),
        options: queryOptions,
      })) {
        if (message.type === "system" && message.subtype === "init") {
          // Only update session ID if we don't already have one (new session)
          if (!sessionId) {
            sessionId = message.session_id;
          }
          if (options.session) {
            options.session.sessionId = sessionId;
          }
        }

        // Collect all message content as output
        if (message.type === "assistant") {
          output += JSON.stringify(message) + "\n";
        } else if (message.type === "result") {
          output += JSON.stringify(message) + "\n";
        }
      }

      return {
        success: true,
        output,
        duration: Date.now() - startTime,
        sessionId,
      };
    } catch (error) {
      return {
        success: false,
        output,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        sessionId,
      };
    }
  }

  async *streamQuery(
    options: ClaudeExecutionOptions
  ): AsyncGenerator<SDKMessage, void, unknown> {
    const queryOptions: any = {
      outputFormat: "stream-json",
      permissionMode: "bypassPermissions",
    };

    if (options.workingDirectory) {
      queryOptions.cwd = options.workingDirectory;
    }

    // Add MCP server configuration if available
    const mcpServers = this.mcpManager.getServerConfiguration();
    if (mcpServers && Object.keys(mcpServers).length > 0) {
      queryOptions.mcpServers = mcpServers;

      // Allow all MCP tools by default
      const defaultMcpTools = this.mcpManager.getDefaultAllowedTools();
      const allTools = [
        "Read",
        "Write",
        "Bash",
        "Computer",
        "CreateArtifact",
        "EditArtifact",
        ...defaultMcpTools,
      ];
      queryOptions.allowedTools = allTools;
    }

    if (options.session?.sessionId) {
      queryOptions.resume = options.session.sessionId;
    }

    try {
      for await (const message of query({
        prompt: options.prompt,
        abortController: options.abortController || new AbortController(),
        options: queryOptions,
      })) {
        if (message.type === "system" && message.subtype === "init") {
          if (options.session) {
            // Use existing session ID if we have one (resuming), otherwise use new one
            const sessionId = options.session.sessionId || message.session_id;
            options.session.sessionId = sessionId;
          }
        }
        yield message;
      }
    } catch (error) {
      console.error("Error in Claude query:", error);
      throw error;
    }
  }

  cleanupInactiveSessions(maxAge: number = 30 * 60 * 1000): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.sessions.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} inactive Claude sessions`);
    }
  }
}
