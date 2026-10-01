import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "User" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityEdit entity="user" id={id} titleKey="auth.email" />;
}