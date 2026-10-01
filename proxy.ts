import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic route protection (Next.js 16 renamed `middleware` to `proxy`).
 *
 * This runs on the Edge runtime, so it can only check for the *presence* of a
 * signed session cookie — the authoritative role/entitlement checks happen in
 * the server components and route handlers via `lib/auth.ts`. It exists purely
 * to avoid flashing protected pages to anonymous visitors.
 */
const SESSION_COOKIE = "ls_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const needsAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin");

  if (needsAuth && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Signed-in users should not sit on the login/register screens.
  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/favorites/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};