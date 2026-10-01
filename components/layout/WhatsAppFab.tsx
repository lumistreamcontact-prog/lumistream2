"use client";

import { useEffect, useState } from "react";
import { useSite } from "@/components/providers/SiteProvider";
import { WhatsAppIcon, CloseIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/utils";

/**
 * Floating WhatsApp support button. Appears after a short scroll so it never
 * competes with the hero, and can be dismissed for the rest of the session.
 */
export function WhatsAppFab() {
  const { settings, t } = useSite();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || !settings.whatsappNumber) return;

    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed, settings.whatsappNumber]);

  if (dismissed || !settings.whatsappNumber) return null;

  return (
    <div
      className="fixed bottom-5 end-5 z-40 flex items-center gap-2 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {visible && (
        <>
          <span className="glass hidden rounded-full px-3.5 py-2 text-xs font-medium text-ink shadow-lg sm:inline">
            {t("support.whatsapp")}
          </span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t("common.close")}
            className="grid h-7 w-7 place-items-center rounded-full bg-surface text-faint transition-colors hover:text-ink"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      <a
        href={waLink(
          settings.whatsappNumber,
          `Hello ${settings.siteName}, I need help with my subscription.`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("support.whatsapp")}
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-black shadow-2xl shadow-black/40 transition-transform hover:scale-105 active:scale-95"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}