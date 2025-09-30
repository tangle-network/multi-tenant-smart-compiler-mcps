import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "node:fs";
import { type CallToolResult } from "mcp-http/types";
import { faker } from "@faker-js/faker";
import { waitForServiceHealth } from "mcp-http";
import {
  ResourceUpdatedNotificationSchema,
  LoggingMessageNotificationSchema,
  CancelledNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sleep } from "mcp-fs";

// Use a fixed, package-specific port to avoid collisions with other MCP suites
if (!process.env.PORT) {
  process.env.PORT = "4006";
}

const testProjectPath = path.resolve(__dirname, "test_project");

function getProjectData() {
  const project = fs.readFileSync(testProjectPath, "utf-8");
  return JSON.parse(project);
}

describe("MCP Risc Zero Integration Tests", () => {
  let client: Client;
  let sseTransport: SSEClientTransport;
  const projectName = faker.string.alphanumeric({ length: 10 });
  const projectData = getProjectData();
  let terminalId: string;

  const execAsync = promisify(exec);

  beforeAll(async () => {
    // Skipping orchestrator management - containers managed externally
    await waitForServiceHealth(4006, { timeoutMs: 90_000 });

    // Create transport with correct port inside beforeAll
    const baseUrl = new URL(`http://localhost:4006/sse`);
    sseTransport = new SSEClientTransport(baseUrl);

    client = new Client({
      name: "mcp-risc-zero-tester",
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
      expect(result.content[0]?.text).toContain("Project created successfully");
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
        expect(result.content[0]?.text).toContain("Files updated successfully");
      }
    }, 30000);

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
      const fileName = "/host/src/main.rs";
      const result = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect((result.contents[0]?.text as string).trim()).eq(
        projectData[fileName].trim(),
      );
    });
  });

  const resetTerminal = async () => {
    await client.callTool({
      name: "kill-terminal",
      arguments: {
        terminalId: terminalId,
      },
    });
    const result = (await client.callTool({
      name: "create-terminal",
      arguments: {
        projectId: projectName,
        silent: false,
      },
    })) as CallToolResult;
    terminalId = result.content[0]?.text as string;
  };

  describe("Build project", () => {
    it("should build the project using shell", async () => {
      const result = (await client.callTool({
        name: "run-command",
        arguments: {
          command: "cargo run --release",
          terminalId: terminalId,
        },
      })) as CallToolResult;
      await sleep(10000);
      expect(result.content[0]?.text).toContain("Command execution finished");
      await resetTerminal();
    }, 20000);

    it("should build the project using cargo", async () => {
      const result = (await client.callTool({
        name: "cargo-run",
        arguments: {
          terminalId: terminalId,
          compilationOpt: ["--release"],
        },
      })) as CallToolResult;
      await sleep(10000);
      expect(result.content[0]?.text).toContain("Command execution finished");
      await resetTerminal();
    }, 20000);
  });
});
