/**
 * Auto-enhance and low-light merging, on plain RGBA pixel arrays so they run
 * the same in the browser and in tests.
 *
 * Auto-enhance measures a small copy of the frame (about 96 × 54 pixels, a
 * few thousand values) and returns levels for the shader: a gentle black and
 * white point stretch, a partial white-balance correction taken only from
 * neutral-looking pixels, a midtone lift for dark scenes (set by the faces
 * when there are any), and how much grain to expect. Every correction is
 * capped, so a dark room stays a dark room and a sunset stays orange — the
 * aim is a clearer version of the scene, not a different one.
 *
 * Low light merges several frames of the video. Each pixel is averaged only
 * with frames where it looks the same, so still areas lose their grain while
 * anything that moved keeps the detail from the first frame instead of
 * ghosting. No alignment step is needed, which keeps it fast on old phones.
 */

import { IDENTITY_LEVELS, type Levels } from "./filters";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function percentile(hist: Uint32Array, total: number, p: number): number {
  const target = total * p;
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= target) return i;
  }
  return 255;
}

/** A face as a box in 0 … 1 coordinates of the measured image. */
export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Levels for one frame. `data` is RGBA, as from getImageData, `width` its
 * width in pixels. With `faces`, exposure is set for the faces first (the way
 * phone cameras meter a portrait), so a face against a bright window is not
 * left in shadow.
 */
export function measureLevels(data: Uint8ClampedArray | Uint8Array, width = 0, faces: FaceBox[] = []): Levels {
  const n = Math.floor(data.length / 4);
  if (n < 16) return IDENTITY_LEVELS;
  const height = width ? Math.floor(n / width) : 0;

  const hist = new Uint32Array(256);
  const neutralHist = new Uint32Array(256);
  let neutral = 0;
  let rawSum = 0;
  // Skin is never used to judge colour: without this, a close-up of a light
  // face would read as "too red" and be cooled.
  const skip = faceMask(width, height, faces);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const y = (r * 54 + g * 183 + b * 19) >> 8;
    hist[y]++;
    rawSum += y;
    if (isNeutral(r, g, b, y) && !skip?.[i]) {
      neutral++;
      neutralHist[y]++;
    }
  }

  // The colour of the light is read from the brightest grey areas only —
  // white walls, paper, highlights — which reflect the light as it is. A
  // room full of blue-grey or beige things then no longer looks like a cast.
  let nr = 0;
  let ng = 0;
  let nb = 0;
  let bright = 0;
  if (neutral > n * 0.04) {
    const from = percentile(neutralHist, neutral, 0.8);
    for (let i = 0; i < n; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const y = (r * 54 + g * 183 + b * 19) >> 8;
      if (y >= from && isNeutral(r, g, b, y) && !skip?.[i]) {
        nr += r;
        ng += g;
        nb += b;
        bright++;
      }
    }
  }

  // Black and white points, stretched only part of the way and never past
  // limits that would turn a dark or bright scene grey.
  const lo = percentile(hist, n, 0.005) / 255;
  const hi = percentile(hist, n, 0.995) / 255;
  const black = Math.min(lo, 0.12) * 0.8;
  const white = 1 - (1 - Math.max(hi, 0.78)) * 0.8;
  const range = Math.max(white - black, 0.2);
  const stretch = (y: number) => clamp((y / 255 - black) / range, 0, 1);

  // White balance: most cameras (and every phone) already balance colour
  // well, and a blue-grey wall or a beige shirt is not a colour cast. So a
  // tint of up to 5 % in the grey areas is left alone; beyond that, 60 % of
  // the excess is corrected, never more than 10 % per channel. Only a clearly
  // wrong webcam (green office light, orange bulb) is touched.
  let gains: [number, number, number] = [1, 1, 1];
  if (bright > 0) {
    const avg = (nr + ng + nb) / 3;
    gains = [nr, ng, nb].map((v) => {
      const off = avg / Math.max(v, 1) - 1;
      const excess = Math.sign(off) * Math.max(0, Math.abs(off) - 0.05);
      return clamp(1 + excess * 0.6, 0.9, 1.1);
    }) as [number, number, number];
  }

  // Midtones: a frame whose average sits in a normal band is left alone; a
  // dark one is lifted towards it and a washed-out one eased down a little.
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += hist[i] * stretch(i);
  const mean = clamp(sum / n, 0.02, 0.98);
  const ideal = Math.log(clamp(mean, 0.42, 0.6)) / Math.log(mean);
  // Darkening is kept very small: a bright frame is usually meant to be.
  let gamma = clamp(1 + (ideal - 1) * 0.6, 0.6, 1.04);

  // Faces: aim their average brightness at a natural skin level and let that
  // decide most of the midtone curve, so a face against a bright window is
  // lifted out of shadow. Each correction is limited before they are mixed.
  const face = faceMean(data, width, height, faces, stretch);
  if (face !== null) {
    const f = clamp(face, 0.03, 0.97);
    const faceIdeal = Math.log(clamp(f, 0.45, 0.62)) / Math.log(f);
    const faceGamma = clamp(1 + (faceIdeal - 1) * 0.8, 0.55, 1.1);
    gamma = faceGamma * 0.75 + gamma * 0.25;
  }

  // Grain: cameras raise their gain in dim light, so darker scenes are
  // noisier, and lifting shadows makes the grain more visible still.
  const raw = rawSum / n / 255;
  const dim = 1 - smoothstep(0.12, 0.45, raw);
  const noise = 0.01 + 0.022 * dim + (gamma < 0.85 ? 0.006 : 0);
  const denoise = clamp(0.18 + 0.47 * dim + (gamma < 0.85 ? 0.1 : 0), 0, 0.75);

  return {
    black: [black, black, black],
    scale: [gains[0] / range, gains[1] / range, gains[2] / range],
    gamma,
    noise,
    denoise,
  };
}

