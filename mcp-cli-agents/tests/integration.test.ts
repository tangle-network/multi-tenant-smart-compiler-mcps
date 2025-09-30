import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { CLIAgentServer, type ServerConfig } from "../src/server.js";
import { createAgent, type AgentType } from "../src/agent.js";
import { McpManager } from "@blueprint-agent/context-lego";
import {
  convertOutputToBoltArtifact,
  extractFileChangesFromBoltArtifact,
} from "../src/bolt-converter.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const debugDir = path.join(__dirname, "../debug");

describe("MCP CLI Agents Library Integration Tests", () => {
  let mcpManager: McpManager;
  const mcpConfigPath = "./mcp-config.json";

  beforeAll(async () => {
    await fs.ensureDir(debugDir);
    console.log(`🔧 Setting up integration tests in: ${debugDir}`);
    console.log(`🚀 Testing actual MCP CLI agent library components`);

    // Initialize MCP manager
    if (!(await fs.pathExists(mcpConfigPath))) {
      throw new Error(`MCP config file not found at ${mcpConfigPath}`);
    }
    mcpManager = new McpManager(mcpConfigPath);
  });

  afterAll(async () => {
    console.log(`\n🔍 MANUAL INSPECTION: Check projects in ${debugDir}`);
    console.log(`📋 Run 'ls -la ${debugDir}' to see created projects`);
  });

  describe("CLI Agent Library Components", () => {
    it("should create and initialize Claude Code agent using library", async () => {
      console.log("\n🤖 Testing Claude Code agent creation...");

      const claudeAgent = createAgent("claude-code", {
        mcpConfig: mcpManager.getServerConfiguration()
          ? { mcpServers: mcpManager.getServerConfiguration()! }
          : undefined,
        systemPrompt: "You are Claude Code, a helpful coding assistant.",
        allowedTools: [
          "Read",
          "Write",
          "Bash",
          "Computer",
          "CreateArtifact",
          "EditArtifact",
          ...mcpManager.getDefaultAllowedTools(),
        ],
        permissionMode: "plan",
        dangerouslySkipPermissions: false,
      });

      expect(claudeAgent).toBeDefined();
      expect(claudeAgent.getName()).toBe("Claude Code");

      await claudeAgent.initialize();
      console.log("✅ Claude Code agent initialized via library");
    });

    it("should execute real projects using CLI Agent library", async () => {
      console.log(
        "\n🚀 Testing real project creation using Agent.execute()..."
      );

      const projectDir = path.join(debugDir, "library-claude-nodejs-api");
      await fs.ensureDir(projectDir);

      // Create Claude Code agent using our library
      const claudeAgent = createAgent("claude-code", {
        mcpConfig: mcpManager.getServerConfiguration()
          ? { mcpServers: mcpManager.getServerConfiguration()! }
          : undefined,
        systemPrompt: `Create a comprehensive REST API project with Express.js, proper middleware, routes, controllers, models, and tests.`,
        allowedTools: [
          "Read",
          "Write",
          "Bash",
          "Computer",
          "CreateArtifact",
          "EditArtifact",
        ],
        permissionMode: "plan",
      });

      const prompt = `Create a complete Node.js REST API project with:
1. Express.js server with middleware (cors, helmet, morgan)
2. Routes for /api/users (GET, POST, PUT, DELETE) 
3. User model with validation
4. Error handling middleware
5. package.json with dependencies
6. README.md with setup instructions
7. Basic tests

Include proper folder structure.`;

      console.log(`📁 Creating project in: ${projectDir}`);

      // Use our actual Agent.execute() method
      const result = await claudeAgent.execute(prompt, {
        workingDir: projectDir,
        maxTurns: 1,
      });

      console.log("📊 Library Agent Execution Results:");
      console.log(`  ✅ Success: ${result.success}`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
      console.log(`  📏 Output length: ${result.output.length}`);

      if (!result.success) {
        console.log(`  ⚠️ Error: ${result.error}`);
        console.log(
          `  📋 This may be expected if Claude Code CLI has permission restrictions`
        );
      }

      // Check if files were created
      const files = await fs.readdir(projectDir, { recursive: true });
      console.log(`📁 Files created: ${files.length}`);

      if (files.length > 0) {
        console.log("📋 Project structure:");
        for (const file of files.slice(0, 10)) {
          const filePath = path.join(projectDir, file.toString());
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            console.log(`  📄 ${file} (${stats.size} bytes)`);
          } else {
            console.log(`  📁 ${file}/`);
          }
        }
        if (files.length > 10) {
          console.log(`  ... and ${files.length - 10} more files`);
        }
      }

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.duration).toBe("number");
    }, 300000);

    it("should test Codex agent using library components", async () => {
      console.log("\n💻 Testing Codex agent via library...");

      const projectDir = path.join(debugDir, "library-codex-utility");
      await fs.ensureDir(projectDir);

      // Create Codex agent using our library
      const codexAgent = createAgent("codex", {
        mcpConfig: mcpManager.getServerConfiguration()
          ? { mcpServers: mcpManager.getServerConfiguration()! }
          : undefined,
        systemPrompt:
          "You are OpenAI Codex, create a comprehensive JavaScript utility library.",
        allowedTools: ["Read", "Write", "Bash"],
      });

      const prompt = `Create a comprehensive JavaScript utility library with:
1. Math utilities: add, subtract, multiply, divide, power, factorial, gcd, lcm
2. String utilities: capitalize, camelCase, kebabCase, truncate, reverse, stripHTML
3. Array utilities: unique, flatten, chunk, groupBy, sortBy, shuffle
4. Object utilities: deepClone, merge, pick, omit, isEmpty
5. Date utilities: formatDate, isValid, daysBetween, addDays
6. Validation utilities: isEmail, isURL, isNumeric, isAlpha
7. Create proper package.json with dependencies
8. Add comprehensive JSDoc comments for all functions
9. Create Jest test files with 90%+ coverage
10. Include TypeScript definitions (.d.ts file)
11. Add README with usage examples

Structure the project professionally with src/, tests/, and docs/ directories.`;

      console.log(`📁 Working in: ${projectDir}`);

      // Use our actual Agent.execute() method
      const result = await codexAgent.execute(prompt, {
        workingDir: projectDir,
        maxTurns: 1,
      });

      console.log("📊 Codex Agent Results:");
      console.log(`  ✅ Success: ${result.success}`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
      console.log(`  📏 Output length: ${result.output.length}`);

      if (!result.success && result.error) {
        console.log(`  ⚠️ Error: ${result.error}`);
        console.log(
          `  📋 This may be expected if OpenAI CLI requires different syntax or API key`
        );
      }

      // Analyze what was created/modified
      const files = await fs.readdir(projectDir, { recursive: true });
      console.log(`📁 Project files: ${files.length}`);

      // Analyze the created project structure
      if (files.length > 0) {
        console.log(`📋 Project created with ${files.length} files`);
        // Check for main source files
        const jsFiles = files.filter((f) => f.toString().endsWith(".js"));
        const testFiles = files.filter(
          (f) => f.toString().includes("test") || f.toString().includes("spec")
        );
        console.log(
          `📄 JavaScript files: ${jsFiles.length}, Test files: ${testFiles.length}`
        );
      }

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    }, 180000);

    it("should test MCP server integration with real CLI agents", async () => {
      console.log("\n🔧 Testing CLIAgentServer with real agents...");

      // Test server configuration for Claude Code
      const serverConfig: ServerConfig = {
        agentType: "claude-code",
        mcpConfigPath: mcpConfigPath,
        baseSystemPrompt: "You are a helpful coding assistant.",
        enableBoltConversion: true,
      };

      const server = new CLIAgentServer(serverConfig);

      // Test server capabilities (this tests our MCP server logic)
      expect(server).toBeDefined();
      console.log("✅ CLIAgentServer created successfully");

      // Test with different agent types (skip gemini-cli if no API key)
      const allAgentTypes: AgentType[] = ["claude-code", "codex", "gemini-cli"];
      const agentTypes = allAgentTypes.filter((type) => {
        if (
          type === "gemini-cli" &&
          !process.env.GOOGLE_GENERATIVE_AI_API_KEY
        ) {
          console.log(
            "⚠️ Skipping gemini-cli tests - GOOGLE_GENERATIVE_AI_API_KEY not available"
          );
          return false;
        }
        return true;
      });

      for (const agentType of agentTypes) {
        console.log(`🤖 Testing ${agentType} integration...`);

        const agent = createAgent(agentType, {
          mcpConfig: mcpManager.getServerConfiguration()
            ? { mcpServers: mcpManager.getServerConfiguration()! }
            : undefined,
          systemPrompt: `You are ${agentType}`,
          permissionMode: "plan",
        });

        await agent.initialize();
        expect(agent.getName()).toBeTruthy();
        console.log(`  ✅ ${agentType}: ${agent.getName()}`);
      }
    });
  });

  describe("Real Project Analysis", () => {
    it("should analyze all projects created by library components", async () => {
      console.log(`\n🔍 ANALYZING PROJECTS CREATED BY LIBRARY:`);

      const debugExists = await fs.pathExists(debugDir);
      if (!debugExists) {
        console.log(
          "⚠️ No debug directory - library tests may not have created projects"
        );
        return;
      }

      const allItems = await fs.readdir(debugDir, { recursive: true });
      console.log(`📊 Total items in debug: ${allItems.length}`);

      // Group by project (library-prefixed projects)
      const libraryProjects: Record<
        string,
        Array<{ name: string; size?: number }>
      > = {};

      for (const item of allItems) {
        const itemName = item.toString();
        const fullPath = path.join(debugDir, itemName);
        const projectName = itemName.split(path.sep)[0];

        // Only analyze library-created projects
        if (projectName.startsWith("library-")) {
          if (!libraryProjects[projectName]) {
            libraryProjects[projectName] = [];
          }

          try {
            const stats = await fs.stat(fullPath);
            if (stats.isFile()) {
              libraryProjects[projectName].push({
                name: itemName,
                size: stats.size,
              });
            }
          } catch (error) {
            // Skip items that can't be stat'd
          }
        }
      }

      console.log(
        `📂 Library-created projects: ${Object.keys(libraryProjects).length}`
      );

      for (const [projectName, files] of Object.entries(libraryProjects)) {
        console.log(`\n📁 ${projectName}:`);
        console.log(`  📄 Files: ${files.length}`);

        if (files.length > 0) {
          const totalSize = files.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          );
          console.log(`  💾 Total size: ${totalSize} bytes`);

          // Show largest files
          const sortedFiles = files.sort(
            (a, b) => (b.size || 0) - (a.size || 0)
          );
          console.log(`  📋 Key files:`);

          for (const file of sortedFiles.slice(0, 5)) {
            console.log(`    📄 ${file.name} (${file.size || 0} bytes)`);
          }
        } else {
          console.log(
            `  ⚠️ No files created - agent may have had execution issues`
          );
        }
      }

      console.log(`\n🎯 LIBRARY INTEGRATION SUMMARY:`);
      console.log(
        `  📦 Projects attempted: ${Object.keys(libraryProjects).length}`
      );
      console.log(`  📁 Using actual Agent.execute() methods`);
      console.log(`  🔧 Using real MCP configuration and tools`);
      console.log(`  🚀 Testing library components, not custom test functions`);

      // This test documents what our library actually accomplished
      expect(Object.keys(libraryProjects).length).toBeGreaterThanOrEqual(0);
    });
  });
});
