import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { audit, track } from "@/lib/audit";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { LOGIN_WINDOW_MS, MAX_LOGIN_ATTEMPTS } from "@/lib/constants";
import { normalizeEmail, validateEmail } from "@/lib/validation";

/** POST /api/auth/login */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const key = `login:${ip}`;

  const limit = rateLimit(key, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { errors: { form: "errors.tooManyAttempts" } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errors: { form: "errors.generic" } }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember !== false;

  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ errors: { email: emailError } }, { status: 422 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      password: true,
      isActive: true,
    },
  });

  // Compare even when the user is missing, to avoid leaking which emails exist.
  const valid = user ? await verifyPassword(password, user.password) : false;

  if (!user || !valid) {
    return NextResponse.json({ errors: { form: "errors.invalidCredentials" } }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ errors: { form: "errors.accountDisabled" } }, { status: 403 });
  }

  resetRateLimit(key);
  await createSessionCookie(user.id, user.role, remember);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await track("login", { userId: user.id, path: "/login", ip });
  await audit({
    request,
    userId: user.id,
    actorName: user.email,
    action: "auth.login",
    entity: "User",
    entityId: user.id,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
}