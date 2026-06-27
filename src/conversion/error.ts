import type { SerializedError } from "./types";

function formatErrorParts(name: string, message: string, stack?: string): string {
  const label = name && name !== "Error" ? `${name}: ${message}` : message;
  return stack ? `${label}\n${stack}` : label;
}

export function formatErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return formatErrorParts(error.name, error.message, error.stack);
  }
  if (error && typeof error === "object") {
    const value = error as Partial<SerializedError> & {
      name?: unknown;
      message?: unknown;
      stack?: unknown;
    };
    const name = typeof value.name === "string" ? value.name : "Error";
    const message = typeof value.message === "string" ? value.message : "";
    const stack = typeof value.stack === "string" ? value.stack : undefined;
    if (message) {
      return formatErrorParts(name, message, stack);
    }
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (error && typeof error === "object" && "message" in error) {
    const value = error as { name?: unknown; message: unknown; stack?: unknown };
    return {
      name: typeof value.name === "string" ? value.name : "Error",
      message: String(value.message),
      stack: typeof value.stack === "string" ? value.stack : undefined,
    };
  }
  return {
    name: "Error",
    message: formatErrorMessage(error),
  };
}
