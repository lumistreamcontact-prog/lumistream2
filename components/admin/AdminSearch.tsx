"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchIcon } from "@/components/ui/Icons";

/**
 * GET-form search box used by every admin list page.
 *
 * A plain `<form method="get">` means filters survive a refresh and work
 * without JavaScript; the input just follows the URL while typing.
 */
export function AdminSearch({ placeholder }: { placeholder?: string }) {
  const { t } = useSite();
  const router = useRouter();
  const params = useSearchParams();

  return (
    <form method="get" action="" className="flex items-center gap-2">
      <div className="relative min-w-52 flex-1">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={placeholder ?? t("admin.search")}
          aria-label={t("admin.search")}
          className="ps-9"
        />
      </div>
      <Button type="submit" size="sm" variant="secondary">
        {t("common.search")}
      </Button>
      {params.get("q") && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => router.push(window.location.pathname, { scroll: false })}
        >
          {t("channels.clearFilters")}
        </Button>
      )}
    </form>
  );
}