import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "../prisma";
import { BUNDLED_LOCALES, DEFAULT_LANGUAGES, FALLBACK_LOCALE } from "../constants";
import { en } from "./en";
import { ar } from "./ar";
import { fr } from "./fr";
import { es } from "./es";

const BUNDLES: Record<string, Record<string, string>> = { en, ar, fr, es };

/** The reference bundle widened for dynamic (string-keyed) lookups. */
const REFERENCE: Record<string, string> = en;

export type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  dir: string;
};

/**
 * Resolve the active locale for the current request:
 * 1. the `ls_locale` cookie (set by the language switcher / `setLocale` route)
 * 2. the site's `defaultLocale` setting
 * 3. the built-in fallback
 *
 * Database lookups degrade to the bundled default rather than throwing — the
 * root layout calls this on every render, including at build time.
 */
export const getLocale = cache(async (): Promise<string> => {
  const store = await cookies();
  const fromCookie = store.get("ls_locale")?.value;
  if (fromCookie) return fromCookie;

  try {
    const row = await prisma.setting.findUnique({
      where: { key: "defaultLocale" },
      select: { value: true },
    });
    if (row?.value) return row.value;
  } catch {
    /* database unavailable — use the bundled fallback */
  }

  return FALLBACK_LOCALE;
});

export async function getDirection(locale: string): Promise<"rtl" | "ltr"> {
  if (locale === "ar") return "rtl";
  try {
    const row = await prisma.language.findUnique({
      where: { code: locale },
      select: { dir: true },
    });
    return row?.dir === "rtl" ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
}

/** Translation function bound to the request locale. */
export async function getDictionary(): Promise<{
  locale: string;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
}> {
  const locale = await getLocale();
  const dir = await getDirection(locale);
  const bundle = BUNDLES[locale] ?? BUNDLES[FALLBACK_LOCALE] ?? REFERENCE;
  const fallback = BUNDLES[FALLBACK_LOCALE] ?? REFERENCE;

  const t = (key: string): string =>
    bundle[key] ?? fallback[key] ?? REFERENCE[key] ?? key;

  return { locale, dir, t };
}

/** Languages enabled in the admin (falls back to the bundled set). */
export async function getActiveLanguages(): Promise<LanguageOption[]> {
  let rows: { code: string; name: string; nativeName: string; dir: string }[];

  try {
    rows = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { code: true, name: true, nativeName: true, dir: true },
    });
  } catch {
    return DEFAULT_LANGUAGES.map((l) => ({ ...l }));
  }

  if (rows.length === 0) {
    return DEFAULT_LANGUAGES.map((l) => ({ ...l }));
  }

  // Locales we have no bundle for still appear in the switcher (admin-managed),
  // but rendering falls back to the default bundle.
  return rows.map((l) => ({
    code: l.code,
    name: l.name,
    nativeName: l.nativeName,
    dir: l.dir,
  }));
}

export function hasBundle(locale: string): boolean {
  return BUNDLED_LOCALES.includes(locale as (typeof BUNDLED_LOCALES)[number]);
}

/** Server-side helper for admin screens that show labels in every language. */
export function localeLabel(code: string): string {
  const lang = DEFAULT_LANGUAGES.find((l) => l.code === code);
  if (lang) return `${lang.nativeName} (${lang.name})`;
  return code.toUpperCase();
}