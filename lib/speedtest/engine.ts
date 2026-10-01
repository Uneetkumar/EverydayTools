/**
 * An internet speed test that runs in the browser against Cloudflare's public
 * speed-test endpoints (the ones speed.cloudflare.com uses; they send CORS
 * headers so any page may call them).
 *
 * What it measures, and how, in the order it happens:
 *
 * 1. Latency. A burst of zero-byte requests on a warm connection. The first is
 *    thrown away because it pays for DNS, TCP and TLS. Each ping is the time
 *    from sending the request to the first byte back (Resource Timing), minus
 *    the time the server reports spending on it (Server-Timing): about 20 ms on
 *    Cloudflare's speed endpoints, which a plain stopwatch would add to every
 *    result. The median is the latency; the mean change between consecutive
 *    pings is the jitter.
 *
 * 2. Download and upload. Several parallel streams so one connection's slow
 *    start does not cap the result. Bytes are counted continuously and cut
 *    into 250 ms slices. The headline speed is the mean of the middle 80% of
 *    the slices after the ramp-up; peak and consistency come from the same
 *    slices, so a line that is fast but erratic is reported as such.
 *
 * 3. Latency under load. The same ping, repeating while the line is saturated.
 *    How far it rises above idle is bufferbloat.
 *
 * 4. Packet loss, as far as a web page can see it. Browsers cannot send raw
 *    UDP, but the server reports TCP retransmissions for each connection in
 *    Server-Timing. The retransmitted share of packets sent during the
 *    download is a real, if conservative, loss signal.
 *
 * 5. Who you are to the server: provider, city and data centre, from /meta.
 *
 * The approach to latency, ranking and scoring follows Cloudflare's MIT-licensed
 * speedtest library; the slice trimming follows the general approach of Ookla's
 * published methodology. A result is what this device gets from this server
 * over this route at this moment.
 */

import { parseServerTime, parseTcpSnapshot, summarizeTcp, type RetransmissionSummary, type TcpSnapshot } from "./timing";
import {
  downsample,
  summarizeLatency,
  summarizeTransfer,
  toSlices,
  type BytePoint,
  type LatencySummary,
  type Slice,
  type TransferSummary,
} from "./stats";

export const SPEED_BASE = "https://speed.cloudflare.com";

export type Phase = "idle" | "latency" | "download" | "upload" | "done";
export type Mode = "quick" | "full" | "extended";

export interface ConnectionMeta {
  ip?: string;
  isp?: string;
  asn?: number | string;
  city?: string;
  region?: string;
  country?: string;
  /** IATA code of the Cloudflare data centre that answered, e.g. "DEL". */
  colo?: string;
  coloCity?: string;
}

export interface LatencyResult extends LatencySummary {
  values: number[];
}

export interface TransferResult extends TransferSummary {
  timeline: Slice[];
  bytes: number;
  durationMs: number;
  warmupMs: number;
  streams: number;
  /** Ping while this transfer saturated the line. */
  loaded: LatencyResult | null;
}

export interface SpeedResult {
  version: 2;
  mode: Mode;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  latency: LatencyResult | null;
  download: TransferResult | null;
  upload: TransferResult | null;
  tcp: RetransmissionSummary | null;
  /** "HTTP/2", "HTTP/3" or "HTTP/1.1", as the browser negotiated it. */
  protocol?: string;
  meta: ConnectionMeta;
  bytesDownloaded: number;
  bytesUploaded: number;
  /** Whether the server's own processing time was available to subtract from pings. */
  serverTimeRemoved: boolean;
}

export interface Progress {
  phase: Phase;
  /** Live speed over the last second, Mbps. */
  mbps?: number;
  /** 0–1 through the phase. */
  fraction?: number;
  /** Idle latency so far, ms. */
  latency?: number | null;
  jitter?: number | null;
  /** Ping under load right now, ms. */
  loaded?: number | null;
  /** The transfer so far, for the live chart. */
  timeline?: Slice[];
}

export interface TestPlan {
  latencySamples: number;
  downloadMs: number;
  uploadMs: number;
  downloadCap: number;
  uploadCap: number;
  streams: number;
  warmupMs: number;
  /** Rough data use, for the interface to state. */
  approxData: string;
}

