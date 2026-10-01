import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { validatePassword } from "@/lib/validation";

/** POST /api/account/password — change password after re-verifying the old one. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errors: { form: "errors.generic" } }, { status: 400 });
  }

  const current = typeof body.current === "string" ? body.current : "";
  const next = typeof body.next === "string" ? body.next : "";
  const confirm = typeof body.confirm === "string" ? body.confirm : "";

  const errors: Record<string, string> = {};
  if (!current) errors.form = "errors.passwordRequired";
  const nextError = validatePassword(next);
  if (nextError) errors.next = nextError;
  if (next && next !== confirm) errors.confirmPassword = "errors.passwordMismatch";
  if (next && current && next === current) errors.next = "errors.passwordMismatch";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });
  if (!row || !(await verifyPassword(current, row.password))) {
    return NextResponse.json({ errors: { form: "errors.invalidCredentials" } }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(next) },
  });

  // Invalidate any outstanding reset links after a password change.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await audit({
    request,
    userId: user.id,
    actorName: user.email,
    action: "account.password.change",
    entity: "User",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true });
}