import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "Content" };

export default function NewContentPage() {
  return <EntityEdit entity="content" titleKey="admin.title" />;
}