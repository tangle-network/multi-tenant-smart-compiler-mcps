import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ArtifactManager } from "../src/artifact-manager.js";
import fs from "fs-extra";
import path from "path";
import { tmpdir } from "os";

describe("ArtifactManager", () => {
  let testDir: string;
  let artifactManager: ArtifactManager;
  let sourceDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), "artifact-test-"));
    artifactManager = new ArtifactManager(path.join(testDir, "artifacts"));
    await artifactManager.initialize();

    // Create test source directory with files
    sourceDir = path.join(testDir, "source");
    await fs.ensureDir(sourceDir);
    await fs.writeFile(
      path.join(sourceDir, "package.json"),
      '{"name": "test"}'
    );
    await fs.writeFile(path.join(sourceDir, "README.md"), "# Test Project");
    await fs.ensureDir(path.join(sourceDir, "src"));
    await fs.writeFile(
      path.join(sourceDir, "src", "index.ts"),
      "export const test = 'hello';"
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it("should initialize and create artifacts directory", async () => {
    const newManager = new ArtifactManager(path.join(testDir, "new-artifacts"));
    await newManager.initialize();

    expect(await fs.pathExists(path.join(testDir, "new-artifacts"))).toBe(true);
  });

  it("should create artifact with metadata", async () => {
    const metadata = await artifactManager.createArtifact(
      "claude-sdk",
      sourceDir
    );

    expect(metadata).toMatchObject({
      id: expect.any(String),
      agentType: "claude-sdk",
      location: expect.stringContaining("artifacts"),
      filesCreated: 3,
      totalSize: expect.any(Number),
      structure: expect.stringContaining("package.json"),
      keyFiles: expect.arrayContaining([
        "package.json",
        "README.md",
        "src/index.ts",
      ]),
      createdAt: expect.any(Number),
    });

    // Verify ALL files are included in keyFiles
    expect(metadata.keyFiles).toHaveLength(3);

    // Verify files were copied
    expect(
      await fs.pathExists(path.join(metadata.location, "package.json"))
    ).toBe(true);
    expect(
      await fs.pathExists(path.join(metadata.location, "src", "index.ts"))
    ).toBe(true);
  });

  it("should retrieve artifact metadata", async () => {
    const metadata = await artifactManager.createArtifact("codex", sourceDir);

    const retrieved = artifactManager.getArtifactMetadata(metadata.id);
    expect(retrieved).toEqual(metadata);
  });

  it("should return null for non-existent artifact", () => {
    const result = artifactManager.getArtifactMetadata("non-existent-id");
    expect(result).toBeNull();
  });

  it("should get artifact content", async () => {
    const metadata = await artifactManager.createArtifact(
      "claude-sdk",
      sourceDir
    );

    const content = await artifactManager.getArtifactContent({
      artifactId: metadata.id,
      files: ["package.json", "README.md"],
    });

    expect(content).toMatchObject({
      artifactId: metadata.id,
      files: [
        {
          path: "package.json",
          content: '{"name": "test"}',
          size: expect.any(Number),
        },
        {
          path: "README.md",
          content: "# Test Project",
          size: expect.any(Number),
        },
      ],
    });
  });

  it("should limit number of files in content request", async () => {
    const metadata = await artifactManager.createArtifact(
      "claude-sdk",
      sourceDir
    );

    const content = await artifactManager.getArtifactContent({
      artifactId: metadata.id,
      maxFiles: 1,
    });

    expect(content?.files).toHaveLength(1);
  });

  it("should use key files when no specific files requested", async () => {
    const metadata = await artifactManager.createArtifact(
      "claude-sdk",
      sourceDir
    );

    const content = await artifactManager.getArtifactContent({
      artifactId: metadata.id,
    });

    expect(content?.files.length).toBeGreaterThan(0);
    expect(content?.files[0].path).toMatch(/\.(json|md|ts)$/);
  });

  it("should handle custom key file patterns", async () => {
    const metadata = await artifactManager.createArtifact(
      "claude-sdk",
      sourceDir,
      {
        keyFilePatterns: ["\\.ts$"],
      }
    );

    expect(metadata.keyFiles).toContain("src/index.ts");
  });

  it("should persist and load registry", async () => {
    const metadata = await artifactManager.createArtifact(
      "claude-sdk",
      sourceDir
    );

    // Create new manager instance
    const newManager = new ArtifactManager(path.join(testDir, "artifacts"));
    await newManager.initialize();

    const retrieved = newManager.getArtifactMetadata(metadata.id);
    expect(retrieved).toEqual(metadata);
  });
});
