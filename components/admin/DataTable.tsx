"use client";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { EditIcon, TrashIcon } from "@/components/ui/Icons";
import { deleteEntityAction } from "@/app/admin/actions";
import { TABLE_COLUMNS, type AdminEntity } from "@/lib/admin-fields";
import { formatDate } from "@/lib/utils";

export type TableRow = Record<string, unknown>;

/**
 * Generic list table for every catalogue entity.
 *
 * Row actions are plain `<form action={serverAction}>` submissions, so the
 * whole admin list stays usable with JavaScript disabled.
 */
export function DataTable({
  entity,
  rows,
  locale,
  emptyLabel,
  extraColumns,
}: {
  entity: AdminEntity;
  rows: TableRow[];
  locale: string;
  emptyLabel?: string;
  /** Appended after the standard columns, e.g. owner + counts. */
  extraColumns?: { key: string; labelKey: string }[];
}) {
  const { t } = useSite();
  const columns = [...TABLE_COLUMNS[entity], ...(extraColumns ?? []).map((c) => ({ ...c }))];

  if (rows.length === 0) {
    return <EmptyState title={emptyLabel ?? t("admin.noResults")} />;
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-start text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/40 text-xs uppercase tracking-wider text-faint">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-start font-medium whitespace-nowrap">
                  {t(col.labelKey)}
                </th>
              ))}
              <th className="px-4 py-3 text-end font-medium">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={String(row.id ?? index)}
                className="border-b border-line/60 transition-colors last:border-0 hover:bg-white/3"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    <Cell col={col} row={row} locale={locale} t={t} />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/${entity}s/${String(row.id)}`}
                      title={t("common.edit")}
                      aria-label={t("common.edit")}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/8 hover:text-brand"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Link>

                    <form action={deleteEntityAction}>
                      <input type="hidden" name="entity" value={entity} />
                      <input type="hidden" name="id" value={String(row.id)} />
                      <button
                        type="submit"
                        title={t("common.delete")}
                        aria-label={t("common.delete")}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-faint">
        <span>{rows.length}</span>
        <Link href={`/admin/${entity}s/new`}>
          <Button size="sm" variant="secondary">
            {t("common.create")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Cell({
  col,
  row,
  locale,
  t,
}: {
  col: { key: string; labelKey: string; kind?: string };
  row: TableRow;
  locale: string;
  t: (key: string) => string;
}) {
  const value = row[col.key];

  if (value === null || value === undefined || value === "") {
    return <span className="text-faint">—</span>;
  }

  if (col.kind === "bool") {
    return (
      <Badge tone={value ? "ok" : "neutral"}>
        {value ? t("admin.active") : t("admin.inactive")}
      </Badge>
    );
  }

  if (col.kind === "badge") {
    const isAdmin = value === "admin";
    return <Badge tone={isAdmin ? "brand" : "neutral"}>{t(isAdmin ? "admin.admin" : "admin.user")}</Badge>;
  }

  if (col.kind === "date") {
    return <span className="whitespace-nowrap text-muted">{formatDate(value as string, locale)}</span>;
  }

  // `name`, `title`, `email` get a subdued dict label where applicable.
  if (col.key === "category" || col.key === "type") {
    return <span className="whitespace-nowrap text-muted">{t(`${col.key}.${String(value)}`)}</span>;
  }

  if (typeof value === "number") {
    return <span className="tabular-nums">{value.toLocaleString()}</span>;
  }

  if (col.key === "email") {
    return (
      <span className="text-muted" dir="ltr">
        {String(value)}
      </span>
    );
  }

  return <span className="line-clamp-1 text-ink">{String(value)}</span>;
}