export type SpeedUnit = "Mbps" | "MB/s";

const digits = (n: number) => (n >= 100 ? 0 : n >= 10 ? 1 : 2);

export interface Formatted {
  value: string;
  unit: string;
}

/**
 * A speed at a readable scale: 850 Mbps, 1.2 Gbps, 640 kbps. Providers quote
 * bits and downloads show bytes, so both units are offered (8 bits = 1 byte).
 */
export function formatSpeed(mbps: number | null, unit: SpeedUnit = "Mbps"): Formatted {
  if (mbps === null || !Number.isFinite(mbps)) return { value: "—", unit };
  if (unit === "Mbps") {
    if (mbps >= 1000) return { value: (mbps / 1000).toFixed(digits(mbps / 1000)), unit: "Gbps" };
    if (mbps < 1) return { value: String(Math.round(mbps * 1000)), unit: "kbps" };
    return { value: mbps.toFixed(digits(mbps)), unit: "Mbps" };
  }
  const mbytes = mbps / 8;
  if (mbytes >= 1000) return { value: (mbytes / 1000).toFixed(digits(mbytes / 1000)), unit: "GB/s" };
  if (mbytes < 1) return { value: String(Math.round(mbytes * 1000)), unit: "KB/s" };
  return { value: mbytes.toFixed(digits(mbytes)), unit: "MB/s" };
}

export const speedText = (mbps: number | null, unit: SpeedUnit = "Mbps") => {
  const f = formatSpeed(mbps, unit);
  return f.value === "—" ? "—" : `${f.value} ${f.unit}`;
};

export function formatMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  return ms < 10 ? `${ms.toFixed(1)} ms` : `${Math.round(ms)} ms`;
}

/** "8 s", "2 min 10 s", "1 h 12 min", "about 3 days". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  if (seconds < 1) return "under a second";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  if (m < 60) return s === 60 ? `${m + 1} min` : s > 0 ? `${m} min ${s} s` : `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m - h * 60;
  if (h < 48) return rm > 0 ? `${h} h ${rm} min` : `${h} h`;
  return `about ${Math.round(h / 24)} days`;
}

export const formatPercent = (ratio: number | null, d = 0) => (ratio === null ? "—" : `${(ratio * 100).toFixed(d)}%`);

/**
 * A provider's name without the street address some registries append:
 * "Airtel UNOC, CP-05, Sector 8, IMT Manesar, …" reads "Airtel UNOC".
 */
export function providerName(isp: string | null | undefined): string | undefined {
  if (!isp) return undefined;
  return isp.split(",")[0].trim() || isp.trim();
}

/**
 * The dial's scale. Each step takes the same share of the arc, like a car's
 * speedometer, so 5 Mbps and 500 Mbps both move it visibly.
 */
export const GAUGE_STOPS: Record<SpeedUnit, number[]> = {
  Mbps: [0, 5, 10, 25, 50, 100, 250, 500, 1000],
  "MB/s": [0, 1, 2, 5, 10, 25, 50, 100, 200],
};

/** Where `value` (in the stops' unit) sits on the dial, 0–1. Past the last stop it stays at the end. */
export function gaugePosition(value: number | null, stops: number[]): number {
  if (value === null || !(value > 0)) return 0;
  const n = stops.length - 1;
  for (let i = 0; i < n; i++) {
    if (value <= stops[i + 1]) return (i + (value - stops[i]) / (stops[i + 1] - stops[i])) / n;
  }
  return 1;
}