export const PLANS: Record<Mode, TestPlan> = {
  quick: { latencySamples: 12, downloadMs: 6000, uploadMs: 5000, downloadCap: 300_000_000, uploadCap: 150_000_000, streams: 4, warmupMs: 1200, approxData: "about 140 MB at 100 Mbps, never more than about 450 MB" },
  full: { latencySamples: 20, downloadMs: 10_000, uploadMs: 8000, downloadCap: 2_000_000_000, uploadCap: 1_000_000_000, streams: 6, warmupMs: 2000, approxData: "up to about 1–3 GB on a fast line" },
  extended: { latencySamples: 30, downloadMs: 30_000, uploadMs: 20_000, downloadCap: 3_000_000_000, uploadCap: 1_500_000_000, streams: 6, warmupMs: 2500, approxData: "up to about 4 GB on a fast line" },
};

const FIRST_DOWN = 5_000_000;
const DOWN_CHUNK = 25_000_000; // the server refuses 100 MB and over
const UP_CHUNK = 8_000_000;

export class SpeedTestError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "server" | "aborted"
  ) {
    super(message);
    this.name = "SpeedTestError";
  }
}

const rand = () => Math.random().toString(36).slice(2);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* --------------------------------------------------------------- timing entries */

/**
 * Collects Resource Timing entries for the test server as they arrive. An
 * observer is used instead of reading the performance buffer, which holds only
 * 250 entries and silently drops the rest during a long test.
 */
class TimingCollector {
  private entries = new Map<string, PerformanceResourceTiming>();
  private observer: PerformanceObserver | null = null;

  constructor() {
    try {
      if (typeof PerformanceObserver === "undefined") return;
      this.observer = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name.startsWith(SPEED_BASE)) this.entries.set(e.name, e as PerformanceResourceTiming);
        }
        // Download streams never ask for theirs; keep the map from growing.
        if (this.entries.size > 300) this.entries.clear();
      });
      this.observer.observe({ type: "resource", buffered: false });
    } catch {
      this.observer = null;
    }
  }

  async get(url: string): Promise<PerformanceResourceTiming | undefined> {
    for (let i = 0; i < 14; i++) {
      const hit = this.entries.get(url);
      if (hit) {
        this.entries.delete(url);
        return hit;
      }
      const direct = typeof performance.getEntriesByName === "function" ? (performance.getEntriesByName(url).pop() as PerformanceResourceTiming | undefined) : undefined;
      if (direct) return direct;
      await sleep(5);
    }
    return undefined;
  }

  stop() {
    this.observer?.disconnect();
    this.entries.clear();
  }
}

const PROTOCOL_NAMES: Record<string, string> = { h2: "HTTP/2", h3: "HTTP/3", "http/1.1": "HTTP/1.1", "http/1.0": "HTTP/1.0" };

/* ---------------------------------------------------------------------- probes */

type During = "idle" | "downloadload" | "uploadload";

interface ProbeResult {
  ms: number;
  serverTimeRemoved: boolean;
  protocol?: string;
  headers: Headers;
}

/** One ping: request to first byte, less the server's own processing time. */
async function probe(signal: AbortSignal, during: During, timings: TimingCollector): Promise<ProbeResult> {
  const url = `${SPEED_BASE}/__down?bytes=0&during=${during}&r=${rand()}`;
  const t0 = performance.now();
  const res = await fetch(url, { cache: "no-store", signal });
  await res.arrayBuffer();
  const total = performance.now() - t0;
  if (!res.ok) throw new SpeedTestError(`The test server answered ${res.status}.`, "server");
  const serverTime = parseServerTime(res.headers.get("server-timing"));
  const perf = await timings.get(url);
  const ttfb = perf && perf.requestStart > 0 && perf.responseStart >= perf.requestStart ? perf.responseStart - perf.requestStart : undefined;
  const raw = ttfb ?? total;
  let ms = raw - (serverTime ?? 0);
  // A server time that swallowed the whole ping cannot be right: keep the raw figure.
  if (ms < 0.3) ms = Math.max(0.3, raw);
  return { ms, serverTimeRemoved: serverTime !== undefined && ms < raw, protocol: perf ? PROTOCOL_NAMES[perf.nextHopProtocol] ?? perf.nextHopProtocol : undefined, headers: res.headers };
}

