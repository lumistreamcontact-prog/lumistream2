import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "New channel" };

export default async function EditChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityEdit entity="channel" id={id} titleKey="admin.channelName" />;
}