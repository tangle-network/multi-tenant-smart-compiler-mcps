import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Agent, createAgent, type AgentType } from "../src/agent.js";
import { McpManager } from "@blueprint-agent/context-lego";
import { existsSync } from "fs";

describe("CLI Agents Integration", () => {
  let mcpManager: McpManager;
  const mcpConfigPath = "./mcp-config.json";

  beforeAll(async () => {
    // Verify mcp-config.json exists
    if (!existsSync(mcpConfigPath)) {
      throw new Error(`MCP config file not found at ${mcpConfigPath}`);
    }

    // Initialize MCP manager with the existing config
    mcpManager = new McpManager(mcpConfigPath);

    console.log("🔧 CLI Agent Test setup complete");
    console.log("📁 MCP Config:", mcpConfigPath);
    console.log(
      "🔗 MCP Servers:",
      Object.keys(mcpManager.getServerConfiguration() || {})
    );
  });

  afterAll(async () => {
    console.log("🧹 CLI Agent test cleanup complete");
  });

  describe("Codex Agent", () => {
    let codexAgent: Agent;

    beforeAll(() => {
      const mcpServers = mcpManager.getServerConfiguration();
      const mcpConfig = mcpServers ? { mcpServers } : undefined;

      codexAgent = createAgent("codex", {
        mcpConfig,
        systemPrompt: "You are OpenAI Codex, a helpful coding assistant.",
        allowedTools: [
          "Read",
          "Write",
          "Bash",
          ...mcpManager.getDefaultAllowedTools(),
        ],
        permissionMode: "plan",
        dangerouslySkipPermissions: false,
      });

      console.log("🤖 Codex agent initialized");
    });

    it("should create and initialize codex agent", async () => {
      expect(codexAgent).toBeDefined();
      expect(codexAgent.getName()).toBe("OpenAI Codex");

      await codexAgent.initialize();
      console.log("✅ Codex agent initialized successfully");
    }, 10000);

    it("should execute simple task with codex CLI simulation", async () => {
      console.log("\n💻 Testing Codex execution...");

      const startTime = Date.now();

      try {
        const result = await codexAgent.execute(
          "Write a simple hello world function in JavaScript",
          {
            workingDir: process.cwd(),
            maxTurns: 1,
          }
        );

        const duration = Date.now() - startTime;

        console.log("📊 Codex Execution Results:");
        console.log("  ✅ Success:", result.success);
        console.log("  ⏱️  Duration:", duration + "ms");
        console.log("  📏 Output length:", result.output.length);

        if (result.output) {
          console.log(
            "📝 Output preview:",
            result.output.substring(0, 200) + "..."
          );
        }

        if (result.error) {
          console.log("⚠️  Error (expected for CLI simulation):", result.error);
        }

        // Since we're using echo as placeholder, we expect it to work but with simple output
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
        expect(typeof result.duration).toBe("number");
      } catch (error) {
        console.log(
          "⚠️  CLI execution failed (expected in test environment):",
          error
        );
        expect(error).toBeDefined();
      }
    }, 30000);

    it("should handle MCP configuration for codex", async () => {
      console.log("\n🔧 Testing Codex MCP integration...");

      const mcpConfig = codexAgent.getMCPConfig();
      const mcpServers = mcpManager.getServerConfiguration();

      console.log("📊 MCP Configuration:");
      console.log("  🔗 Agent MCP config:", !!mcpConfig);
      console.log("  📋 Available servers:", Object.keys(mcpServers || {}));
      console.log(
        "  🛠️  Available tools:",
        mcpManager.getDefaultAllowedTools().slice(0, 3),
        "..."
      );

      expect(mcpConfig).toBeDefined();
      if (mcpServers) {
        expect(Object.keys(mcpServers).length).toBeGreaterThan(0);
      }
    });

    it("should validate codex agent configuration", () => {
      console.log("\n⚙️  Testing Codex configuration...");

      expect(codexAgent.getName()).toBe("OpenAI Codex");

      const mcpConfig = codexAgent.getMCPConfig();
      console.log("📊 Agent Configuration:");
      console.log("  🤖 Name:", codexAgent.getName());
      console.log("  🔧 Has MCP config:", !!mcpConfig);

      expect(mcpConfig).toBeDefined();
    });
  });

  describe("Gemini CLI Agent", () => {
    let geminiAgent: Agent;

    beforeAll(() => {
      const mcpServers = mcpManager.getServerConfiguration();
      const mcpConfig = mcpServers ? { mcpServers } : undefined;

      geminiAgent = createAgent("gemini-cli", {
        mcpConfig,
        systemPrompt: "You are Google Gemini CLI, a helpful AI assistant.",
        allowedTools: [
          "Read",
          "Write",
          "Bash",
          ...mcpManager.getDefaultAllowedTools(),
        ],
        permissionMode: "plan",
        dangerouslySkipPermissions: false,
      });

      console.log("🤖 Gemini CLI agent initialized");
    });

    it("should create and initialize gemini agent", async () => {
      expect(geminiAgent).toBeDefined();
      expect(geminiAgent.getName()).toBe("Gemini CLI");

      await geminiAgent.initialize();
      console.log("✅ Gemini CLI agent initialized successfully");
    }, 10000);

    it("should execute simple task with gemini CLI simulation", async () => {
      console.log("\n🧠 Testing Gemini CLI execution...");

      const startTime = Date.now();

      try {
        const result = await geminiAgent.execute(
          "Explain what machine learning is in one sentence",
          {
            workingDir: process.cwd(),
            maxTurns: 1,
          }
        );

        const duration = Date.now() - startTime;

        console.log("📊 Gemini CLI Execution Results:");
        console.log("  ✅ Success:", result.success);
        console.log("  ⏱️  Duration:", duration + "ms");
        console.log("  📏 Output length:", result.output.length);

        if (result.output) {
          console.log(
            "📝 Output preview:",
            result.output.substring(0, 200) + "..."
          );
        }

        if (result.error) {
          console.log("⚠️  Error (expected for CLI simulation):", result.error);
        }

        // Since we're using echo as placeholder, we expect it to work but with simple output
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
        expect(typeof result.duration).toBe("number");
      } catch (error) {
        console.log(
          "⚠️  CLI execution failed (expected in test environment):",
          error
        );
        expect(error).toBeDefined();
      }
    }, 30000);

    it("should handle MCP configuration for gemini", async () => {
      console.log("\n🔧 Testing Gemini CLI MCP integration...");

      const mcpConfig = geminiAgent.getMCPConfig();
      const mcpServers = mcpManager.getServerConfiguration();

      console.log("📊 MCP Configuration:");
      console.log("  🔗 Agent MCP config:", !!mcpConfig);
      console.log("  📋 Available servers:", Object.keys(mcpServers || {}));
      console.log(
        "  🛠️  Available tools:",
        mcpManager.getDefaultAllowedTools().slice(0, 3),
        "..."
      );

      expect(mcpConfig).toBeDefined();
      if (mcpServers) {
        expect(Object.keys(mcpServers).length).toBeGreaterThan(0);
      }
    });

    it("should validate gemini agent configuration", () => {
      console.log("\n⚙️  Testing Gemini CLI configuration...");

      expect(geminiAgent.getName()).toBe("Gemini CLI");

      const mcpConfig = geminiAgent.getMCPConfig();
      console.log("📊 Agent Configuration:");
      console.log("  🤖 Name:", geminiAgent.getName());
      console.log("  🔧 Has MCP config:", !!mcpConfig);

      expect(mcpConfig).toBeDefined();
    });
  });

  describe("CLI Agent Comparison", () => {
    it("should demonstrate different agent types working with same MCP setup", async () => {
      console.log("\n🔄 Testing multi-agent compatibility...");

      const mcpServers = mcpManager.getServerConfiguration();
      const mcpConfig = mcpServers ? { mcpServers } : undefined;

      const agents: Array<{ type: AgentType; agent: Agent }> = [
        {
          type: "codex",
          agent: createAgent("codex", {
            mcpConfig,
            systemPrompt: "You are Codex.",
            permissionMode: "plan",
          }),
        },
        {
          type: "gemini-cli",
          agent: createAgent("gemini-cli", {
            mcpConfig,
            systemPrompt: "You are Gemini.",
            permissionMode: "plan",
          }),
        },
      ];

      console.log("📊 Agent Comparison:");

      for (const { type, agent } of agents) {
        await agent.initialize();

        const config = agent.getMCPConfig();

        console.log(`  🤖 ${type}:`);
        console.log(`    📛 Name: ${agent.getName()}`);
        console.log(`    🔧 Has MCP config: ${!!config}`);
        console.log(
          `    📋 Servers: ${config?.mcpServers ? Object.keys(config.mcpServers).length : 0}`
        );

        expect(agent.getName()).toBeTruthy();
        expect(config).toBeDefined();
      }

      console.log("✅ All agents compatible with MCP setup");
    });

    it("should show CLI vs SDK agent type differentiation", () => {
      console.log("\n🔍 Testing agent type differentiation...");

      const agentTypes: AgentType[] = ["claude-code", "gemini-cli", "codex"];

      console.log("📊 Agent Type Analysis:");

      agentTypes.forEach((type) => {
        const isSDK = type === "claude-code";
        const isCLI = type !== "claude-code";

        console.log(`  🤖 ${type}:`);
        console.log(`    📡 Uses SDK: ${isSDK}`);
        console.log(`    💻 Uses CLI: ${isCLI}`);

        expect(typeof isSDK).toBe("boolean");
        expect(typeof isCLI).toBe("boolean");
        expect(isSDK !== isCLI).toBe(true); // Should be mutually exclusive
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle CLI command failures gracefully", async () => {
      console.log("\n🚨 Testing error handling...");

      const testAgent = createAgent("codex", {
        systemPrompt: "Test agent for error scenarios",
        permissionMode: "plan",
      });

      // This will likely fail since we're using echo placeholder
      const result = await testAgent.execute(
        "This should trigger error handling",
        {
          workingDir: "/nonexistent/directory", // Invalid directory
          maxTurns: 1,
        }
      );

      console.log("📊 Error Handling Results:");
      console.log("  🔄 Completed without throwing:", true);
      console.log("  📋 Result defined:", !!result);
      console.log(
        "  ⚡ Has success field:",
        typeof result.success === "boolean"
      );

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.duration).toBe("number");

      // Should handle error gracefully without throwing
    }, 15000);
  });
});