function readHeaderMeta(h: Headers): ConnectionMeta {
  return {
    ip: h.get("cf-meta-ip") ?? undefined,
    colo: h.get("cf-meta-colo") ?? undefined,
    city: h.get("cf-meta-city") ?? undefined,
    country: h.get("cf-meta-country") ?? undefined,
    asn: h.get("cf-meta-asn") ?? undefined,
  };
}

/**
 * Provider, location and data centre. The endpoint answers a normal browser
 * request (it checks the Referer) and is optional: without it the result just
 * shows less about the connection.
 */
async function fetchMeta(signal: AbortSignal): Promise<ConnectionMeta> {
  try {
    const res = await fetch(`${SPEED_BASE}/meta`, { cache: "no-store", signal });
    if (!res.ok) return {};
    const j = (await res.json()) as {
      clientIp?: string;
      asn?: number;
      asOrganization?: string;
      country?: string;
      city?: string;
      region?: string;
      colo?: { iata?: string; city?: string };
    };
    return { ip: j.clientIp, isp: j.asOrganization, asn: j.asn, country: j.country, city: j.city, region: j.region, colo: j.colo?.iata, coloCity: j.colo?.city };
  } catch {
    return {};
  }
}

const merge = (a: ConnectionMeta, b: ConnectionMeta): ConnectionMeta => {
  const out: ConnectionMeta = { ...b };
  for (const [k, v] of Object.entries(a) as Array<[keyof ConnectionMeta, string | number | undefined]>) if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  return out;
};

/* -------------------------------------------------------------------- metering */

/** Counts bytes over time. Points closer than 5 ms are merged so a gigabit test stays small. */
export class Meter {
  readonly points: BytePoint[] = [{ t: 0, bytes: 0 }];
  private total = 0;
  private start = performance.now();

  add(bytes: number) {
    this.total += bytes;
    const t = performance.now() - this.start;
    const last = this.points[this.points.length - 1];
    if (t - last.t < 5 && this.points.length > 1) {
      last.t = t;
      last.bytes = this.total;
    } else {
      this.points.push({ t, bytes: this.total });
    }
  }
  get bytes() {
    return this.total;
  }
  get elapsed() {
    return performance.now() - this.start;
  }
  /** Speed over the most recent window, for the live dial. */
  live(windowMs = 1000): number {
    const now = this.elapsed;
    const from = now - windowMs;
    let i = this.points.length - 1;
    while (i > 0 && this.points[i].t > from) i--;
    const a = this.points[i];
    const dt = Math.max(now - a.t, 1);
    return ((this.total - a.bytes) * 8) / (dt / 1000) / 1e6;
  }
}

interface StreamContext {
  meter: Meter;
  signal: AbortSignal;
  shouldStop: () => boolean;
  onHeaders: (h: Headers) => void;
}

async function downloadStream(ctx: StreamContext): Promise<void> {
  let size = FIRST_DOWN;
  let first = true;
  while (!ctx.shouldStop() && !ctx.signal.aborted) {
    const res = await fetch(`${SPEED_BASE}/__down?bytes=${size}&r=${rand()}`, { cache: "no-store", signal: ctx.signal });
    if (!res.ok || !res.body) {
      if (size > 1_000_000) {
        size = Math.floor(size / 4);
        continue;
      }
      throw new SpeedTestError(`The test server answered ${res.status}.`, "server");
    }
    ctx.onHeaders(res.headers);
    if (first) {
      size = DOWN_CHUNK;
      first = false;
    }
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      ctx.meter.add(value.byteLength);
      if (ctx.shouldStop()) {
        await reader.cancel().catch(() => undefined);
        return;
      }
    }
  }
}

let uploadBlock: Blob | null = null;
function uploadBody(): Blob {
  if (uploadBlock) return uploadBlock;
  // Random bytes, so nothing on the path can shrink the upload.
  const block = new Uint8Array(65536);
  crypto.getRandomValues(block);
  uploadBlock = new Blob(Array.from({ length: Math.ceil(UP_CHUNK / block.length) }, () => block));
  return uploadBlock;
}

