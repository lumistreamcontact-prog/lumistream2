import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { SettingsForm, type SettingField } from "@/components/admin/SettingsForm";
import { PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Primitives";

export const metadata: Metadata = { title: "Appearance" };

const COLORS: SettingField[] = [
  { name: "primaryColor", labelKey: "admin.primaryColor", kind: "color" },
  { name: "secondaryColor", labelKey: "admin.secondaryColor", kind: "color" },
];

const BACKDROP: SettingField[] = [
  { name: "backgroundImage", labelKey: "admin.backgroundImage", kind: "url", span: 2 },
  { name: "backgroundOverlay", labelKey: "admin.backgroundOverlay", kind: "number" },
  { name: "glassIntensity", labelKey: "admin.glassIntensity", kind: "number" },
  { name: "radius", labelKey: "admin.radius", kind: "number" },
  { name: "fontFamily", labelKey: "admin.fontFamily", kind: "text" },
];

export default async function AppearanceAdminPage() {
  const [{ t }, settings] = await Promise.all([getDictionary(), getSettings()]);

  return (
    <div className="max-w-4xl">
      <PageHeader title={t("admin.appearance")} description={settings.siteName} />

      <div className="mb-6 flex items-center gap-4">
        <span
          className="brand-gradient-bg grid h-14 w-14 place-items-center rounded-2xl text-lg font-black text-white"
          aria-hidden
        >
          {settings.siteName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold">{settings.siteName}</p>
          <p className="text-xs text-muted">{settings.siteTagline}</p>
        </div>
        <div className="ms-auto flex gap-2">
          {[
            settings.primaryColor,
            settings.secondaryColor,
            settings.backgroundOverlay,
            settings.radius,
          ].map((value, index) => (
            <span
              key={index}
              className="rounded-lg border border-line px-2 py-1 font-mono text-[10px] text-faint"
            >
              {value}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <section className="surface-card p-6">
          <SectionHeader title={t("admin.appearance")} />
          <SettingsForm
            group="appearance"
            fields={COLORS}
            values={settings as unknown as Record<string, string>}
          />
        </section>

        <section className="surface-card p-6">
          <SectionHeader title={t("admin.heroImage")} />
          <SettingsForm
            group="appearance"
            fields={BACKDROP}
            values={settings as unknown as Record<string, string>}
          />
        </section>

        {settings.demoMode === "true" && (
          <Alert tone="warn" title={t("admin.demoMode")}>
            {t("admin.demoModeHint")}
          </Alert>
        )}
      </div>
    </div>
  );
}