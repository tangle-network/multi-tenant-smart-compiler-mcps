import { EventEmitter } from "events";
import { ProgressUpdate } from "./types/progress.js";

export class ProgressTracker extends EventEmitter {
  private taskId: string;
  private startTime: number;
  private updates: ProgressUpdate[] = [];

  constructor(taskId: string) {
    super();
    this.taskId = taskId;
    this.startTime = Date.now();
  }

  progress(
    stage: string,
    message: string,
    options?: {
      filesCount?: number;
      milestone?: string;
    }
  ): void {
    const update: ProgressUpdate = {
      stage,
      message,
      filesCount: options?.filesCount,
      milestone: options?.milestone,
      timestamp: Date.now(),
    };

    this.updates.push(update);
    this.emit("progress", { taskId: this.taskId, ...update });
  }

  getUpdates(): ProgressUpdate[] {
    return [...this.updates];
  }

  getDuration(): number {
    return Date.now() - this.startTime;
  }

  getTokenEfficientSummary(): string {
    const milestones = this.updates
      .filter((u) => u.milestone)
      .map((u) => u.milestone)
      .join(" → ");

    const duration = Math.round(this.getDuration() / 1000);
    const lastUpdate = this.updates[this.updates.length - 1];

    return `${lastUpdate?.message} (${duration}s${milestones ? `, ${milestones}` : ""})`;
  }
}
