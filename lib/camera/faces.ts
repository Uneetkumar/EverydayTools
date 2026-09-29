/**
 * Face detection for the camera, using Google's MediaPipe BlazeFace
 * (short-range) model: 230 KB, built for phone cameras, and fast enough to run
 * several times a second on a phone's CPU.
 *
 * It only finds where faces are. It does not identify anyone, and it runs
 * entirely on the device; the engine and model are served by this site.
 * The engine (~3.4 MB compressed) is downloaded the first time detection is
 * switched on, never as part of the page itself.
 */

import type { FaceDetector as MpFaceDetector } from "@mediapipe/tasks-vision";

/** A face as a box in 0 … 1 coordinates of the image it was found in. */
export interface Face {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

const VERSION = "1.0.1"; // keep in step with package.json (scripts/copy-vendor.mjs)
const WASM_BASE = `/vendor/mediapipe/${VERSION}`;
const MODEL = "/models/blaze-face-short-range.tflite";

let loading: Promise<MpFaceDetector | null> | null = null;

/** Loads the detector once per page. Resolves to null if it cannot run here. */
export function loadFaceDetector(): Promise<MpFaceDetector | null> {
  loading ??= (async () => {
    try {
      const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return await FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.6,
      });
    } catch {
      loading = null; // allow a retry later (e.g. after going back online)
      return null;
    }
  })();
  return loading;
}

let scratch: HTMLCanvasElement | null = null;

/**
 * Finds faces in a video frame or image. The frame is scaled down to 320 px
 * first: the model works at 128 px anyway, and a small copy is much cheaper
 * to hand over than a full HD frame.
 */
export function detectFaces(
  detector: MpFaceDetector,
  source: HTMLVideoElement | HTMLCanvasElement,
  timestamp: number
): Face[] {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (!sw || !sh) return [];
  const k = Math.min(1, 320 / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * k));
  const h = Math.max(1, Math.round(sh * k));
  scratch ??= document.createElement("canvas");
  if (scratch.width !== w) scratch.width = w;
  if (scratch.height !== h) scratch.height = h;
  scratch.getContext("2d")!.drawImage(source, 0, 0, w, h);
  const result = detector.detectForVideo(scratch, timestamp);
  return result.detections
    .filter((d) => d.boundingBox)
    .map((d) => {
      const b = d.boundingBox!;
      return {
        x: b.originX / w,
        y: b.originY / h,
        w: b.width / w,
        h: b.height / h,
        score: d.categories[0]?.score ?? 0,
      };
    })
    .filter((f) => f.w > 0.02 && f.h > 0.02)
    .sort((a, b) => b.w * b.h - a.w * a.h)
    .slice(0, 4);
}

/**
 * Eases boxes towards new detections so frames do not jitter, and keeps a face
 * for a couple of misses so a blink or a turn of the head does not make it
 * flicker away.
 */
export function smoothFaces(prev: (Face & { miss?: number })[], next: Face[]): (Face & { miss?: number })[] {
  const out: (Face & { miss?: number })[] = [];
  const used = new Set<number>();
  for (const n of next) {
    let best = -1;
    let bestD = Infinity;
    prev.forEach((p, i) => {
      if (used.has(i)) return;
      const d = Math.hypot(p.x + p.w / 2 - (n.x + n.w / 2), p.y + p.h / 2 - (n.y + n.h / 2));
      if (d < bestD && d < Math.max(n.w, p.w)) {
        best = i;
        bestD = d;
      }
    });
    if (best >= 0) {
      used.add(best);
      const p = prev[best];
      const t = 0.55;
      out.push({ x: p.x + (n.x - p.x) * t, y: p.y + (n.y - p.y) * t, w: p.w + (n.w - p.w) * t, h: p.h + (n.h - p.h) * t, score: n.score, miss: 0 });
    } else {
      out.push({ ...n, miss: 0 });
    }
  }
  prev.forEach((p, i) => {
    if (!used.has(i) && (p.miss ?? 0) < 2) out.push({ ...p, miss: (p.miss ?? 0) + 1 });
  });
  return out.slice(0, 4);
}

/**
 * Moves faces found in a whole frame into the coordinates of a cropped (and
 * possibly mirrored) output. Faces outside the crop are dropped.
 */
export function facesInCrop(
  faces: Face[],
  crop: { x: number; y: number; w: number; h: number },
  mirror = false
): Face[] {
  return faces
    .map((f) => {
      let x = (f.x - crop.x) / crop.w;
      const y = (f.y - crop.y) / crop.h;
      const w = f.w / crop.w;
      const h = f.h / crop.h;
      if (mirror) x = 1 - x - w;
      return { ...f, x, y, w, h };
    })
    .filter((f) => f.x + f.w > 0.05 && f.x < 0.95 && f.y + f.h > 0.05 && f.y < 0.95);
}
