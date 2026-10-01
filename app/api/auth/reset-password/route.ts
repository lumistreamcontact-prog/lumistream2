import { NextResponse, type NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hashToken } from "@/lib/stream-token";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/validation";

/**
 * POST /api/auth/reset-password — consume a single-use reset token.
 *
 * The token is stored hashed, is bound to an expiry, and is marked used in the
 * same transaction as the password write so a link can never be replayed.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
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

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirm = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  const errors: Record<string, string> = {};
  if (!token) errors.token = "errors.invalidToken";
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (password && password !== confirm) errors.confirmPassword = "errors.passwordMismatch";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { email: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ errors: { token: "errors.invalidToken" } }, { status: 400 });
  }

  const hash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await audit({
    request,
    userId: record.userId,
    actorName: record.user.email,
    action: "auth.reset_password",
    entity: "User",
    entityId: record.userId,
  });

  return NextResponse.json({ ok: true });
}