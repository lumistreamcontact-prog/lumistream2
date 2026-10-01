"use client";
import { useSite } from "@/components/providers/SiteProvider";
import { CardIcon, PlayIcon, UserIcon } from "@/components/ui/Icons";

const STEPS = [
  { icon: UserIcon, titleKey: "home.step1Title", textKey: "home.step1Text" },
  { icon: CardIcon, titleKey: "home.step2Title", textKey: "home.step2Text" },
  { icon: PlayIcon, titleKey: "home.step3Title", textKey: "home.step3Text" },
] as const;

/** "How it works" — 3 steps explaining signup → package → watch. */
export function HowItWorks() {
  const { t } = useSite();

  return (
    <section aria-labelledby="how-it-works">
      <h2
        id="how-it-works"
        className="mb-5 text-center text-xl font-bold tracking-tight sm:text-2xl"
      >
        {t("home.howItWorks")}
      </h2>

      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.titleKey}
            className="surface-card hover-lift relative overflow-hidden p-6 text-center"
          >
            <span
              aria-hidden
              className="text-gradient pointer-events-none absolute end-4 top-2 text-5xl font-black opacity-15"
            >
              {i + 1}
            </span>
            <span className="brand-gradient-bg mx-auto grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg">
              <step.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-semibold">{t(step.titleKey)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {t(step.textKey)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
