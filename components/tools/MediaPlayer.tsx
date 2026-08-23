"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward,
  Upload, Music, Film, Gauge, PictureInPicture2, X,
} from "lucide-react";

type Mode = "video" | "audio";

interface MediaPlayerProps {
  mode?: Mode;
}

interface Track {
  id: string;
  name: string;
  url: string;
  size: number;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const humanSize = (b: number) =>
  b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;

/**
 * Local media player for video or audio.
 *
 * Files are read with createObjectURL and played straight from disk — nothing
 * is uploaded, and there is no decode step, so even a multi-gigabyte file opens
 * instantly. That also means playback is limited to what the browser itself can
 * decode (MP4/H.264, WebM, Ogg, MP3, WAV, FLAC, AAC); exotic codecs such as
 * MKV/H.265 will fail, and the tool says so rather than showing a blank frame.
 */
export default function MediaPlayer({ mode = "video" }: MediaPlayerProps) {
  const isAudio = mode === "audio";
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const active = tracks.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    return () => {
      tracks.forEach((t) => URL.revokeObjectURL(t.url));
    };
    // Cleanup only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((f) =>
      isAudio ? f.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(f.name)
              : f.type.startsWith("video/") || /\.(mp4|webm|ogv|mov|m4v|mkv)$/i.test(f.name)
    );
    if (!accepted.length) {
      setError(`Those files are not ${isAudio ? "audio" : "video"} files.`);
      return;
    }
    const next = accepted.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }));
    setError(null);
    setTracks((prev) => [...prev, ...next]);
    setActiveId((cur) => cur ?? next[0].id);
  };

  const togglePlay = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, []);

  const step = (delta: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  };

  const changeTrack = (dir: 1 | -1) => {
    if (!active || tracks.length < 2) return;
    const i = tracks.findIndex((t) => t.id === active.id);
    const next = tracks[(i + dir + tracks.length) % tracks.length];
    setActiveId(next.id);
  };

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const onTime = () => {
      setCurrent(el.currentTime);
      if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
    };
    const onMeta = () => { setDuration(el.duration || 0); setError(null); };
    const onErr = () =>
      setError(
        "This browser cannot decode that file. MKV and H.265 in particular are often unsupported — try MP4 (H.264) or WebM."
      );
    const onEnd = () => { setPlaying(false); if (tracks.length > 1) changeTrack(1); };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", () => setPlaying(true));
    el.addEventListener("pause", () => setPlaying(false));
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, tracks.length]);

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.playbackRate = speed;
  }, [speed, activeId]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(5); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-5); }
    else if (e.key === "m") {
      e.preventDefault();
      const el = mediaRef.current;
      if (el) { el.muted = !el.muted; setMuted(el.muted); }
    }
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const Icon = isAudio ? Music : Film;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center transition hover:bg-blue-50/30"
      >
        <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Drop {isAudio ? "audio" : "video"} files here, or click to choose
        </p>
        <p className="text-xs text-slate-500">
          Plays straight from your device — nothing is uploaded, and large files open instantly.
        </p>
        <input
          type="file"
          multiple
          accept={isAudio ? "audio/*" : "video/*"}
          onChange={(e) => addFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`Choose ${isAudio ? "audio" : "video"} files`}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </p>
      )}

      {active && (
        <div
          ref={wrapRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900"
        >
          {isAudio ? (
            <div className="flex items-center gap-4 bg-gradient-to-br from-slate-900 to-blue-950 p-6">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10">
                <Music className="h-7 w-7 text-blue-300" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{active.name}</span>
                <span className="block text-xs text-slate-400">{humanSize(active.size)}</span>
              </span>
              <audio ref={mediaRef} src={active.url} className="hidden" />
            </div>
          ) : (
            <div className="relative aspect-video bg-black">
              <video
                ref={mediaRef}
                src={active.url}
                playsInline
                onClick={togglePlay}
                className="h-full w-full cursor-pointer object-contain"
              />
              {!playing && (
                <button
                  onClick={togglePlay}
                  aria-label="Play"
                  className="absolute inset-0 grid place-items-center bg-black/25 transition hover:bg-black/35"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:scale-105">
                    <Play className="h-7 w-7 translate-x-0.5" />
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-2 p-3">
            <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300 dark:bg-slate-600" style={{ width: `${bufPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
              <input
                type="range" min={0} max={duration || 0} step={0.1} value={current}
                onChange={(e) => { const el = mediaRef.current; if (el) { el.currentTime = parseFloat(e.target.value); setCurrent(parseFloat(e.target.value)); } }}
                aria-label="Seek"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
              {tracks.length > 1 && (
                <button onClick={() => changeTrack(-1)} aria-label="Previous" className="p-1 hover:text-blue-600">
                  <SkipBack className="h-4 w-4" />
                </button>
              )}
              <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}
                className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
              </button>
              {tracks.length > 1 && (
                <button onClick={() => changeTrack(1)} aria-label="Next" className="p-1 hover:text-blue-600">
                  <SkipForward className="h-4 w-4" />
                </button>
              )}

              <span className="font-mono text-[11px] tabular-nums text-slate-500">
                {fmt(current)} / {fmt(duration)}
              </span>

              <div className="ml-auto flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Gauge className="h-3.5 w-3.5" />
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    aria-label="Playback speed"
                    className="cursor-pointer rounded bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {SPEEDS.map((s) => <option key={s} value={s}>{s}x</option>)}
                  </select>
                </label>

                <button
                  onClick={() => { const el = mediaRef.current; if (el) { el.muted = !el.muted; setMuted(el.muted); } }}
                  aria-label={muted ? "Unmute" : "Mute"} className="p-1 hover:text-blue-600"
                >
                  {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value); setVolume(v);
                    const el = mediaRef.current;
                    if (el) { el.volume = v; el.muted = v === 0; setMuted(v === 0); }
                  }}
                  aria-label="Volume" className="hidden h-1 w-16 cursor-pointer accent-blue-600 sm:block"
                />

                {!isAudio && (
                  <>
                    <button
                      onClick={() => mediaRef.current?.requestPictureInPicture?.().catch(() => {})}
                      aria-label="Picture in picture" className="p-1 hover:text-blue-600"
                    >
                      <PictureInPicture2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => wrapRef.current?.requestFullscreen?.().catch(() => {})}
                      aria-label="Fullscreen" className="p-1 hover:text-blue-600"
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tracks.length > 1 && (
        <ul className="space-y-1">
          {tracks.map((t) => (
            <li key={t.id}>
              <div
                onClick={() => setActiveId(t.id)}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
                  t.id === activeId ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{t.name}</span>
                <span className="shrink-0 text-[10px] text-slate-400">{humanSize(t.size)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    URL.revokeObjectURL(t.url);
                    setTracks((prev) => prev.filter((x) => x.id !== t.id));
                    if (activeId === t.id) setActiveId(tracks.find((x) => x.id !== t.id)?.id ?? null);
                  }}
                  aria-label={`Remove ${t.name}`}
                  className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Space plays and pauses, arrow keys seek 5 seconds, M mutes. Files never
          leave your device, so this works offline once the page has loaded.
        </p>
      )}
    </div>
  );
}
