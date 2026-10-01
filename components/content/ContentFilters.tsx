"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";

const TYPE_LABEL: Record<string, string> = {
  movie: "content.movies",
  series: "content.series",
  documentary: "content.documentaries",
};

const SORTS = [
  ["newest", "admin.date"],
  ["rating", "content.rating"],
  ["title", "admin.title"],
] as const;

/** URL-driven filter bar for the on-demand catalogue. */
export function ContentFilters({
  genres,
  types,
}: {
  genres: string[];
  types: string[];
}) {
  const { t } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [term, setTerm] = useState(params.get("q") ?? "");
  const [syncedUrlTerm, setSyncedUrlTerm] = useState(params.get("q") ?? "");

  // Follow the URL when the user navigates back/forward.
  const urlTerm = params.get("q") ?? "";
  if (urlTerm !== syncedUrlTerm) {
    setSyncedUrlTerm(urlTerm);
    setTerm(urlTerm);
  }

  const active = {
    type: params.get("type") ?? "all",
    genre: params.get("genre") ?? "all",
    sort: params.get("sort") ?? "newest",
    q: params.get("q") ?? "",
  };

  const dirty = active.type !== "all" || active.genre !== "all" || active.q !== "";

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          push({ q: term.trim() });
        }}
        className="relative min-w-56 flex-1"
      >
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("content.searchPlaceholder")}
          aria-label={t("common.search")}
          className="ps-9"
        />
      </form>

      <Select
        value={active.type}
        onChange={(e) => push({ type: e.target.value })}
        aria-label={t("content.filterType")}
        className="h-10 min-w-36 text-xs"
      >
        <option value="all">{t("content.allTypes")}</option>
        {types.map((type) => (
          <option key={type} value={type}>
            {t(TYPE_LABEL[type] ?? "nav.content")}
          </option>
        ))}
      </Select>

      {genres.length > 0 && (
        <Select
          value={active.genre}
          onChange={(e) => push({ genre: e.target.value })}
          aria-label={t("content.filterGenre")}
          className="h-10 min-w-36 text-xs"
        >
          <option value="all">{t("content.filterGenre")}</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </Select>
      )}

      <Select
        value={active.sort}
        onChange={(e) => push({ sort: e.target.value })}
        aria-label={t("channels.sortBy")}
        className="h-10 min-w-36 text-xs"
      >
        {SORTS.map(([value, key]) => (
          <option key={value} value={value}>
            {t(key)}
          </option>
        ))}
      </Select>

      {dirty && (
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
  );
}