"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Film, Loader2, RotateCcw,
} from "lucide-react";
import { VideoMetadata } from "@/lib/video/metadata";

interface VideoPreviewProps {
  metadata: VideoMetadata;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

/**
 * Video player with a real transport bar.
 *
 * The previous version had no seek control at all, and its play button was
 * absolutely positioned with `inset-0 m-auto` — so it stayed centred over the
 * picture during playback rather than getting out of the way. Controls also
 * only appeared on hover, which leaves touch users with nothing.
 */
export default function VideoPreview({ metadata }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(metadata.durationSeconds || 0);
  const [buffered, setBuffered] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  // Keyboard transport, scoped to the player so it does not hijack the page.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      v.currentTime = Math.max(0, v.currentTime - 5);
    } else if (e.key === "m") {
      e.preventDefault();
      v.muted = !v.muted;
      setMuted(v.muted);
    } else if (e.key === "f") {
      e.preventDefault();
      wrapRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.buffered.length) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
    };
    const onMeta = () => setDuration(v.duration || metadata.durationSeconds || 0);
    const onPlay = () => { setPlaying(true); setEnded(false); };
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setEnded(true); };
    const onWait = () => setWaiting(true);
    const onCanPlay = () => setWaiting(false);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnd);
    v.addEventListener("waiting", onWait);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [metadata.durationSeconds]);

  const seek = (value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setCurrent(value);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Preview
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold">
          {metadata.resolutionTier}
        </span>
      </div>

      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Video player. Space to play or pause, arrow keys to seek."
        className="relative rounded-2xl overflow-hidden bg-black aspect-video group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <video
          ref={videoRef}
          src={metadata.url}
          playsInline
          preload="metadata"
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {waiting && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="w-9 h-9 text-white/90 animate-spin" />
          </span>
        )}

        {/* Only shown while paused, so it never covers the picture during
            playback the way the old always-on button did. */}
        {!playing && !waiting && (
          <button
            onClick={togglePlay}
            aria-label={ended ? "Replay" : "Play"}
            className="absolute inset-0 grid place-items-center bg-black/25 transition hover:bg-black/35"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:scale-105 active:scale-95">
              {ended ? <RotateCcw className="h-7 w-7" /> : <Play className="h-7 w-7 translate-x-0.5" />}
            </span>
          </button>
        )}

        {/* Always visible on touch; fades in on hover for pointer devices. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-2 pt-6 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <div className="relative mb-2 h-1.5 rounded-full bg-white/25">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${bufPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={(e) => seek(parseFloat(e.target.value))}
              aria-label="Seek"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex items-center gap-3 text-white">
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="transition hover:text-blue-400">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <span className="font-mono text-[11px] tabular-nums text-slate-200">
              {fmt(current)} / {fmt(duration)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.muted = !v.muted;
                  setMuted(v.muted);
                }}
                aria-label={muted ? "Unmute" : "Mute"}
                className="transition hover:text-blue-400"
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const v = videoRef.current;
                  setVolume(val);
                  if (v) {
                    v.volume = val;
                    v.muted = val === 0;
                    setMuted(val === 0);
                  }
                }}
                aria-label="Volume"
                className="hidden h-1 w-16 cursor-pointer accent-blue-500 sm:block"
              />
              <span className="hidden rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                {metadata.width}×{metadata.height}
              </span>
              <button
                onClick={() => wrapRef.current?.requestFullscreen?.().catch(() => {})}
                aria-label="Fullscreen"
                className="transition hover:text-blue-400"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
