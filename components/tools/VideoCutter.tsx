"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Scissors, Download, RefreshCw, AlertTriangle, Play, Pause,
} from "lucide-react";
import confetti from "canvas-confetti";
import { getFFmpeg, fetchFile, formatDuration, toTimestamp } from "@/lib/media/ffmpeg";
import { downloadBlob } from "@/lib/utils/download";

/**
 * Trims a video to a chosen range.
 *
 * Uses `-c copy` — a stream copy rather than a re-encode. That makes the cut
 * near-instant and completely lossless, at the cost of landing on the nearest
 * preceding keyframe (typically within a couple of seconds). Re-encoding would
 * be frame-accurate but slow enough in wasm to be unusable on a long clip.
 */
export default function VideoCutter() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setError(null);
    setSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
    setFile(f);
  };

  const onMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setStart(0);
    setEnd(v.duration || 0);
  };

  // Keep the preview head inside the selected range so you can hear where the
  // cut will actually land.
  const previewAt = (t: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(duration, t));
  };

  const cut = useCallback(async () => {
    if (!file || end <= start) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const ff = await getFFmpeg((r, msg) => {
        setProgress(r);
        if (msg) setStatus(msg);
      });
      setStatus("Trimming…");

      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const input = `in.${ext}`;
      const output = `out.${ext}`;

      await ff.writeFile(input, await fetchFile(file));
      // -ss before -i seeks by keyframe and is dramatically faster than
      // decoding from the start of the file.
      await ff.exec([
        "-ss", toTimestamp(start),
        "-to", toTimestamp(end),
        "-i", input,
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        output,
      ]);

      const data = await ff.readFile(output);
      const blob = new Blob([data as BlobPart], { type: file.type || "video/mp4" });
      downloadBlob(
        blob,
        `${file.name.replace(/\.[^.]+$/, "")}-clip.${ext}`
      );

      await ff.deleteFile(input).catch(() => {});
      await ff.deleteFile(output).catch(() => {});

      setStatus(`Trimmed to ${formatDuration(end - start)}.`);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setError(
        "Could not trim that file. Some containers (notably MKV and unusual codecs) cannot be stream-copied — try an MP4."
      );
    } finally {
      setBusy(false);
    }
  }, [file, start, end]);

  const clipLength = Math.max(0, end - start);

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center transition hover:bg-blue-50/30">
        <Scissors className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a video to trim
        </p>
        <p className="text-xs text-slate-500">
          Cut without re-encoding — instant, lossless, and nothing is uploaded.
        </p>
        <input
          type="file" accept="video/*" disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
          aria-label="Choose a video"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
        />
      </div>

      {error && (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {src && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef} src={src} onLoadedMetadata={onMeta}
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
              className="aspect-video w-full object-contain"
            />
            <button
              onClick={() => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); }}
              aria-label={playing ? "Pause" : "Play"}
              className="absolute bottom-2 left-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-900 shadow"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="cut-start" className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Start</span>
                <span className="font-mono text-blue-600">{formatDuration(start)}</span>
              </label>
              <input
                id="cut-start" type="range" min={0} max={duration || 0} step={0.1} value={start}
                onChange={(e) => {
                  const v = Math.min(parseFloat(e.target.value), end - 0.1);
                  setStart(v); previewAt(v);
                }}
                className="w-full cursor-pointer accent-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cut-end" className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>End</span>
                <span className="font-mono text-blue-600">{formatDuration(end)}</span>
              </label>
              <input
                id="cut-end" type="range" min={0} max={duration || 0} step={0.1} value={end}
                onChange={(e) => {
                  const v = Math.max(parseFloat(e.target.value), start + 0.1);
                  setEnd(v); previewAt(v);
                }}
                className="w-full cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Clip length{" "}
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatDuration(clipLength)}
              </strong>{" "}
              of {formatDuration(duration)}
            </span>
            <button
              onClick={cut} disabled={busy || clipLength <= 0}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working…" : "Trim & download"}
            </button>
          </div>

          {busy && (
            <div className="space-y-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-[11px] text-slate-500">{status}</p>
            </div>
          )}
          {!busy && status && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{status}</p>}

          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            The cut copies streams rather than re-encoding, so it is instant and
            loses no quality — but it lands on the nearest keyframe before your
            start point, usually within a second or two.
          </p>
        </div>
      )}
    </div>
  );
}
