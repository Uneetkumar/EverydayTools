"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  VolumeX, Music, Download, RefreshCw, AlertTriangle, Upload,
} from "lucide-react";
import confetti from "canvas-confetti";
import { getFFmpeg, fetchFile, formatDuration } from "@/lib/media/ffmpeg";
import { downloadBlob } from "@/lib/utils/download";

type Mode = "mute" | "extract";

/**
 * Removes the audio track from a video, or pulls the audio out as a file.
 *
 * Both operations are stream copies (`-c copy`), so neither re-encodes: muting
 * keeps the video bit-identical and extraction keeps the original audio
 * quality. That is both instant and lossless, which a re-encode would not be.
 */
export default function AudioRemover() {
  const [mode, setMode] = useState<Mode>("mute");
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setError(null);
    setStatus(null);
    setHasAudio(null);
    setSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
    setFile(f);
  };

  const onMeta = () => {
    const v = videoRef.current as (HTMLVideoElement & {
      mozHasAudio?: boolean;
      webkitAudioDecodedByteCount?: number;
      audioTracks?: { length: number };
    }) | null;
    if (!v) return;
    setDuration(v.duration || 0);
    // No standard API exposes track presence, so probe the vendor hints that
    // exist and stay silent when none of them do rather than guessing wrong.
    const detected =
      v.mozHasAudio ??
      (typeof v.webkitAudioDecodedByteCount === "number"
        ? v.webkitAudioDecodedByteCount > 0
        : undefined) ??
      (v.audioTracks ? v.audioTracks.length > 0 : undefined);
    setHasAudio(typeof detected === "boolean" ? detected : null);
  };

  const run = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const ff = await getFFmpeg((r, msg) => {
        setProgress(r);
        if (msg) setStatus(msg);
      });

      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const input = `in.${ext}`;
      const base = file.name.replace(/\.[^.]+$/, "");

      await ff.writeFile(input, await fetchFile(file));

      if (mode === "mute") {
        setStatus("Removing audio track…");
        const output = `out.${ext}`;
        // -an drops audio; -c copy leaves the video untouched.
        await ff.exec(["-i", input, "-c", "copy", "-an", output]);
        const data = await ff.readFile(output);
        downloadBlob(
          new Blob([data as BlobPart], { type: file.type || "video/mp4" }),
          `${base}-muted.${ext}`
        );
        await ff.deleteFile(output).catch(() => {});
        setStatus("Audio removed. Video quality is untouched.");
      } else {
        setStatus("Extracting audio…");
        const output = "out.m4a";
        await ff.exec(["-i", input, "-vn", "-acodec", "copy", output]);
        const data = await ff.readFile(output);
        downloadBlob(
          new Blob([data as BlobPart], { type: "audio/mp4" }),
          `${base}-audio.m4a`
        );
        await ff.deleteFile(output).catch(() => {});
        setStatus("Audio extracted at its original quality.");
      }

      await ff.deleteFile(input).catch(() => {});
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setError(
        mode === "extract"
          ? "Could not extract the audio. If the source has no audio track, or uses a codec that cannot be copied into an .m4a, this will fail."
          : "Could not process that file. Some containers cannot be stream-copied — try an MP4."
      );
    } finally {
      setBusy(false);
    }
  }, [file, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([["mute", "Remove audio from video", VolumeX], ["extract", "Extract audio as a file", Music]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id} onClick={() => setMode(id)} disabled={busy}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                mode === id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          )
        )}
      </div>

      <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center transition hover:bg-blue-50/30">
        <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a video
        </p>
        <p className="text-xs text-slate-500">
          Processed without re-encoding, so quality is preserved exactly. Nothing is uploaded.
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
          <video
            ref={videoRef} src={src} controls onLoadedMetadata={onMeta}
            className="aspect-video w-full rounded-xl bg-black object-contain"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {file?.name} — {formatDuration(duration)}
              {hasAudio === false && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  no audio track detected
                </span>
              )}
            </span>
            <button
              onClick={run} disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working…" : mode === "mute" ? "Remove audio" : "Extract audio"}
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
        </div>
      )}
    </div>
  );
}