/** Uploads use XHR because fetch cannot report how much of a request body has been sent. */
function uploadOnce(ctx: StreamContext): Promise<void> {
  const body = uploadBody();
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === "undefined") {
      // No XHR (a non-browser runtime): time the whole request instead.
      fetch(`${SPEED_BASE}/__up`, { method: "POST", body, signal: ctx.signal }).then(
        () => {
          ctx.meter.add(body.size);
          resolve();
        },
        reject
      );
      return;
    }
    const xhr = new XMLHttpRequest();
    let last = 0;
    xhr.open("POST", `${SPEED_BASE}/__up?r=${rand()}`);
    xhr.upload.onprogress = (e) => {
      ctx.meter.add(e.loaded - last);
      last = e.loaded;
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new SpeedTestError(`The test server answered ${xhr.status}.`, "server")));
    xhr.onerror = () => reject(new SpeedTestError("The upload request failed.", "network"));
    xhr.onabort = () => resolve();
    ctx.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

async function uploadStream(ctx: StreamContext): Promise<void> {
  while (!ctx.shouldStop() && !ctx.signal.aborted) await uploadOnce(ctx);
}

/* ------------------------------------------------------------------- the test */

export interface RunOptions {
  mode: Mode;
  signal: AbortSignal;
  onProgress: (p: Progress) => void;
}

/** Runs latency, download and upload in turn. Rejects with SpeedTestError when the server cannot be reached. */
export async function runSpeedTest({ mode, signal, onProgress }: RunOptions): Promise<SpeedResult> {
  const plan = PLANS[mode];
  const startedAt = Date.now();
  const t0 = performance.now();
  const timings = new TimingCollector();
  const tcp: TcpSnapshot[] = [];
  const noteTcp = (h: Headers) => {
    const s = parseTcpSnapshot(h.get("server-timing"));
    if (s) tcp.push({ ...s, at: performance.now() });
  };

  const wrap = (e: unknown): never => {
    if (signal.aborted) throw new SpeedTestError("Test stopped.", "aborted");
    if (e instanceof SpeedTestError) throw e;
    throw new SpeedTestError(
      "Could not reach the speed-test server. Check your connection, or whether a firewall or content blocker is stopping requests to speed.cloudflare.com.",
      "network"
    );
  };

  let protocol: string | undefined;
  let serverTimeRemoved = false;
  const noteProbe = (p: ProbeResult) => {
    protocol ??= p.protocol;
    serverTimeRemoved ||= p.serverTimeRemoved;
  };

  try {
    // ---- latency
    onProgress({ phase: "latency", fraction: 0 });
    const metaPromise = fetchMeta(signal);
    const first = await probe(signal, "idle", timings); // discarded: includes DNS, TCP and TLS setup
    noteProbe(first);
    const headerMeta = readHeaderMeta(first.headers);
    const pings: number[] = [];
    for (let i = 0; i < plan.latencySamples; i++) {
      const p = await probe(signal, "idle", timings);
      noteProbe(p);
      noteTcp(p.headers);
      pings.push(p.ms);
      const s = summarizeLatency(pings)!;
      onProgress({ phase: "latency", fraction: (i + 1) / plan.latencySamples, latency: s.median, jitter: s.jitter });
    }
    const latency: LatencyResult = { ...summarizeLatency(pings)!, values: pings.map((x) => Math.round(x * 10) / 10) };

    // ---- download
    // Packet counters are compared from the end of the ramp-up, when slow start is over.
    const lossFrom = performance.now() + Math.min(plan.warmupMs, plan.downloadMs * 0.3);
    const download = await transfer({ phase: "download", plan, signal, onProgress, timings, worker: downloadStream, onTcp: noteTcp, noteProbe });
    // One more ping on the same connection reads the server's final packet counters for the window.
    try {
      const flush = await probe(signal, "idle", timings);
      noteTcp(flush.headers);
    } catch {
      /* the counters already gathered are still used */
    }

    // ---- upload
    const upload = await transfer({ phase: "upload", plan, signal, onProgress, timings, worker: uploadStream, onTcp: () => undefined, noteProbe });

    const meta = merge(headerMeta, await metaPromise);
    const finishedAt = Date.now();
    onProgress({ phase: "done", fraction: 1 });
    return {
      version: 2,
      mode,
      startedAt,
      finishedAt,
      durationMs: performance.now() - t0,
      latency,
      download,
      upload,
      tcp: summarizeTcp(tcp, lossFrom),
      protocol,
      meta,
      bytesDownloaded: download.bytes,
      bytesUploaded: upload.bytes,
      serverTimeRemoved,
    };
  } catch (e) {
    return wrap(e);
  } finally {
    timings.stop();
  }
}

