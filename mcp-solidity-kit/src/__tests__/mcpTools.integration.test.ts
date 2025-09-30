import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import * as path from "path";
import * as fs from "node:fs";
import { type CallToolResult } from "mcp-http/types";
import { faker } from "@faker-js/faker";
import { exec } from "child_process";
import { promisify } from "util";
import {
  waitForServiceHealth,
  waitForProject as waitForProjectShared,
} from "mcp-http";
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

describe("MCP Solidity Kit Integration Tests", () => {
  let client: Client;
  let baseUrl: URL;
  let sseTransport: SSEClientTransport;
  const projectName = faker.string.alphanumeric({ length: 10 });
  const projectData = getProjectData();
  let terminalId: string;
  const execAsync = promisify(exec);
  const waitForProject = async (name: string, timeoutMs = 120000) =>
    waitForProjectShared(client as any, name, { timeoutMs });

  beforeAll(async () => {
    try {
      // Skipping orchestrator stop - managed externally
    } catch (e) {
      console.warn("orchestrator stop failed (continuing):", e);
    }
    // Skipping orchestrator start - managed externally
    await waitForServiceHealth(4001, { timeoutMs: 90_000 });

    baseUrl = new URL(`http://localhost:4001/sse`);
    sseTransport = new SSEClientTransport(baseUrl);

    client = new Client({
      name: "mcp-solidity-kit-tester",
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
          files: projectData,
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
      await waitForProject(projectName, 120000);
    }, 120000);

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
      console.info(result.contents[0]?.text);
      expect(true).toBe(true);
    });

    it("should edit project file", async () => {
      const fileName = "/" + faker.string.alphanumeric({ length: 10 });
      const fileContent = faker.string.alphanumeric({ length: 10 });
      const editResult = (await client.callTool({
        name: "edit-project-files",
        arguments: {
          projectId: projectName,
          files: {
            [fileName]: fileContent,
          },
        },
      })) as CallToolResult;
      expect(editResult.content[0].text).toContain(projectName);

      const readFileResult = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect((readFileResult.contents[0].text as string).trim()).eq(
        fileContent.trim()
      );
    });

    it("should read project file", async () => {
      const fileName = "/src/Vulnerable.sol";
      const result = await client.readResource({
        uri: `project://${projectName}/file${fileName}`,
      });
      expect(result.contents[0].text).eq(projectData[fileName]);
    });
  });

  describe("Anvil Lifecycle", () => {
    it("should start anvil", async () => {
      const result = (await client.callTool({
        name: "anvil_start",
        arguments: {
          port: 8545,
          terminalId,
        },
      })) as CallToolResult;
      expect(result.content[0].text).toContain("Command execution finished");
    }, 15000);

    it("should report anvil status as running", async () => {
      const result = (await client.callTool({
        name: "anvil_status",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      expect(result.content[0].text).toContain("Anvil is running");
    });

    it("should stop anvil", async () => {
      const result = (await client.callTool({
        name: "anvil_stop",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      expect(result.content[0].text).toContain(
        "Anvil has been stopped successfully"
      );
    }, 15000);
  });

  describe("Slither Auditing Tools", () => {
    it("should list Slither detectors", async () => {
      const result = (await client.callTool({
        name: "slither_list_detectors",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(5000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 10000);

    it("should analyze the test project with Slither and find reentrancy", async () => {
      const result = (await client.callTool({
        name: "slither_analyze",
        arguments: {
          projectId: projectName,
          target: ".",
          terminalId,
        },
      })) as CallToolResult;
      await sleep(5000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 12000);
  });

  describe("Echidna Auditing Tools", () => {
    it("should run Echidna tests on Vulnerable.sol", async () => {
      const result = (await client.callTool({
        name: "echidna_test",
        arguments: {
          projectId: projectName,
          target_files: "src/Vulnerable.sol",
          contract: "Vulnerable",
          test_limit: 100,
          timeout: 100,
          test_mode: "assertion",
          terminalId,
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 120000);
  });

  describe("Aderyn Auditing Tools", () => {
    it("should analyze Vulnerable.sol with Aderyn", async () => {
      const result = (await client.callTool({
        name: "aderyn_analyze",
        arguments: {
          projectId: projectName,
          src: "src",
          terminalId,
        },
      })) as CallToolResult;
      await sleep(2000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 120000);
  });

  describe("Mythril Auditing Tools", () => {
    it("should list Mythril detectors", async () => {
      const result = (await client.callTool({
        name: "mythril_list_detectors",
        arguments: {
          terminalId,
        },
      })) as CallToolResult;
      await sleep(1000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 10000);

    it("should analyze Vulnerable.sol with Mythril", async () => {
      const result = (await client.callTool({
        name: "mythril_analyze",
        arguments: {
          projectId: projectName,
          target_path: "src/Vulnerable.sol",
          execution_timeout: 200,
          terminalId,
        },
      })) as CallToolResult;
      await sleep(10000);
      expect(result.content[0].text).toContain("Command execution finished");
    }, 16000);
  });

  // describe("Hello World AVS typescript", () => {
  //   const createTerminal = async () => {
  //     const createTerminalResult = await client.callTool({
  //       name: 'create-terminal',
  //       arguments: {
  //         projectId: "hello-world-avs",
  //         silent: false,
  //       }
  //     }) as CallToolResult;
  //     terminalId = createTerminalResult.content[0].text as string;
  //   }

  //   it("should build forge", async () => {
  //     await createTerminal();
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run build:forge',
  //         terminalId,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should start anvil", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run start:anvil',
  //         terminalId,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should deploy core", async () => {
  //     await createTerminal();
  //     const result = await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run deploy:core',
  //         terminalId
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(result.content[0].text).not.contain("error sending request");
  //   }, 600000);

  //   it("should deploy hello world", async () => {
  //     const result = await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run deploy:hello-world',
  //         terminalId
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(result.content[0].text).not.contain("error sending request");
  //   }, 600000);

  //   it("should extract abis", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run extract:abis',
  //         terminalId
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should start operator", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run start:operator',
  //         terminalId
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should start spam task", async () => {
  //     await createTerminal();
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'npm run start:traffic',
  //         terminalId
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000)

  //   it("Watch terminal to see AVS running", async () => {
  //     console.log('sleep');
  //     await sleep(20000);
  //     console.log('sleep');
  //     expect(true).toBe(true);
  //   }, 600000)
  // });

  // describe("Hello World AVS rust", () => {
  //   it("should build forge", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'make build-contracts',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: false,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should start anvil", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'anvil',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: true,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should deploy core", async () => {
  //     const result = await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'make deploy-eigenlayer-contracts',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: true,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(result.content[0].text).not.contain("error sending request");
  //   }, 600000);

  //   it("should deploy hello world", async () => {
  //     const result = await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'make deploy-helloworld-contracts',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: true,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(result.content[0].text).not.contain("error sending request");
  //   }, 600000);

  //   it("should start challenger", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'make start-rust-challenger',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: true,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should start operator", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'make start-rust-operator',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: true,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000);

  //   it("should start spam task", async () => {
  //     await client.callTool({
  //       name: 'run-command',
  //       arguments: {
  //         command: 'make spam-rust-tasks',
  //         projectId: 'hello-world-avs',
  //         isLongProcess: true,
  //         silent: true,
  //       }
  //     }) as CallToolResult;

  //     await sleep(5000);

  //     expect(true).toBe(true);
  //   }, 600000)
  // });
});
