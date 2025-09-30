import fs from "fs-extra";
import path from "path";
import { nanoid } from "nanoid";
import {
  ArtifactMetadata,
  ArtifactContent,
  ArtifactContentRequest,
} from "./types/progress.js";

export class ArtifactManager {
  private artifactsDir: string;
  private registry: Map<string, ArtifactMetadata> = new Map();

  constructor(artifactsDir: string = "./artifacts") {
    this.artifactsDir = artifactsDir;
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.artifactsDir);
    await this.loadRegistry();
  }

  async createArtifact(
    agentType: string,
    sourceDir: string,
    options?: { keyFilePatterns?: string[] }
  ): Promise<ArtifactMetadata> {
    const id = nanoid();
    const artifactPath = path.join(this.artifactsDir, id);

    // Copy files to artifact storage
    await fs.copy(sourceDir, artifactPath);

    // Analyze artifact
    const files = await this.getFilesRecursively(artifactPath);
    const totalSize = await this.calculateTotalSize(files, artifactPath);
    const structure = await this.generateFileTree(artifactPath);
    const keyFiles = await this.identifyKeyFiles(
      files,
      options?.keyFilePatterns
    );

    const metadata: ArtifactMetadata = {
      id,
      agentType,
      location: artifactPath,
      filesCreated: files.length,
      totalSize,
      structure,
      keyFiles,
      createdAt: Date.now(),
    };

    this.registry.set(id, metadata);
    await this.saveRegistry();

    return metadata;
  }

  async getArtifactContent(
    request: ArtifactContentRequest
  ): Promise<ArtifactContent | null> {
    const metadata = this.registry.get(request.artifactId);
    if (!metadata) return null;

    const filesToRead = request.files || metadata.keyFiles;
    const maxFiles = request.maxFiles || 10;
    const limitedFiles = filesToRead.slice(0, maxFiles);

    const files = await Promise.all(
      limitedFiles.map(async (filePath) => {
        const fullPath = path.join(metadata.location, filePath);
        const content = await fs.readFile(fullPath, "utf-8").catch(() => "");
        const stats = await fs.stat(fullPath).catch(() => ({ size: 0 }));

        return {
          path: filePath,
          content,
          size: stats.size,
        };
      })
    );

    return {
      artifactId: request.artifactId,
      files,
    };
  }

  getArtifactMetadata(id: string): ArtifactMetadata | null {
    return this.registry.get(id) || null;
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const subFiles = await this.getFilesRecursively(fullPath);
        files.push(...subFiles.map((f) => path.join(item.name, f)));
      } else {
        files.push(item.name);
      }
    }

    return files;
  }

  private async calculateTotalSize(
    files: string[],
    baseDir: string
  ): Promise<number> {
    // Actually calculate the real total size
    let totalSize = 0;
    for (const file of files) {
      try {
        const fullPath = path.join(baseDir, file);
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      } catch {
        // If file doesn't exist, skip it
      }
    }
    return totalSize;
  }

  private async generateFileTree(dir: string): Promise<string> {
    const files = await this.getFilesRecursively(dir);

    // Build a proper tree structure
    const tree = this.buildTreeStructure(files);
    return tree;
  }

  private buildTreeStructure(files: string[]): string {
    const tree: Record<string, any> = {};

    // Build tree structure
    files.forEach((file) => {
      const parts = file.split("/");
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = null;
        } else {
          // It's a directory
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });

    // Convert to string representation
    return this.treeToString(tree, "", true);
  }

  private treeToString(
    node: Record<string, any>,
    prefix: string = "",
    isRoot: boolean = false
  ): string {
    const entries = Object.entries(node);
    let result = "";

    entries.forEach(([name, children], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const newPrefix = isLast ? "    " : "│   ";

      if (!isRoot) {
        result += `${prefix}${connector}${name}\n`;
      } else {
        result += `${name}\n`;
      }

      if (children && typeof children === "object") {
        result += this.treeToString(children, prefix + newPrefix, false);
      }
    });

    return result;
  }

  private async identifyKeyFiles(
    files: string[],
    patterns?: string[]
  ): Promise<string[]> {
    // Return ALL files - this is what was actually created/changed
    // Sort by common project files first, then alphabetically
    return files.sort((a, b) => {
      // Common project configuration files (language-agnostic)
      const configFiles = [
        "package.json",
        "Cargo.toml",
        "pyproject.toml",
        "pom.xml",
        "build.gradle",
        "go.mod",
        "Makefile",
      ];
      const docFiles = ["README", "LICENSE"];

      const aIsConfig = configFiles.some((cf) => a.includes(cf));
      const bIsConfig = configFiles.some((cf) => b.includes(cf));
      const aIsDoc = docFiles.some((df) => a.includes(df));
      const bIsDoc = docFiles.some((df) => b.includes(df));

      if (aIsConfig && !bIsConfig) return -1;
      if (bIsConfig && !aIsConfig) return 1;
      if (aIsDoc && !bIsDoc) return -1;
      if (bIsDoc && !aIsDoc) return 1;

      return a.localeCompare(b);
    });
  }

  private async loadRegistry(): Promise<void> {
    const registryPath = path.join(this.artifactsDir, "registry.json");
    try {
      const data = await fs.readFile(registryPath, "utf-8");
      const entries = JSON.parse(data);
      this.registry = new Map(entries);
    } catch {
      // Registry doesn't exist yet, start with empty
    }
  }

  private async saveRegistry(): Promise<void> {
    const registryPath = path.join(this.artifactsDir, "registry.json");
    const entries = Array.from(this.registry.entries());
    await fs.writeFile(registryPath, JSON.stringify(entries, null, 2));
  }
}
