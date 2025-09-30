import type { ExpressApp } from "mcp-http";
import { ForkedStateController } from "./ForkedStateController.js";
import { proxyAuthMiddleware } from "mcp-http";

export class ForkedStateRouter {
  private readonly controller: ForkedStateController;

  constructor() {
    this.controller = new ForkedStateController();
  }

  /**
   * Register all forked state routes
   */
  registerRoutes(app: ExpressApp): void {
    const basePath = "/api/v1/evm/forked-state";

    // Upload forked state file
    app.post(
      basePath,
      ...this.controller.getUploadMiddleware(),
      proxyAuthMiddleware,
      this.controller.uploadForkedState.bind(this.controller),
    );

    // Get specific forked state
    app.get(
      `${basePath}/:projectId/:fileName`,
      proxyAuthMiddleware,
      this.controller.getForkedState.bind(this.controller),
    );
  }

  /**
   * Get controller instance (for testing or direct access)
   */
  getController(): ForkedStateController {
    return this.controller;
  }
}
