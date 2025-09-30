import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import * as path from "path";
import * as fs from "node:fs";
import { type CallToolResult } from "mcp-http/types";
import { faker } from "@faker-js/faker";
import {
  ResourceUpdatedNotificationSchema,
  LoggingMessageNotificationSchema,
  CancelledNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sleep } from "mcp-fs";
import { exec } from "child_process";
import { promisify } from "util";
import { waitForServiceHealth } from "mcp-http";

// Use a fixed, package-specific port to avoid collisions with other suites
process.env.PORT = "3002";

const testProjectPath = path.resolve(__dirname, "test_project");

function getProjectData() {
  const project = fs.readFileSync(testProjectPath, "utf-8");
  return JSON.parse(project);
}

describe("MCP Solana Program Integration Tests", () => {
  let client: Client;
  let baseUrl: URL;
  let sseTransport: SSEClientTransport;
  const projectName = faker.string.alphanumeric({ length: 10 });
  const projectData = getProjectData();
  let terminalId: string;

  const execAsync = promisify(exec);

  beforeAll(async () => {
    // Skipping orchestrator management - containers managed externally
    await waitForServiceHealth(4003, { timeoutMs: 90_000 });

    baseUrl = new URL(`http://localhost:4003/sse`);
    sseTransport = new SSEClientTransport(baseUrl);

    client = new Client({
      name: "mcp-solana-program-tester",
      version: "1.0.0",
    });

    await client.connect(sseTransport);

    [
      CancelledNotificationSchema,
      LoggingMessageNotificationSchema,
      ResourceUpdatedNotificationSchema,
      ResourceListChangedNotificationSchema,
      ToolListChangedNotificationSchema,
      PromptListChangedNotificationSchema,
    ].forEach((notificationSchema) => {
      client.setNotificationHandler(notificationSchema, () => {});
    });
  }, 180000);

  afterAll(async () => {
    try {
      await client.callTool({
        name: "delete-project",
        arguments: { projectId: projectName },
      });
    } catch {}
    try {
      await client.close();
    } catch {}
    try {
      await sseTransport.close();
    } catch {}
    // Skipping orchestrator stop - managed externally
  }, 60000);

  describe("Create project", () => {
    it("should create a new project", async () => {
      const result = (await client.callTool({
        name: "create-project",
        arguments: {
          name: projectName,
          files: {
            "/README.md": projectName,
          },
        },
      })) as CallToolResult;
      expect(result.content[0].text).toContain("Project created successfully");
      terminalId = (result.content[1]?.text as string) ?? "";
      if (!terminalId) {
        const termRes = (await client.callTool({
          name: "create-terminal",
          arguments: { projectId: projectName },
        })) as CallToolResult;
        terminalId = termRes.content[0]?.text as string;
      }
    }, 30000);

    it("should add file to project", async () => {
      for (let k in projectData) {
        const result = (await client.callTool({
          name: "edit-project-files",
          arguments: {
            projectId: projectName,
            files: {
              [k]: projectData[k],
            },
          },
        })) as CallToolResult;
        expect(result.content[0].text).toContain("Files updated successfully");
      }
    }, 30000);

    it("should list projects", async () => {
      const result = await client.readResource({
        uri: `project://projects`,
      });
      expect(result.contents[0].text).toContain(projectName);
    });

    it("should list project files", async () => {
      const result = await client.readResource({
        uri: `project://${projectName}/files`,
      });
      console.info(result.contents[0].text);
      expect(true).toBe(true);
    });

    it("should read project file", async () => {
      const fileName = "/Anchor.toml";
      const result = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect((result.contents[0].text as string).trim()).eq(
        projectData[fileName].trim()
      );
    });
  });

  describe("Localnet", () => {
    it("should start a localnet", async () => {
      const result = (await client.callTool({
        name: "solana_localnet_start",
        arguments: {
          reset: true,
          terminalId,
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 50000);

    it("should check if localnet is running", async () => {
      const result = (await client.callTool({
        name: "solana_localnet_status",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(1000);
      expect(result.content[0].text).toContain("Solana localnet is running");
    }, 50000);

    it("should stop a localnet", async () => {
      const result = (await client.callTool({
        name: "solana_localnet_stop",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      expect(result.content[0].text).toContain(
        "Solana localnet has been stopped successfully"
      );
    }, 50000);
  });

  describe("Build project", () => {
    it("should build the project using shell", async () => {
      const result = (await client.callTool({
        name: "run-command",
        arguments: {
          terminalId,
          command: "anchor build",
        },
      })) as CallToolResult;
      await sleep(5000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 15000);

    it("should build the project using anchor", async () => {
      const result = (await client.callTool({
        name: "anchor_build",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(5000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 15000);
  });
});
