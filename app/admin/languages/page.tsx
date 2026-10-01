import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { EntityList } from "@/components/admin/EntityList";
import { countLanguages, listLanguages } from "@/lib/admin-lists";

export const metadata: Metadata = { title: "Languages" };

interface SearchParams {
  q?: string;
}

export default async function LanguagesAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { locale } = await getDictionary();
  const q = sp.q?.slice(0, 80);

  const [rows, total] = await Promise.all([listLanguages(), countLanguages(q)]);

  return (
    <EntityList
      entity="language"
      config={{ slug: "languages", titleKey: "admin.languages", createKey: "admin.new" }}
      rows={rows as unknown as Record<string, unknown>[]}
      total={total}
      locale={locale}
    />
  );
}