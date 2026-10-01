"use client";

import { cn } from "@/lib/utils";
import type { QualityLevel } from "./useHls";

/** Quality + subtitle menu shown from the gear button in the control bar. */
export function QualityMenu({
  levels,
  current,
  hasSubs,
  subsOn,
  labels,
  onSelect,
  onToggleSubs,
}: {
  levels: QualityLevel[];
  current: number;
  hasSubs: boolean;
  subsOn: boolean;
  labels: { quality: string; subtitles: string };
  onSelect: (index: number) => void;
  onToggleSubs: () => void;
}) {
  return (
    <div className="animate-scale-in absolute bottom-full end-0 z-20 mb-2 w-40 overflow-hidden rounded-xl border border-white/15 bg-black/90 p-1 backdrop-blur-xl">
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        {labels.quality}
      </p>

      <button
        type="button"
        onClick={() => onSelect(-1)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs transition-colors hover:bg-white/10",
          current === -1 ? "text-brand" : "text-white/85",
        )}
      >
        Auto
      </button>

      {levels.map((level) => (
        <button
          key={level.index}
          type="button"
          onClick={() => onSelect(level.index)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs transition-colors hover:bg-white/10",
            current === level.index ? "text-brand" : "text-white/85",
          )}
        >
          {level.label}
        </button>
      ))}

      {levels.length === 0 && <p className="px-3 py-2 text-[11px] text-white/40">—</p>}

      {hasSubs && (
        <>
          <div className="my-1 h-px bg-white/10" />
          <button
            type="button"
            onClick={onToggleSubs}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs text-white/85 transition-colors hover:bg-white/10"
          >
            {labels.subtitles}
            <span className={subsOn ? "text-brand" : "text-white/40"}>
              {subsOn ? "ON" : "OFF"}
            </span>
          </button>
        </>
      )}
    </div>
  );
}