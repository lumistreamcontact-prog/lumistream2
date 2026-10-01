"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { CloseIcon, GlobeIcon, MenuIcon } from "@/components/ui/Icons";
import { MobileDrawer, type NavItem } from "./MobileDrawer";
import { SearchButton } from "./SearchButton";
import { cn } from "@/lib/utils";

const NAV: NavItem[] = [
  { href: "/", key: "nav.home", exact: true },
  { href: "/channels", key: "nav.channels" },
  { href: "/packages", key: "nav.packages" },
  { href: "/content", key: "nav.content" },
  { href: "/favorites", key: "nav.favorites", auth: true },
  { href: "/account", key: "nav.subscriptions", auth: true },
  { href: "/about", key: "nav.about" },
  { href: "/support", key: "nav.support" },
];

export function Header() {
  const { t, user, settings, languages, locale } = useSite();
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  /* Close overlays on navigation. Adjusting state during render (React's
     recommended alternative to setState-in-effect) avoids a second pass. */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
    if (langOpen) setLangOpen(false);
  }

  /* Solidify the header once the page scrolls. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock body scroll while the mobile drawer is open. */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* Dismiss the language menu on outside click / Escape. */
  useEffect(() => {
    if (!langOpen) return;
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  const items = NAV.filter((item) => !item.auth || user);
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  async function changeLanguage(code: string) {
    setLangOpen(false);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    });
    router.refresh();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled || menuOpen
          ? "glass shadow-lg shadow-black/20"
          : "bg-gradient-to-b from-black/55 to-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={settings.siteName}>
          {settings.siteLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.siteLogo} alt={settings.siteName} className="h-8 w-auto rounded-md object-contain" />
          ) : (
            <span className="brand-gradient-bg grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white shadow-lg">
              {settings.siteName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden text-lg font-bold tracking-tight sm:block">{settings.siteName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ms-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active(item.href, item.exact)
                  ? "bg-white/10 text-ink"
                  : "text-muted hover:bg-white/5 hover:text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <SearchButton />

          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              aria-label={t("nav.language")}
              className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm text-muted transition-colors hover:bg-white/8 hover:text-ink"
            >
              <GlobeIcon className="h-[18px] w-[18px]" />
              <span className="hidden text-xs font-semibold uppercase sm:inline">{locale}</span>
            </button>

            {langOpen && (
              <div
                role="menu"
                className="animate-scale-in absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-card border border-line bg-surface p-1 shadow-2xl"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    role="menuitem"
                    onClick={() => changeLanguage(lang.code)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-white/8",
                      lang.code === locale ? "text-brand" : "text-muted hover:text-ink",
                    )}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] uppercase text-faint">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account */}
          {user ? (
            <Link
              href="/account"
              className="flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm text-muted transition-colors hover:bg-white/8 hover:text-ink"
              aria-label={t("nav.account")}
            >
              <span className="brand-gradient-bg grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white">
                {user.firstName[0]}
                {user.lastName?.[0] ?? ""}
              </span>
              <span className="hidden max-w-24 truncate lg:inline">{user.firstName}</span>
            </Link>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/8 hover:text-ink"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="brand-gradient-bg rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/25"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t("common.close") : t("nav.menu")}
            aria-expanded={menuOpen}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink transition-colors hover:bg-white/8 lg:hidden"
          >
            {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && <MobileDrawer items={items} active={active} onClose={() => setMenuOpen(false)} />}
    </header>
  );
}