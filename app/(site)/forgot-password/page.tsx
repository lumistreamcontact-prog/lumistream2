import { Suspense } from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t("auth.resetTitle"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage() {
  const { t } = await getDictionary();

  return (
    <AuthShell title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      <Suspense fallback={<div className="h-64 skeleton rounded-xl" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}