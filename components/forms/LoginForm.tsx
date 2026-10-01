"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Checkbox } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";

/** Shared email/password form used by the login screen. */
export function LoginForm() {
  const { t } = useSite();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        setErrors(data.errors ?? { form: "errors.invalidCredentials" });
        return;
      }

      router.push(next.startsWith("/") ? next : "/account");
      router.refresh();
    } catch {
      setErrors({ form: "errors.network" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.form && <Alert tone="danger">{t(errors.form)}</Alert>}

      <Field label={t("auth.email")} htmlFor="email" error={errors.email ? t(errors.email) : undefined}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={Boolean(errors.email)}
          placeholder="you@example.com"
          dir="ltr"
        />
      </Field>

      <Field
        label={t("auth.password")}
        htmlFor="password"
        error={errors.password ? t(errors.password) : undefined}
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(errors.password)}
            className="pe-20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 end-2 my-auto h-8 rounded-lg px-2 text-xs text-faint transition-colors hover:text-ink"
          >
            {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          </button>
        </div>
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          label={t("auth.rememberMe")}
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <Link
          href="/forgot-password"
          className="text-sm text-muted transition-colors hover:text-brand"
        >
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? t("subscribe.processing") : t("auth.loginButton")}
      </Button>
    </form>
  );
}