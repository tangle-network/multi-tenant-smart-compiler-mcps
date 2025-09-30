import { zProjectId } from "mcp-fs";
import { z } from "zod";

export const FilePathSchema = z
  .string()
  .min(1, "File path is required")
  .transform((val) => {
    try {
      // Decode URL-encoded string
      return decodeURIComponent(val);
    } catch (error) {
      // If decoding fails, return original value
      return val;
    }
  })
  .refine((decodedPath) => {
    // After decoding, validate the path
    if (!decodedPath || typeof decodedPath !== "string") {
      return false;
    }

    // Check for directory traversal attempts
    if (
      decodedPath.includes("..") ||
      decodedPath.startsWith("/") ||
      decodedPath.startsWith("\\")
    ) {
      return false;
    }

    // Allow alphanumeric characters, dots, hyphens, underscores, and forward slashes
    // This allows file paths like "data/state.json" or "contracts/deployments/config.json"
    return /^[a-zA-Z0-9._/-]+$/.test(decodedPath);
  }, "File path must contain only alphanumeric characters, dots, hyphens, underscores, and forward slashes, and cannot contain directory traversal");

export const SubPathSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9._/-]+$/,
    "Sub path must contain only alphanumeric characters, dots, hyphens, underscores, and forward slashes",
  )
  .refine(
    (path) =>
      !path.includes("..") && !path.startsWith("/") && !path.startsWith("\\"),
    "Invalid sub path: cannot contain directory traversal or absolute paths",
  )
  .optional();

// Upload request schema
export const UploadForkedStateSchema = z.object({
  projectId: zProjectId,
  subPath: SubPathSchema,
});

// Type exports
export type UploadForkedStateRequest = z.infer<typeof UploadForkedStateSchema>;
