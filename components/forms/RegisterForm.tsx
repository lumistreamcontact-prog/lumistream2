"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";

/** Shared registration form. */
export function RegisterForm() {
  const { t } = useSite();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/packages";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        setErrors(data.errors ?? { form: "errors.generic" });
        return;
      }

      router.push(next.startsWith("/") ? next : "/packages");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.firstName")} htmlFor="firstName" required error={errors.firstName ? t(errors.firstName) : undefined}>
          <Input
            id="firstName"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={update("firstName")}
            invalid={Boolean(errors.firstName)}
          />
        </Field>
        <Field label={t("auth.lastName")} htmlFor="lastName" required error={errors.lastName ? t(errors.lastName) : undefined}>
          <Input
            id="lastName"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={update("lastName")}
            invalid={Boolean(errors.lastName)}
          />
        </Field>
      </div>

      <Field label={t("auth.email")} htmlFor="email" required error={errors.email ? t(errors.email) : undefined}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          dir="ltr"
          placeholder="you@example.com"
          value={form.email}
          onChange={update("email")}
          invalid={Boolean(errors.email)}
        />
      </Field>

      <Field label={t("auth.password")} htmlFor="password" required error={errors.password ? t(errors.password) : undefined}>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
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
          onChange={update("confirmPassword")}
          invalid={Boolean(errors.confirmPassword)}
        />
      </Field>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? t("common.loading") : t("auth.registerButton")}
      </Button>
    </form>
  );
}