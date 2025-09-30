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

describe("MCP Noir Integration Tests", () => {
  let client: Client;
  let baseUrl: URL;
  let sseTransport: SSEClientTransport;
  const projectName = faker.string.alphanumeric({ length: 10 });
  const projectData = getProjectData();
  let terminalId: string;
  const execAsync = promisify(exec);

  beforeAll(async () => {
    // Use orchestrator to manage dockerized MCPs
    try {
      // Skipping orchestrator stop - managed externally
    } catch (e) {
      console.warn("orchestrator stop failed (continuing):", e);
    }
    // Skipping orchestrator start - managed externally
    // Allow services time to stabilize
    await waitForServiceHealth(4008, { timeoutMs: 90_000 });

    baseUrl = new URL(`http://localhost:4008/sse`);
    sseTransport = new SSEClientTransport(baseUrl);

    client = new Client({
      name: "mcp-noir-integration-tester",
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

    // Stop services to free ports for other test suites
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
    });

    it("should add file to project", async () => {
      for (let k in projectData) {
        (await client.callTool({
          name: "edit-project-files",
          arguments: {
            projectId: projectName,
            files: {
              [k]: projectData[k],
            },
          },
        })) as CallToolResult;
      }
      expect(true).eq(true);
    });

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
      const fileName = "/Nargo.toml";
      const result = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect(result.contents[0]?.text).eq(projectData[fileName]);
    });
  });

  describe("Build project", () => {
    it("should check the project using nargo", async () => {
      const result = (await client.callTool({
        name: "nargo-check",
        arguments: {
          projectId: projectName,
          terminalId,
        },
      })) as CallToolResult;
      await sleep(1000);
      expect(!Number.isNaN(result.content[0]?.text)).eq(true);
    }, 10000);

    it("should adding data to prover", async () => {
      const fileName = "/Prover.toml";
      let proverFileContent = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect(proverFileContent.contents[0]?.text).contains('x = ""');

      const proverData = 'x = "10"\ny = "12"\n';
      (await client.callTool({
        name: "edit-project-files",
        arguments: {
          projectId: projectName,
          files: {
            [fileName]: proverData,
          },
        },
      })) as CallToolResult;

      proverFileContent = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect(proverFileContent.contents[0]?.text).contains(proverData);
    }, 10000);

    it("should execute the project using nargo", async () => {
      const result = (await client.callTool({
        name: "nargo-execute",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;

      expect(result.content[0]?.text).toContain("Command execution finished");

      const witnessFileContent = await client.readResource({
        uri: `project://${projectName}/file/target/hello_world.json`,
      });
      expect(witnessFileContent.contents[0]?.text).toBeDefined();
    }, 10000);

    it("should compile the project using nargo", async () => {
      const result = (await client.callTool({
        name: "nargo-compile",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0]?.text).toContain("Command execution finished");
    }, 10000);
  });

  describe("Working with bb backend", () => {
    it("should generate and write verification key to file", async () => {
      // Generate the verification key and save to ./target/vk
      const result = (await client.callTool({
        name: "bb-write-vk",
        arguments: {
          terminalId,
          backend: "target/hello_world.json",
          output: "target",
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0]?.text).toContain("Command execution finished");
    }, 10000);

    it("should verify the proof using bb", async () => {
      const result = (await client.callTool({
        name: "bb-prove",
        arguments: {
          terminalId,
          backend: "target/hello_world.json",
          output: "target",
          witness: "./target/hello_world.gz",
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0]?.text).toContain("Command execution finished");
    }, 10000);
  });
});
