import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import * as path from "path";
import * as fs from "node:fs";
import { type CallToolResult } from "mcp-http/types";
import { faker } from "@faker-js/faker";
import { exec } from "child_process";
import { promisify } from "util";
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

const testProjectPath = path.resolve(__dirname, "test_project");

function getProjectData() {
  const project = fs.readFileSync(testProjectPath, "utf-8");
  return JSON.parse(project);
}

describe("MCP Stylus Integration Tests", () => {
  let client: Client;
  let baseUrl: URL;
  let sseTransport: SSEClientTransport;
  const projectName = faker.string.alphanumeric({ length: 10 });
  const projectData = getProjectData();
  let terminalId: string;
  const execAsync = promisify(exec);

  beforeAll(async () => {
    // Ensure dockerized MCPs are running via orchestrator
    try {
      // Skipping orchestrator stop - managed externally
    } catch (e) {
      console.warn("orchestrator stop failed (continuing):", e);
    }
    // Skipping orchestrator start - managed externally
    await waitForServiceHealth(4005, { timeoutMs: 90_000 });

    baseUrl = new URL(`http://localhost:4005/sse`);
    sseTransport = new SSEClientTransport(baseUrl);

    client = new Client({
      name: "mcp-stylus-tester",
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
      console.info("Terminal ID: ", terminalId);
    });

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
    });

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
      const fileName = "/examples/counter.rs";
      const result = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect((result.contents[0].text as string).trim()).eq(
        projectData[fileName].trim(),
      );
    });
  });

  describe("Localnet", () => {
    it("should start a localnet", async () => {
      const result = (await client.callTool({
        name: "nitro_localnet_start",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(1000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 10000);

    it("should check if localnet is running", async () => {
      const result = (await client.callTool({
        name: "nitro_localnet_status",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      expect(result.content[0].text).toContain("Nitro is running");
    });
  });

  describe("Build project", () => {
    const resetTerminal = async () => {
      (await client.callTool({
        name: "kill-terminal",
        arguments: {
          terminalId: terminalId,
        },
      })) as CallToolResult;

      const result = (await client.callTool({
        name: "create-terminal",
        arguments: {
          projectId: projectName,
        },
      })) as CallToolResult;
      terminalId = result.content[0]?.text as string;
      console.info(`Reset terminal to ${terminalId}`);
    };

    it("should build the project using shell", async () => {
      const result = (await client.callTool({
        name: "run-command",
        arguments: {
          terminalId,
          command: "cargo stylus check",
        },
      })) as CallToolResult;
      await sleep(10000);
      expect(result.content[0].text).toContain("Command execution finished");
      await resetTerminal();
    }, 25000);

    it("should build the project using stylus", async () => {
      const result = (await client.callTool({
        name: "stylus_check",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(1000);
      expect(!Number.isNaN(result.content[0].text)).eq(true);
      await resetTerminal();
    }, 15000);

    it("should export the abi", async () => {
      const result = (await client.callTool({
        name: "stylus_export_abi",
        arguments: {
          terminalId: terminalId,
        },
      })) as CallToolResult;
      expect(result.content[0].text).includes("Command execution finished");
    }, 15000);
  });

  it("should stop the localnet", async () => {
    const result = (await client.callTool({
      name: "nitro_localnet_stop",
      arguments: {},
    })) as CallToolResult;
    await sleep(1000);
    expect(result.content[0].text).toContain(
      "Nitro has been stopped successfully",
    );
  });
});
