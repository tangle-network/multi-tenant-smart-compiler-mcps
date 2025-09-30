import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { getUserIdFromRequest } from "mcp-http";
import assert from "node:assert";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { stringify } from "superjson";
import { userTerminalOutputs, userTerminals } from "./command.js";
import {
  ensureError,
  getWorkspacePath,
  listFilesRecursive,
  projectExists,
} from "./utils.js";

interface IgPattern {
  regex: RegExp;
  negate: boolean;
}

function compileGitignore(content: string): IgPattern[] {
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((line) => {
      let negate = false;
      if (line.startsWith("!")) {
        negate = true;
        line = line.slice(1);
      }
      let dirOnly = line.endsWith("/");
      if (dirOnly) line = line.slice(0, -1);
      let anchored = line.startsWith("/");
      if (anchored) line = line.slice(1);
      let expr = line
        .replace(/[-\\^$+?.()|[\]{}]/g, "\\$&")
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]");
      expr = (anchored ? "^" : "(?:^|/)") + expr;
      expr += dirOnly ? "(?:/|$)" : "$";
      return { regex: new RegExp(expr), negate };
    });
}

function isIgnored(path: string, patterns: IgPattern[]): boolean {
  path = path.replace(/\\/g, "/");
  let ignored = false;
  for (const { regex, negate } of patterns) {
    if (regex.test(path)) {
      ignored = !negate;
    }
  }
  return ignored;
}

export function registerProjectResources(server: McpServer) {
  server.resource(
    "list-projects",
    new ResourceTemplate("project://projects", { list: undefined }),
    {
      title: "List projects",
      description: "List all projects for a user",
    },
    async (uri, _, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        assert(typeof userId === "string", "Unauthorized");
        const { workspace: userProjectsRoot } = getWorkspacePath(userId, "/");
        if (!(await projectExists(userProjectsRoot))) {
          return {
            contents: [
              {
                text: stringify([]),
                uri: uri.href,
              },
            ],
          };
        }

        const projects = await readdir(userProjectsRoot);

        return {
          contents: [
            {
              text: stringify(projects),
              uri: uri.href,
            },
          ],
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          contents: [
            {
              text: `Error: ${error.message}`,
              uri: uri.href,
            },
          ],
        };
      }
    }
  );

  server.resource(
    "project-files",
    new ResourceTemplate("project://{projectId}/files", { list: undefined }),
    {
      title: "Project files",
      description: "List all files in a project",
    },
    async (uri, { projectId }, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        assert(typeof userId === "string", "Unauthorized");
        assert(typeof projectId === "string", "projectId must be a string");

        const { workspace: projectPath } = getWorkspacePath(userId, projectId);

        if (!(await projectExists(projectPath))) {
          throw new Error(
            `Project not found: ${projectId}. please create it first using 'create-project' tool.`
          );
        }

        let ignorePatterns: IgPattern[] = [];
        try {
          const gitignore = await readFile(
            join(projectPath, ".gitignore"),
            "utf8"
          );
          ignorePatterns = compileGitignore(gitignore);
        } catch {}

        const files: string[] = [];
        for (const file of await listFilesRecursive(projectPath)) {
          const rel = relative(projectPath, file).split(sep).join("/");
          if (rel.split("/").some((s) => s.startsWith("."))) continue;
          if (isIgnored(rel, ignorePatterns)) continue;
          files.push(rel);
        }

        return {
          contents: [
            {
              uri: uri.href,
              text: stringify(files),
            },
          ],
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          contents: [
            {
              text: `Error: ${error.message}`,
              uri: uri.href,
            },
          ],
        };
      }
    }
  );

  server.resource(
    "file-content",
    new ResourceTemplate("project://{projectId}/file/{+filePath*}", {
      list: undefined,
    }),
    {
      title: "File content",
      description: "Get the content of a file in a project",
    },
    async (uri, { projectId, filePath }, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        assert(typeof userId === "string", "Unauthorized");
        assert(typeof projectId === "string", "projectId must be a string");
        assert(typeof filePath === "string", "filePath must be a string");

        const { workspace: projectPath } = getWorkspacePath(userId, projectId);
        const fullPath = join(projectPath, filePath);

        if (!fullPath.startsWith(projectPath)) {
          throw new Error(
            "Invalid file path (potential path traversal attempt)"
          );
        }

        const content = await readFile(fullPath, "utf8");

        return {
          contents: [
            {
              uri: uri.href,
              text: content,
            },
          ],
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          contents: [
            {
              text: `Error: ${error.message}`,
              uri: uri.href,
            },
          ],
        };
      }
    }
  );

  server.resource(
    "terminal-output",
    new ResourceTemplate("terminal://{terminalId}", { list: undefined }),
    {
      title: "Terminal output",
      description:
        "Get the output of a terminal; the first content is stdout, the second is stderr",
    },
    async (uri, { terminalId }, req) => {
      try {
        const userId = getUserIdFromRequest(req);
        assert(typeof userId === "string", "Unauthorized");
        assert(
          typeof terminalId === "string",
          "terminalId must be a string (uuid)"
        );
        const userProcess = userTerminals.get(userId)?.get(terminalId);
        if (!userProcess) {
          throw new Error(
            `Terminal not found: ${terminalId}. Please create it first using 'create-terminal' tool.`
          );
        }

        const terminalOutput = userTerminalOutputs.get(userId)?.get(terminalId);
        if (!terminalOutput) {
          throw new Error(
            `Terminal output not found: ${terminalId}. Terminal may be in an invalid state.`
          );
        }

        return {
          contents: [
            {
              uri: uri.href + "#stdout",
              text: terminalOutput.stdout,
              mimeType: "text/plain",
            },
            {
              uri: uri.href + "#stderr",
              text: terminalOutput.stderr,
              mimeType: "text/plain",
            },
          ],
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          contents: [
            {
              uri: uri.href + "#stdout",
              text: "",
              mimeType: "text/plain",
            },
            {
              text: `Error: ${error.message}`,
              uri: uri.href + "#stderr",
              mimeType: "text/plain",
            },
          ],
        };
      }
    }
  );
}
