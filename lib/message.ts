import { ZodError } from "zod";
import { COMMON_MESSAGES, HTTP_ERROR_MESSAGES } from "@/constants/messages";
import { AppError } from "@/lib/errors/app-error";

/**
 * Standardized error message resolution for components, hooks, and services.
 * Extracts user-friendly error messages from AppError, ZodError, HTTP/Axios/Fetch,
 * Network errors, or generic Exceptions with guaranteed safe fallback.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return COMMON_MESSAGES.ERROR.UNKNOWN;
  }

  // 1. Domain AppError
  if (error instanceof AppError) {
    if (error.message && error.message.trim().length > 0) {
      return error.message;
    }
    switch (error.code) {
      case "UNAUTHORIZED":
        return COMMON_MESSAGES.ERROR.UNAUTHORIZED;
      case "FORBIDDEN":
        return COMMON_MESSAGES.ERROR.FORBIDDEN;
      case "NOT_FOUND":
        return COMMON_MESSAGES.ERROR.NOT_FOUND;
      case "CONFLICT":
        return COMMON_MESSAGES.ERROR.CONFLICT;
      case "VALIDATION_ERROR":
        return COMMON_MESSAGES.ERROR.VALIDATION;
      case "DATABASE_ERROR":
      case "INTERNAL_ERROR":
      default:
        return COMMON_MESSAGES.ERROR.SERVER;
    }
  }

  // 2. Zod validation error
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    if (firstIssue?.message) {
      return firstIssue.message;
    }
    return COMMON_MESSAGES.ERROR.VALIDATION;
  }

  // 3. Object with response / status (Axios / Fetch HTTP Response error)
  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;

    // Response status code
    const status =
      (typeof errObj.status === "number" && errObj.status) ||
      (typeof errObj.statusCode === "number" && errObj.statusCode) ||
      (typeof (errObj.response as Record<string, unknown> | undefined)?.status === "number" &&
        (errObj.response as Record<string, unknown>).status);

    if (typeof status === "number" && HTTP_ERROR_MESSAGES[status]) {
      return HTTP_ERROR_MESSAGES[status];
    }

    // Server-provided message field if present
    const responseData = (errObj.response as Record<string, unknown> | undefined)?.data;
    if (typeof responseData === "object" && responseData !== null) {
      const respMsg = (responseData as Record<string, unknown>).message;
      if (typeof respMsg === "string" && respMsg.trim()) {
        return respMsg;
      }
    }

    // Direct message property
    if (typeof errObj.message === "string" && errObj.message.trim()) {
      const msg = errObj.message.toLowerCase();
      if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("econnrefused")) {
        return COMMON_MESSAGES.ERROR.NETWORK;
      }
      if (msg.includes("timeout") || msg.includes("timed out")) {
        return COMMON_MESSAGES.ERROR.TIMEOUT;
      }
      return errObj.message;
    }
  }

  // 4. Standard JavaScript Error
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("econnrefused")) {
      return COMMON_MESSAGES.ERROR.NETWORK;
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return COMMON_MESSAGES.ERROR.TIMEOUT;
    }
    if (error.message.trim()) {
      return error.message;
    }
  }

  // 5. Fallback for primitive string error
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return COMMON_MESSAGES.ERROR.UNKNOWN;
}
