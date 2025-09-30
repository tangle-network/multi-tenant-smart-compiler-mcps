/**
 * Convert CLI agent output to bolt artifact format
 */
export function convertOutputToBoltArtifact(
  output: string,
  agent: string,
  artifactId?: string,
  artifactTitle?: string
): string {
  const id = artifactId || `${agent}-output`;
  const title = artifactTitle || `${agent} Generated Code`;

  // Try to detect files and shell commands in the output
  const lines = output.split("\n");
  let actions: string[] = [];
  let currentFile: { path?: string; content: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLang = "";

  for (const line of lines) {
    // Detect markdown code blocks
    const codeBlockMatch = line.match(/^```(\w+)?/);
    if (codeBlockMatch) {
      inCodeBlock = !inCodeBlock;
      codeBlockLang = codeBlockMatch[1] || "";

      if (!inCodeBlock && currentFile) {
        // End of code block, save file
        actions.push(
          `<boltAction type="file" filePath="${currentFile.path}">\n${currentFile.content.join("\n")}\n</boltAction>`
        );
        currentFile = null;
      }
      continue;
    }

    // Detect file paths - improved regex to handle complex paths
    const filePathMatch = line.match(/^(?:File:|Creating:|Writing:)/i);
    if (filePathMatch && !inCodeBlock) {
      if (currentFile) {
        actions.push(
          `<boltAction type="file" filePath="${currentFile.path}">\n${currentFile.content.join("\n")}\n</boltAction>`
        );
      }

      // Extract file path more accurately
      const pathMatch = line.match(/(?:File:|Creating:|Writing:)\s*(.+)/i);
      if (pathMatch && pathMatch[1]) {
        const extractedPath = pathMatch[1].trim();
        currentFile = {
          path: extractedPath,
          content: [],
        };
      } else {
        // Fallback for complex parsing
        currentFile = {
          path: "generated-file.txt",
          content: [],
        };
      }
      continue;
    }

    // Detect shell commands
    const shellMatch = line.match(/^(?:\$|>|#)\s*(.+)$/);
    if (shellMatch && !inCodeBlock) {
      actions.push(
        `<boltAction type="shell">\n${shellMatch[1]}\n</boltAction>`
      );
      continue;
    }

    // Add content to current file or general output
    if (inCodeBlock && currentFile) {
      currentFile.content.push(line);
    } else if (inCodeBlock && codeBlockLang) {
      // Code block without specific file, create generic file
      if (!currentFile) {
        const ext = getExtensionForLanguage(codeBlockLang);
        currentFile = {
          path: `generated-code${ext}`,
          content: [],
        };
      }
      currentFile.content.push(line);
    }
  }

  // Handle any remaining file
  if (currentFile) {
    actions.push(
      `<boltAction type="file" filePath="${currentFile.path}">\n${currentFile.content.join("\n")}\n</boltAction>`
    );
  }

  return `<boltArtifact id="${id}" title="${title}">
${actions.join("\n")}
</boltArtifact>`;
}

export function getExtensionForLanguage(lang: string): string {
  const extensions: Record<string, string> = {
    javascript: ".js",
    typescript: ".ts",
    python: ".py",
    rust: ".rs",
    go: ".go",
    java: ".java",
    cpp: ".cpp",
    c: ".c",
    html: ".html",
    css: ".css",
    json: ".json",
    yaml: ".yaml",
    yml: ".yml",
    toml: ".toml",
    md: ".md",
    markdown: ".md",
    sh: ".sh",
    bash: ".sh",
  };
  return extensions[lang.toLowerCase()] || ".txt";
}

/**
 * Extract file changes from bolt artifact output (for compatibility with existing systems)
 */
export function extractFileChangesFromBoltArtifact(output: string): Array<{
  path: string;
  type: "create" | "edit";
  content: string;
}> {
  const changes: Array<{
    path: string;
    type: "create" | "edit";
    content: string;
  }> = [];

  // First try to extract from boltArtifact containers
  const artifactRegex = /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/g;
  let artifactMatch;

  while ((artifactMatch = artifactRegex.exec(output)) !== null) {
    const artifactContent = artifactMatch[1];
    if (!artifactContent) continue;

    const fileActionRegex =
      /<boltAction\s+type="file"\s+filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g;
    let fileMatch;

    while ((fileMatch = fileActionRegex.exec(artifactContent)) !== null) {
      const [, path, content] = fileMatch;
      if (typeof path === "string" && typeof content === "string") {
        changes.push({
          path: path.trim(),
          type: "create",
          content: content.trim(),
        });
      }
    }
  }

  // Also check for standalone boltAction tags (backwards compatibility)
  if (changes.length === 0) {
    const standaloneRegex =
      /<boltAction\s+type="file"\s+filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g;
    let match;

    while ((match = standaloneRegex.exec(output)) !== null) {
      const [, path, content] = match;
      if (path && content !== undefined) {
        changes.push({
          path: path.trim(),
          type: "create",
          content: content.trim(),
        });
      }
    }
  }

  return changes;
}
