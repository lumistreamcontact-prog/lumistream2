import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { EntityList } from "@/components/admin/EntityList";
import { countContentAdmin, listContent } from "@/lib/admin-lists";

export const metadata: Metadata = { title: "Content" };

interface SearchParams {
  q?: string;
}

export default async function ContentAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { locale } = await getDictionary();
  const q = sp.q?.slice(0, 80);

  const [rows, total] = await Promise.all([listContent({ q }), countContentAdmin(q)]);

  return (
    <EntityList
      entity="content"
      config={{ slug: "content", titleKey: "admin.content", createKey: "admin.addContent" }}
      rows={rows as unknown as Record<string, unknown>[]}
      total={total}
      locale={locale}
    />
  );
}