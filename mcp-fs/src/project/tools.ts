import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getUserIdFromRequest } from "mcp-http";
import { z } from "zod";
import {
  createTerminal,
  executeCommand,
  killTerminal,
  listTerminal,
} from "./command.js";
import {
  handleProjectCreate,
  handleProjectDelete,
  handleProjectEdit,
} from "./handlers.js";
import { sanitizeProjectId } from "./sanitization.js";
import {
  ensureError,
  ensureExistUser,
  getWorkspacePath,
  transferFolderOwnership,
} from "./utils.js";
import { zProjectId, zTerminalId } from "./zod.js";

export function registerProjectTools(server: McpServer) {
  server.tool(
    "create-project",
    `Creates a new project workspace with initial files.
    PREREQUISITE: None (starting point).
    OUTPUTS: projectId for subsequent operations, terminal automatically created.
    Use for: scaffolding a new codebase, initializing a workspace for agent tasks, or resetting project state.
    This is typically the FIRST tool to call in any development workflow.
    Workflow: create-project → [edit-project-files] → [create-terminal if needed] → build tools.
    Filse path must be absolute path starting with \`/\`
    `,
    {
      name: zProjectId,
      files: z.record(
        z
          .string()
          .regex(/^\//, "File path must be absolute path starting with `/`"),
        z.string()
      ),
    },
    async ({ name, files }, req) => {
      const userId = getUserIdFromRequest(req);
      const sanitizedProjectId = sanitizeProjectId(name);
      const { workspace: workspaceToUse } = getWorkspacePath(
        userId,
        sanitizedProjectId
      );

      await ensureExistUser(userId);

      try {
        const createProjectResp = await handleProjectCreate(
          workspaceToUse,
          files
        );
        const createTerminalResp = await createTerminal(
          userId,
          workspaceToUse,
          (event) => {
            let data = "";
            if ("data" in event) {
              data = event.data;
            } else if (event.type === "error") {
              data = event.error.message;
            }
            const terminalId = event.tid || "unknown-terminal";
            server.server.sendResourceUpdated({
              uri: `terminal://${terminalId}`,
              data,
            });
          }
        );

        // transfer ownership of folder to user
        await transferFolderOwnership(userId, workspaceToUse);

        const isError =
          createProjectResp.isError || !createTerminalResp.success;
        return {
          isError,
          content: [
            ...createProjectResp.content,
            {
              type: "text",
              text: createTerminalResp.message,
            },
          ],
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete-project",
    "Deletes an entire project and all its files by project id. PREREQUISITE: Must have valid projectId from create-project. WARNING: Irreversible operation. Use for: permanently removing a project and freeing up storage when it is no longer needed. Consider backing up important work first.",
    {
      projectId: zProjectId,
    },
    async ({ projectId }, req) => {
      const userId = getUserIdFromRequest(req);
      const sanitizedProjectId = sanitizeProjectId(projectId);
      const { workspace: workspaceToUse } = getWorkspacePath(
        userId,
        sanitizedProjectId
      );

      try {
        return handleProjectDelete(workspaceToUse, userId);
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "edit-project-files",
    "Edits multiple files in a project in one go. PREREQUISITE: Must have valid projectId from create-project. Use for: batch updating, creating, or overwriting files in a project workspace. NOTE: This will overwrite files if they already exist. Workflow: create-project → edit-project-files → create-terminal → build/test tools",
    {
      projectId: zProjectId,
      files: z.record(
        z
          .string()
          .regex(/^\//, "File path must be absolute path starting with `/`"),
        z.string()
      ),
    },
    async ({ projectId, files }, req) => {
      const userId = getUserIdFromRequest(req);
      const sanitizedProjectId = sanitizeProjectId(projectId);
      const { workspace: workspaceToUse } = getWorkspacePath(
        userId,
        sanitizedProjectId
      );

      try {
        return handleProjectEdit(workspaceToUse, files, userId);
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create-terminal",
    "Creates a new terminal for the project and returns its terminal id. PREREQUISITE: Must have valid projectId from create-project. OUTPUTS: terminalId required by all cargo/build tools. Use for: running shell commands, building, or testing code in an isolated environment. NOTE: create-project automatically creates a terminal, but you may need additional terminals for parallel operations. Workflow: create-project → [additional create-terminal if needed] → cargo/build tools (using terminalId)",
    {
      projectId: zProjectId,
      silent: z.boolean().default(false),
    },
    async ({ projectId, silent }, req) => {
      const userId = getUserIdFromRequest(req);
      const sanitizedProjectId = sanitizeProjectId(projectId);
      const { workspace: workspaceToUse } = getWorkspacePath(
        userId,
        sanitizedProjectId
      );

      try {
        const createTerminalRes = await createTerminal(
          userId,
          workspaceToUse,
          silent
            ? undefined
            : (event) => {
                let data = "";
                if ("data" in event) {
                  data = event.data;
                } else if (event.type === "error") {
                  data = event.error.message;
                }
                const terminalId = event.tid || "unknown-terminal";
                server.server.sendResourceUpdated({
                  uri: `terminal://${terminalId}`,
                  data,
                });
              }
        );
        return {
          content: [{ type: "text" as const, text: createTerminalRes.message }],
          isError: false,
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list-terminal",
    "Lists all terminals for a project. PREREQUISITE: Must have at least one terminal created. Use for: viewing all open terminals, debugging, or managing multiple terminal sessions, finding terminalId for subsequent tool calls. Only call this when you need to list terminals or find a terminalId.",
    {},
    async (_, req) => {
      const userId = getUserIdFromRequest(req);

      try {
        const terminals = await listTerminal(userId);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(terminals) }],
          isError: false,
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "kill-terminal",
    "Kills a terminal by terminal id. PREREQUISITE: Must have valid terminalId from create-terminal or list-terminal. Use for: terminating a terminal session, freeing up resources, or stopping unwanted processes. WARNING: Will terminate any running processes in that terminal.",
    {
      terminalId: zTerminalId,
    },
    async ({ terminalId }, req) => {
      const userId = getUserIdFromRequest(req);

      try {
        const killTerminalRes = await killTerminal(userId, terminalId);
        return {
          content: [{ type: "text" as const, text: killTerminalRes.message }],
          isError: false,
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "run-command",
    "Run a command directly via terminal. PREREQUISITE: Must have valid terminalId from create-terminal. Use for: executing shell commands, building, or testing code in an isolated environment. Alternative to specialized tools when you need custom commands. Workflow: create-project → create-terminal → run-command",
    {
      terminalId: zTerminalId,
      command: z.string(),
    },
    async ({ terminalId, command }, req) => {
      const userId = getUserIdFromRequest(req);
      const cmd = command.trim().split(" ")[0] as string;
      if (cmd.length === 0) {
        throw new Error("Invalid command.");
      }
      const args = command.trim().replace(cmd, "").trim();

      try {
        const { success, message } = await executeCommand(
          userId,
          terminalId,
          cmd,
          args
        );
        return {
          content: [{ type: "text" as const, text: message }],
          isError: !success,
        };
      } catch (unknownError) {
        const error = ensureError(unknownError);

        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
