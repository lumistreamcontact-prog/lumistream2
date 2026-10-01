import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUNDLED_LOCALES } from "@/lib/constants";

/** POST /api/locale — persists the visitor's language choice. */
export async function POST(request: NextRequest) {
  let locale = "";
  try {
    const body = (await request.json()) as { locale?: string };
    locale = typeof body.locale === "string" ? body.locale.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Only accept locales that exist and are enabled in the admin.
  const exists = await prisma.language.findFirst({
    where: { code: locale, isActive: true },
    select: { code: true },
  });

  if (!exists && !BUNDLED_LOCALES.includes(locale as (typeof BUNDLED_LOCALES)[number])) {
    return NextResponse.json({ error: "unsupported_locale" }, { status: 422 });
  }

  const store = await cookies();
  store.set("ls_locale", locale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true, locale });
}