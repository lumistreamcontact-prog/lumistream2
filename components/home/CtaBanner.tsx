"use client";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";

/** Bottom CTA — guests see register, members see packages. */
export function CtaBanner() {
  const { t, user } = useSite();

  return (
    <section className="brand-gradient-bg relative overflow-hidden rounded-card p-8 text-center text-white shadow-2xl sm:p-12">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_-20%,rgba(255,255,255,0.25),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          {t("home.ctaTitle")}
        </h2>
        <p className="mt-2 text-sm text-white/85 sm:text-base">
          {t("home.ctaText")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link href="/packages" className="contents">
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 bg-white text-black hover:bg-white/90"
              >
                {t("packages.title")}
              </Button>
            </Link>
          ) : (
            <Link href="/register" className="contents">
              <Button
                size="lg"
                variant="secondary"
                className="border-white/30 bg-white text-black hover:bg-white/90"
              >
                {t("home.ctaButton")}
              </Button>
            </Link>
          )}
          <Link href="/channels" className="contents">
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/15 hover:text-white"
            >
              {t("common.watchNow")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
