import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { EntityList } from "@/components/admin/EntityList";
import { countUsers, listUsers } from "@/lib/admin";

export const metadata: Metadata = { title: "Users" };

interface SearchParams {
  q?: string;
}

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { locale } = await getDictionary();
  const q = sp.q?.slice(0, 80);

  const [rows, total] = await Promise.all([listUsers({ q }), countUsers(q)]);

  return (
    <EntityList
      entity="user"
      config={{ slug: "users", titleKey: "admin.users", createKey: "admin.addUser" }}
      rows={rows as unknown as Record<string, unknown>[]}
      total={total}
      locale={locale}
    />
  );
}