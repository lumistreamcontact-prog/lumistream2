"use client";

import { useState } from "react";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";
import { CheckIcon } from "@/components/ui/Icons";

/**
 * Support request form. Prefilled from the session when signed in and posted
 * to `/api/support`, which opens a `SupportTicket` for the admin queue.
 */
export function SupportForm() {
  const { t, user } = useSite();

  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { errors?: Record<string, string> };

      if (!res.ok) {
        setErrors(data.errors ?? { form: "errors.generic" });
        return;
      }

      setSent(true);
    } catch {
      setErrors({ form: "errors.network" });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <Alert tone="ok" title={t("support.sent")}>
          <span className="flex items-center justify-center gap-2">
            <CheckIcon className="h-4 w-4" />
            {t("support.subtitle")}
          </span>
        </Alert>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setSent(false);
            setForm((prev) => ({ ...prev, subject: "", message: "" }));
          }}
        >
          {t("support.send")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.form && <Alert tone="danger">{t(errors.form)}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("support.name")} htmlFor="name" error={errors.name ? t(errors.name) : undefined}>
          <Input id="name" value={form.name} onChange={update("name")} invalid={Boolean(errors.name)} />
        </Field>
        <Field
          label={t("support.email")}
          htmlFor="email"
          error={errors.email ? t(errors.email) : undefined}
        >
          <Input
            id="email"
            type="email"
            dir="ltr"
            inputMode="email"
            value={form.email}
            onChange={update("email")}
            invalid={Boolean(errors.email)}
          />
        </Field>
      </div>

      <Field label={t("support.phone")} htmlFor="phone">
        <Input id="phone" type="tel" dir="ltr" value={form.phone} onChange={update("phone")} />
      </Field>

      <Field
        label={t("support.subject")}
        htmlFor="subject"
        required
        error={errors.subject ? t(errors.subject) : undefined}
      >
        <Input
          id="subject"
          value={form.subject}
          onChange={update("subject")}
          invalid={Boolean(errors.subject)}
        />
      </Field>

      <Field
        label={t("support.message")}
        htmlFor="message"
        required
        error={errors.message ? t(errors.message) : undefined}
      >
        <Textarea
          id="message"
          rows={6}
          value={form.message}
          onChange={update("message")}
          invalid={Boolean(errors.message)}
        />
      </Field>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? t("common.loading") : t("support.send")}
      </Button>
    </form>
  );
}