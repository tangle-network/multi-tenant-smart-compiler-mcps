import { stringify } from "superjson";

export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error(stringify(error));
}
