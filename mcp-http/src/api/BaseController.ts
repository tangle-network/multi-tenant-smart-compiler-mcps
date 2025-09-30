import type { Request, Response } from "express";
import { z } from "zod";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/helpers.js";

export abstract class BaseController {
  // Constants
  private static readonly DEFAULT_PAGINATION_LIMIT = 100;
  private static readonly DEFAULT_PAGE_SIZE = 20;

  constructor() {}

  /**
   * Send success response
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json(createSuccessResponse(data, message));
  }

  /**
   * Send error response
   */
  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 400
  ): void {
    res.status(statusCode).json(createErrorResponse(message, statusCode));
  }

  /**
   * Send not found response
   */
  protected sendNotFound(
    res: Response,
    message: string = "Resource not found"
  ): void {
    this.sendError(res, message, 404);
  }

  /**
   * Send internal server error response
   */
  protected sendInternalError(res: Response, error: unknown): void {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Controller error:", error);
    this.sendError(res, message, 500);
  }

  /**
   * Validate pagination parameters
   */
  protected validatePagination(page: number, limit: number): boolean {
    return (
      page >= 1 &&
      limit >= 1 &&
      limit <= BaseController.DEFAULT_PAGINATION_LIMIT
    );
  }

  /**
   * Parse pagination parameters from request
   */
  protected parsePagination(req: Request): {
    page: number;
    limit: number;
  } {
    const page = parseInt(req.query.page as string) || 1;
    const limit =
      parseInt(req.query.limit as string) || BaseController.DEFAULT_PAGE_SIZE;
    return { page, limit };
  }

  /**
   * Extract project ID from request params
   */
  protected getProjectId(req: Request): string {
    return req.params.projectId || "";
  }

  /**
   * Extract state ID from request params
   */
  protected getStateId(req: Request): string {
    return req.params.stateId || "";
  }

  /**
   * Extract project ID and state ID from request params
   */
  protected getProjectAndStateIds(req: Request): {
    projectId: string;
    stateId: string;
  } {
    return {
      projectId: this.getProjectId(req),
      stateId: this.getStateId(req),
    };
  }

  /**
   * Get request body with type safety using Zod schema
   */
  protected getBody<T>(req: Request, schema: z.ZodSchema<T>): T {
    return schema.parse(req.body);
  }

  /**
   * Get request query with type safety using Zod schema
   */
  protected getQuery<T>(req: Request, schema: z.ZodSchema<T>): T {
    return schema.parse(req.query);
  }

  /**
   * Get request params with type safety using Zod schema
   */
  protected getParams<T>(req: Request, schema: z.ZodSchema<T>): T {
    return schema.parse(req.params);
  }

  /**
   * Get request body with fallback type assertion (for backward compatibility)
   * @deprecated Use getBody with Zod schema instead
   */
  protected getBodyUnsafe<T>(req: Request): T {
    return req.body as T;
  }

  /**
   * Get request query with fallback type assertion (for backward compatibility)
   * @deprecated Use getQuery with Zod schema instead
   */
  protected getQueryUnsafe<T>(req: Request): T {
    return req.query as T;
  }

  /**
   * Get request params with fallback type assertion (for backward compatibility)
   * @deprecated Use getParams with Zod schema instead
   */
  protected getParamsUnsafe<T>(req: Request): T {
    return req.params as T;
  }
}