/**
 * Greys and whites: not skin, sky or foliage. Loose enough that a clear tint
 * still counts, and clipped highlights are left out because they have lost
 * their colour.
 */
function isNeutral(r: number, g: number, b: number, y: number): boolean {
  const mx = Math.max(r, g, b);
  return y > 40 && mx < 250 && mx - Math.min(r, g, b) < 0.28 * mx;
}

/** Pixels inside (slightly enlarged) face boxes, or null without faces. */
function faceMask(width: number, height: number, faces: FaceBox[]): Uint8Array | null {
  if (!width || !height || !faces.length) return null;
  const mask = new Uint8Array(width * height);
  for (const f of faces) {
    const x0 = Math.max(0, Math.floor((f.x - f.w * 0.15) * width));
    const x1 = Math.min(width, Math.ceil((f.x + f.w * 1.15) * width));
    const y0 = Math.max(0, Math.floor((f.y - f.h * 0.15) * height));
    const y1 = Math.min(height, Math.ceil((f.y + f.h * 1.3) * height));
    for (let y = y0; y < y1; y++) mask.fill(1, y * width + x0, y * width + x1);
  }
  return mask;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Average stretched brightness inside the face boxes, or null without faces. */
function faceMean(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  faces: FaceBox[],
  stretch: (y: number) => number
): number | null {
  if (!width || !height || !faces.length) return null;
  let sum = 0;
  let count = 0;
  for (const f of faces) {
    // The middle of the box: skin, not hair or background.
    const x0 = Math.max(0, Math.floor((f.x + f.w * 0.2) * width));
    const x1 = Math.min(width, Math.ceil((f.x + f.w * 0.8) * width));
    const y0 = Math.max(0, Math.floor((f.y + f.h * 0.15) * height));
    const y1 = Math.min(height, Math.ceil((f.y + f.h * 0.85) * height));
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const j = (y * width + x) * 4;
        sum += stretch((data[j] * 54 + data[j + 1] * 183 + data[j + 2] * 19) >> 8);
        count++;
      }
  }
  // Too few pixels (a tiny face far away) is not worth steering exposure for.
  return count >= Math.max(6, width * height * 0.004) ? sum / count : null;
}

