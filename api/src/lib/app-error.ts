export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options: { code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code ?? "APP_ERROR";
    this.details = options.details;
  }
}

export const Errors = {
  unauthorized(message = "Unauthorized") {
    return new AppError(401, message, { code: "UNAUTHORIZED" });
  },
  forbidden(message = "Forbidden") {
    return new AppError(403, message, { code: "FORBIDDEN" });
  },
  notFound(message = "Not found") {
    return new AppError(404, message, { code: "NOT_FOUND" });
  },
  badRequest(message = "Bad request", details?: unknown) {
    return new AppError(400, message, { code: "BAD_REQUEST", details });
  },
  conflict(message: string) {
    return new AppError(409, message, { code: "CONFLICT" });
  },
  internal(message = "Internal server error") {
    return new AppError(500, message, { code: "INTERNAL_SERVER_ERROR" });
  },
} as const;