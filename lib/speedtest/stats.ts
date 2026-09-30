/**
 * The arithmetic of a speed test, kept free of the network so it can be tested.
 *
 * A transfer is recorded as a running byte count over time. It is cut into
 * short slices (250 ms), each slice gives a speed, and the headline figure is
 * computed from the slices after the TCP ramp-up: the mean of the middle 80%,
 * which ignores a few unusually fast or slow moments instead of letting them
 * decide the result. Peak and consistency come from the same slices.
 *
 * Percentiles use linear interpolation, as in Cloudflare's speedtest library.
 */

export function percentile(values: number[], p = 0.5): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export const median = (values: number[]) => percentile(values, 0.5);

export const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN);

/** Mean change between consecutive samples, in the samples' unit (ms). */
export function jitterOf(samples: number[]): number {
  if (samples.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < samples.length; i++) sum += Math.abs(samples[i] - samples[i - 1]);
  return sum / (samples.length - 1);
}

export interface LatencySummary {
  median: number;
  min: number;
  max: number;
  p95: number;
  jitter: number;
  samples: number;
}

export function summarizeLatency(samples: number[]): LatencySummary | null {
  if (samples.length === 0) return null;
  return {
    median: median(samples),
    min: Math.min(...samples),
    max: Math.max(...samples),
    p95: percentile(samples, 0.95),
    jitter: jitterOf(samples),
    samples: samples.length,
  };
}

/* ------------------------------------------------------------------ slicing */

export interface Slice {
  /** Start of the slice, in seconds from the beginning of the transfer. */
  t: number;
  mbps: number;
}

export interface BytePoint {
  /** ms since the transfer began. */
  t: number;
  /** Cumulative bytes. */
  bytes: number;
}

export const SLICE_MS = 250;

/** Cumulative bytes at time t, interpolating between recorded points. */
function bytesAt(points: BytePoint[], t: number): number {
  if (points.length === 0) return 0;
  if (t <= points[0].t) return points[0].bytes;
  const last = points[points.length - 1];
  if (t >= last.t) return last.bytes;
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = points[lo];
  const b = points[hi];
  return b.t === a.t ? b.bytes : a.bytes + ((b.bytes - a.bytes) * (t - a.t)) / (b.t - a.t);
}

export function toSlices(points: BytePoint[], endMs: number, stepMs = SLICE_MS): Slice[] {
  const out: Slice[] = [];
  for (let start = 0; start + stepMs <= endMs + 1e-6; start += stepMs) {
    const bytes = bytesAt(points, start + stepMs) - bytesAt(points, start);
    out.push({ t: start / 1000, mbps: (bytes * 8) / (stepMs / 1000) / 1e6 });
  }
  return out;
}

export interface TransferSummary {
  /** Headline speed: mean of the middle 80% of slices after warm-up. */
  mbps: number;
  /** Plain mean after warm-up, dips included. */
  average: number;
  /** Best one-second stretch. */
  peak: number;
  /**
   * How steady the speed was: the slowest tenth of one-second stretches as a
   * share of the fastest tenth, 0–1. Null when the test was too short to say.
   */
  consistency: number | null;
}

/** Rolling mean over `size` slices. */
function rolling(values: number[], size: number): number[] {
  if (values.length < size) return [];
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= size) sum -= values[i - size];
    if (i >= size - 1) out.push(sum / size);
  }
  return out;
}

export function summarizeTransfer(slices: Slice[], warmupMs: number, stepMs = SLICE_MS): TransferSummary {
  const usable = slices.filter((s) => s.t * 1000 >= warmupMs).map((s) => s.mbps);
  // A test too short to trim uses every slice rather than nothing.
  const values = usable.length >= 4 ? usable : slices.map((s) => s.mbps);
  if (values.length === 0) return { mbps: 0, average: 0, peak: 0, consistency: null };

  const sorted = [...values].sort((a, b) => a - b);
  const cut = sorted.length >= 10 ? Math.floor(sorted.length * 0.1) : 0;
  const middle = sorted.slice(cut, sorted.length - cut);

  const window = Math.max(1, Math.round(1000 / stepMs));
  const seconds = rolling(values, window);
  const consistency =
    seconds.length >= 5 && percentile(seconds, 0.9) > 0 ? Math.min(1, percentile(seconds, 0.1) / percentile(seconds, 0.9)) : null;

  return {
    mbps: mean(middle),
    average: mean(values),
    peak: seconds.length ? Math.max(...seconds) : Math.max(...values),
    consistency,
  };
}

/** Reduce a timeline to at most `max` points by averaging neighbours, for drawing and saving. */
export function downsample(slices: Slice[], max: number): Slice[] {
  if (slices.length <= max) return slices;
  const size = Math.ceil(slices.length / max);
  const out: Slice[] = [];
  for (let i = 0; i < slices.length; i += size) {
    const chunk = slices.slice(i, i + size);
    out.push({ t: chunk[0].t, mbps: mean(chunk.map((c) => c.mbps)) });
  }
  return out;
}