/** Moves the live levels part of the way to a new measurement, to avoid flicker. */
export function blendLevels(from: Levels, to: Levels, t: number): Levels {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    black: from.black.map((v, i) => mix(v, to.black[i])) as Levels["black"],
    scale: from.scale.map((v, i) => mix(v, to.scale[i])) as Levels["scale"],
    gamma: mix(from.gamma, to.gamma),
    noise: mix(from.noise, to.noise),
    denoise: mix(from.denoise, to.denoise),
  };
}

/** Average of several measurements: one odd frame (a hand passing) barely moves it. */
export function averageLevels(list: Levels[]): Levels {
  if (list.length === 1) return list[0];
  let acc = list[0];
  for (let i = 1; i < list.length; i++) acc = blendLevels(acc, list[i], 1 / (i + 1));
  return acc;
}

/** The largest visible difference between two sets of levels. */
export function levelsDistance(a: Levels, b: Levels): number {
  let d = Math.abs(a.gamma - b.gamma);
  for (let i = 0; i < 3; i++) {
    d = Math.max(d, Math.abs(a.black[i] - b.black[i]) * 2, Math.abs(a.scale[i] - b.scale[i]) / Math.max(a.scale[i], 0.01));
  }
  return d;
}

/**
 * Noise level between two frames, as the median absolute difference of a
 * sample of pixels' brightness. Moving areas are the minority, so the median
 * reflects the sensor grain rather than the motion.
 */
export function estimateNoise(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  const n = Math.floor(a.length / 4);
  const step = Math.max(1, Math.floor(n / 20000));
  const diffs = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < n; i += step) {
    const j = i * 4;
    const ya = (a[j] + 2 * a[j + 1] + a[j + 2]) >> 2;
    const yb = (b[j] + 2 * b[j + 1] + b[j + 2]) >> 2;
    diffs[Math.abs(ya - yb)]++;
    count++;
  }
  return percentile(diffs, count, 0.5);
}

/**
 * Merges frames of the same size into `frames[0]`'s shape. Returns a new
 * RGBA array. Frame 0 is the reference: its pixels always count fully.
 */
export function mergeFrames(frames: Uint8ClampedArray[]): Uint8ClampedArray {
  const ref = frames[0];
  if (frames.length < 2) return ref;
  const n = Math.floor(ref.length / 4);

  // Differences within ~3× the grain count fully, beyond ~6× not at all.
  const noise = estimateNoise(ref, frames[1]);
  const t1 = clamp(noise * 3 + 2, 4, 36);
  const t2 = t1 * 2;

  // Integer weights 0 … 8 keep the sums in 16 bits for up to 8 frames.
  const sum = new Uint16Array(n * 3);
  const weight = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    sum[i * 3] = ref[j] * 8;
    sum[i * 3 + 1] = ref[j + 1] * 8;
    sum[i * 3 + 2] = ref[j + 2] * 8;
    weight[i] = 8;
  }

  const count = Math.min(frames.length, 8);
  for (let f = 1; f < count; f++) {
    const fr = frames[f];
    if (fr.length !== ref.length) continue;
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const d = Math.abs(((fr[j] + 2 * fr[j + 1] + fr[j + 2]) >> 2) - ((ref[j] + 2 * ref[j + 1] + ref[j + 2]) >> 2));
      if (d >= t2) continue;
      const w = d <= t1 ? 8 : Math.round((8 * (t2 - d)) / (t2 - t1));
      if (w === 0) continue;
      sum[i * 3] += fr[j] * w;
      sum[i * 3 + 1] += fr[j + 1] * w;
      sum[i * 3 + 2] += fr[j + 2] * w;
      weight[i] += w;
    }
  }

  const out = new Uint8ClampedArray(ref.length);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    const w = weight[i];
    // Uint8ClampedArray rounds to the nearest integer on assignment.
    out[j] = sum[i * 3] / w;
    out[j + 1] = sum[i * 3 + 1] / w;
    out[j + 2] = sum[i * 3 + 2] / w;
    out[j + 3] = 255;
  }
  return out;
}
