import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { SupportForm } from "@/components/forms/SupportForm";
import { PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { LinkButton } from "@/components/ui/Button";
import { ClockIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };

const FAQ = [
  ["support.faqDeviceQ", "support.faqDeviceA"],
  ["support.faqPlaybackQ", "support.faqPlaybackA"],
  ["support.faqRefundQ", "support.faqRefundA"],
] as const;

export default async function SupportPage() {
  const [{ t }, settings] = await Promise.all([getDictionary(), getSettings()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t("support.title")} description={t("support.subtitle")} />

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <SupportForm />

        <aside className="space-y-5">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("support.channels")}
            </h2>

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
                    {t("support.whatsapp")}
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

            <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-faint">
              <ClockIcon className="h-3.5 w-3.5" />
              {t("support.hours")}
            </p>
          </div>

          {settings.address && (
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("footer.legal")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{settings.address}</p>
            </div>
          )}
        </aside>
      </div>

      <section className="mt-16">
        <SectionHeader title={t("support.faq")} />
        <div className="grid gap-4 md:grid-cols-3">
          {FAQ.map(([question, answer]) => (
            <div key={question} className="surface-card p-5">
              <h3 className="text-sm font-semibold">{t(question)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(answer)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <LinkButton href="/about" variant="secondary">
            {t("about.title")}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}