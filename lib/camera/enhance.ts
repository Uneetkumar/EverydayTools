/**
 * Auto-enhance and low-light merging, on plain RGBA pixel arrays so they run
 * the same in the browser and in tests.
 *
 * Auto-enhance measures a small copy of the frame (about 64 × 48 pixels, a
 * few thousand values) and returns levels for the shader: a gentle black and
 * white point stretch, a partial white-balance correction taken only from
 * neutral-looking pixels, and a midtone lift for dark scenes. Every
 * correction is capped, so a dark room stays a dark room and a sunset stays
 * orange — the aim is a clearer version of the scene, not a different one.
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

/** Levels for one frame. `data` is RGBA, as from getImageData. */
export function measureLevels(data: Uint8ClampedArray | Uint8Array): Levels {
  const n = Math.floor(data.length / 4);
  if (n < 16) return IDENTITY_LEVELS;

  const hist = new Uint32Array(256);
  let neutral = 0;
  let nr = 0;
  let ng = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const y = (r * 54 + g * 183 + b * 19) >> 8;
    hist[y]++;
    // White balance reads only greys and whites (not skin, sky or foliage),
    // which is what keeps a close-up face from being pushed blue.
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    if (y > 40 && y < 235 && mx - mn < 0.18 * mx) {
      neutral++;
      nr += r;
      ng += g;
      nb += b;
    }
  }

  // Black and white points, stretched only part of the way and never past
  // limits that would turn a dark or bright scene grey.
  const lo = percentile(hist, n, 0.005) / 255;
  const hi = percentile(hist, n, 0.995) / 255;
  const black = Math.min(lo, 0.12) * 0.8;
  const white = 1 - (1 - Math.max(hi, 0.78)) * 0.8;
  const range = Math.max(white - black, 0.2);

  // Partial grey-world on the neutral pixels, at most ±8 % per channel.
  let gains: [number, number, number] = [1, 1, 1];
  if (neutral > n * 0.04) {
    const avg = (nr + ng + nb) / 3;
    const strength = 0.6;
    gains = [nr, ng, nb].map((v) => clamp(1 + (avg / Math.max(v, 1) - 1) * strength, 0.92, 1.08)) as [
      number,
      number,
      number,
    ];
  }

  // Midtones: a frame whose average sits in a normal band is left alone; a
  // dark one is lifted towards it and a washed-out one eased down a little.
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += hist[i] * clamp((i / 255 - black) / range, 0, 1);
  const mean = clamp(sum / n, 0.02, 0.98);
  const ideal = Math.log(clamp(mean, 0.42, 0.6)) / Math.log(mean);
  const gamma = clamp(1 + (ideal - 1) * 0.55, 0.62, 1.12);

  return {
    black: [black, black, black],
    scale: [gains[0] / range, gains[1] / range, gains[2] / range],
    gamma,
  };
}

/** Moves the live levels part of the way to a new measurement, to avoid flicker. */
export function blendLevels(from: Levels, to: Levels, t: number): Levels {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    black: from.black.map((v, i) => mix(v, to.black[i])) as Levels["black"],
    scale: from.scale.map((v, i) => mix(v, to.scale[i])) as Levels["scale"],
    gamma: mix(from.gamma, to.gamma),
  };
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
