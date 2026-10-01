import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { normalizeEmail, sanitizeText, validateName } from "@/lib/validation";

/** PATCH /api/account — update the signed-in user's profile fields. */
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errors: { form: "errors.generic" } }, { status: 400 });
  }

  const firstName = sanitizeText(body.firstName, 60);
  const lastName = sanitizeText(body.lastName, 60);
  const phone = sanitizeText(body.phone, 40);
  // The email is intentionally read-only: changing it needs a verification flow.
  const email = body.email ? normalizeEmail(String(body.email)) : null;

  const errors: Record<string, string> = {};
  if (validateName(firstName)) errors.firstName = "errors.nameRequired";
  if (validateName(lastName)) errors.lastName = "errors.nameRequired";
  if (email && email !== user.email) errors.email = "errors.emailRequired";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
    },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });

  await audit({
    request,
    userId: user.id,
    actorName: user.email,
    action: "account.profile.update",
    entity: "User",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true, user: updated });
}