import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const AUTH_ROUTES = ["/login", "/register"];
const PUBLIC_PREFIXES = ["/api/health"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Always allow public API and health routes
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  // Authenticated users trying to access login/register are redirected to home
  if (hasSession && isAuthRoute) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Guests trying to access protected routes
  if (!hasSession && !isAuthRoute) {
    const isEnforced =
      process.env.NODE_ENV === "production" || process.env.DEV_AUTH_BYPASS === "false";

    if (isEnforced) {
      const returnUrl = encodeURIComponent(pathname + search);
      const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (metadata file)
     */
    "/((?!api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
