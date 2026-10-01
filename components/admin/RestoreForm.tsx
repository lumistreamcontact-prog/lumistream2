"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Primitives";

/**
 * Uploads a JSON snapshot to `/api/admin/restore`.
 *
 * Restore is destructive, so the form requires an explicit confirmation and
 * explains exactly what is replaced before anything is sent.
 */
export function RestoreForm() {
  const { t } = useSite();
  const { push } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/restore", { method: "POST", body });
      if (!res.ok) {
        push(t("admin.uploadFailed"), "danger");
        return;
      }

      push(t("admin.restored"), "ok");
      setFile(null);
      setConfirm(false);
      router.refresh();
    } catch {
      push(t("errors.network"), "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert tone="warn">{t("admin.restoreHint")}</Alert>

      <label className="block cursor-pointer rounded-xl border border-dashed border-line px-4 py-6 text-center transition-colors hover:border-brand">
        <input
          type="file"
          name="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-sm font-medium text-muted">
          {file ? file.name : t("admin.backupFile")}
        </span>
        <span className="mt-1 block text-xs text-faint">{t("admin.restoreBackup")}</span>
      </label>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
          className="h-4 w-4 rounded border-line bg-surface-2 accent-[var(--ls-brand)]"
        />
        {t("common.confirm")}
      </label>

      <Button type="submit" variant="danger" loading={busy} disabled={!file || !confirm}>
        {t("admin.restoreBackup")}
      </Button>
    </form>
  );
}