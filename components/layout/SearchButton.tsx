"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { CloseIcon, HeartIcon, SearchIcon } from "@/components/ui/Icons";
import Link from "next/link";

/**
 * Header search. Collapsed into an icon on desktop and expands into a full
 * width overlay bar; on the Channels page the same query is mirrored into the
 * visible input field so both controls stay in sync.
 */
export function SearchButton() {
  const { t } = useSite();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    setOpen(false);
    router.push(q ? `/channels?q=${encodeURIComponent(q)}` : "/channels");
  }

  if (open) {
    return (
      <form
        onSubmit={submit}
        className="absolute inset-x-0 top-0 z-10 flex h-16 items-center gap-2 bg-canvas/95 px-4 backdrop-blur-xl"
      >
        <SearchIcon className="h-[18px] w-[18px] shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("channels.searchPlaceholder")}
          aria-label={t("nav.search")}
          className="h-10 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
        <Button type="submit" size="sm" variant="ghost">
          {t("common.search")}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setOpen(false)}
          aria-label={t("common.close")}
        >
          <CloseIcon className="h-5 w-5" />
        </Button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.search")}
        className="grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-white/8 hover:text-ink"
      >
        <SearchIcon className="h-[18px] w-[18px]" />
      </button>
      <Link
        href="/favorites"
        aria-label={t("nav.favorites")}
        className="hidden h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-white/8 hover:text-ink sm:grid"
      >
        <HeartIcon className="h-[18px] w-[18px]" />
      </Link>
    </>
  );
}