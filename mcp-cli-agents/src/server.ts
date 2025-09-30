import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { z } from "zod";
import {
  SystemPromptBuilder,
  McpManager,
  type McpConfiguration,
  type ModelConfig,
} from "@blueprint-agent/context-lego";
import { Agent, AgentType, createAgent } from "./agent.js";
import { convertOutputToBoltArtifact } from "./bolt-converter.js";

interface CreateServerOptions {
  agentType: AgentType;
  mcpConfigPath?: string;
  baseSystemPrompt?: string;
  enableBoltConversion?: boolean;
  defaultArtifactId?: string;
  defaultArtifactTitle?: string;
  llmModelConfig?: ModelConfig; // Using the exported type from context-lego
}

interface ArtifactContentRequest {
  artifactId: string;
  files?: string[];
  maxFiles?: number;
}

// Custom error classes for better error categorization
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class ExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

// Zod schemas for input validation
const DomainSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9\-_]+$/,
    "Domain must contain only alphanumeric characters, hyphens, and underscores"
  );

const ExecuteTaskSchema = z.object({
  task: z.string().min(1, "Task must be a non-empty string"),
  domains: z.array(DomainSchema).optional(),
  workingDir: z
    .string()
    .regex(/^[^/].*$/, "Working directory cannot start with /")
    .regex(/^(?!.*\.\.).*$/, "Working directory cannot contain ..")
    .optional(),
  enableProgressTracking: z.boolean().optional(),
  createArtifacts: z.boolean().optional(),
});

// Default tool configurations for each agent type
const DEFAULT_ALLOWED_TOOLS: Record<AgentType, string[]> = {
  "claude-code": [
    // Claude default tools
    "Read",
    "Write",
    "Bash",
    "Computer",
    "CreateArtifact",
    "EditArtifact",
  ],
  "gemini-cli": ["Read", "Write", "Bash"],
  codex: ["Read", "Write", "Bash"],
};

