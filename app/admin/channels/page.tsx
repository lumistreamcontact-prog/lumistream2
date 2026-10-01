import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { EntityList } from "@/components/admin/EntityList";
import { countChannelsAdmin, listChannels } from "@/lib/admin";

export const metadata: Metadata = { title: "Channels" };

interface SearchParams {
  q?: string;
}

export default async function ChannelsAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { locale } = await getDictionary();
  const q = sp.q?.slice(0, 80);

  const [rows, total] = await Promise.all([listChannels({ q }), countChannelsAdmin(q)]);

  return (
    <EntityList
      entity="channel"
      config={{ slug: "channels", titleKey: "admin.channels", createKey: "admin.addChannel" }}
      rows={rows as unknown as Record<string, unknown>[]}
      total={total}
      locale={locale}
    />
  );
}