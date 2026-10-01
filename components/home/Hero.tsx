"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { PlayIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/utils";

export interface HeroData {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
  whatsappLabel: string;
  whatsappNumber: string;
}

/**
 * Home hero. Every field comes from Admin > Settings > Hero, so the section
 * can be re-skinned (image, copy, buttons, links, WhatsApp) without a deploy.
 */
export function Hero({
  hero,
  stats,
}: {
  hero: HeroData;
  stats: { channels: string; content: string; viewers: string };
}) {
  const { t } = useSite();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Backdrop */}
      {hero.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero.image}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            background:
              "radial-gradient(70rem 45rem at 20% 10%, color-mix(in srgb, var(--ls-brand) 30%, transparent), transparent 60%)," +
              "radial-gradient(60rem 40rem at 85% 25%, color-mix(in srgb, var(--ls-brand-2) 26%, transparent), transparent 60%)," +
              "radial-gradient(50rem 34rem at 50% 90%, color-mix(in srgb, var(--ls-brand) 18%, transparent), transparent 60%)",
          }}
        />
      )}

      {/* Darkening overlay so text stays legible on any image */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-canvas"
        style={{ opacity: hero.image ? Number(hero.image ? 0.68 : 0) : 0.35 }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-canvas to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="max-w-3xl">
          {hero.badge && (
            <span className="glass animate-fade-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
              </span>
              {hero.badge}
            </span>
          )}

          <h1 className="animate-fade-up mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">{hero.title}</span>
          </h1>

          <p className="animate-fade-up mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {hero.subtitle}
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3">
            <Link href={hero.primaryLink} className="contents">
              <Button size="lg">
                <PlayIcon className="h-4 w-4" />
                {hero.primaryLabel || t("common.watchNow")}
              </Button>
            </Link>

            <Link href={hero.secondaryLink} className="contents">
              <Button size="lg" variant="secondary">
                {hero.secondaryLabel || t("packages.title")}
              </Button>
            </Link>

            {hero.whatsappNumber && (
              <LinkButton
                size="lg"
                variant="whatsapp"
                external
                href={waLink(hero.whatsappNumber, `Hello, I need help with ${hero.title}`)}
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
                {hero.whatsappLabel || t("support.whatsapp")}
              </LinkButton>
            )}
          </div>

          {/* Trust stats */}
          <dl className="animate-fade-up mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              [stats.channels, t("home.channelCount")],
              [stats.content, t("nav.content")],
              [stats.viewers, t("home.viewerCount")],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-black tracking-tight text-gradient sm:text-3xl">
                  {value}
                </dt>
                <dd className="mt-1 text-xs text-muted sm:text-sm">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}