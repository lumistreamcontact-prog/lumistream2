import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/Primitives";
import { Button, LinkButton } from "@/components/ui/Button";
import { EntityForm } from "./EntityForm";
import { getEntityRow, listPackageChannelIds, listSelectableChannels } from "@/lib/admin-lists";
import type { AdminEntity } from "@/lib/admin-fields";

/**
 * Shared create/edit screen for a catalogue entity.
 *
 * Loads the row (when editing) and hands everything to the declarative
 * `<EntityForm>`; validation and persistence stay in `app/admin/actions.ts`.
 */
export async function EntityEdit({
  entity,
  id,
  titleKey,
}: {
  entity: AdminEntity;
  /** Omitted for the "create" form. */
  id?: string;
  titleKey: string;
}) {
  const { t } = await getDictionary();

  const row = id ? await getEntityRow(entity, id) : null;
  if (id && !row) notFound();

  const channels = entity === "package" ? await listSelectableChannels() : [];
  const linked = entity === "package" && id ? await listPackageChannelIds(id) : [];
  const linkedIds = linked.map((l) => l.channelId);

  // The password column is write-only; never echo a hash back into the DOM.
  const safeRow = row && "password" in row ? { ...row, password: "" } : row;

  return (
    <div className="max-w-4xl">
      <PageHeader title={t(titleKey)} />

      {id && (
        <p className="mb-5 font-mono text-xs text-faint" dir="ltr">
          {id}
        </p>
      )}

      <div className="surface-card p-6">
        <EntityForm
          entity={entity}
          row={safeRow}
          channels={channels}
          linkedChannelIds={linkedIds}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href={`/admin/${entity}s`} variant="secondary" size="sm">
          {t("common.back")}
        </LinkButton>
        {id && (
          <Link href={`/admin/${entity}s/new`}>
            <Button variant="ghost" size="sm">
              {t("common.create")}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}