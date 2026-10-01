"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { PageHeader } from "@/components/ui/Primitives";
import { Button, LinkButton } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icons";
import { AdminSearch } from "./AdminSearch";
import { DataTable, type TableRow } from "./DataTable";
import type { AdminEntity } from "@/lib/admin-fields";

export interface EntityListConfig {
  /** Path segment under /admin, e.g. "channels". */
  slug: string;
  /** Singular label key, e.g. "admin.channelName". */
  titleKey: string;
  /** "New X" button label key. */
  createKey: string;
  /** Optional extra columns appended after the standard ones. */
  extraColumns?: { key: string; labelKey: string }[];
}

/**
 * Shared list screen used by every catalogue entity. Keeping it here means the
 * five list pages differ only by their query + column config.
 */
export function EntityList({
  entity,
  config,
  rows,
  total,
  locale,
}: {
  entity: AdminEntity;
  config: EntityListConfig;
  rows: TableRow[];
  total: number;
  locale: string;
}) {
  const { t } = useSite();

  return (
    <div>
      <PageHeader title={t(config.titleKey)}>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <AdminSearch />
          <Link href={`/admin/${config.slug}/new`}>
            <Button size="sm">
              <PlusIcon className="h-4 w-4" />
              {t(config.createKey)}
            </Button>
          </Link>
        </div>
      </PageHeader>

      <p className="mb-3 text-xs text-faint">
        {total} {t("common.results")}
      </p>

      <DataTable
        entity={entity}
        rows={rows}
        locale={locale}
        extraColumns={config.extraColumns}
      />

      <div className="mt-6 flex justify-center">
        <LinkButton href="/admin" variant="ghost" size="sm">
          {t("admin.dashboard")}
        </LinkButton>
      </div>
    </div>
  );
}