interface TransferArgs {
  phase: "download" | "upload";
  plan: TestPlan;
  signal: AbortSignal;
  onProgress: (p: Progress) => void;
  timings: TimingCollector;
  worker: (ctx: StreamContext) => Promise<void>;
  onTcp: (h: Headers) => void;
  noteProbe: (p: ProbeResult) => void;
}

async function transfer({ phase, plan, signal: outer, onProgress, timings, worker, onTcp, noteProbe }: TransferArgs): Promise<TransferResult> {
  const down = phase === "download";
  const durationMs = down ? plan.downloadMs : plan.uploadMs;
  const capBytes = down ? plan.downloadCap : plan.uploadCap;
  const streams = down ? plan.streams : Math.min(plan.streams, 4);
  const warmupMs = Math.min(plan.warmupMs, durationMs * 0.3);

  const meter = new Meter();
  const controller = new AbortController();
  const onOuter = () => controller.abort();
  outer.addEventListener("abort", onOuter, { once: true });
  let stop = false;
  // The data cap protects metered connections, but it must not cut the
  // measurement short on a fast line: a test that ends a second after the
  // ramp-up has almost nothing to average. So the cap only ends the test once
  // there is at least 1.5 s of steady data, unless it is exceeded twice over.
  const minMs = warmupMs + 1500;
  const shouldStop = () => stop || meter.elapsed >= durationMs || (meter.bytes >= capBytes && meter.elapsed >= minMs) || meter.bytes >= capBytes * 2;
  const loaded: Array<{ t: number; ms: number }> = [];
  let latestLoaded: number | null = null;

  const ctx: StreamContext = { meter, signal: controller.signal, shouldStop, onHeaders: onTcp };
  const workers = Array.from({ length: streams }, () => worker(ctx).catch((error) => ({ error })));

  // Ping on its own request while the line is busy.
  const during: During = down ? "downloadload" : "uploadload";
  const prober = (async () => {
    while (!shouldStop() && !controller.signal.aborted) {
      try {
        const p = await probe(controller.signal, during, timings);
        noteProbe(p);
        onTcp(p.headers);
        if (meter.elapsed > warmupMs) {
          loaded.push({ t: meter.elapsed, ms: p.ms });
          latestLoaded = p.ms;
        }
      } catch {
        return;
      }
      await sleep(250);
    }
  })();

  const ticker = setInterval(() => {
    onProgress({
      phase,
      mbps: meter.live(),
      fraction: Math.min(1, Math.max(meter.elapsed / durationMs, meter.bytes / capBytes)),
      loaded: latestLoaded,
      timeline: toSlices(meter.points, meter.elapsed),
    });
  }, 150);

  try {
    // Finish when the time or data cap is reached.
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (shouldStop() || outer.aborted) {
          clearInterval(check);
          resolve();
        }
      }, 40);
    });
    stop = true;
    const endMs = meter.elapsed;
    controller.abort();
    const settled = await Promise.all(workers);
    await prober;
    if (outer.aborted) throw new SpeedTestError("Test stopped.", "aborted");
    const failed = settled.find((r): r is { error: unknown } => typeof r === "object" && r !== null && "error" in r);
    if (meter.bytes === 0 && failed) {
      throw failed.error instanceof SpeedTestError ? failed.error : new SpeedTestError("Could not reach the speed-test server.", "network");
    }

    const slices = toSlices(meter.points, endMs);
    const summary = summarizeTransfer(slices, warmupMs);
    // Like Cloudflare's test, keep only the latest pings: the earliest are still ramping up.
    const loadedValues = loaded.slice(-20).map((l) => l.ms);
    const loadedSummary = loadedValues.length >= 3 ? { ...summarizeLatency(loadedValues)!, values: loadedValues.map((x) => Math.round(x * 10) / 10) } : null;
    const result: TransferResult = {
      ...summary,
      timeline: downsample(slices, 160),
      bytes: meter.bytes,
      durationMs: endMs,
      warmupMs,
      streams,
      loaded: loadedSummary,
    };
    onProgress({ phase, mbps: summary.mbps, fraction: 1, timeline: slices, loaded: loadedSummary?.median ?? null });
    return result;
  } finally {
    clearInterval(ticker);
    outer.removeEventListener("abort", onOuter);
    controller.abort();
  }
}
