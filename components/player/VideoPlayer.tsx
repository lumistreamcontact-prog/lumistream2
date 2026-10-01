"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "@/components/providers/SiteProvider";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ExitFullscreenIcon,
  FullscreenIcon,
  MuteIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  SettingsIcon,
  SubtitlesIcon,
  VolumeIcon,
} from "@/components/ui/Icons";
import { useHls } from "./useHls";
import { QualityMenu } from "./QualityMenu";
import { ErrorOverlay } from "./ErrorOverlay";
import { cn } from "@/lib/utils";

export interface VideoPlayerProps {
  channelId: string;
  channelName: string;
  isLive?: boolean;
  poster?: string | null;
  className?: string;
  onEnded?: () => void;
}

/**
 * Professional HLS player with play/pause, volume, fullscreen, quality,
 * subtitles, picture-in-picture, loading + error states and auto-reconnect.
 */
export function VideoPlayer({
  channelId,
  channelName,
  isLive = true,
  poster,
  className,
  onEnded,
}: VideoPlayerProps) {
  const { t } = useSite();
  const { push } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useHls({ channelId, isLive, videoRef, onEnded });

  const [menu, setMenu] = useState<null | "quality">(null);
  const [chrome, setChrome] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Picture-in-picture is a browser capability, not React state — read it
  // during render rather than storing it from an effect.
  const pipSupported =
    typeof document !== "undefined" && "pictureInPictureEnabled" in document;

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const bumpChrome = useCallback(() => {
    setChrome(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (player.transport.playing) setChrome(false);
    }, 2800);
  }, [player.transport.playing]);

  useEffect(() => {
    /* Start the auto-hide countdown on the next frame so the initial paint is
       never blocked by a synchronous state update. */
    const raf = requestAnimationFrame(bumpChrome);
    return () => {
      cancelAnimationFrame(raf);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [bumpChrome]);

  const { status, error, transport } = player;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen().catch(() => undefined);
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      push(t("errors.generic"), "danger");
    }
  }, [push, t]);

  const setVolume = (next: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = next;
    video.muted = next === 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.8;
  };

  const handleSubs = () => {
    if (!player.toggleSubs()) push(t("player.subscriptionsOff"), "info");
  };

  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = value;
  };

  const busy = status === "loading" || status === "reconnecting";
  const showChrome = chrome || !transport.playing || busy || menu !== null;
return (
    <div
      ref={containerRef}
      onMouseMove={bumpChrome}
      onTouchStart={bumpChrome}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-card bg-black",
        !showChrome && "cursor-none",
        className,
      )}
    >
      <video
        ref={videoRef}
        playsInline
        muted={transport.muted}
        poster={poster ?? undefined}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="h-full w-full bg-black object-contain"
      />

      {/* Top bar */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 to-transparent p-4 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="line-clamp-1 text-sm font-semibold text-white">{channelName}</span>
          {isLive && (
            <span className="flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 text-[10px] font-bold uppercase text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {t("player.live")}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {busy && (
        <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
            <p className="text-sm text-white/85">
              {status === "reconnecting" ? t("player.reconnecting") : t("player.loading")}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <ErrorOverlay error={error} channelName={channelName} onRetry={player.retry} />
      )}

      {/* Centre play button */}
      {status === "paused" && !busy && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={t("player.play")}
          className="absolute inset-0 grid place-items-center bg-black/25 transition-colors hover:bg-black/15"
        >
          <span className="brand-gradient-bg grid h-16 w-16 place-items-center rounded-full text-white shadow-2xl transition-transform hover:scale-105">
            <PlayIcon className="ms-1 h-7 w-7" />
          </span>
        </button>
      )}
{/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300",
          showChrome ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {!isLive && transport.duration > 0 && (
          <input
            type="range"
            min={0}
            max={transport.duration}
            step={0.1}
            value={transport.current}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={t("player.play")}
            className="range-brand mb-2 w-full"
          />
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Control
            onClick={togglePlay}
            label={transport.playing ? t("player.pause") : t("player.play")}
          >
            {transport.playing ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Control>

          <div className="flex items-center gap-1">
            <Control
              onClick={toggleMute}
              label={transport.muted ? t("player.unmute") : t("player.mute")}
            >
              {transport.muted || transport.volume === 0 ? (
                <MuteIcon className="h-5 w-5" />
              ) : (
                <VolumeIcon className="h-5 w-5" />
              )}
            </Control>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={transport.muted ? 0 : transport.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label={t("player.unmute")}
              className="range-brand hidden w-20 sm:block"
            />
          </div>

          {!isLive && transport.duration > 0 && (
            <span className="ms-1 hidden text-[11px] tabular-nums text-white/75 sm:inline">
              {formatTime(transport.current)} / {formatTime(transport.duration)}
            </span>
          )}

          <div className="ms-auto flex items-center gap-1">
            <Control onClick={handleSubs} label={t("player.subtitles")} active={player.subsOn}>
              <SubtitlesIcon className="h-5 w-5" />
            </Control>

            {pipSupported && (
              <Control onClick={togglePip} label={t("player.pip")} active={transport.pipActive}>
                <PipIcon className="h-5 w-5" />
              </Control>
            )}

            <div className="relative">
              <Control
                onClick={() => setMenu((m) => (m === "quality" ? null : "quality"))}
                label={t("player.quality")}
                active={menu === "quality"}
              >
                <SettingsIcon className="h-5 w-5" />
              </Control>

              {menu === "quality" && (
                <QualityMenu
                  levels={player.levels}
                  current={player.currentLevel}
                  hasSubs={player.hasSubs}
                  subsOn={player.subsOn}
                  labels={{ quality: t("player.quality"), subtitles: t("player.subtitles") }}
                  onSelect={(index) => {
                    player.setQuality(index);
                    setMenu(null);
                  }}
                  onToggleSubs={() => {
                    handleSubs();
                    setMenu(null);
                  }}
                />
              )}
            </div>

            <Control onClick={toggleFullscreen} label={t("player.fullscreen")}>
              {fullscreen ? (
                <ExitFullscreenIcon className="h-5 w-5" />
              ) : (
                <FullscreenIcon className="h-5 w-5" />
              )}
            </Control>
          </div>
        </div>
      </div>

      {/* Click catcher for the settings menu */}
      {menu && (
        <button
          type="button"
          aria-label={t("common.close")}
          className="absolute inset-0 z-0 cursor-default"
          onClick={() => setMenu(null)}
        />
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function Control({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "relative z-10 grid h-9 w-9 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/15",
        active && "text-brand",
      )}
    >
      {children}
    </button>
  );
}