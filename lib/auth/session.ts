import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_SESSION_HOURS,
  REMEMBER_SESSION_DAYS,
  SESSION_COOKIE_NAME,
} from "@/modules/auth/types/auth.types";

export { DEFAULT_SESSION_HOURS, REMEMBER_SESSION_DAYS, SESSION_COOKIE_NAME };

// Configures HTTP-only session cookie options adhering to modern security standards:
// HttpOnly prevents JavaScript access (mitigating XSS),
// Secure ensures HTTPS transmission in production,
// SameSite=Lax prevents cross-site request forgery while preserving top-level navigation.
export async function setSessionCookie(sessionId: string, rememberMe = false): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = rememberMe
    ? REMEMBER_SESSION_DAYS * 24 * 60 * 60
    : DEFAULT_SESSION_HOURS * 60 * 60;

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
