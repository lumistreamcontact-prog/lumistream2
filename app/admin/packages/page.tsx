import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { EntityList } from "@/components/admin/EntityList";
import { countPackagesAdmin, listPackages } from "@/lib/admin-lists";

export const metadata: Metadata = { title: "Packages" };

interface SearchParams {
  q?: string;
}

export default async function PackagesAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { locale } = await getDictionary();
  const q = sp.q?.slice(0, 80);

  const [rows, total] = await Promise.all([listPackages({ q }), countPackagesAdmin(q)]);

  return (
    <EntityList
      entity="package"
      config={{ slug: "packages", titleKey: "admin.packages", createKey: "admin.addPackage" }}
      rows={rows as unknown as Record<string, unknown>[]}
      total={total}
      locale={locale}
    />
  );
}