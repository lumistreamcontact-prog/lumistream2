import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getActiveLanguages, getDictionary, getLocale } from "@/lib/i18n";
import { SiteProvider, type ClientSettings } from "@/components/providers/SiteProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { BUNDLED_LOCALES } from "@/lib/constants";
import { TRANSLATION_KEYS } from "@/lib/i18n/keys";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(base),
    title: {
      default: `${s.siteName} — ${s.siteTagline}`,
      template: `%s | ${s.siteName}`,
    },
    description: s.siteDescription,
    applicationName: s.siteName,
    keywords: ["OTT", "streaming", "live TV", "channels", "movies", s.siteName],
    authors: [{ name: s.siteName }],
    openGraph: {
      type: "website",
      siteName: s.siteName,
      title: `${s.siteName} — ${s.siteTagline}`,
      description: s.siteDescription,
      url: base,
      images: s.heroImage ? [{ url: s.heroImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${s.siteName} — ${s.siteTagline}`,
      description: s.siteDescription,
    },
    icons: s.siteFavicon ? { icon: s.siteFavicon } : undefined,
    alternates: {
      canonical: base,
      languages: Object.fromEntries(BUNDLED_LOCALES.map((l) => [l, base])),
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Turn admin-editable theme values into CSS custom properties on <html>. */
function themeStyle(s: Awaited<ReturnType<typeof getSettings>>): CSSProperties {
  return {
    "--ls-brand": s.primaryColor,
    "--ls-brand-2": s.secondaryColor,
    "--ls-overlay": s.backgroundOverlay || "0.72",
    "--ls-glass": s.glassIntensity || "0.12",
    "--ls-radius": s.radius || "1rem",
    ...(s.backgroundImage
      ? {
          backgroundImage: `url(${s.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }
      : {}),
  } as CSSProperties;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [settings, user, locale, { dir, t }] = await Promise.all([
    getSettings(),
    getSessionUser(),
    getLocale(),
    getDictionary(),
  ]);
  const languages = await getActiveLanguages();

  const clientSettings: ClientSettings = {
    siteName: settings.siteName,
    siteTagline: settings.siteTagline,
    siteDescription: settings.siteDescription,
    siteLogo: settings.siteLogo,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    backgroundImage: settings.backgroundImage,
    backgroundOverlay: settings.backgroundOverlay,
    radius: settings.radius,
    glassIntensity: settings.glassIntensity,
    fontFamily: settings.fontFamily,
    whatsappNumber: settings.whatsappNumber,
    supportEmail: settings.supportEmail,
    phone: settings.phone,
    address: settings.address,
    facebookUrl: settings.facebookUrl,
    twitterUrl: settings.twitterUrl,
    instagramUrl: settings.instagramUrl,
    telegramUrl: settings.telegramUrl,
    youtubeUrl: settings.youtubeUrl,
    footerText: settings.footerText,
    footerDisclaimer: settings.footerDisclaimer,
    showFooter: settings.showFooter,
    showSocial: settings.showSocial,
    copyright: settings.copyright,
    currency: settings.currency,
    demoMode: settings.demoMode,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };

  // Flatten the dictionary once so client components get a serialisable map.
  const dictionary: Record<string, string> = {};
  for (const key of TRANSLATION_KEYS) dictionary[key] = t(key);

  return (
    <html lang={locale} dir={dir} style={themeStyle(settings)} suppressHydrationWarning>
      <body>
        <SiteProvider
          settings={clientSettings}
          user={user}
          locale={locale}
          dir={dir}
          languages={languages}
          dictionary={dictionary}
        >
          <ToastProvider>{children}</ToastProvider>
        </SiteProvider>
      </body>
    </html>
  );
}