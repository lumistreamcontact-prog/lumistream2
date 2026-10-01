import { Suspense } from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t("auth.newPassword"), robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage() {
  const { t } = await getDictionary();

  return (
    <AuthShell title={t("auth.resetTitle")} subtitle={t("auth.newPassword")}>
      <Suspense fallback={<div className="h-64 skeleton rounded-xl" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}