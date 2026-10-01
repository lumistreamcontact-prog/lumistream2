import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "Package" };

export default function NewPackagePage() {
  return <EntityEdit entity="package" titleKey="admin.plan" />;
}