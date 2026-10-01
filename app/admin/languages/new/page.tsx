import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "Language" };

export default function NewLanguagePage() {
  return <EntityEdit entity="language" titleKey="admin.code" />;
}