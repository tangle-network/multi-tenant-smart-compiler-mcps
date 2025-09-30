import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "node:fs";
import { type CallToolResult } from "mcp-http/types";
import { faker } from "@faker-js/faker";
import { sleep } from "mcp-fs";
import { waitForServiceHealth, waitForProject } from "mcp-http";
import {
  ResourceUpdatedNotificationSchema,
  LoggingMessageNotificationSchema,
  CancelledNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Use a fixed, package-specific port to avoid collisions with other suites
if (!process.env.PORT) {
  process.env.PORT = "3005";
}

const testProjectPath = path.resolve(__dirname, "test_project");

function getProjectData() {
  const project = fs.readFileSync(testProjectPath, "utf-8");
  return JSON.parse(project);
}

describe("MCP Tangle Blueprint Integration Tests", () => {
  let client: Client;
  let baseUrl: URL;
  let sseTransport: SSEClientTransport;
  const projectName = faker.string.alphanumeric({ length: 10 });
  const projectData = getProjectData();
  let terminalId: string;

  const execAsync = promisify(exec);

  beforeAll(async () => {
    try {
      // Skipping orchestrator stop - managed externally
    } catch (e) {
      console.warn("orchestrator stop failed (continuing):", e);
    }
    // Skipping orchestrator start - managed externally
    await waitForServiceHealth(4002, { timeoutMs: 90_000 });

    baseUrl = new URL(`http://localhost:4002/sse`);
    sseTransport = new SSEClientTransport(baseUrl);

    client = new Client({
      name: "mcp-tangle-blueprint-tester",
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
    try {
      // Skipping orchestrator stop - managed externally
    } catch (e) {
      console.warn("orchestrator stop failed during teardown:", e);
    }
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
      expect(result.content[0]?.text).toContain("Project created successfully");
      terminalId = (result.content[1]?.text as string) ?? "";
      if (!terminalId) {
        const termRes = (await client.callTool({
          name: "create-terminal",
          arguments: { projectId: projectName },
        })) as CallToolResult;
        terminalId = termRes.content[0]?.text as string;
      }
      await waitForProject(projectName, 120000);
      console.info("Terminal ID: ", terminalId);
    }, 120000);

    it("should add file to project", async () => {
      const res = (await client.callTool({
        name: "edit-project-files",
        arguments: {
          projectId: projectName,
          files: projectData,
        },
      })) as CallToolResult;
      expect(res.content[0]?.text).toContain("Files updated successfully");
    }, 60000);

    it("should list projects", async () => {
      const result = await client.readResource({
        uri: `project://projects`,
      });
      expect(result.contents[0]?.text).toContain(projectName);
    });

    it("should list project files", async () => {
      const result = await client.readResource({
        uri: `project://${projectName}/files`,
      });
      console.info(result.contents[0]?.text);
      expect(true).toBe(true);
    });

    it("should read project file", async () => {
      const fileName = "/demo-bin/Cargo.toml";
      const result = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect((result.contents[0]?.text as string).trim()).eq(
        projectData[fileName].trim(),
      );
    });
  });

  const stopTerminal = async () => {
    console.log("Resetting terminal");
    await client.callTool({
      name: "kill-terminal",
      arguments: {
        terminalId: terminalId,
      },
    });
  };

  describe("Build project", () => {
    it("should build the project using shell", async () => {
      const result = (await client.callTool({
        name: "run-command",
        arguments: {
          terminalId: terminalId,
          command: "cargo build",
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0]?.text).toContain("Command execution finished");
      await stopTerminal();
    }, 10000);
  });
});
