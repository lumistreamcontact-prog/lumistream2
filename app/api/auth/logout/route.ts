import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { destroySessionCookie, SESSION_COOKIE } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * Sign-out. Accepts both a POST (fetch) and a plain form submit, so the mobile
 * drawer can use a zero-JavaScript `<form action>`.
 */
async function handle(request: NextRequest) {
  const user = await getSessionUser();

  if (user) {
    await audit({
      request,
      userId: user.id,
      actorName: user.email,
      action: "auth.logout",
      entity: "User",
      entityId: user.id,
    });
  }

  await destroySessionCookie();
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  // Form navigations must get a redirect; fetch calls get JSON.
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }
  return NextResponse.json({ ok: true });
}

export const POST = handle;
export const GET = handle;