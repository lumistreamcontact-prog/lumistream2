"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error"
  | "reconnecting";

export type PlayerError = "unavailable" | "network" | "unsupported" | "subscription_required" | null;

export interface QualityLevel {
  index: number;
  label: string;
}

const RECONNECT_DELAYS = [2000, 4000, 8000, 15000];
const MAX_RETRIES = RECONNECT_DELAYS.length + 2;

export interface UseHlsOptions {
  channelId: string;
  isLive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onEnded?: () => void;
}

/**
 * Owns everything hls.js-related: token negotiation, manifest loading,
 * reconnect/backoff, quality levels and subtitle tracks.
 *
 * The player never learns the upstream URL — it only ever talks to
 * `/api/stream/[id]/p`, which proxies and re-encodes every segment.
 */
export function useHls({ channelId, isLive, videoRef, onEnded }: UseHlsOptions) {
  const hlsRef = useRef<Hls | null>(null);
  const retryRef = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEndedRef = useRef(onEnded);
  const subsOnRef = useRef(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<PlayerError>(null);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [hasSubs, setHasSubs] = useState(false);
  const [subsOn, setSubsOn] = useState(false);

  useEffect(() => {
    subsOnRef.current = subsOn;
  }, [subsOn]);

  const destroy = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const fail = useCallback((next: PlayerError) => {
    setStatus("error");
    setError(next);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Retry with exponential backoff                                      */
  /* ------------------------------------------------------------------ */

  /**
   * `schedule` needs to call `load`, and `load` needs to call `schedule` on a
   * fatal network error. Breaking the cycle with a ref keeps both callbacks
   * stable and lets either be declared first.
   */
  const loadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const schedule = useCallback(() => {
    const attempt = retryRef.current;
    const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
    retryRef.current = attempt + 1;

    reconnectTimer.current = setTimeout(() => {
      if (retryRef.current > MAX_RETRIES) {
        fail("unavailable");
        return;
      }
      void loadRef.current();
    }, delay);
  }, [fail]);

  const load = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    destroy();
    setStatus("loading");
    setError(null);

    let source: string;
    try {
      const res = await fetch(`/api/stream/${channelId}/token`, { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        fail(data.error === "subscription_required" ? "subscription_required" : "unavailable");
        return;
      }
      const data = (await res.json()) as { url: string; token: string };
      source = `${data.url}?t=${encodeURIComponent(data.token)}`;
    } catch {
      fail("network");
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        backBufferLength: 60,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 4,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const available: QualityLevel[] = (data.levels ?? []).map((level: Level, i: number) => ({
          index: i,
          label: level.height ? `${level.height}p` : `Level ${i + 1}`,
        }));
        setLevels(available);
        setHasSubs(hls.subtitleTracks.length > 0 || hls.audioTracks.length > 0);
        setStatus("paused");
        void video.play().catch(() => {
          /* autoplay blocked by the browser — the user can press play */
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => setCurrentLevel(data.level));

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event, data) => {
        setHasSubs(data.subtitleTracks.length > 0 || hls.audioTracks.length > 0);
        if (data.subtitleTracks.length > 0 && subsOnRef.current) {
          hls.subtitleTrack = 0;
          hls.subtitleDisplay = true;
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStatus("reconnecting");
          schedule();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          // A single media glitch is usually recoverable without a reload.
          try {
            hls.recoverMediaError();
            setStatus("reconnecting");
            return;
          } catch {
            /* fall through to fatal handling */
          }
        }

        hls.destroy();
        hlsRef.current = null;
        fail("unavailable");
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      return;
    }

    // Safari / iOS play HLS natively.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      setStatus("paused");
      void video.play().catch(() => undefined);
      return;
    }

    fail("unsupported");
  }, [channelId, destroy, fail, isLive, schedule, videoRef]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    retryRef.current = 0;
    /* Kick the load off on the next frame so the poster paints first and the
       initial state updates are not part of the commit phase. */
    const raf = requestAnimationFrame(() => {
      void loadRef.current();
    });
    return () => {
      cancelAnimationFrame(raf);
      destroy();
    };
  }, [load, destroy]);

  /* ---------------------------------------------------------------- */
  /* Transport state, driven by DOM events on the <video> element     */
  /* ---------------------------------------------------------------- */

  const [transport, setTransport] = useState({
    playing: false,
    muted: false,
    volume: 1,
    pipActive: false,
    current: 0,
    duration: 0,
    buffered: 0,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () =>
      setTransport((prev) => ({
        ...prev,
        playing: !video.paused && !video.ended,
        muted: video.muted,
        volume: video.volume,
        current: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        buffered: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0,
      }));

    const onPlay = () => {
      setStatus("playing");
      sync();
    };
    const onPause = () => {
      setStatus("paused");
      sync();
    };
    const onWaiting = () => setStatus("reconnecting");
    const onPlaying = () => {
      setStatus("playing");
      retryRef.current = 0; // a healthy frame cancels pending backoff
    };
    const onError = () => fail("unavailable");
    const onEnd = () => onEndedRef.current?.();

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", sync);
    video.addEventListener("progress", sync);
    video.addEventListener("seeked", sync);
    video.addEventListener("durationchange", sync);
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("volumechange", sync);
    video.addEventListener("error", onError);
    video.addEventListener("ended", onEnd);
    video.addEventListener("enterpictureinpicture", () =>
      setTransport((prev) => ({ ...prev, pipActive: true })),
    );
    video.addEventListener("leavepictureinpicture", () =>
      setTransport((prev) => ({ ...prev, pipActive: false })),
    );

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", sync);
      video.removeEventListener("progress", sync);
      video.removeEventListener("seeked", sync);
      video.removeEventListener("durationchange", sync);
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("volumechange", sync);
      video.removeEventListener("error", onError);
      video.removeEventListener("ended", onEnd);
    };
  }, [videoRef, fail]);

  /* ---------------------------------------------------------------- */
  /* Imperative controls                                              */
  /* ---------------------------------------------------------------- */

  const retry = useCallback(() => {
    retryRef.current = 0;
    void load();
  }, [load]);

  const setQuality = useCallback((index: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setCurrentLevel(index);
  }, []);

  /** Returns false when the source simply has no subtitles available. */
  const toggleSubs = useCallback((): boolean => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    const next = !subsOnRef.current;

    if (hls && hls.subtitleTracks.length > 0) {
      hls.subtitleTrack = next ? 0 : -1;
      hls.subtitleDisplay = next;
      setSubsOn(next);
      return true;
    }

    if (video && video.textTracks.length > 0) {
      video.textTracks[0]!.mode = next ? "showing" : "hidden";
      setSubsOn(next);
      return true;
    }

    return false;
  }, [videoRef]);

  return {
    status,
    error,
    levels,
    currentLevel,
    hasSubs,
    subsOn,
    transport,
    retry,
    setQuality,
    toggleSubs,
  };
}

export type HlsController = ReturnType<typeof useHls>;
