import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

const apiKeyHeaderKey = "x-api-key";

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = process.env.MCP_HTTP_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    const requestApiKey = req.headers[apiKeyHeaderKey];

    if (typeof requestApiKey !== "string" || requestApiKey !== apiKey) {
      console.log(
        `Method: ${req.method}, Path: ${req.url}, invalid or missing API key`
      );

      res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid or missing API key" });
      return;
    }
  }

  next();
}

export const userIdHeaderKey = "x-user-id";
export const authHeaderKey = "authorization";

const proxyAuthSchema = z.object({
  [userIdHeaderKey]: z.string().default("guest"),
  [authHeaderKey]: z.string().default("Bearer 0|mcp-http|some-random-string"),
});

export function proxyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const parseResult = proxyAuthSchema.safeParse({
    [userIdHeaderKey]: req.headers[userIdHeaderKey],
    [authHeaderKey]: req.headers[authHeaderKey],
  });

  if (!parseResult.success) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: parseResult.error.message });
    return;
  }

  const authHeader =
    typeof parseResult.data[authHeaderKey] === "string"
      ? String(parseResult.data[authHeaderKey])
      : "";
  const masked = authHeader ? `${authHeader.slice(0, 7)}********` : "";
  console.info(
    `Proxy Auth middleware - Method: ${req.method}, Path: ${req.url}, userId: ${parseResult.data[userIdHeaderKey]}, authorization: ${masked}`
  );

  req.headers[userIdHeaderKey] = parseResult.data[userIdHeaderKey];
  req.headers[authHeaderKey] = parseResult.data[authHeaderKey];

  const authorization = req.headers[authHeaderKey]
    .replace("Bearer ", "")
    .split("|") as string[];

  // @ts-expect-error - this is a custom property for MCP Header binding
  req.auth = {
    token: req.headers[authHeaderKey] as string,
    clientId: req.query.sessionId as string,
    scopes: [authorization[1] ?? ""],
    expiresAt: 0,
    extra: {
      userId: req.headers[userIdHeaderKey],
    },
  } satisfies AuthInfo;

  next();
}

export const getUserIdFromRequest = (
  req: RequestHandlerExtra<ServerRequest, ServerNotification>
): string => {
  if (req.authInfo?.extra?.userId) {
    return req.authInfo.extra.userId as string;
  }
  throw new Error("Unauthorized");
};
