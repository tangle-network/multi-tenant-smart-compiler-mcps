import type { CallToolResult } from "mcp-http/types";
import { projectExists, transferFolderOwnership } from "./utils.js";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { stringify } from "superjson";

export const handleProjectCreate = async (
  projectPath: string,
  files: Record<string, string>
): Promise<CallToolResult> => {
  const projectId = projectPath.split("/").pop();
  const projectExistsCheck = await projectExists(projectPath);
  if (projectExistsCheck) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Project already exists: ${projectId}. Try with a different name please.`,
        },
      ],
      isError: true,
    };
  }

  await mkdir(projectPath, { recursive: true });

  for (const [filePath, content] of Object.entries(files)) {
    const relativePath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;
    const fullPath = join(projectPath, relativePath);

    if (!fullPath.startsWith(projectPath)) {
      throw new Error(
        `Invalid file path: ${filePath} (outside project workspace)`
      );
    }

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: stringify({
          projectId,
          message:
            "Project created successfully, you can now use other tools with this projectId",
        }),
      },
    ],
    isError: false,
  };
};

export const handleProjectDelete = async (
  projectPath: string,
  userId: string
): Promise<CallToolResult> => {
  const projectId = projectPath.split("/").pop();
  const projectExistsCheck = await projectExists(projectPath);
  if (!projectExistsCheck) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Project not found: ${projectId}, did you delete it already?`,
        },
      ],
      isError: true,
    };
  }

  try {
    await rm(projectPath, { recursive: true, force: true });

    return {
      content: [
        {
          type: "text" as const,
          text: `Project ${projectId} deleted successfully`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error deleting project: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
};

export const handleProjectEdit = async (
  projectPath: string,
  files: Record<string, string>,
  userId: string
): Promise<CallToolResult> => {
  const projectId = projectPath.split("/").pop();

  if (!(await projectExists(projectPath))) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Project not found: ${projectId}, use 'create-project' tool to create it first.`,
        },
      ],
      isError: true,
    };
  }

  try {
    for (const [filePath, content] of Object.entries(files)) {
      const relativePath = filePath.startsWith("/")
        ? filePath.slice(1)
        : filePath;
      const fullPath = join(projectPath, relativePath);

      if (!fullPath.startsWith(projectPath)) {
        throw new Error(
          `Invalid file path: ${filePath} (potential path traversal attempt)`
        );
      }

      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content);
    }

    await transferFolderOwnership(userId, projectPath);
    return {
      content: [
        {
          type: "text" as const,
          text: stringify({
            projectId,
            message: `Files updated successfully (${Object.keys(files).length} file(s))`,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error editing project: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
};
