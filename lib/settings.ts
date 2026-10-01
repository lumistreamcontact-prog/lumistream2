import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Every value an administrator can change from the Admin > Settings /
 * Appearance / Languages screens lives here as a typed row in the `Setting`
 * table. Defaults are defined below and merged over whatever is in the DB, so
 * a fresh install is fully functional before seeding.
 */
export const SETTING_DEFAULTS = {
  /* Brand ------------------------------------------------------------ */
  siteName: "LumiStream",
  siteTagline: "Premium streaming, everywhere",
  siteDescription:
    "LumiStream is a modern OTT platform delivering live TV channels and on-demand content in multiple languages, on every screen.",
  siteLogo: "",
  siteFavicon: "",
  /* Theme ------------------------------------------------------------ */
  primaryColor: "#e11d48",
  secondaryColor: "#0ea5e9",
  backgroundImage: "",
  backgroundOverlay: "0.72",
  radius: "1rem",
  glassIntensity: "0.12",
  fontFamily: "system",
  defaultLocale: "ar",
  /* Contact ---------------------------------------------------------- */
  /**
   * International format, digits only (no `+`, spaces or dashes) — that is the
   * form `waLink()` needs to build a valid `wa.me` URL. `NEXT_PUBLIC_WHATSAPP_NUMBER`
   * lets a deployment override the fallback without a code change; anything saved
   * from Admin > Settings lives in the `Setting` table and wins over both.
   */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "212786172756",
  supportEmail: "support@lumistream.example",
  phone: "",
  address: "",
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://twitter.com",
  instagramUrl: "https://instagram.com",
  telegramUrl: "https://t.me",
  youtubeUrl: "https://youtube.com",
  /* Hero ------------------------------------------------------------- */
  heroImage: "",
  heroTitle: "Watch the world, live",
  heroSubtitle:
    "Thousands of channels and on-demand titles in one place. Stream on your TV, tablet, phone or desktop.",
  heroPrimaryLabel: "Watch now",
  heroPrimaryLink: "/channels",
  heroSecondaryLabel: "Explore packages",
  heroSecondaryLink: "/packages",
  heroWhatsappLabel: "Support on WhatsApp",
  heroBadge: "Live 24/7",
  /* Footer ----------------------------------------------------------- */
  footerText: "© {year} LumiStream. All rights reserved.",
  footerDisclaimer:
    "LumiStream only distributes content for which it holds the required licences. All channel marks belong to their respective owners.",
  /* Commerce --------------------------------------------------------- */
  currency: "EUR",
  demoMode: "true",
  /* Footer toggles --------------------------------------------------- */
  showFooter: "true",
  showSocial: "true",
  copyright: "",
} as const;

export type SiteSettings = Record<keyof typeof SETTING_DEFAULTS, string>;

export type SiteSettingKey = keyof typeof SETTING_DEFAULTS;

/** Setting rows grouped per admin screen. */
export const SETTING_GROUPS: Record<string, SiteSettingKey[]> = {
  general: [
    "siteName",
    "siteTagline",
    "siteDescription",
    "siteLogo",
    "siteFavicon",
    "footerText",
    "footerDisclaimer",
    "copyright",
    "showFooter",
    "showSocial",
  ],
  appearance: [
    "primaryColor",
    "secondaryColor",
    "backgroundImage",
    "backgroundOverlay",
    "radius",
    "glassIntensity",
    "fontFamily",
  ],
  hero: [
    "heroBadge",
    "heroImage",
    "heroTitle",
    "heroSubtitle",
    "heroPrimaryLabel",
    "heroPrimaryLink",
    "heroSecondaryLabel",
    "heroSecondaryLink",
    "heroWhatsappLabel",
  ],
  contact: [
    "whatsappNumber",
    "supportEmail",
    "phone",
    "address",
    "facebookUrl",
    "twitterUrl",
    "instagramUrl",
    "telegramUrl",
    "youtubeUrl",
  ],
  commerce: ["currency", "demoMode", "defaultLocale"],
};

/**
 * Read every setting, merged over the defaults. Cached per request.
 *
 * A database failure returns the defaults instead of throwing: the root layout
 * needs this on every render, and `next build` evaluates it while generating
 * `/_not-found` on a machine that may have no database at all. Losing
 * admin-tuned values is survivable; failing the whole build is not.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await prisma.setting.findMany();
    const map = {} as Record<string, string>;
    for (const row of rows) map[row.key] = row.value;
    return { ...SETTING_DEFAULTS, ...map } as SiteSettings;
  } catch (error) {
    console.warn("[settings] falling back to defaults:", (error as Error).message);
    return { ...SETTING_DEFAULTS };
  }
});

/** Upsert a batch of settings. Called from the Admin Settings screens. */
export async function saveSettings(
  values: Record<string, string>,
  group = "general",
): Promise<void> {
  const entries = Object.entries(values).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value ?? ""), group },
        update: { value: String(value ?? ""), group },
      }),
    ),
  );
}

/** Lightweight site config for client components (no server-only imports). */
export type PublicSettings = Pick<
  SiteSettings,
  | "siteName"
  | "siteTagline"
  | "siteLogo"
  | "whatsappNumber"
  | "supportEmail"
  | "currency"
  | "demoMode"
  | "defaultLocale"
>;