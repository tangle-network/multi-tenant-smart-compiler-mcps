import { describe, it, expect, vi } from "vitest";
import { ProgressTracker } from "../src/progress-tracker.js";

describe("ProgressTracker", () => {
  it("should initialize with task ID and start time", () => {
    const taskId = "test-task-123";
    const tracker = new ProgressTracker(taskId);

    expect(tracker.getUpdates()).toHaveLength(0);
    expect(tracker.getDuration()).toBeGreaterThan(0);
  });

  it("should track progress updates", () => {
    const tracker = new ProgressTracker("test-task");

    tracker.progress("setup", "Initializing environment");
    tracker.progress("execution", "Running command", { filesCount: 5 });
    tracker.progress("completion", "Task finished", { milestone: "complete" });

    const updates = tracker.getUpdates();
    expect(updates).toHaveLength(3);
    expect(updates[0]).toMatchObject({
      stage: "setup",
      message: "Initializing environment",
    });
    expect(updates[1]).toMatchObject({
      stage: "execution",
      message: "Running command",
      filesCount: 5,
    });
    expect(updates[2]).toMatchObject({
      stage: "completion",
      message: "Task finished",
      milestone: "complete",
    });
  });

  it("should emit progress events", () => {
    const tracker = new ProgressTracker("test-task");
    const progressHandler = vi.fn();

    tracker.on("progress", progressHandler);
    tracker.progress("test", "Test message");

    expect(progressHandler).toHaveBeenCalledWith({
      taskId: "test-task",
      stage: "test",
      message: "Test message",
      timestamp: expect.any(Number),
    });
  });

  it("should generate token-efficient summary", () => {
    const tracker = new ProgressTracker("test-task");

    tracker.progress("setup", "Starting");
    tracker.progress("work", "Processing files", { milestone: "files-ready" });
    tracker.progress("done", "Completed successfully", {
      milestone: "complete",
    });

    const summary = tracker.getTokenEfficientSummary();

    expect(summary).toContain("Completed successfully");
    expect(summary).toContain("files-ready → complete");
    expect(summary).toMatch(/\d+s/); // Contains duration in seconds
  });

  it("should handle updates without milestones", () => {
    const tracker = new ProgressTracker("test-task");

    tracker.progress("work", "Working on task");

    const summary = tracker.getTokenEfficientSummary();
    expect(summary).toContain("Working on task");
    expect(summary).toMatch(/\d+s/);
  });
});
