import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { validateAndDecodeFileName } from "./fileValidation.js";

export interface FileUpload {
  userId: string;
  projectId: string;
  fileName: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface FileStorageConfig {
  baseDir?: string;
  maxFileSize?: number;
  maxFilesPerProject?: number;
  fileExtension?: string;
}

export class FileStorageService {
  private readonly baseDir: string;
  private readonly maxFileSize: number;
  private readonly maxFilesPerProject: number;
  private readonly fileExtension: string;
  private readonly logger: Console;

  constructor(config: FileStorageConfig = {}) {
    this.baseDir =
      config.baseDir || path.join(os.tmpdir(), "mcp-fs", "file-storage");
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFilesPerProject = config.maxFilesPerProject || 100;
    this.fileExtension = config.fileExtension || ".json";
    this.logger = console;
    this.ensureBaseDir();
  }

  private async ensureBaseDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      this.logger.error("Failed to create base directory:", error);
      throw new Error("Failed to initialize file storage service");
    }
  }

  private getProjectDir(projectId: string): string {
    return path.join(this.baseDir, projectId);
  }

  private getFilePath(projectId: string, fileName: string): string {
    return path.join(this.getProjectDir(projectId), fileName);
  }

  private validateProjectId(projectId: string): void {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Project ID is required and must be a string");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
      throw new Error(
        "Project ID must contain only alphanumeric characters, hyphens, and underscores",
      );
    }
  }

  private validateFileName(fileName: string): void {
    validateAndDecodeFileName(fileName);
  }

  private validateFileContent(content: string): void {
    if (typeof content !== "string") {
      throw new Error("File content must be a string");
    }

    if (content.length > this.maxFileSize) {
      throw new Error(
        `File size exceeds maximum limit of ${this.maxFileSize} bytes`,
      );
    }
  }

  private async validateProjectFileLimit(projectId: string): Promise<void> {
    const projectDir = this.getProjectDir(projectId);

    try {
      const files = await fs.readdir(projectDir);
      const dataFiles = files.filter((file) =>
        file.endsWith(this.fileExtension),
      );

      if (dataFiles.length >= this.maxFilesPerProject) {
        throw new Error(
          `Project has reached maximum limit of ${this.maxFilesPerProject} files`,
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // Project directory doesn't exist yet, which is fine
        return;
      }
      throw error;
    }
  }

  async createFile(upload: FileUpload): Promise<void> {
    this.logger.info(`Creating file for project: ${upload.projectId}`);

    try {
      this.validateProjectId(upload.projectId);
      this.validateFileName(upload.fileName);
      this.validateFileContent(upload.content);
      await this.validateProjectFileLimit(upload.projectId);

      const projectDir = this.getProjectDir(upload.projectId);
      const filePath = this.getFilePath(upload.projectId, upload.fileName);

      // Create project directory if it doesn't exist
      await fs.mkdir(projectDir, { recursive: true });

      // Write the file
      await fs.writeFile(filePath, upload.content, "utf8");

      this.logger.info(
        `Created file: ${upload.fileName} for project: ${upload.projectId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create file for project ${upload.projectId}:`,
        error,
      );
      throw error;
    }
  }

  async getFileContent(
    projectId: string,
    fileName: string,
  ): Promise<string | null> {
    this.logger.info(
      `Getting file content: ${fileName} for project: ${projectId}`,
    );

    try {
      this.validateProjectId(projectId);
      this.validateFileName(fileName);

      const filePath = this.getFilePath(projectId, fileName);
      const content = await fs.readFile(filePath, "utf8");

      this.logger.info(
        `Retrieved file content: ${fileName} for project: ${projectId}`,
      );
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.logger.info(
          `File not found: ${fileName} for project: ${projectId}`,
        );
        return null;
      }
      this.logger.error(
        `Failed to get file content ${fileName} for project ${projectId}:`,
        error,
      );
      throw error;
    }
  }
}

/**
 * Factory function to create JSON file storage service
 */
export function createJsonFileStorageService(
  config: Partial<FileStorageConfig> = {},
): FileStorageService {
  return new FileStorageService({
    fileExtension: ".json",
    ...config,
  });
}
