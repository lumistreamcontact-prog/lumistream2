import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeEmail, sanitizeText, validateEmail, validateName } from "@/lib/validation";

/**
 * POST /api/support — opens a `SupportTicket` from the public contact form.
 * Signed-in visitors have their ticket linked to their account so it shows up
 * in `/account` as well.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`support:${ip}`, 6, 60 * 60 * 1000);
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

  const name = sanitizeText(body.name, 120);
  const email = normalizeEmail(sanitizeText(body.email, 180));
  const phone = sanitizeText(body.phone, 40) || null;
  const subject = sanitizeText(body.subject, 160);
  const message = sanitizeText(body.message, 4000);

  const errors: Record<string, string> = {};
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!subject) errors.subject = "support.subjectRequired";
  if (!message) errors.message = "support.messageRequired";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const user = await getSessionUser();

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user?.id ?? null,
      name,
      email,
      phone,
      subject,
      message,
      status: "open",
      priority: user ? "normal" : "low",
    },
    select: { id: true },
  });

  await track("contact", {
    userId: user?.id ?? null,
    path: "/support",
    meta: { subject },
    ip,
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}