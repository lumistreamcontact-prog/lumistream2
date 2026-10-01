import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "@/components/forms/LoginForm";
import { AuthShell } from "@/components/layout/AuthShell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t("auth.loginTitle"), robots: { index: false, follow: true } };
}

export default async function LoginPage() {
  const { t } = await getDictionary();

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            {t("nav.register")}
          </Link>
        </>
      }
    >
      {/* `useSearchParams` needs a Suspense boundary during prerendering. */}
      <Suspense fallback={<div className="h-72 skeleton rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}