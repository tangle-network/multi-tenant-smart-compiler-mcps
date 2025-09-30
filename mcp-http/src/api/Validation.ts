import { z, type ZodSchema } from "zod";
import type { Request, Response } from "express";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export class RequestValidator {
  /**
   * Validate request body using Zod schema
   */
  static validateBody<T>(
    schema: ZodSchema<T>,
    req: Request
  ): ValidationResult<T> {
    try {
      const data = schema.parse(req.body);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        return { success: false, errors };
      }
      return { success: false, errors: ["Invalid request body"] };
    }
  }

  /**
   * Validate request params using Zod schema
   */
  static validateParams<T>(
    schema: ZodSchema<T>,
    req: Request
  ): ValidationResult<T> {
    try {
      const data = schema.parse(req.params);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        return { success: false, errors };
      }
      return { success: false, errors: ["Invalid request parameters"] };
    }
  }

  /**
   * Validate request query using Zod schema
   */
  static validateQuery<T>(
    schema: ZodSchema<T>,
    req: Request
  ): ValidationResult<T> {
    try {
      const data = schema.parse(req.query);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        return { success: false, errors };
      }
      return { success: false, errors: ["Invalid query parameters"] };
    }
  }

  /**
   * Validate combined params and query using Zod schema
   */
  static validateParamsAndQuery<T>(
    schema: ZodSchema<T>,
    req: Request
  ): ValidationResult<T> {
    try {
      const combinedData = { ...req.params, ...req.query };
      const data = schema.parse(combinedData);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        return { success: false, errors };
      }
      return { success: false, errors: ["Invalid request parameters"] };
    }
  }

  /**
   * Validate request body and params using separate schemas
   */
  static validateBodyAndParams<TBody, TParams>(
    bodySchema: ZodSchema<TBody>,
    paramsSchema: ZodSchema<TParams>,
    req: Request
  ): ValidationResult<{ body: TBody; params: TParams }> {
    const bodyResult = this.validateBody(bodySchema, req);
    const paramsResult = this.validateParams(paramsSchema, req);

    if (!bodyResult.success || !paramsResult.success) {
      const errors = [
        ...(bodyResult.errors || []),
        ...(paramsResult.errors || []),
      ];
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        body: bodyResult.data!,
        params: paramsResult.data!,
      },
    };
  }

  /**
   * Create error response for validation failures
   */
  static createValidationErrorResponse(errors: string[]): any {
    return {
      success: false,
      error: "Validation failed",
      details: errors,
      message: errors.join("; "),
    };
  }

  /**
   * Validate and return typed data or send error response
   */
  static validateOrFail<T>(
    schema: ZodSchema<T>,
    data: any,
    res: Response,
    errorMessage: string = "Validation failed"
  ): T | null {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        res.status(400).json(this.createValidationErrorResponse(errors));
        return null;
      }
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
      return null;
    }
  }
}
