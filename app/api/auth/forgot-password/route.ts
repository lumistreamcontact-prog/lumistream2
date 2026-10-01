import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/stream-token";
import { normalizeEmail, validateEmail } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/auth/forgot-password
 *
 * Issues a single-use reset token. The response is intentionally identical
 * whether or not the account exists so the endpoint cannot be used to
 * enumerate registered email addresses.
 *
 * There is no mail transport wired up in this project: the raw link is
 * returned in the response body **only when NODE_ENV !== "production"**, so
 * local development works without an SMTP provider. Send it with your mailer
 * (or the admin) before deploying.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
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
  const emailError = validateEmail(email);
  if (emailError) return NextResponse.json({ errors: { email: emailError } }, { status: 422 });

  const settings = await getSettings();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  let devLink: string | undefined;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, isActive: true },
  });

  if (user?.isActive) {
    // Only one live token per account — older links stop working.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    devLink = `${base}/reset-password?token=${token}`;
    await audit({
      request,
      userId: user.id,
      actorName: user.email,
      action: "auth.forgot_password",
      entity: "User",
      entityId: user.id,
    });

    // --- Deliver the email here (Nodemailer / Resend / SES). ----------------
    void sendResetEmail(settings.supportEmail, email, devLink);
  }

  const payload: { ok: true; devLink?: string } = { ok: true };
  if (devLink && process.env.NODE_ENV !== "production") payload.devLink = devLink;

  return NextResponse.json(payload);
}

/**
 * Placeholder mailer. Swap the body for a real provider — it receives the
 * recipient address and the fully-built reset link.
 */
async function sendResetEmail(_from: string, to: string, link: string): Promise<void> {
  console.info(`[password-reset] ${to} -> ${link}`);
}