"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";
import {
  ENTITY_FIELDS,
  type AdminEntity,
  type FieldSpec,
} from "@/lib/admin-fields";
import { saveEntityAction } from "@/app/admin/actions";
import { asStringArray } from "@/lib/utils";

export interface EntityFormProps {
  entity: AdminEntity;
  row?: Record<string, unknown> | null;
  /** Channels offered by the package multi-select. */
  channels?: { id: string; name: string; category: string }[];
  /** Currently linked channel ids when editing a package. */
  linkedChannelIds?: string[];
}

/**
 * Generic create/edit form driven by `ENTITY_FIELDS`.
 *
 * Submits straight to the `saveEntityAction` Server Function, which re-checks
 * the admin role server-side before touching the database.
 */
export function EntityForm({
  entity,
  row,
  channels = [],
  linkedChannelIds = [],
}: EntityFormProps) {
  const { t } = useSite();
  const { push } = useToast();
  const router = useRouter();

  const fields = ENTITY_FIELDS[entity];
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initial = useInitialValues(fields, row, linkedChannelIds);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const form = event.currentTarget;
    const fd = new FormData(form);

    try {
      await saveEntityAction(fd);
      push(t("admin.saved"), "ok");
      router.push(`/admin/${entity}s`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.startsWith("INVALID_FIELDS:")) {
        setError("errors.required");
      } else {
        setError("errors.generic");
      }
      setSaving(false);
    }
  }

  return (
    <form
      action={saveEntityAction}
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
    >
      {error && <Alert tone="danger">{t(error)}</Alert>}

      <input type="hidden" name="entity" value={entity} />
      {row?.id ? <input type="hidden" name="id" value={String(row.id)} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldControl
            key={field.name}
            field={field}
            initial={initial[field.name]}
            channels={channels}
            selectedChannels={linkedChannelIds}
            label={t(field.labelKey)}
            t={t}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button type="submit" loading={saving}>
          {row?.id ? t("common.save") : t("common.create")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

/** Maps the stored row into string form values the controls understand. */
function useInitialValues(
  fields: FieldSpec[],
  row: Record<string, unknown> | null | undefined,
  linkedChannelIds: string[],
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of fields) {
    const raw = row?.[field.name];

    if (field.kind === "checkbox") {
      values[field.name] = raw ? "on" : "";
    } else if (field.kind === "lines") {
      values[field.name] = asStringArray(raw).join("\n");
    } else if (raw === null || raw === undefined) {
      values[field.name] = "";
    } else if (raw instanceof Date) {
      values[field.name] = raw.toISOString().slice(0, 10);
    } else {
      values[field.name] = String(raw);
    }
  }

  values.channels = linkedChannelIds.join(",");
  return values;
}

function FieldControl({
  field,
  initial,
  channels,
  selectedChannels,
  label,
  t,
}: {
  field: FieldSpec;
  initial: string;
  channels: { id: string; name: string; category: string }[];
  selectedChannels: string[];
  label: string;
  t: (key: string) => string;
}) {
  const span = field.span === 2 ? "sm:col-span-2" : "";
  const id = `f-${field.name}`;

  if (field.kind === "checkbox") {
    return (
      <div className={span}>
        <Switch
          id={id}
          checked={initial === "on"}
          onChange={() => undefined}
          label={label}
        />
        {/* Keeps the value in the FormData even when the switch renders unchecked. */}
        <input type="hidden" name={field.name} value={initial === "on" ? "true" : "false"} />
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <Field label={label} htmlFor={id} className={span} required={field.required}>
        <Select id={id} name={field.name} defaultValue={initial} required={field.required}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.labelKey ? t(option.labelKey) : option.label}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  if (field.kind === "textarea") {
    return (
      <Field label={label} htmlFor={id} className={span} required={field.required}>
        <Textarea id={id} name={field.name} defaultValue={initial} rows={4} />
      </Field>
    );
  }

  if (field.kind === "lines") {
    return (
      <Field label={label} htmlFor={id} className={span}>
        <Textarea
          id={id}
          name={field.name}
          defaultValue={initial}
          rows={4}
          placeholder={t("admin.features")}
        />
      </Field>
    );
  }

  if (field.kind === "channels") {
    return (
      <Field label={label} htmlFor={id} className={span}>
        <div
          id={id}
          className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-line bg-surface-2/50 p-2"
        >
          {channels.length === 0 && (
            <p className="p-2 text-xs text-faint">{t("common.noResults")}</p>
          )}
          {channels.map((channel) => (
            <label
              key={channel.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-white/6"
            >
              <input
                type="checkbox"
                name="channelIds"
                value={channel.id}
                defaultChecked={selectedChannels.includes(channel.id)}
                className="h-4 w-4 rounded border-line bg-surface-2 accent-[var(--ls-brand)]"
              />
              <span className="truncate">{channel.name}</span>
              <span className="ms-auto shrink-0 text-[10px] uppercase text-faint">
                {t(`category.${channel.category}`)}
              </span>
            </label>
          ))}
        </div>
      </Field>
    );
  }

  const type =
    field.kind === "number"
      ? "number"
      : field.kind === "password"
        ? "password"
        : field.kind === "color"
          ? "color"
          : "text";

  return (
    <Field label={label} htmlFor={id} className={span} required={field.required}>
      <Input
        id={id}
        name={field.name}
        type={type}
        step={field.step}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        defaultValue={initial}
        required={field.required}
        dir={field.kind === "url" || field.kind === "text" ? "auto" : undefined}
      />
    </Field>
  );
}
