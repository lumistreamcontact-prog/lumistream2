import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "New channel" };

export default function NewChannelPage() {
  return <EntityEdit entity="channel" titleKey="admin.channelName" />;
}