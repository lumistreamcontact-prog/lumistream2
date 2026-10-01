"use client";
import Link from "next/link";
import { GridIcon } from "@/components/ui/Icons";
import { useSite } from "@/components/providers/SiteProvider";
import { formatNumber } from "@/lib/utils";

export interface CategoryTile {
  value: string;
  label: string;
  count: number;
}

/** Category shortcuts that deep-link into the filtered channels page. */
export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  const { t, locale } = useSite();

  const visible = categories.filter((c) => c.count > 0).slice(0, 10);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="mb-5 text-xl font-bold tracking-tight sm:text-2xl">
        {t("home.categories")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((category) => (
          <Link
            key={category.value}
            href={`/channels?category=${encodeURIComponent(category.value)}`}
            className="surface-card hover-lift group flex items-center gap-3 p-4"
          >
            <span className="brand-gradient-bg grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white">
              <GridIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{category.label}</span>
              <span className="block text-xs text-faint">
                {formatNumber(category.count, locale)} {t("channels.channelCount")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}