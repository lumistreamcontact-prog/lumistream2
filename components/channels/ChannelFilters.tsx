"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { CATEGORIES, QUALITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ChannelFacets {
  countries: string[];
  languages: string[];
  qualities: string[];
  categories: { value: string; count: number }[];
}

const SORTS = [
  ["newest", "channels.sortNewest"],
  ["name", "channels.sortName"],
  ["popular", "channels.sortPopular"],
  ["trending", "channels.sortTrending"],
] as const;

/**
 * Filter + search bar for the Channels page.
 *
 * State lives entirely in the URL so results stay shareable, bookmarkable and
 * server-rendered; the bar simply mirrors it and pushes a new query on change.
 */
export function ChannelFilters({
  facets,
  resultCount,
}: {
  facets: ChannelFacets;
  resultCount: number;
}) {
  const { t } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [term, setTerm] = useState(params.get("q") ?? "");
  const [syncedUrlTerm, setSyncedUrlTerm] = useState(params.get("q") ?? "");

  // Follow the URL when the user navigates back/forward. Adjusting state while
  // rendering (rather than in an effect) avoids an extra render pass.
  const urlTerm = params.get("q") ?? "";
  if (urlTerm !== syncedUrlTerm) {
    setSyncedUrlTerm(urlTerm);
    setTerm(urlTerm);
  }

  const active = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "all",
    country: params.get("country") ?? "all",
    language: params.get("language") ?? "all",
    quality: params.get("quality") ?? "all",
    sort: params.get("sort") ?? "newest",
  };

  const hasFilters =
    active.q !== "" ||
    active.category !== "all" ||
    active.country !== "all" ||
    active.language !== "all" ||
    active.quality !== "all";

  function push(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all" || (key === "sort" && value === "newest")) next.delete(key);
      else next.set(key, value);
    }
    startTransition(() => {
      router.push(next.size ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
    });
  }

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    push({ q: term.trim() });
  }

  const selectClass = (activeKey: string) =>
    cn("h-10 min-w-32 text-xs", activeKey !== "all" && "border-brand text-brand");
return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearch} className="relative min-w-56 flex-1">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t("channels.searchPlaceholder")}
            aria-label={t("common.search")}
            className="ps-9"
          />
        </form>

        <Select
          value={active.category}
          onChange={(e) => push({ category: e.target.value })}
          aria-label={t("channels.filterCategory")}
          className={selectClass(active.category)}
        >
          <option value="all">{t("channels.filterCategory")}</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.labelKey)}
            </option>
          ))}
        </Select>

        <Select
          value={active.country}
          onChange={(e) => push({ country: e.target.value })}
          aria-label={t("channels.filterCountry")}
          className={selectClass(active.country)}
        >
          <option value="all">{t("channels.filterCountry")}</option>
          {facets.countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={active.language}
          onChange={(e) => push({ language: e.target.value })}
          aria-label={t("channels.filterLanguage")}
          className={selectClass(active.language)}
        >
          <option value="all">{t("channels.filterLanguage")}</option>
          {facets.languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>

        <Select
          value={active.quality}
          onChange={(e) => push({ quality: e.target.value })}
          aria-label={t("channels.filterQuality")}
          className={selectClass(active.quality)}
        >
          <option value="all">{t("channels.filterQuality")}</option>
          {[...new Set([...QUALITIES, ...facets.qualities])].map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </Select>

        <Select
          value={active.sort}
          onChange={(e) => push({ sort: e.target.value })}
          aria-label={t("channels.sortBy")}
          className="h-10 min-w-32 text-xs"
        >
          {SORTS.map(([value, key]) => (
            <option key={value} value={value}>
              {t(key)}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
          >
            <CloseIcon className="h-4 w-4" />
            {t("channels.clearFilters")}
          </Button>
        )}
      </div>

      <p className={cn("text-xs text-faint", pending && "opacity-50")} aria-live="polite">
        {resultCount} {t("channels.channelCount")}
      </p>
    </div>
  );
}