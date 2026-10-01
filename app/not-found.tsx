import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { LinkButton } from "@/components/ui/Button";
import { FilmIcon } from "@/components/ui/Icons";

export default async function NotFound() {
  const { t } = await getDictionary();

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <FilmIcon className="h-14 w-14 text-faint" />
      <p className="mt-6 text-6xl font-black tracking-tight text-gradient">404</p>
      <h1 className="mt-3 text-xl font-bold">{t("common.notFound")}</h1>
      <p className="mt-2 text-sm text-muted">{t("common.notFoundText")}</p>
      <LinkButton href="/" size="lg" className="mt-8">
        {t("common.goHome")}
      </LinkButton>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-faint">
        <Link href="/channels" className="hover:text-brand">
          {t("nav.channels")}
        </Link>
        <Link href="/packages" className="hover:text-brand">
          {t("nav.packages")}
        </Link>
        <Link href="/support" className="hover:text-brand">
          {t("nav.support")}
        </Link>
      </div>
    </div>
  );
}