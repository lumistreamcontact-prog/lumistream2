import type { Metadata } from "next";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const metadata: Metadata = { title: "User" };

export default function NewUserPage() {
  return <EntityEdit entity="user" titleKey="auth.email" />;
}