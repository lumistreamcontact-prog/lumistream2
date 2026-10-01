"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Alert, Badge } from "@/components/ui/Primitives";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { saveSettingsAction } from "@/app/admin/actions";
import { formatWhatsApp, normalizeWhatsApp, waLink } from "@/lib/utils";

/** E.164 allows 8-15 digits; anything shorter would build a dead wa.me link. */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/**
 * Editor for the site-wide WhatsApp number.
 *
 * A single number drives the floating button, the footer, the hero CTA, the
 * support page and the player error overlay, so it gets its own prominent card
 * with a live link preview instead of hiding in a generic form.
 */
export function WhatsAppCard({ value }: { value: string }) {
  const { t } = useSite();
  const { push } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [raw, setRaw] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const digits = useMemo(() => normalizeWhatsApp(raw), [raw]);
  const valid = digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS;
  const link = valid ? waLink(digits) : "";
  const changed = digits !== normalizeWhatsApp(value);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!valid) {
      setError(t("admin.whatsappInvalid"));
      return;
    }

    const fd = new FormData();
    fd.set("group", "contact");
    fd.set("whatsappNumber", digits);

    startTransition(async () => {
      try {
        await saveSettingsAction(fd);
        push(t("admin.saved"), "ok");
        router.refresh();
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <form action={saveSettingsAction} onSubmit={onSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="group" value="contact" />

      <div className="flex flex-wrap items-center gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-black"
          aria-hidden
        >
          <WhatsAppIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{t("admin.whatsappNumber")}</p>
          <p className="text-xs text-muted">{t("admin.whatsappHint")}</p>
        </div>
        <div className="ms-auto">
          {valid ? (
            <Badge tone="ok">{t("admin.whatsappActive")}</Badge>
          ) : (
            <Badge tone="warn">{t("admin.whatsappDisabled")}</Badge>
          )}
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("admin.whatsappNumber")}
          htmlFor="wa-number"
          hint={t("admin.whatsappNumberHint")}
          error={raw && !valid ? t("admin.whatsappInvalid") : undefined}
        >
          <Input
            id="wa-number"
            name="whatsappNumber"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="212786172756"
            invalid={Boolean(raw) && !valid}
          />
        </Field>

        <Field label={t("admin.whatsappPreview")} hint={t("admin.whatsappPreviewHint")}>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface-2/70 px-3.5 text-sm">
            {valid ? (
              <>
                <span className="truncate font-mono text-xs text-muted" dir="ltr">
                  {link}
                </span>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-auto shrink-0 text-xs font-semibold text-[#25D366] hover:underline"
                >
                  {t("admin.whatsappTest")}
                </a>
              </>
            ) : (
              <span className="text-xs text-faint">{t("admin.whatsappNoPreview")}</span>
            )}
          </div>
        </Field>
      </div>

      {valid && (
        <p className="text-xs text-faint" dir="ltr">
          {t("admin.whatsappDisplay")}: <span className="font-mono">{formatWhatsApp(digits)}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" loading={pending} disabled={!changed || !valid}>
          {t("common.save")}
        </Button>
        {changed && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setRaw(value);
              setError(null);
            }}
          >
            {t("common.reset")}
          </Button>
        )}
      </div>
    </form>
  );
}
