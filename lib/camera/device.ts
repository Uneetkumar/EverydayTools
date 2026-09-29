/**
 * Camera and recorder helpers: opening the camera at a sensible resolution,
 * finding out what the hardware supports, and choosing a video format every
 * browser can record and every phone can play.
 */

export type Facing = "user" | "environment";
export type Quality = "standard" | "high" | "max";

export const QUALITY: Record<Quality, { label: string; hint: string; width: number; height: number; bitrate: number }> = {
  standard: { label: "Standard", hint: "720p. Lightest, best for older phones.", width: 1280, height: 720, bitrate: 2_500_000 },
  high: { label: "High", hint: "1080p. Sharp photos and videos.", width: 1920, height: 1080, bitrate: 5_000_000 },
  max: { label: "Maximum", hint: "The highest your camera allows, up to 4K.", width: 3840, height: 2160, bitrate: 10_000_000 },
};

/** Phones with 2 GB of memory or two cores start on Standard. */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (typeof mem === "number" && mem <= 2) || (typeof cores === "number" && cores <= 2);
}

export function cameraSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export async function openCamera({
  facing,
  deviceId,
  quality,
}: {
  facing: Facing;
  deviceId?: string;
  quality: Quality;
}): Promise<MediaStream> {
  const q = QUALITY[quality];
  const video: MediaTrackConstraints = {
    ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: facing } }),
    // Phones rotate these for portrait on their own.
    width: { ideal: q.width },
    height: { ideal: q.height },
    frameRate: { ideal: 30, max: 30 },
  };
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: false });
  } catch (err) {
    // A camera that cannot do the requested size (or a device that went
    // away) should still open with its defaults rather than fail.
    if (err instanceof DOMException && (err.name === "OverconstrainedError" || err.name === "NotFoundError") && deviceId) {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false });
    }
    if (err instanceof DOMException && err.name === "OverconstrainedError") {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    throw err;
  }
}

export function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Plain-language reason the camera or microphone did not start. */
export function mediaErrorMessage(err: unknown, what: "camera" | "microphone" = "camera"): string {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return `Access to the ${what} was blocked. Allow it from the icon in your browser's address bar, then try again.`;
    case "NotFoundError":
    case "DevicesNotFoundError":
      return `No ${what} was found on this device.`;
    case "NotReadableError":
    case "TrackStartError":
      return `The ${what} is being used by another app or tab. Close it, then try again.`;
    case "SecurityError":
      return `The ${what} can only be used on a secure (https) page.`;
    case "AbortError":
      return `The ${what} could not be started. Try again.`;
    default:
      return `The ${what} could not be started. Check that no other app is using it and try again.`;
  }
}

export interface TrackFeatures {
  torch: boolean;
  zoom: { min: number; max: number; step: number } | null;
}

/** Controls the hardware offers. Only some Android phones report torch and zoom. */
export function trackFeatures(track: MediaStreamTrack | undefined): TrackFeatures {
  const out: TrackFeatures = { torch: false, zoom: null };
  if (!track || typeof track.getCapabilities !== "function") return out;
  try {
    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      torch?: boolean;
      zoom?: { min: number; max: number; step: number };
    };
    out.torch = caps.torch === true;
    if (caps.zoom && caps.zoom.max > caps.zoom.min) out.zoom = { min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1 };
  } catch {
    /* capabilities are optional */
  }
  return out;
}

/** Applies an advanced constraint (torch, zoom) and reports whether it took. */
export async function applyAdvanced(track: MediaStreamTrack | undefined, constraint: Record<string, unknown>): Promise<boolean> {
  if (!track) return false;
  try {
    await track.applyConstraints({ advanced: [constraint as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

/**
 * The best format this browser can record. MP4 first because it plays on
 * every phone and computer (Safari and recent Chrome record it); WebM for
 * Firefox and older Chrome.
 */
export function pickRecorderType(withAudio: boolean): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = withAudio
    ? [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4;codecs=avc1,mp4a.40.2",
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ]
    : ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      /* keep looking */
    }
  }
  return "";
}

export function recorderSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
}

export function extensionFor(mime: string): "mp4" | "webm" {
  return mime.includes("mp4") ? "mp4" : "webm";
}

/** "photo-2026-09-29-143012" in local time. */
export function timestampName(prefix: string, date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${prefix}-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}
