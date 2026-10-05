"use server";

import { redirect } from "next/navigation";

import { clearSessionCookie, getSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { toPublicError } from "@/lib/errors/app-error";
import { loginSchema, registerSchema } from "@/modules/auth/schemas/auth.schema";
import { getAuthService } from "@/modules/auth/services";
import type { AuthActionState } from "@/modules/auth/types/auth.types";

function extractFormData(input: unknown): Record<string, unknown> {
  if (input instanceof FormData) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of input.entries()) {
      if (key === "rememberMe") {
        data[key] = value === "true" || value === "on";
      } else {
        data[key] = typeof value === "string" ? value.trim() : value;
      }
    }
    return data;
  }
  if (typeof input === "object" && input !== null) {
    return input as Record<string, unknown>;
  }
  return {};
}

export async function loginAction(
  _prevState: AuthActionState,
  payload: unknown,
): Promise<AuthActionState> {
  try {
    const rawData = extractFormData(payload);
    const returnUrl = typeof rawData.returnUrl === "string" && rawData.returnUrl.startsWith("/")
      ? rawData.returnUrl
      : "/";

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Vui lòng kiểm tra lại thông tin đăng nhập.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { sessionId } = await getAuthService().login(parsed.data);
    await setSessionCookie(sessionId, parsed.data.rememberMe);

    return {
      status: "success",
      message: "Đăng nhập thành công!",
      redirectTo: returnUrl,
    };
  } catch (error) {
    const pub = toPublicError(error);
    return {
      status: "error",
      message: pub.message,
    };
  }
}

export async function registerAction(
  _prevState: AuthActionState,
  payload: unknown,
): Promise<AuthActionState> {
  try {
    const rawData = extractFormData(payload);
    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Vui lòng kiểm tra lại các trường được đánh dấu.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { sessionId } = await getAuthService().register(parsed.data);
    await setSessionCookie(sessionId, false);

    return {
      status: "success",
      message: "Đăng ký tài khoản thành công!",
      redirectTo: "/",
    };
  } catch (error) {
    const pub = toPublicError(error);
    return {
      status: "error",
      message: pub.message,
    };
  }
}

export async function logoutAction(): Promise<void> {
  const sessionId = await getSessionCookie();
  if (sessionId) {
    try {
      await getAuthService().logout(sessionId);
    } catch {
      // Fallback clean-up
    }
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function getCurrentUserAction() {
  const sessionId = await getSessionCookie();
  if (!sessionId) return null;
  return await getAuthService().validateSession(sessionId);
}
