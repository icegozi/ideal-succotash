export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toPublicError(error: unknown): {
  code: AppErrorCode;
  message: string;
} {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }

  console.error("Unexpected application error", error);
  return {
    code: "INTERNAL_ERROR",
    message: "Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử lại.",
  };
}
