import { bufferbloat, type Grade, type Measurements } from "./aim";
import type { Mode, SpeedResult } from "./engine";
import { providerName, speedText, type SpeedUnit } from "./format";
import { median } from "./stats";

/** Fewer packets than this say nothing reliable about loss. */
const MIN_PACKETS_FOR_LOSS = 200;

/** Everything the scoring functions read, taken from one run. */
export function toMeasurements(r: SpeedResult, extra: Partial<Measurements> = {}): Measurements {
  const idle = r.latency?.median ?? null;
  const rises = [r.download?.loaded, r.upload?.loaded]
    .filter((l): l is NonNullable<typeof l> => !!l)
    .map((l) => l.median - (idle ?? 0));
  const tcp = r.tcp && r.tcp.sent >= MIN_PACKETS_FOR_LOSS ? r.tcp : null;
  return {
    download: r.download?.mbps ?? null,
    upload: r.upload?.mbps ?? null,
    latency: idle,
    jitter: r.latency?.jitter ?? null,
    loadedIncrease: idle !== null && rises.length > 0 ? Math.max(0, ...rises) : null,
    packetLoss: tcp ? tcp.ratio : null,
    consistencyDown: r.download?.consistency ?? null,
    consistencyUp: r.upload?.consistency ?? null,
    connections: r.tcp?.connections,
    protocol: r.protocol,
    ...extra,
  };
}

/** A run reduced to what is worth keeping on the device, about 100 bytes each. */
export interface HistoryRecord {
  at: number;
  mode: Mode;
  down: number | null;
  up: number | null;
  ping: number | null;
  jitter: number | null;
  /** Extra ms of delay under load. */
  bloat: number | null;
  grade: Grade | null;
  isp?: string;
  city?: string;
}

export const HISTORY_LIMIT = 100;

export function toHistoryRecord(r: SpeedResult): HistoryRecord {
  const m = toMeasurements(r);
  return {
    at: r.finishedAt,
    mode: r.mode,
    down: round(m.download),
    up: round(m.upload),
    ping: round(m.latency),
    jitter: round(m.jitter),
    bloat: round(m.loadedIncrease),
    grade: bufferbloat(m.loadedIncrease)?.grade ?? null,
    isp: r.meta.isp,
    city: r.meta.coloCity ?? r.meta.city,
  };
}

const round = (n: number | null) => (n === null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10);

export interface HistoryStats {
  count: number;
  medianDown: number | null;
  medianUp: number | null;
  medianPing: number | null;
  bestDown: number | null;
  worstDown: number | null;
}

const nums = (xs: Array<number | null>) => xs.filter((x): x is number => x !== null);

export function historyStats(records: HistoryRecord[]): HistoryStats {
  const d = nums(records.map((r) => r.down));
  const u = nums(records.map((r) => r.up));
  const p = nums(records.map((r) => r.ping));
  return {
    count: records.length,
    medianDown: d.length ? median(d) : null,
    medianUp: u.length ? median(u) : null,
    medianPing: p.length ? median(p) : null,
    bestDown: d.length ? Math.max(...d) : null,
    worstDown: d.length ? Math.min(...d) : null,
  };
}

/** Plain-text summary for copying or sharing. No IP address and no location beyond the data centre city. */
export function summaryText(r: SpeedResult, unit: SpeedUnit, url = "https://tabbench.com/tools/internet-speed-test"): string {
  const m = toMeasurements(r);
  const bloat = bufferbloat(m.loadedIncrease);
  const lines = [
    `Internet speed test: ${speedText(m.download, unit)} down, ${speedText(m.upload, unit)} up`,
    `Ping ${m.latency !== null ? Math.round(m.latency) : "—"} ms · jitter ${m.jitter !== null ? Math.round(m.jitter) : "—"} ms${bloat ? ` · responsiveness under load ${bloat.grade}` : ""}`,
  ];
  if (r.meta.isp) lines.push(`Provider: ${providerName(r.meta.isp)}`);
  lines.push(`Tested ${new Date(r.finishedAt).toLocaleString()} with TabBench · ${url}`);
  return lines.join("\n");
}

/** The full result as JSON, without the IP address. */
export function reportJson(r: SpeedResult): string {
  const { meta, ...rest } = r;
  const { ip: _ip, ...safeMeta } = meta;
  void _ip;
  return JSON.stringify({ ...rest, meta: safeMeta, measurements: toMeasurements(r) }, null, 2);
}

const csvCell = (v: string | number | null | undefined) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function historyCsv(records: HistoryRecord[]): string {
  const head = ["time", "mode", "download_mbps", "upload_mbps", "ping_ms", "jitter_ms", "loaded_increase_ms", "responsiveness_grade", "provider", "server_city"];
  const rows = records.map((r) => [new Date(r.at).toISOString(), r.mode, r.down, r.up, r.ping, r.jitter, r.bloat, r.grade, r.isp, r.city].map(csvCell).join(","));
  return [head.join(","), ...rows].join("\n");
}
