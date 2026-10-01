"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";

/** Consumes a reset token and sets the new password. */
export function ResetPasswordForm() {
  const { t } = useSite();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        setErrors(data.errors ?? { form: "errors.generic" });
        return;
      }

      router.push("/login?reset=1");
      router.refresh();
    } catch {
      setErrors({ form: "errors.network" });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <Alert tone="danger" title={t("common.notFound")}>
          {t("errors.invalidToken")}
        </Alert>
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
          {t("auth.resetButton")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.form && <Alert tone="danger">{t(errors.form)}</Alert>}
      {errors.token && <Alert tone="danger">{t(errors.token)}</Alert>}

      <Field
        label={t("auth.newPassword")}
        htmlFor="password"
        required
        error={errors.password ? t(errors.password) : undefined}
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
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

      <Field
        label={t("auth.confirmPassword")}
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
      >
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          invalid={Boolean(errors.confirmPassword)}
        />
      </Field>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? t("common.loading") : t("auth.resetButton")}
      </Button>
    </form>
  );
}