export function createServer(config: CreateServerOptions) {
  const server = new McpServer(
    {
      name: "CLI Agents MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
        tools: {},
        resources: {},
      },
    }
  );

  // Initialize internal components
  const mcpManager = new McpManager(
    config.mcpConfigPath ? config.mcpConfigPath : undefined
  );

  let promptBuilder: SystemPromptBuilder | undefined;
  let tempMcpConfigPath: string | undefined;

  // Initialize context-lego components if we have classification config
  if (config.llmModelConfig) {
    try {
      promptBuilder = new SystemPromptBuilder({
        llmConfig: config.llmModelConfig,
      });
    } catch (error) {
      console.warn("Failed to initialize SystemPromptBuilder:", error);
    }
  }

  // Create agent
  const agent = createAgent(config.agentType);

  // Helper function to build system prompt
  const buildSystemPrompt = async (
    task: string,
    domains?: string[]
  ): Promise<string> => {
    if (!promptBuilder) {
      return (
        config.baseSystemPrompt ||
        `You are ${agent.getName()}, a helpful coding assistant.`
      );
    }

    try {
      let selectedDomains: string[] = [];

      // Use provided domains or get LLM classification
      if (domains?.length) {
        selectedDomains = domains;
      } else {
        const classification = await promptBuilder.getClassification(task);
        selectedDomains = classification.selectedDomains.map(
          (selection) => selection.domain
        );
      }

      // Build enhanced system prompt with context
      const result = await promptBuilder.buildPrompt({
        baseTemplate: "coding-assistant",
        cwd: process.cwd(),
        userIntent: task,
        domains: selectedDomains,
        githubToken:
          process.env.GH_TOKEN || process.env.GH_PERSONAL_ACCESS_TOKEN,
      });

      return result.prompt;
    } catch (error) {
      console.warn("Failed to build enhanced system prompt:", error);
      return (
        config.baseSystemPrompt ||
        `You are ${agent.getName()}, a helpful coding assistant.`
      );
    }
  };

  // Helper function to create temp MCP config
  const createTempMcpConfig = (): string | undefined => {
    const mcpServers = mcpManager.getServerConfiguration();
    if (!mcpServers) {
      return undefined;
    }

    try {
      const tempDir = mkdtempSync(join(tmpdir(), "mcp-config-"));
      const tempPath = join(tempDir, "mcp-config.json");
      writeFileSync(tempPath, JSON.stringify(mcpServers, null, 2));
      return tempPath;
    } catch (error) {
      console.warn("Failed to create temporary MCP config:", error);
      return undefined;
    }
  };

  // Register tools
  registerTools();

  function registerTools(): void {
    // Token-efficient task execution with progress tracking
    server.tool(
      "execute_task",
      `Execute ${agent.getName()} task with token-efficient progress tracking and artifact creation`,
      {
        task: z.string().describe("The task to execute"),
        domains: z
          .array(z.string())
          .optional()
          .describe("Relevant domains (optional)"),
        workingDir: z
          .string()
          .optional()
          .describe("Working directory (optional)"),
        enableProgressTracking: z
          .boolean()
          .optional()
          .default(true)
          .describe("Enable progress tracking (default: true)"),
        createArtifacts: z
          .boolean()
          .optional()
          .default(true)
          .describe("Create artifacts for generated files (default: true)"),
      },
      async ({
        task,
        domains,
        workingDir,
        enableProgressTracking = true,
        createArtifacts = true,
      }) => {
        // Comprehensive input validation using Zod
        const validationResult = ExecuteTaskSchema.safeParse({
          task,
          domains,
          workingDir,
          enableProgressTracking,
          createArtifacts,
        });
        if (!validationResult.success) {
          const errorMessages = validationResult.error.issues
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join("; ");
          throw new ValidationError(`Validation failed: ${errorMessages}`);
        }

        try {
          const enhancedSystemPrompt = await buildSystemPrompt(
            task as string,
            domains as string[]
          );

          // Initialize agent if not done yet
          await agent.initialize();

          // Execute the task using token-efficient flow
          const result = await agent.executeTask(task as string, {
            workingDir: workingDir as string,
            enableProgressTracking,
            createArtifacts,
          });

          // Return the result
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  agentType: config.agentType,
                  usedSDK: config.agentType === "claude-code",
                  mcpInfo: mcpManager.getServerConfiguration(),
                  success: result.success,
                  summary: result.summary,
                  artifacts: result.artifacts,
                  integrationNotes: result.integrationNotes,
                  duration: result.duration,
                }),
              },
            ],
          };
        } catch (error) {
          console.error("Error in execute_task:", error);

          // Categorize error types using custom error classes
          let errorType = "unknown";
          let errorMessage = "An unexpected error occurred";

          if (error instanceof ValidationError) {
            errorType = "validation";
            errorMessage = error.message;
          } else if (error instanceof TimeoutError) {
            errorType = "timeout";
            errorMessage = error.message;
          } else if (error instanceof ExecutionError) {
            errorType = "execution";
            errorMessage = error.message;
          } else if (error instanceof PermissionError) {
            errorType = "permission";
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
            // Fallback categorization for generic errors
            if (
              error.message.includes("timeout") ||
              error.message.includes("TIMEOUT")
            ) {
              errorType = "timeout";
            } else if (
              error.message.includes("spawn") ||
              error.message.includes("command not found")
            ) {
              errorType = "execution";
            } else if (
              error.message.includes("permission") ||
              error.message.includes("EACCES")
            ) {
              errorType = "permission";
            }
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: errorMessage,
                  errorType,
                  agentType: config.agentType,
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get artifact content
    server.tool(
      "get_artifact",
      "Get content from a specific artifact by ID",
      {
        artifactId: z.string().describe("The artifact ID to retrieve"),
        files: z
          .array(z.string())
          .optional()
          .describe("Specific files to retrieve (optional)"),
        maxFiles: z
          .number()
          .optional()
          .describe("Maximum number of files to return (optional)"),
      },
      async ({ artifactId, files, maxFiles }) => {
        try {
          await agent.initialize();

          const content = await agent.getArtifactContent({
            artifactId,
            files,
            maxFiles,
          });

          // Check if artifact exists - getArtifactContent returns null for non-existent artifacts
          if (content === null) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    success: false,
                    error: "Artifact not found",
                    errorType: "not_found",
                  }),
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  artifact: content,
                }),
              },
            ],
          };
        } catch (error) {
          let errorType = "unknown";
          let errorMessage = "Failed to retrieve artifact";

          if (error instanceof Error) {
            errorMessage = error.message;

            if (
              error.message.includes("not found") ||
              error.message.includes("does not exist")
            ) {
              errorType = "not_found";
            } else if (
              error.message.includes("permission") ||
              error.message.includes("EACCES")
            ) {
              errorType = "permission";
            } else if (error.message.includes("Cannot read properties")) {
              errorType = "validation";
              errorMessage = "Artifact not found - invalid artifact ID";
            }
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: errorMessage,
                  errorType,
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // List all artifacts
    server.tool(
      "list_artifacts",
      "List all available artifacts",
      {},
      async () => {
        try {
          await agent.initialize();

          const artifacts = agent.getAllArtifacts();
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  artifacts,
                }),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                  artifacts: [],
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Status tool
    server.tool(
      "status",
      "Get the current status and configuration of the CLI agent",
      {},
      async () => {
        try {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  agentType: config.agentType,
                  name: agent.getName(),
                  usesSDK: config.agentType === "claude-code",
                  usesCLI: config.agentType !== "claude-code",
                  capabilities: {
                    defaultTools: DEFAULT_ALLOWED_TOOLS[config.agentType],
                    enhancedPrompts: !!promptBuilder,
                    boltConversion: config.enableBoltConversion || false,
                  },
                  mcpInfo: mcpManager.getServerConfiguration(),
                }),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  // Initialize MCP configuration if needed
  if (mcpManager.getServerConfiguration()) {
    tempMcpConfigPath = createTempMcpConfig();
  }

  return server;
}
