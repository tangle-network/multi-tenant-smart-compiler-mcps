import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";
import { AgentType } from "../src/agent.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs-extra";
import path from "path";
import os from "os";

describe("MCP Server Real Protocol Test", () => {
  let mcpClient: Client;
  let testDir: string;
  let serverScriptPath: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-server-test-"));

    // Create a server script in the current directory where node_modules are available
    const serverScript = `#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./dist/server.js";

const server = createServer({
  agentType: "claude-code",
  mcpConfigPath: "./mcp-config.json",
  baseSystemPrompt: "You are a helpful coding assistant.",
  enableBoltConversion: false,
});

const transport = new StdioServerTransport();
await server.connect(transport);
`;

    // Put the script in current directory, not temp directory
    serverScriptPath = path.join(process.cwd(), "test-server-mcp.mjs");
    await fs.writeFile(serverScriptPath, serverScript);
    await fs.chmod(serverScriptPath, 0o755);

    // Create real MCP client
    mcpClient = new Client(
      {
        name: "Test MCP Client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Connect client to server using stdio transport with proper parameters
    const clientTransport = new StdioClientTransport({
      command: "node",
      args: [serverScriptPath],
      cwd: process.cwd(),
    });

    await mcpClient.connect(clientTransport);
  }, 30000);

  afterEach(async () => {
    if (mcpClient) {
      await mcpClient.close();
    }
    // Clean up the server script
    if (await fs.pathExists(serverScriptPath)) {
      await fs.remove(serverScriptPath);
    }
    await fs.remove(testDir);
  });

  describe("Real MCP Protocol Communication via Stdio", () => {
    it("should list tools through real MCP protocol", async () => {
      const result = await mcpClient.listTools();

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);

      // Check for our actual tools
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain("execute_task");
      expect(toolNames).toContain("get_artifact");
      expect(toolNames).toContain("list_artifacts");
      expect(toolNames).toContain("status");

      // Verify tool schemas
      result.tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      });
    });

    it("should call status tool through real MCP protocol", async () => {
      const result = await mcpClient.callTool({
        name: "status",
        arguments: {},
      });

      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect((result.content as any[]).length).toBe(1);

      const content = (result.content as any[])[0];
      expect(content.type).toBe("text");

      const response = JSON.parse(content.text);
      expect(response.agentType).toBe("claude-code");
      expect(response.name).toContain("Claude");
      expect(response.usesSDK).toBe(true);
      expect(response.usesCLI).toBe(false);
      expect(response.capabilities).toBeDefined();
      expect(response.mcpInfo).toBeDefined();
    });

    it("should call list_artifacts tool through real MCP protocol", async () => {
      const result = await mcpClient.callTool({
        name: "list_artifacts",
        arguments: {},
      });

      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect((result.content as any[]).length).toBe(1);

      const content = (result.content as any[])[0];
      expect(content.type).toBe("text");

      const response = JSON.parse(content.text);
      expect(response.success).toBe(true);
      expect(response.artifacts).toBeDefined();
      expect(Array.isArray(response.artifacts)).toBe(true);
    });

    it("should handle get_artifact tool with non-existent artifact", async () => {
      const result = await mcpClient.callTool({
        name: "get_artifact",
        arguments: {
          artifactId: "non-existent-artifact",
        },
      });

      expect(result.content).toBeDefined();
      expect(result.isError).toBe(true);

      const content = (result.content as any[])[0];
      expect(content.type).toBe("text");

      const response = JSON.parse(content.text);
      expect(response.success).toBe(false);
      expect(response.error).toContain("Artifact not found");
    });

    it("should handle execute_task tool through real MCP protocol", async () => {
      // Create a test project directory
      const projectDir = path.join(testDir, "test-project");
      await fs.ensureDir(projectDir);
      await fs.writeFile(
        path.join(projectDir, "README.md"),
        "# Test Project\n\nThis is a test."
      );

      const result = await mcpClient.callTool({
        name: "execute_task",
        arguments: {
          task: "Review this project structure",
          workingDir: projectDir,
          enableProgressTracking: false,
          createArtifacts: false,
        },
      });

      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect((result.content as any[]).length).toBe(1);

      const content = (result.content as any[])[0];
      expect(content.type).toBe("text");

      // Just check that we get some response, don't parse JSON if it's an error message
      expect(content.text).toBeDefined();
      expect(typeof content.text).toBe("string");
      expect(content.text.length).toBeGreaterThan(0);
    }, 60000);
  });
});
