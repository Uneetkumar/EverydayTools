"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/**
 * Lazily-loaded ffmpeg.wasm.
 *
 * The core is ~32MB, so it is fetched only when a tool actually needs it — it
 * must never be part of the initial page load. It is self-hosted under
 * /public/ffmpeg rather than pulled from a CDN, so the site keeps working if a
 * CDN goes down and no third party sees that you are using these tools.
 *
 * Deliberately the SINGLE-THREADED core: the multi-threaded build needs
 * SharedArrayBuffer, which requires COOP/COEP headers site-wide — and those
 * headers break third-party embeds including AdSense. Slower, but it does not
 * cost the rest of the site.
 */

const CORE_BASE = "/ffmpeg";

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

export type ProgressHandler = (ratio: number, message?: string) => void;

export async function getFFmpeg(onProgress?: ProgressHandler): Promise<FFmpeg> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const ff = new FFmpeg();

    ff.on("progress", ({ progress }) => {
      // ffmpeg reports >1 near the end on some inputs; clamp so progress bars
      // never render past full.
      onProgress?.(Math.max(0, Math.min(1, progress)));
    });

    onProgress?.(0, "Loading video engine (about 32MB, first time only)…");
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });

    instance = ff;
    return ff;
  })();

  try {
    return await loading;
  } catch (e) {
    // Allow a retry rather than caching a failed load forever.
    loading = null;
    throw e;
  }
}

export { fetchFile };

/** Whether the engine is already in memory, so the UI can warn about the download. */
export function isEngineReady(): boolean {
  return instance !== null;
}

export function formatDuration(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

/** ffmpeg wants HH:MM:SS.mmm for -ss and -to. */
export function toTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s
    .toFixed(3)
    .padStart(6, "0")}`;
}
