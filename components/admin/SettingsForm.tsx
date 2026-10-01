"use client";

import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Input";
import { saveSettingsAction } from "@/app/admin/actions";
import { CURRENCIES } from "@/lib/constants";

export interface SettingField {
  name: string;
  labelKey: string;
  kind: "text" | "url" | "textarea" | "number" | "color" | "select" | "switch" | "password";
  options?: { value: string; label: string }[];
  span?: 1 | 2;
  required?: boolean;
}

/**
 * Renders one tab of the settings screens.
 *
 * A single `<form action={saveSettingsAction}>` posts every field at once; the
 * server action sanitises each value by name before it is persisted.
 */
export function SettingsForm({
  group,
  fields,
  values,
}: {
  group: string;
  fields: SettingField[];
  values: Record<string, string>;
}) {
  const { t } = useSite();

  return (
    <form action={saveSettingsAction} className="space-y-5">
      <input type="hidden" name="group" value={group} />

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `s-${field.name}`;
          const span = field.span === 2 ? "sm:col-span-2" : "";
          const value = values[field.name] ?? "";

          if (field.kind === "switch") {
            return (
              <div key={field.name} className={span}>
                <Switch
                  id={id}
                  checked={value === "true"}
                  onChange={() => undefined}
                  label={t(field.labelKey)}
                />
                <input type="hidden" name={field.name} value={value === "true" ? "true" : "false"} />
              </div>
            );
          }

          if (field.kind === "select") {
            return (
              <Field key={field.name} label={t(field.labelKey)} htmlFor={id} className={span}>
                <Select id={id} name={field.name} defaultValue={value}>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          }

          if (field.kind === "textarea") {
            return (
              <Field key={field.name} label={t(field.labelKey)} htmlFor={id} className={span}>
                <Textarea id={id} name={field.name} defaultValue={value} rows={3} />
              </Field>
            );
          }

          const type =
            field.kind === "number" ? "number" : field.kind === "color" ? "color" : "text";

          return (
            <Field
              key={field.name}
              label={t(field.labelKey)}
              htmlFor={id}
              className={span}
              required={field.required}
            >
              <Input
                id={id}
                name={field.name}
                type={type}
                step={field.kind === "number" ? "0.01" : undefined}
                defaultValue={value}
                required={field.required}
                dir={field.kind === "url" ? "ltr" : undefined}
              />
            </Field>
          );
        })}
      </div>

      <div className="border-t border-line pt-5">
        <Button type="submit">{t("common.save")}</Button>
      </div>
    </form>
  );
}

/** Currency options shared by the appearance and commerce tabs. */
export const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.symbol} ${c.code} — ${c.label}`,
}));