import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { AuthShell } from "@/components/layout/AuthShell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t("auth.registerTitle"), robots: { index: false, follow: true } };
}

export default async function RegisterPage() {
  const { t } = await getDictionary();

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            {t("nav.login")}
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}