import type { ExpressApp } from "mcp-http";
import { ForkedStateRouter } from "./http/ForkedStateRouter.js";

export function initAnvilHttp(
  app: ExpressApp,
) {
  // Initialize and register forked state routes
  const forkedStateRouter = new ForkedStateRouter();
  forkedStateRouter.registerRoutes(app);
}
