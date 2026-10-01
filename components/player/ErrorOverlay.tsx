"use client";

import { useSite } from "@/components/providers/SiteProvider";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Alert } from "@/components/ui/Primitives";
import type { PlayerError } from "./useHls";
import { waLink } from "@/lib/utils";

/**
 * Fatal-playback overlay. Offers a manual retry plus a WhatsApp escape hatch
 * so a viewer is never stuck on a dead screen.
 */
export function ErrorOverlay({
  error,
  channelName,
  onRetry,
}: {
  error: PlayerError;
  channelName: string;
  onRetry: () => void;
}) {
  const { t, settings } = useSite();

  const message =
    error === "subscription_required"
      ? t("channels.choosePackage")
      : error === "unsupported"
        ? t("player.unsupported")
        : error === "network"
          ? t("errors.network")
          : t("player.errorHint");

  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-black/85 p-6 backdrop-blur-sm">
      <div className="max-w-md space-y-4 text-center">
        <Alert tone="danger" title={t("player.error")}>
          <p>{message}</p>
        </Alert>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="brand-gradient-bg rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {t("player.retry")}
          </button>

          {settings.whatsappNumber && (
            <a
              href={waLink(settings.whatsappNumber, `Problem with ${channelName}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-black"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {t("support.whatsapp")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}