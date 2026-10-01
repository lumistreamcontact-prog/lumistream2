"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { HeartIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

/**
 * Optimistic favourite toggle. When signed out it redirects to the login page
 * instead of silently failing.
 */
export function FavoriteButton({
  channelId,
  initial = false,
  className,
  size = "md",
}: {
  channelId: string;
  initial?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const { user, t } = useSite();
  const { push } = useToast();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(routerPath())}`);
      return;
    }
    if (busy) return;

    const next = !isFavorite;
    setIsFavorite(next);
    setBusy(true);

    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });

      if (!res.ok) {
        setIsFavorite(!next);
        push(t("errors.generic"), "danger");
        return;
      }

      push(next ? t("common.addFavorite") : t("common.removeFavorite"), "ok");
      router.refresh();
    } catch {
      setIsFavorite(!next);
      push(t("errors.network"), "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("common.removeFavorite") : t("common.addFavorite")}
      title={isFavorite ? t("common.removeFavorite") : t("common.addFavorite")}
      className={cn(
        "grid place-items-center rounded-full backdrop-blur-md transition-all duration-200",
        "bg-black/55 hover:bg-black/75 active:scale-90",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        isFavorite ? "text-brand" : "text-white/80 hover:text-white",
        className,
      )}
    >
      <HeartIcon filled={isFavorite} className={size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"} />
    </button>
  );
}

function routerPath(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}