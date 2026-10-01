import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { audit, track } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  collectErrors,
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";

/** POST /api/auth/register — creates an account and signs the user in. */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
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

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  const errors = collectErrors({
    firstName: validateName(firstName),
    lastName: validateName(lastName),
    email: validateEmail(email),
    password: validatePassword(password),
    ...(password !== confirmPassword ? { confirmPassword: "errors.passwordMismatch" } : {}),
  });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ errors: { email: "errors.emailTaken" } }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      firstName: firstName.slice(0, 60),
      lastName: lastName.slice(0, 60),
      email,
      password: await hashPassword(password),
      role: "user",
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  await createSessionCookie(user.id, user.role, true);
  await track("signup", { userId: user.id, path: "/register", ip });
  await audit({
    request,
    userId: user.id,
    actorName: user.email,
    action: "auth.register",
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