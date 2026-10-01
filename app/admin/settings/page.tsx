import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { SettingsForm, type SettingField } from "@/components/admin/SettingsForm";
import { WhatsAppCard } from "@/components/admin/WhatsAppCard";
import { PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { CURRENCIES, DEFAULT_LANGUAGES } from "@/lib/constants";

export const metadata: Metadata = { title: "Settings" };

const LANGUAGE_OPTIONS = DEFAULT_LANGUAGES.map((l) => ({ value: l.code, label: l.nativeName }));
const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.symbol} ${c.code} — ${c.label}`,
}));

const GENERAL: SettingField[] = [
  { name: "siteName", labelKey: "admin.siteName", kind: "text", required: true },
  { name: "siteTagline", labelKey: "admin.siteTagline", kind: "text" },
  { name: "siteLogo", labelKey: "admin.logo", kind: "url" },
  { name: "siteFavicon", labelKey: "siteFavicon", kind: "url" },
  { name: "siteDescription", labelKey: "admin.description", kind: "textarea", span: 2 },
  { name: "footerText", labelKey: "admin.footerText", kind: "text", span: 2 },
  { name: "footerDisclaimer", labelKey: "admin.footerDisclaimer", kind: "textarea", span: 2 },
  { name: "copyright", labelKey: "admin.copyright", kind: "text", span: 2 },
  { name: "showFooter", labelKey: "admin.showFooter", kind: "switch" },
  { name: "showSocial", labelKey: "admin.showSocial", kind: "switch" },
];

const HERO: SettingField[] = [
  { name: "heroBadge", labelKey: "admin.heroBadge", kind: "text" },
  { name: "heroImage", labelKey: "admin.heroImage", kind: "url" },
  { name: "heroTitle", labelKey: "admin.heroTitle", kind: "text", span: 2 },
  { name: "heroSubtitle", labelKey: "admin.heroSubtitle", kind: "textarea", span: 2 },
  { name: "heroPrimaryLabel", labelKey: "admin.heroPrimaryLabel", kind: "text" },
  { name: "heroPrimaryLink", labelKey: "admin.heroPrimaryLink", kind: "text" },
  { name: "heroSecondaryLabel", labelKey: "admin.heroSecondaryLabel", kind: "text" },
  { name: "heroSecondaryLink", labelKey: "admin.heroSecondaryLink", kind: "text" },
  { name: "heroWhatsappLabel", labelKey: "admin.heroWhatsappLabel", kind: "text", span: 2 },
];

/**
 * `whatsappNumber` is deliberately absent from this list: it has its own card at
 * the top of the page with validation and a live link preview, and two inputs
 * writing the same setting would let the two cards silently overwrite each other.
 */
const CONTACT: SettingField[] = [
  { name: "supportEmail", labelKey: "admin.supportEmail", kind: "text" },
  { name: "phone", labelKey: "admin.phone", kind: "text" },
  { name: "address", labelKey: "admin.address", kind: "textarea", span: 2 },
  { name: "facebookUrl", labelKey: "admin.facebookUrl", kind: "url" },
  { name: "twitterUrl", labelKey: "admin.twitterUrl", kind: "url" },
  { name: "instagramUrl", labelKey: "admin.instagramUrl", kind: "url" },
  { name: "telegramUrl", labelKey: "admin.telegramUrl", kind: "url" },
  { name: "youtubeUrl", labelKey: "admin.youtubeUrl", kind: "url" },
];

const COMMERCE: SettingField[] = [
  { name: "currency", labelKey: "admin.currency", kind: "select", options: CURRENCY_OPTIONS },
  {
    name: "defaultLocale",
    labelKey: "admin.defaultLocale",
    kind: "select",
    options: LANGUAGE_OPTIONS,
  },
  { name: "demoMode", labelKey: "admin.demoMode", kind: "switch" },
];

const GROUPS = [
  { id: "general", titleKey: "admin.general", fields: GENERAL },
  { id: "hero", titleKey: "admin.hero", fields: HERO },
  { id: "contact", titleKey: "admin.contact", fields: CONTACT },
  { id: "commerce", titleKey: "admin.commerce", fields: COMMERCE },
] as const;

export default async function SettingsAdminPage() {
  const [{ t }, settings] = await Promise.all([getDictionary(), getSettings()]);
  const values = settings as unknown as Record<string, string>;

  return (
    <div className="max-w-4xl">
      <PageHeader title={t("admin.settings")} description={t("admin.settingsDescription")} />

      <div className="space-y-6">
        <section className="surface-card p-6">
          <SectionHeader
            title={t("admin.whatsappSection")}
            description={t("admin.whatsappSectionDescription")}
          />
          <WhatsAppCard value={settings.whatsappNumber} />
        </section>

        {GROUPS.map((group) => (
          <section key={group.id} className="surface-card p-6">
            <SectionHeader title={t(group.titleKey)} />
            <SettingsForm group={group.id} fields={[...group.fields]} values={values} />
          </section>
        ))}
      </div>
    </div>
  );
}