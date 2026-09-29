/**
 * Small browser helpers for taking and handling photos: crop shapes, frame
 * grabbing for low-light merges, thumbnails and loading a photo from a file.
 */

import type { Crop } from "./renderer";
import { sourceSize } from "./renderer";

export type Shape = "full" | "4:3" | "1:1" | "16:9";

export const SHAPES: { value: Shape; label: string }[] = [
  { value: "full", label: "Full" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
];

/**
 * The centred part of a `w × h` frame with the chosen shape. Ratios follow the
 * frame's orientation, so 4:3 on a phone held upright is a 3:4 portrait.
 */
export function cropForShape(w: number, h: number, shape: Shape): Crop {
  if (shape === "full" || !w || !h) return { x: 0, y: 0, w: 1, h: 1 };
  const [a, b] = shape.split(":").map(Number);
  const target = w >= h ? a / b : b / a;
  const current = w / h;
  if (Math.abs(current - target) < 0.01) return { x: 0, y: 0, w: 1, h: 1 };
  if (current > target) {
    const cw = target / current;
    return { x: (1 - cw) / 2, y: 0, w: cw, h: 1 };
  }
  const ch = current / target;
  return { x: 0, y: (1 - ch) / 2, w: 1, h: ch };
}

/** Pixel size of a crop, scaled down so the longer side is at most `cap`. */
export function cropPixels(w: number, h: number, crop: Crop, cap = Infinity): { width: number; height: number } {
  const cw = w * crop.w;
  const ch = h * crop.h;
  const k = Math.min(1, cap / Math.max(cw, ch));
  return { width: Math.max(1, Math.round(cw * k)), height: Math.max(1, Math.round(ch * k)) };
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), type, quality);
  });
}

let scratch: HTMLCanvasElement | null = null;
function scratchCanvas(w: number, h: number): CanvasRenderingContext2D {
  scratch ??= document.createElement("canvas");
  if (scratch.width !== w) scratch.width = w;
  if (scratch.height !== h) scratch.height = h;
  return scratch.getContext("2d", { willReadFrequently: true })!;
}

/** A small RGBA copy of the cropped source, for measuring levels. */
export function samplePixels(source: CanvasImageSource, crop: Crop, width = 96): { data: Uint8ClampedArray; width: number } {
  const { width: sw, height: sh } = sourceSize(source);
  const cw = sw * crop.w;
  const ch = sh * crop.h;
  const w = Math.max(8, Math.min(width, Math.round(cw)));
  const h = Math.max(8, Math.round((w * ch) / Math.max(cw, 1)));
  const ctx = scratchCanvas(w, h);
  ctx.drawImage(source, sw * crop.x, sh * crop.y, cw, ch, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, width: w };
}

/** Square, centre-cropped JPEG thumbnail as a data URL. */
export function thumbnail(source: CanvasImageSource, size = 160, mirror = false): string {
  const { width: sw, height: sh } = sourceSize(source);
  const side = Math.min(sw, sh);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  if (mirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.75);
}

/** Resolves on the next new video frame (or after ~one frame where unsupported). */
export function nextFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    if (typeof v.requestVideoFrameCallback === "function") {
      let done = false;
      const t = setTimeout(() => {
        done = true;
        resolve();
      }, 120);
      v.requestVideoFrameCallback(() => {
        if (done) return;
        clearTimeout(t);
        resolve();
      });
    } else {
      setTimeout(resolve, 40);
    }
  });
}

/**
 * Reads `count` successive frames at full resolution. Frames are copied as
 * they arrive, so memory stays at `count` frames.
 */
export async function grabFrames(video: HTMLVideoElement, count: number): Promise<{ frames: Uint8ClampedArray[]; width: number; height: number }> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const frames: Uint8ClampedArray[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await nextFrame(video);
    if (video.videoWidth !== width || video.videoHeight !== height) break; // phone rotated
    ctx.drawImage(video, 0, 0, width, height);
    frames.push(ctx.getImageData(0, 0, width, height).data);
  }
  return { frames, width, height };
}

/** How many frames a low-light merge uses: fewer for large frames, to spare memory. */
export function lowLightFrameCount(width: number, height: number): number {
  return Math.max(3, Math.min(6, Math.round(14e6 / Math.max(1, width * height))));
}

/**
 * Decodes an image file into a canvas, the right way up (browsers apply the
 * EXIF orientation when drawing), scaled so it has at most `maxPixels`.
 */
export async function loadPhoto(file: Blob, maxSide = 4096, maxPixels = 16e6): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const k = Math.min(1, maxSide / Math.max(w, h), Math.sqrt(maxPixels / (w * h)));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * A small made-up scene (sky, sun, hills, a figure) so the filter swatches
 * show something meaningful before the camera is on.
 */
export function sampleScene(size = 96): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, size * 0.62);
  sky.addColorStop(0, "#7fb2e5");
  sky.addColorStop(1, "#f3d9b1");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#f7c66b";
  ctx.beginPath();
  ctx.arc(size * 0.7, size * 0.38, size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6f8f5a";
  ctx.beginPath();
  ctx.moveTo(0, size * 0.62);
  ctx.quadraticCurveTo(size * 0.35, size * 0.48, size * 0.7, size * 0.6);
  ctx.quadraticCurveTo(size * 0.88, size * 0.64, size, size * 0.58);
  ctx.lineTo(size, size);
  ctx.lineTo(0, size);
  ctx.fill();
  ctx.fillStyle = "#4b6b3f";
  ctx.fillRect(0, size * 0.8, size, size * 0.2);
  ctx.fillStyle = "#c8836a";
  ctx.beginPath();
  ctx.arc(size * 0.3, size * 0.56, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b5473f";
  ctx.fillRect(size * 0.22, size * 0.63, size * 0.16, size * 0.22);
  return c;
}
