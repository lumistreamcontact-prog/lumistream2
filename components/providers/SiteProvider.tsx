"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";

export interface ClientLanguage {
  code: string;
  name: string;
  nativeName: string;
  dir: string;
}

export interface ClientSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteLogo: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundImage: string;
  backgroundOverlay: string;
  radius: string;
  glassIntensity: string;
  fontFamily: string;
  whatsappNumber: string;
  supportEmail: string;
  phone: string;
  address: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  telegramUrl: string;
  youtubeUrl: string;
  footerText: string;
  footerDisclaimer: string;
  showFooter: string;
  showSocial: string;
  copyright: string;
  currency: string;
  demoMode: string;
  siteUrl: string;
}

interface SiteContextValue {
  settings: ClientSettings;
  user: SessionUser | null;
  locale: string;
  dir: "rtl" | "ltr";
  languages: ClientLanguage[];
  t: (key: string) => string;
  refresh: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  children,
  settings: initialSettings,
  user,
  locale,
  dir,
  languages,
  dictionary,
}: {
  children: React.ReactNode;
  settings: ClientSettings;
  user: SessionUser | null;
  locale: string;
  dir: "rtl" | "ltr";
  languages: ClientLanguage[];
  dictionary: Record<string, string>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [currentUser, setCurrentUser] = useState(user);

  // The root layout re-sends `initialSettings` after every admin save. Adjust
  // state while rendering instead of in an effect to avoid a second pass.
  const [syncedSettings, setSyncedSettings] = useState(initialSettings);
  if (initialSettings !== syncedSettings) {
    setSyncedSettings(initialSettings);
    setSettings(initialSettings);
  }

  const t = useCallback((key: string) => dictionary[key] ?? key, [dictionary]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { user?: SessionUser | null };
      setCurrentUser(data.user ?? null);
    } catch {
      /* offline — keep the current value */
    }
  }, []);

  const value = useMemo<SiteContextValue>(
    () => ({
      settings,
      user: currentUser,
      locale,
      dir,
      languages,
      t,
      refresh,
    }),
    [settings, currentUser, locale, dir, languages, t, refresh],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}