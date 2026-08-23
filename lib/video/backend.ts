"use client";

/**
 * Client for the optional video API (see /server).
 *
 * The site is a static export with no server of its own, so platform downloads
 * (YouTube, Instagram, TikTok…) are only possible when this API is configured.
 * When `NEXT_PUBLIC_VIDEO_API` is unset the site falls back to handling direct
 * media URLs only, and says so plainly rather than failing silently.
 */

export const VIDEO_API = (process.env.NEXT_PUBLIC_VIDEO_API || "").replace(/\/$/, "");

export function isBackendConfigured(): boolean {
  return VIDEO_API.length > 0;
}

export interface BackendFormat {
  id: string;
  ext: string;
  height: number;
  fps: number | null;
  filesize: number | null;
  audioOnly: boolean;
  label: string;
}

export interface BackendInfo {
  title: string;
  uploader: string | null;
  duration: number | null;
  thumbnail: string | null;
  extractor: string | null;
  webpage: string;
  formats: BackendFormat[];
}

export class VideoApiError extends Error {
  /** True when the service itself is unreachable, rather than the URL failing. */
  readonly unreachable: boolean;
  constructor(message: string, unreachable = false) {
    super(message);
    this.name = "VideoApiError";
    this.unreachable = unreachable;
  }
}

export async function fetchVideoInfo(url: string, signal?: AbortSignal): Promise<BackendInfo> {
  if (!isBackendConfigured()) {
    throw new VideoApiError(
      "Platform downloads are not enabled on this site.",
      true
    );
  }

  let res: Response;
  try {
    res = await fetch(`${VIDEO_API}/api/info?url=${encodeURIComponent(url)}`, {
      signal,
    });
  } catch {
    // Network-level failure: service down, DNS, CORS, or offline.
    throw new VideoApiError(
      "The download service is not responding. It may be offline or restarting.",
      true
    );
  }

  if (!res.ok) {
    let msg = "Unable to download this video.";
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 429) {
      msg = "Too many requests right now. Please wait a minute and try again.";
    }
    throw new VideoApiError(msg, false);
  }

  return (await res.json()) as BackendInfo;
}

/**
 * Direct download URL. Handed to the browser as a normal navigation so the
 * transfer is not subject to CORS and the browser shows its own progress.
 */
export function buildDownloadUrl(
  url: string,
  opts: { formatId?: string; audioOnly?: boolean } = {}
): string {
  const params = new URLSearchParams({ url });
  if (opts.formatId) params.set("format", opts.formatId);
  if (opts.audioOnly) params.set("audio", "1");
  return `${VIDEO_API}/api/download?${params.toString()}`;
}

/** Platform detected from the URL, for labelling and routing. */
export function detectPlatform(url: string): string | null {
  const u = url.trim();
  if (/youtube\.com|youtu\.be/i.test(u)) return "YouTube";
  if (/instagram\.com/i.test(u)) return "Instagram";
  if (/facebook\.com|fb\.watch/i.test(u)) return "Facebook";
  if (/tiktok\.com/i.test(u)) return "TikTok";
  if (/twitter\.com|x\.com/i.test(u)) return "Twitter/X";
  if (/vimeo\.com/i.test(u)) return "Vimeo";
  if (/dailymotion\.com/i.test(u)) return "Dailymotion";
  if (/reddit\.com/i.test(u)) return "Reddit";
  if (/twitch\.tv/i.test(u)) return "Twitch";
  if (/soundcloud\.com/i.test(u)) return "SoundCloud";
  return null;
}
