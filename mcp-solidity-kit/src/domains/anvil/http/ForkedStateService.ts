import { transferFolderOwnership, type FileUpload } from "mcp-fs";
import * as path from "path";
import * as fs from "fs/promises";
import { validateAndDecodeFileName } from "mcp-fs";

export interface ForkedStateUpload extends FileUpload {
  subPath?: string;
}

export interface ForkedStateInfo {
  userId: string;
  projectId: string;
  fileName: string;
  subPath?: string;
  filePath: string;
  size: number;
  createdAt: string;
}

export interface ForkedStateServiceOptions {
  maxFileSize?: number;
  maxFilesPerProject?: number;
}

export class ForkedStateService {
  private readonly maxFileSize: number;
  private readonly maxFilesPerProject: number;

  constructor(options: ForkedStateServiceOptions = {}) {
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.maxFilesPerProject = options.maxFilesPerProject || 100;
  }

  private getProjectDir(userId: string, projectId: string): string {
    return path.join("/home", userId, projectId);
  }

  private getSubPathDir(
    userId: string,
    projectId: string,
    subPath?: string,
  ): string {
    const projectDir = this.getProjectDir(userId, projectId);
    if (!subPath) {
      return projectDir;
    }
    return path.join(projectDir, subPath);
  }

  private getFilePath(
    userId: string,
    projectId: string,
    fileName: string,
    subPath?: string,
  ): string {
    const subPathDir = this.getSubPathDir(userId, projectId, subPath);
    return path.join(subPathDir, fileName);
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

  private validateSubPath(subPath?: string): void {
    if (subPath && typeof subPath === "string") {
      if (!/^[a-zA-Z0-9._/-]+$/.test(subPath)) {
        throw new Error(
          "Sub path must contain only alphanumeric characters, dots, hyphens, underscores, and forward slashes",
        );
      }

      // Prevent directory traversal
      if (
        subPath.includes("..") ||
        subPath.startsWith("/") ||
        subPath.startsWith("\\")
      ) {
        throw new Error(
          "Invalid sub path: cannot contain directory traversal or absolute paths",
        );
      }
    }
  }

  private validateFileContent(
    content: string,
    projectId: string,
    fileName: string,
  ): void {
    if (typeof content !== "string") {
      throw new Error(
        `File content must be a string for project ${projectId}, file ${fileName}`,
      );
    }

    if (content.length > this.maxFileSize) {
      throw new Error(
        `File size exceeds maximum limit of ${this.maxFileSize} bytes for project ${projectId}, file ${fileName}`,
      );
    }

    try {
      JSON.parse(content);
    } catch (error) {
      throw new Error(
        `File content must be valid JSON for project ${projectId}, file ${fileName}`,
      );
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }

  private async validateProjectFileLimit(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const projectDir = this.getProjectDir(userId, projectId);

    try {
      const files = await this.getAllFilesRecursively(projectDir);
      if (files.length >= this.maxFilesPerProject) {
        throw new Error(
          `Project ${projectId} has reached maximum limit of ${this.maxFilesPerProject} forked states`,
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

  private async getAllFilesRecursively(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          const subFiles = await this.getAllFilesRecursively(fullPath);
          files.push(...subFiles);
        } else if (item.isFile() && item.name.endsWith(".json")) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return files;
      }
      throw error;
    }

    return files;
  }

  async createForkedState(upload: ForkedStateUpload): Promise<ForkedStateInfo> {
    this.validateProjectId(upload.projectId);
    validateAndDecodeFileName(upload.fileName);
    this.validateSubPath(upload.subPath);
    this.validateFileContent(upload.content, upload.projectId, upload.fileName);
    await this.validateProjectFileLimit(upload.userId, upload.projectId);

    const subPathDir = this.getSubPathDir(
      upload.userId,
      upload.projectId,
      upload.subPath,
    );
    const filePath = this.getFilePath(
      upload.userId,
      upload.projectId,
      upload.fileName,
      upload.subPath,
    );

    // Ensure directory exists
    await this.ensureDirectoryExists(subPathDir);

    // Write the file atomically with exclusive flag to prevent race conditions
    try {
      await fs.writeFile(filePath, upload.content, {
        encoding: "utf8",
      });
      // transfer ownership of folder to user
      await transferFolderOwnership(upload.userId, subPathDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error(
          `File already exists: ${upload.fileName}${upload.subPath ? ` in path: ${upload.subPath}` : ""} for project ${upload.projectId}`,
        );
      }
      throw new Error(
        `Failed to write file ${upload.fileName} for project ${upload.projectId}: ${(error as Error).message}`,
      );
    }

    // Get file stats for response
    const stats = await fs.stat(filePath);

    return {
      userId: upload.userId,
      projectId: upload.projectId,
      fileName: upload.fileName,
      subPath: upload.subPath,
      filePath,
      size: stats.size,
      createdAt: stats.birthtime.toISOString(),
    };
  }

  async getForkedStateContent(
    userId: string,
    projectId: string,
    fileName: string,
  ): Promise<string | null> {
    this.validateProjectId(projectId);
    const decodedFileName = validateAndDecodeFileName(fileName);

    const filePath = this.getFilePath(userId, projectId, decodedFileName);

    try {
      const content = await fs.readFile(filePath, "utf8");
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw new Error(
        `Failed to read file ${fileName} for project ${projectId}: ${(error as Error).message}`,
      );
    }
  }
}
