import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createAgent, Agent } from "../src/agent.js";
import fs from "fs-extra";
import path from "path";
import { tmpdir } from "os";

// Mock the child_process spawn for CLI agents
vi.mock("child_process", () => ({
  spawn: vi.fn(() => ({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event, callback) => {
      if (event === "close") {
        setTimeout(() => callback(0), 10);
      }
    }),
  })),
}));

// Mock agent execution to return successful results
vi.mock("../src/agent.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/agent.js")>();

  class MockAgent extends original.Agent {
    async execute() {
      return {
        success: true,
        output: "Mock execution successful",
        error: "",
        duration: 100,
      };
    }
  }

  return {
    ...original,
    Agent: MockAgent,
    createAgent: (type: string) => new MockAgent(type),
  };
});

describe("Task Execution (Token-Efficient)", () => {
  let testDir: string;
  let workingDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), "task-test-"));
    workingDir = "workspace";
    const fullWorkingDir = path.join(testDir, workingDir);
    await fs.ensureDir(fullWorkingDir);
    await fs.ensureDir(workingDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    // Clean up the workspace directory from current working directory
    if (await fs.pathExists(workingDir)) {
      await fs.remove(workingDir);
    }
  });

  it("should execute task with progress tracking", async () => {
    const agent = createAgent("codex");
    await agent.initialize();

    // Create some mock output files
    await fs.writeFile(
      path.join(workingDir, "output.js"),
      "console.log('test');"
    );

    const progressEvents: any[] = [];
    agent.on("progress", (event) => progressEvents.push(event));

    const result = await agent.executeTask("Create a simple utility function", {
      workingDir,
      enableProgressTracking: true,
      createArtifacts: true,
    });

    expect(result.success).toBe(true);
    expect(result.summary).toContain("OpenAI Codex task completed");
    expect(result.duration).toBeGreaterThan(0);
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0]).toMatchObject({
      taskId: expect.stringContaining("task-"),
      stage: "initialization",
      message: "Setting up task environment",
    });
  });

  it("should generate token-efficient summary", async () => {
    const agent = createAgent("codex");
    await agent.initialize();

    // Create multiple files to test artifact creation
    await fs.writeFile(
      path.join(workingDir, "package.json"),
      '{"name": "test"}'
    );
    await fs.writeFile(
      path.join(workingDir, "index.js"),
      "module.exports = {};"
    );
    await fs.writeFile(path.join(workingDir, "README.md"), "# Test");

    const result = await agent.executeTask("Create utility library", {
      workingDir,
      createArtifacts: true,
    });

    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/\d+ files created \(\d+KB\)/);
    expect(result.details).toContain("Artifact created successfully");
    expect(result.integrationNotes).toContain("Files created:");
  });

  it("should create and reference artifacts", async () => {
    const agent = createAgent("claude-code");
    await agent.initialize();

    // Mock the execute method to avoid actual CLI calls
    agent.execute = vi.fn().mockResolvedValue({
      success: true,
      output: "Files created successfully",
      duration: 1000,
    });

    // Create test files
    await fs.writeFile(
      path.join(workingDir, "component.tsx"),
      "export const Test = () => <div />;"
    );
    await fs.writeFile(
      path.join(workingDir, "package.json"),
      '{"name": "react-app"}'
    );

    const result = await agent.executeTask("Create React component", {
      workingDir,
      createArtifacts: true,
    });

    expect(result.artifacts).toBeDefined();
    expect(result.artifacts?.agentType).toBe("claude-code");
    expect(result.artifacts?.filesCreated).toBeGreaterThan(0);
    expect(result.artifacts?.keyFiles).toContain("package.json");
  });

  it("should handle task failures gracefully", async () => {
    const agent = createAgent("codex");
    await agent.initialize();

    // Mock a failing execution
    const originalExecute = agent.execute;
    agent.execute = vi.fn().mockResolvedValue({
      success: false,
      output: "Error output",
      error: "Command failed",
      duration: 100,
    });

    const result = await agent.executeTask("Failing task", {
      workingDir,
      enableProgressTracking: true,
    });

    expect(result.success).toBe(false);
    expect(result.summary).toContain("Task failed");
    expect(result.error).toBe("Command failed");
    expect(result.artifacts).toBeUndefined();
  });

  it("should work without progress tracking", async () => {
    const agent = createAgent("codex");
    await agent.initialize();

    const result = await agent.executeTask("Simple task", {
      workingDir,
      enableProgressTracking: false,
      createArtifacts: false,
    });

    expect(result.success).toBe(true);
    expect(result.summary).toContain("Generated");
    expect(result.artifacts).toBeUndefined();
  });

  it("should generate appropriate integration notes", async () => {
    const agent = createAgent("codex");
    await agent.initialize();

    // Create files with specific key patterns
    await fs.writeFile(
      path.join(workingDir, "index.ts"),
      "export * from './lib';"
    );
    await fs.writeFile(
      path.join(workingDir, "lib.ts"),
      "export const helper = () => {};"
    );
    await fs.writeFile(
      path.join(workingDir, "package.json"),
      '{"main": "index.ts"}'
    );

    const result = await agent.executeTask("Create library", {
      workingDir,
      createArtifacts: true,
    });

    expect(result.integrationNotes).toBeDefined();
    expect(result.integrationNotes).toContain("Files created:");
    expect(result.integrationNotes).toMatch(
      /(index\.ts|lib\.ts|package\.json)/
    );
  });

  it("should emit progress events when enabled", async () => {
    const agent = createAgent("codex");
    await agent.initialize();

    const progressEvents: any[] = [];
    agent.on("progress", (event) => progressEvents.push(event));

    await agent.executeTask("Test task", {
      workingDir,
      enableProgressTracking: true,
    });

    expect(progressEvents.length).toBeGreaterThan(0);

    const initEvent = progressEvents.find((e) => e.stage === "initialization");
    expect(initEvent).toBeDefined();
    expect(initEvent.message).toBe("Setting up task environment");

    const completionEvent = progressEvents.find(
      (e) => e.stage === "completion"
    );
    expect(completionEvent).toBeDefined();
    expect(completionEvent.milestone).toBe("task-complete");
  });
});
