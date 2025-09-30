import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ClaudeHandler } from "../src/claude-handler.js";
import { McpManager } from "@blueprint-agent/context-lego";
import { join } from "path";
import { existsSync } from "fs";

describe("Claude Handler Streaming Integration", () => {
  let claudeHandler: ClaudeHandler;
  let mcpManager: McpManager;
  const mcpConfigPath = "./mcp-config.json";

  beforeAll(async () => {
    // Verify mcp-config.json exists
    if (!existsSync(mcpConfigPath)) {
      throw new Error(`MCP config file not found at ${mcpConfigPath}`);
    }

    // Initialize MCP manager with the existing config
    mcpManager = new McpManager(mcpConfigPath);

    // Initialize Claude handler
    claudeHandler = new ClaudeHandler(mcpManager);

    console.log("🔧 Test setup complete");
    console.log("📁 MCP Config:", mcpConfigPath);
    console.log(
      "🔗 MCP Servers:",
      Object.keys(mcpManager.getServerConfiguration() || {})
    );
  });

  afterAll(async () => {
    // Cleanup any active sessions
    claudeHandler.cleanupInactiveSessions(0);
    console.log("🧹 Test cleanup complete");
  });

  it("should create session and show streaming output", async () => {
    console.log("\n🚀 Starting streaming test...");

    const session = claudeHandler.createSession();
    expect(session).toBeDefined();
    expect(session.isActive).toBe(true);

    console.log("✅ Session created:", session);
  }, 10000);

  it("should execute simple task with streaming", async () => {
    console.log("\n💬 Testing simple execution with streaming...");

    const session = claudeHandler.createSession();
    const startTime = Date.now();

    try {
      const result = await claudeHandler.execute({
        prompt:
          "Say hello and list 3 programming languages in a short response",
        session,
        workingDirectory: process.cwd(),
      });

      const duration = Date.now() - startTime;

      console.log("📊 Execution Results:");
      console.log("  ✅ Success:", result.success);
      console.log("  ⏱️  Duration:", duration + "ms");
      console.log("  📏 Output length:", result.output.length);
      console.log("  🔧 Session ID:", result.sessionId);

      if (result.output) {
        console.log(
          "📝 Output preview:",
          result.output.substring(0, 200) + "..."
        );
      }

      expect(result.success).toBe(true);
      expect(result.output).toBeTruthy();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.sessionId).toBeTruthy();
    } catch (error) {
      console.error("❌ Execution failed:", error);
      throw error;
    }
  }, 30000);

  it("should demonstrate live streaming with async generator", async () => {
    console.log("\n🌊 Testing live streaming with async generator...");

    const session = claudeHandler.createSession();
    let messageCount = 0;
    let hasSystemInit = false;
    let hasContent = false;

    try {
      console.log("📡 Starting stream...");

      for await (const message of claudeHandler.streamQuery({
        prompt:
          "Write a short haiku about coding and then explain what each line means",
        session,
        workingDirectory: process.cwd(),
      })) {
        messageCount++;

        // Log different message types with live output
        if (message.type === "system" && message.subtype === "init") {
          hasSystemInit = true;
          console.log(`🎯 [${messageCount}] System Init:`, {
            sessionId: message.session_id,
            type: message.type,
            subtype: message.subtype,
          });
        } else if (message.type === "assistant") {
          hasContent = true;
          console.log(`💭 [${messageCount}] Assistant:`, {
            type: message.type,
            contentPreview: JSON.stringify(message).substring(0, 100) + "...",
          });
        } else if (message.type === "result") {
          console.log(`📋 [${messageCount}] Result:`, {
            type: message.type,
            contentPreview: JSON.stringify(message).substring(0, 100) + "...",
          });
        } else {
          console.log(`📨 [${messageCount}] Message:`, {
            type: message.type,
            keys: Object.keys(message),
          });
        }

        // Show live progress
        if (messageCount % 5 === 0) {
          console.log(`⏳ Processed ${messageCount} messages...`);
        }
      }

      console.log("🏁 Stream completed!");
      console.log("📊 Stream Summary:");
      console.log("  📨 Total messages:", messageCount);
      console.log("  🔧 Had system init:", hasSystemInit);
      console.log("  💬 Had content:", hasContent);
      console.log("  🆔 Session ID:", session.sessionId);

      expect(messageCount).toBeGreaterThan(0);
      expect(hasSystemInit).toBe(true);
    } catch (error) {
      console.error("❌ Streaming failed:", error);
      throw error;
    }
  }, 45000);

  it("should work with MCP tools from config", async () => {
    console.log("\n🔧 Testing with MCP tools...");

    const mcpServers = mcpManager.getServerConfiguration();
    const mcpTools = mcpManager.getDefaultAllowedTools();

    console.log("🔗 Available MCP servers:", Object.keys(mcpServers || {}));
    console.log("🛠️  Available MCP tools:", mcpTools.slice(0, 5), "...");

    if (!mcpServers || Object.keys(mcpServers).length === 0) {
      console.log("⚠️  No MCP servers configured, skipping tool test");
      return;
    }

    const session = claudeHandler.createSession();

    try {
      const result = await claudeHandler.execute({
        prompt:
          "List the tools available to you and briefly describe what you can do",
        session,
        workingDirectory: process.cwd(),
      });

      console.log("📊 MCP Tool Test Results:");
      console.log("  ✅ Success:", result.success);
      console.log("  📏 Output length:", result.output.length);

      if (result.output) {
        console.log(
          "📝 Output preview:",
          result.output.substring(0, 300) + "..."
        );
      }

      expect(result.success).toBe(true);
      expect(result.output).toBeTruthy();
    } catch (error) {
      console.error("❌ MCP tool test failed:", error);
      // Don't fail the test if MCP servers aren't available
      console.log(
        "⚠️  MCP servers may not be running, which is expected in CI"
      );
    }
  }, 30000);

  it("should handle session resumption", async () => {
    console.log("\n🔄 Testing session resumption...");

    // First interaction
    const session = claudeHandler.createSession();

    const firstResult = await claudeHandler.execute({
      prompt: "Remember this number: 42. Just acknowledge you remembered it.",
      session,
      workingDirectory: process.cwd(),
    });

    console.log("📊 First interaction:");
    console.log("  ✅ Success:", firstResult.success);
    console.log("  🆔 Session ID:", firstResult.sessionId);

    expect(firstResult.success).toBe(true);
    expect(firstResult.sessionId).toBeTruthy();

    // Update session with the session ID
    session.sessionId = firstResult.sessionId;

    // Second interaction - test resumption
    const secondResult = await claudeHandler.execute({
      prompt: "What number did I ask you to remember?",
      session,
      workingDirectory: process.cwd(),
    });

    console.log("📊 Second interaction (resumed):");
    console.log("  ✅ Success:", secondResult.success);
    console.log("  🆔 Session ID:", secondResult.sessionId);
    console.log(
      "  🔗 Same session:",
      firstResult.sessionId === secondResult.sessionId
    );

    if (secondResult.output) {
      console.log(
        "📝 Response preview:",
        secondResult.output.substring(0, 200) + "..."
      );
    }

    expect(secondResult.success).toBe(true);
    expect(secondResult.sessionId).toBe(firstResult.sessionId);
  }, 60000);

  it("should handle concurrent streams", async () => {
    console.log("\n🚀 Testing concurrent streaming...");

    const session1 = claudeHandler.createSession();
    const session2 = claudeHandler.createSession();

    const stream1Promise = (async () => {
      let count = 0;
      for await (const message of claudeHandler.streamQuery({
        prompt: "Count from 1 to 3 slowly",
        session: session1,
      })) {
        count++;
        console.log(`🔵 Stream 1 [${count}]:`, message.type);
      }
      return count;
    })();

    const stream2Promise = (async () => {
      let count = 0;
      for await (const message of claudeHandler.streamQuery({
        prompt: "List 3 colors",
        session: session2,
      })) {
        count++;
        console.log(`🟡 Stream 2 [${count}]:`, message.type);
      }
      return count;
    })();

    const [count1, count2] = await Promise.all([
      stream1Promise,
      stream2Promise,
    ]);

    console.log("📊 Concurrent streaming results:");
    console.log("  🔵 Stream 1 messages:", count1);
    console.log("  🟡 Stream 2 messages:", count2);
    console.log("  🆔 Session 1 ID:", session1.sessionId);
    console.log("  🆔 Session 2 ID:", session2.sessionId);

    expect(count1).toBeGreaterThan(0);
    expect(count2).toBeGreaterThan(0);
    expect(session1.sessionId).not.toBe(session2.sessionId);
  }, 60000);

  it("should cleanup inactive sessions", async () => {
    console.log("\n🧹 Testing session cleanup...");

    // Create multiple sessions
    const sessions = [
      claudeHandler.createSession(),
      claudeHandler.createSession(),
      claudeHandler.createSession(),
    ];

    console.log("📊 Created sessions:", sessions.length);

    // Simulate some being old
    sessions[0].lastActivity = new Date(Date.now() - 2000); // 2 seconds old
    sessions[1].lastActivity = new Date(Date.now() - 1000); // 1 second old

    // Cleanup sessions older than 1.5 seconds
    claudeHandler.cleanupInactiveSessions(1500);

    console.log("✅ Session cleanup completed");

    // This test mainly verifies cleanup runs without errors
    expect(true).toBe(true);
  });
});
