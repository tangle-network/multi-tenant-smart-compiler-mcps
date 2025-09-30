import "dotenv/config";

import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import closeWithGrace from "close-with-grace";
import cors from "cors";
import express, {
  type Express,
  type Request,
  type Response,
  type RequestHandler,
} from "express";
import { rateLimit } from "express-rate-limit";
import { getPort } from "get-port-please";
import { randomUUID } from "node:crypto";
import {
  apiKeyMiddleware,
  proxyAuthMiddleware,
  userIdHeaderKey,
} from "./auth.middleware.js";

const limiter = rateLimit({
  windowMs:
    typeof process.env.RATE_LIMIT_WINDOW_MS === "string" &&
    !Number.isNaN(parseInt(process.env.RATE_LIMIT_WINDOW_MS))
      ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
      : 15 * 60 * 1000,
  limit:
    typeof process.env.RATE_LIMIT_LIMIT === "string" &&
    !Number.isNaN(parseInt(process.env.RATE_LIMIT_LIMIT))
      ? parseInt(process.env.RATE_LIMIT_LIMIT)
      : 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const app: Express = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Hide X-Powered-By
app.disable("x-powered-by");

app.use(
  cors({
    origin:
      typeof process.env.ORIGIN === "string"
        ? process.env.ORIGIN.split(",")
        : "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "mcp-session-id", "x-api-key"],
    credentials: true,
  })
);

// Rate limiting - can be disabled with RATE_LIMIT_DISABLED=true
if (process.env.RATE_LIMIT_DISABLED !== "true") {
  app.use(limiter);
}

// Store transports for each session type
const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
  sse: {} as Record<string, SSEServerTransport>,
};

// Handle health check requests
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Type exports for external use
export type ExpressApp = typeof app;
export type ExpressRequest = Request;
export type ExpressResponse = Response;

type MakeServer = () => Promise<McpServer> | McpServer;
type MakeServerWithApp = (app: ExpressApp) => Promise<McpServer> | McpServer;

export function startMCPServer(makeServer: MakeServerWithApp | MakeServer) {
  //=============================================================================
  // STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-03-26)
  //=============================================================================

  // Handle all MCP Streamable HTTP requests (GET, POST, DELETE) on a single endpoint
  app.all("/mcp", apiKeyMiddleware, async (req, res) => {
    // MCP request received

    try {
      // Check for existing session ID
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.streamable[sessionId]) {
        // Check if the transport is of the correct type
        const existingTransport = transports.streamable[sessionId];
        if (existingTransport instanceof StreamableHTTPServerTransport) {
          // Reuse existing transport
          transport = existingTransport;
        } else {
          // Transport exists but is not a StreamableHTTPServerTransport (could be SSEServerTransport)
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message:
                "Bad Request: Session exists but uses a different transport protocol",
            },
            id: null,
          });
          return;
        }
      } else if (
        !sessionId &&
        req.method === "POST" &&
        isInitializeRequest(req.body)
      ) {
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore, // Enable resumability
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID when session is initialized
            // Session initialized
            transports.streamable[sessionId] = transport;
          },
        });

        // Set up onclose handler to clean up transport when closed
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports.streamable[sid]) {
            // Transport closed
            delete transports.streamable[sid];
          }
        };

        // Connect the transport to the MCP server
        const server = await makeServer(app);
        await server.connect(transport);
      } else {
        // Invalid request - no session ID or not initialization request
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      // Handle the request with the transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  //=============================================================================
  // DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
  //=============================================================================

  app.get("/sse", apiKeyMiddleware, proxyAuthMiddleware, async (req, res) => {
    // SSE request (deprecated)

    const transport = new SSEServerTransport("/messages", res);
    transports.sse[transport.sessionId] = transport;

    res.on("close", () => {
      delete transports.sse[transport.sessionId];
    });

    const server = await makeServer(app);

    // Connect to the MCP server
    await server.connect(transport);
  });

  app.post(
    "/messages",
    apiKeyMiddleware,
    proxyAuthMiddleware,
    async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports.sse[sessionId];

      if (transport) {
        // binding userid to mcp tool
        if (req?.body?.params?.arguments) {
          req.body.params.arguments.userId = req.headers[userIdHeaderKey];
        }
        await transport.handlePostMessage(req, res, req.body);
      } else {
        res.status(400).send("No transport found for sessionId");
      }
    }
  );

  getPort().then((autoPort) => {
    const envPort =
      typeof process.env.PORT === "string" &&
      !Number.isNaN(parseInt(process.env.PORT))
        ? parseInt(process.env.PORT)
        : undefined;
    const portToUse = envPort ?? autoPort;

    app.listen(portToUse, () => {
      console.log(`MCP server on port ${portToUse}`);
    });

    console.log(`
    ==============================================
    SUPPORTED TRANSPORT OPTIONS:

    1. Streamable Http(Protocol version: 2025-03-26)
       Endpoint: /mcp
       Methods: GET, POST, DELETE
       Usage:
         - Initialize with POST to /mcp
         - Establish SSE stream with GET to /mcp
         - Send requests with POST to /mcp
         - Terminate session with DELETE to /mcp

    2. Http + SSE (Protocol version: 2024-11-05)
       Endpoints: /sse (GET) and /messages (POST)
       Usage:
         - Establish SSE stream with GET to /sse
         - Send requests with POST to /messages?sessionId=<id>
    ==============================================
    `);
  });
}

closeWithGrace(async ({ err }) => {
  // Shutting down server

  if (err) {
    console.error(`Shutdown error: ${err}`);
  }

  // Close all active transports to properly clean up resources
  // Helper function to close transports for a given type
  const closeTransportsOfType = async (type: keyof typeof transports) => {
    for (const sessionId in transports[type]) {
      try {
        // Closing transport
        await transports[type][sessionId]?.close();
        delete transports[type][sessionId];
      } catch (error) {
        console.error(`Failed to close transport:`, error);
      }
    }
  };

  // Close all transports
  await Promise.all([
    closeTransportsOfType("sse"),
    closeTransportsOfType("streamable"),
  ]);

  // Server shutdown complete
  process.exit(0);
});

export { BaseController } from "./api/BaseController.js";
export { RequestValidator } from "./api/Validation.js";
export {
  proxyAuthMiddleware,
  getUserIdFromRequest,
  userIdHeaderKey,
} from "./auth.middleware.js";
export {
  waitForServiceHealth,
  type HealthCheckOptions,
} from "./utils/health.js";
export {
  waitForProject,
  type MCPClientLike,
  type WaitForProjectOptions,
} from "./utils/projects.js";
