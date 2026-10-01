"use client";

import { useState } from "react";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";
import { CheckIcon } from "@/components/ui/Icons";

/**
 * "Forgot password" form. In development the API returns the reset link
 * directly (no mail transport is wired up), so it is surfaced here to make the
 * flow testable end to end.
 */
export function ForgotPasswordForm() {
  const { t } = useSite();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        devLink?: string;
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        setError(data.errors?.email ?? data.errors?.form ?? "errors.generic");
        return;
      }

      setDevLink(data.devLink ?? null);
      setSent(true);
    } catch {
      setError("errors.network");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert tone="ok" title={t("auth.resetSent")}>
          <span className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            {email}
          </span>
        </Alert>

        {devLink && (
          <Alert tone="info" title="Development">
            {/* No mail transport in dev — the link is returned by the API. */}
            <Link href={toRelative(devLink)} className="underline break-all" dir="ltr">
              {devLink}
            </Link>
          </Alert>
        )}

        <Link
          href="/login"
          className="block text-center text-sm font-medium text-brand hover:underline"
        >
          {t("auth.loginButton")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{t(error)}</Alert>}

      <Field
        label={t("auth.email")}
        htmlFor="email"
        required
        error={error === "errors.emailRequired" ? t(error) : undefined}
      >
        <Input
          id="email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {t("auth.resetButton")}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="hover:text-brand">
          {t("common.back")}: {t("auth.loginTitle")}
        </Link>
      </p>
    </form>
  );
}

/** Strips the origin so `next/link` can navigate during SSR too. */
function toRelative(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}