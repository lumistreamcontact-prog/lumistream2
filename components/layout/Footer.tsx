"use client";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/utils";

/** Social links rendered as filled paths so no icon library is needed. */
const SOCIALS = [
  {
    key: "facebookUrl" as const,
    label: "Facebook",
    path: "M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z",
  },
  {
    key: "twitterUrl" as const,
    label: "X",
    path: "M4 4h4.2l4 5.6L17 4h3l-6.3 7.4L20.5 20h-4.2l-4.3-6-5 6H4l6.8-8L4 4z",
  },
  {
    key: "instagramUrl" as const,
    label: "Instagram",
    path: "M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zm0-2.4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm6.6-.6a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0zM12 4.8c2.3 0 2.6 0 3.5.1.9 0 1.4.2 1.7.3.4.2.7.4 1 .7.3.3.5.6.7 1 .1.3.3.8.3 1.7.1.9.1 1.2.1 3.5s0 2.6-.1 3.5c0 .9-.2 1.4-.3 1.7-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.1-.8.3-1.7.3-.9.1-1.2.1-3.5.1s-2.6 0-3.5-.1c-.9 0-1.4-.2-1.7-.3-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.1-.3-.3-.8-.3-1.7C4.8 14.6 4.8 14.3 4.8 12s0-2.6.1-3.5c0-.9.2-1.4.3-1.7.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.1.8-.3 1.7-.3.9-.1 1.2-.1 3.5-.1z",
  },
  {
    key: "telegramUrl" as const,
    label: "Telegram",
    path: "M21 5.3 2.9 11.1c-.9.3-.9.9-.1 1.1l4.7 1.5 1.8 5.5c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9l3.3-15.5c.3-1.2-.5-1.8-1.5-1.1zM7.8 13.6l10-6.3c.5-.3.9-.1.6.2l-8.5 7.7-.3 3.5-1.8-5.1z",
  },
  {
    key: "youtubeUrl" as const,
    label: "YouTube",
    path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z",
  },
];

const EXPLORE = [
  ["/channels", "nav.channels"],
  ["/packages", "nav.packages"],
  ["/content", "nav.content"],
  ["/about", "nav.about"],
] as const;

const ACCOUNT_LINKS = [
  ["/login", "nav.login"],
  ["/register", "nav.register"],
  ["/account", "nav.account"],
  ["/favorites", "nav.favorites"],
] as const;

export function Footer() {
  const { t, settings } = useSite();

  if (settings.showFooter === "false") return null;

  const year = new Date().getFullYear();
  const copyright = settings.copyright || settings.footerText.replace("{year}", String(year));
  const socials = SOCIALS.map((s) => ({ ...s, href: settings[s.key] })).filter(
    (s) => s.href && /^https?:\/\//i.test(s.href),
  );
return (
    <footer className="mt-20 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              {settings.siteLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.siteLogo} alt="" className="h-9 w-auto object-contain" />
              ) : (
                <span className="brand-gradient-bg grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white">
                  {settings.siteName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="text-lg font-bold">{settings.siteName}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              {settings.siteDescription}
            </p>

            {settings.showSocial !== "false" && socials.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-line text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          <FooterNav title={t("footer.explore")} links={EXPLORE} t={t} />
          <FooterNav title={t("footer.account")} links={ACCOUNT_LINKS} t={t} />

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
              {t("nav.support")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {settings.whatsappNumber && (
                <li>
                  <a
                    href={waLink(settings.whatsappNumber, `Hello ${settings.siteName} support`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-muted transition-colors hover:text-[#25D366]"
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
                    +{settings.whatsappNumber}
                  </a>
                </li>
              )}
              {settings.supportEmail && (
                <li>
                  <a
                    href={`mailto:${settings.supportEmail}`}
                    className="flex items-center gap-2.5 text-muted transition-colors hover:text-brand"
                  >
                    <MailIcon className="h-4 w-4 shrink-0" />
                    {settings.supportEmail}
                  </a>
                </li>
              )}
              {settings.phone && (
                <li>
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-2.5 text-muted transition-colors hover:text-brand"
                  >
                    <PhoneIcon className="h-4 w-4 shrink-0" />
                    {settings.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {settings.footerDisclaimer && (
          <p className="mt-10 rounded-xl border border-line bg-surface/50 px-4 py-3 text-xs leading-relaxed text-faint">
            {settings.footerDisclaimer}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-faint sm:flex-row">
          <p>{copyright}</p>
          <p>{t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterNav({
  title,
  links,
  t,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
  t: (key: string) => string;
}) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([href, key]) => (
          <li key={href}>
            <Link href={href} className="text-muted transition-colors hover:text-brand">
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}