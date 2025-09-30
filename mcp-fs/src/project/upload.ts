import multer from "multer";
// Import express types directly as the mcp-http exports aren't working properly in this context
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { z } from "zod";

export interface UploadConfig {
  fieldName?: string;
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  storage?: multer.StorageEngine;
}

export interface UploadResult {
  success: boolean;
  file?: Express.Multer.File;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class FileUploadService {
  private config: Required<UploadConfig>;

  constructor(config: UploadConfig = {}) {
    this.config = {
      fieldName: config.fieldName || "file",
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB default
      maxFiles: config.maxFiles || 1,
      allowedMimeTypes: config.allowedMimeTypes || ["application/json"],
      allowedExtensions: config.allowedExtensions || [".json"],
      storage: config.storage || multer.memoryStorage(),
    };
  }

  /**
   * Create multer instance with configured settings
   */
  createMulter(): multer.Multer {
    return multer({
      storage: this.config.storage,
      limits: {
        fileSize: this.config.maxFileSize,
        files: this.config.maxFiles,
      },
      fileFilter: (
        req: ExpressRequest,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback,
      ) => {
        const validation = this.validateFile(file);
        if (validation.isValid) {
          cb(null, true);
        } else {
          console.error("File validation failed:", validation.error);
          cb(new Error(validation.error));
        }
      },
    });
  }

  /**
   * Validate file based on configured rules
   */
  validateFile(file: Express.Multer.File): FileValidationResult {
    // Check MIME type
    if (this.config.allowedMimeTypes.length > 0) {
      const hasValidMimeType = this.config.allowedMimeTypes.some(
        (mimeType) =>
          file.mimetype === mimeType ||
          file.mimetype.startsWith(mimeType + "/"),
      );
      if (!hasValidMimeType) {
        const error = `Invalid file type. Allowed types: ${this.config.allowedMimeTypes.join(", ")}`;
        console.error("File validation failed:", error);
        return {
          isValid: false,
          error,
        };
      }
    }

    // Check file extension
    if (this.config.allowedExtensions.length > 0) {
      const hasValidExtension = this.config.allowedExtensions.some((ext) =>
        file.originalname.toLowerCase().endsWith(ext.toLowerCase()),
      );
      if (!hasValidExtension) {
        const error = `Invalid file extension. Allowed extensions: ${this.config.allowedExtensions.join(", ")}`;
        console.error("File validation failed:", error);
        return {
          isValid: false,
          error,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate JSON content
   */
  validateJsonContent(content: string): FileValidationResult {
    try {
      JSON.parse(content);
      return { isValid: true };
    } catch (error) {
      const errorMessage = "Invalid JSON content";
      console.error("JSON validation failed:", errorMessage, error);
      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get file from request
   */
  getFileFromRequest(req: ExpressRequest): UploadResult {
    const file = req.file;

    if (!file) {
      const error = `No file uploaded. Please ensure the file field is named "${this.config.fieldName}" and the request uses multipart/form-data`;
      console.error("File upload failed:", error);
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      file,
    };
  }

  /**
   * Create error handling middleware for multer
   */
  createErrorHandler() {
    return (
      error: any,
      req: ExpressRequest,
      res: ExpressResponse,
      next: any,
    ) => {
      console.error("Error in file upload middleware:", error);

      if (error instanceof multer.MulterError) {
        switch (error.code) {
          case "LIMIT_FILE_SIZE":
            res.status(400).json({
              success: false,
              error: `File size too large. Maximum size is ${this.config.maxFileSize / (1024 * 1024)}MB`,
            });
            return;

          case "LIMIT_FILE_COUNT":
            res.status(400).json({
              success: false,
              error: `Too many files. Maximum ${this.config.maxFiles} file(s) allowed`,
            });
            return;

          case "LIMIT_UNEXPECTED_FILE":
            res.status(400).json({
              success: false,
              error: `Unexpected file field. Please ensure the file field is named "${this.config.fieldName}"`,
            });
            return;

          default:
            res.status(400).json({
              success: false,
              error: `File upload error: ${error.message}`,
            });
            return;
        }
      }

      // Handle custom validation errors
      if (
        error.message &&
        (error.message.includes("Invalid file type") ||
          error.message.includes("Invalid file extension") ||
          error.message.includes("Invalid JSON content"))
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Handle other errors
      console.error("Unhandled error in file upload middleware:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during file upload",
      });
    };
  }

  /**
   * Create a complete upload middleware with error handling
   */
  createUploadMiddleware(): any[] {
    const multerInstance = this.createMulter();
    const uploadMiddleware = multerInstance.single(this.config.fieldName);

    return [uploadMiddleware, this.createErrorHandler()];
  }
}

/**
 * Factory function to create JSON file upload service
 */
export function createJsonUploadService(
  config: Partial<UploadConfig> = {},
): FileUploadService {
  return new FileUploadService({
    fieldName: "file",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    allowedMimeTypes: ["application/json"],
    allowedExtensions: [".json"],
    ...config,
  });
}

/**
 * Factory function to create general file upload service
 */
export function createFileUploadService(
  config: UploadConfig,
): FileUploadService {
  return new FileUploadService(config);
}

/**
 * Schema for validating required fields
 */
const RequiredFieldsSchema = z.record(z.string(), z.any()).refine((data) => {
  return Object.keys(data).length > 0;
}, "Request body cannot be empty");

/**
 * Utility function to validate required fields in request body using Zod
 */
export function validateRequiredFields(
  req: ExpressRequest,
  fields: string[],
): { isValid: boolean; missingFields: string[] } {
  try {
    // Validate that req.body exists and is an object
    const bodyValidation = RequiredFieldsSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      console.error(
        "Request body validation failed:",
        bodyValidation.error.message,
      );
      return {
        isValid: false,
        missingFields: fields,
      };
    }

    const missingFields: string[] = [];

    for (const field of fields) {
      if (
        !req.body[field] ||
        (typeof req.body[field] === "string" && req.body[field].trim() === "")
      ) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  } catch (error) {
    console.error("Error validating required fields:", error);
    return {
      isValid: false,
      missingFields: fields,
    };
  }
}
