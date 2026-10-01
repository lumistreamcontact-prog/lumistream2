import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** KPI tile used across the dashboard and the analytics screen. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "brand" | "info" | "ok" | "warn";
}) {
  const tones = {
    brand: "text-brand bg-brand/15",
    info: "text-brand-2 bg-brand-2/15",
    ok: "text-ok bg-ok/15",
    warn: "text-warn bg-warn/15",
  } as const;

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
        {icon && (
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}