import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { LinkButton } from "@/components/ui/Button";
import { CardIcon, FilmIcon, HeadsetIcon, ShieldIcon, SparkIcon, TvIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/utils";

export const metadata: Metadata = { title: "About" };

const PILLARS = [
  { icon: TvIcon, key: "home.featuredChannels" },
  { icon: FilmIcon, key: "home.latestContent" },
  { icon: CardIcon, key: "packages.securePayment" },
  { icon: HeadsetIcon, key: "support.subtitle" },
] as const;

export default async function AboutPage() {
  const [{ t }, settings] = await Promise.all([getDictionary(), getSettings()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader title={t("about.title")} description={settings.siteTagline} />

      <section className="mt-8">
        <SectionHeader title={t("about.mission")} />
        <p className="text-base leading-relaxed text-muted">{settings.siteDescription}</p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <div key={pillar.key} className="surface-card p-5">
            <pillar.icon className="h-6 w-6 text-brand" />
            <p className="mt-3 text-sm font-medium">{t(pillar.key)}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <SectionHeader title={t("footer.legal")} />
        <div className="surface-card flex items-start gap-4 p-6">
          <ShieldIcon className="h-6 w-6 shrink-0 text-ok" />
          <p className="text-sm leading-relaxed text-muted">{t("about.legalText")}</p>
        </div>
      </section>

      <section className="mt-14 text-center">
        <SparkIcon className="mx-auto h-7 w-7 text-brand" />
        <p className="mt-3 text-lg font-bold">{t("home.ctaTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("home.ctaText")}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkButton href="/packages" size="lg">
            {t("packages.title")}
          </LinkButton>
          {settings.whatsappNumber && (
            <LinkButton
              href={waLink(settings.whatsappNumber, `Hello ${settings.siteName}`)}
              external
              variant="whatsapp"
              size="lg"
            >
              {t("support.whatsapp")}
            </LinkButton>
          )}
          <LinkButton href="/support" variant="secondary" size="lg">
            {t("nav.support")}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}