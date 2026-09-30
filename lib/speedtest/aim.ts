/**
 * Turning measurements into something a person can act on.
 *
 * Sources, so the numbers can be checked rather than trusted:
 * - Experience scores (streaming, gaming, video calls) use the point tables of
 *   Cloudflare's "Aggregated Internet Measurement" (AIM), published in its
 *   open-source (MIT) speedtest library: each metric earns points by band, the
 *   points are summed per experience, and the sum maps to bad/poor/average/
 *   good/great.
 * - The bufferbloat letter uses the scale popularised by Waveform's test:
 *   A+ under 5 ms of added delay while the line is busy, then 30, 60, 200,
 *   400 ms.
 * - Bandwidth needs are vendor figures: Netflix (HD 5 Mbps, 4K 15 Mbps minimum
 *   and 25 recommended), Zoom and Microsoft Teams (about 3–4 Mbps each way for
 *   HD), NVIDIA GeForce NOW (25 Mbps for 1080p at 60 fps, under 80 ms), and
 *   the FCC's 100/20 Mbps fixed-broadband benchmark. They change; treat them as
 *   guides.
 */

const scale =
  (domain: number[], range: number[]) =>
  (value: number): number => {
    let i = 0;
    while (i < domain.length && value >= domain[i]) i++;
    return range[i];
  };

/* ---------------------------------------------------------------- measurements */

export interface Measurements {
  /** Mbps. */
  download: number | null;
  upload: number | null;
  /** Idle median latency and jitter, ms. */
  latency: number | null;
  jitter: number | null;
  /** Extra latency while the line is busy, ms (worse of download and upload). */
  loadedIncrease: number | null;
  /** TCP retransmission ratio 0–1, or null when it could not be read. */
  packetLoss: number | null;
  /** 0–1 steadiness of each transfer, when measurable. */
  consistencyDown?: number | null;
  consistencyUp?: number | null;
  /** How many TCP connections carried the test, and the HTTP version. */
  connections?: number;
  protocol?: string;
  /** The user's plan, Mbps, when entered. */
  planDown?: number | null;
  planUp?: number | null;
  saveData?: boolean;
  cellular?: boolean;
}

/* ------------------------------------------------------------ bufferbloat grade */

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface Bufferbloat {
  grade: Grade;
  increase: number;
  /** One of the level names used across the UI. */
  verdict: Verdict;
  headline: string;
  detail: string;
}

export type Verdict = "great" | "good" | "ok" | "poor";

const GRADE_BANDS: Array<{ below: number; grade: Grade; verdict: Verdict; headline: string; detail: string }> = [
  { below: 5, grade: "A+", verdict: "great", headline: "Excellent", detail: "Latency barely moves when the line is busy. Calls and games stay smooth even while something is downloading." },
  { below: 30, grade: "A", verdict: "great", headline: "Very good", detail: "A small delay appears under load. You are unlikely to notice it." },
  { below: 60, grade: "B", verdict: "good", headline: "Good", detail: "Some extra delay under load. Fine for most people, though a busy household may notice it on calls." },
  { below: 200, grade: "C", verdict: "ok", headline: "Noticeable", detail: "Delay climbs noticeably when the connection is busy. Video calls and games may stutter while someone downloads or uploads." },
  { below: 400, grade: "D", verdict: "poor", headline: "Poor", detail: "Large delay under load. Calls and games will lag whenever the connection is in use." },
  { below: Infinity, grade: "F", verdict: "poor", headline: "Severe", detail: "Very large delay under load. The connection becomes close to unusable for real-time use while it is busy." },
];

/** `increase` is loaded latency minus idle latency, in ms. */
export function bufferbloat(increase: number | null): Bufferbloat | null {
  if (increase === null || !Number.isFinite(increase)) return null;
  const x = Math.max(0, increase);
  const band = GRADE_BANDS.find((b) => x < b.below)!;
  return { grade: band.grade, increase: x, verdict: band.verdict, headline: band.headline, detail: band.detail };
}

/* ------------------------------------------------------------ AIM experiences */

export type AimLevel = 0 | 1 | 2 | 3 | 4;
export const AIM_NAMES = ["bad", "poor", "average", "good", "great"] as const;

type Metric = "latency" | "jitter" | "packetLoss" | "download" | "loadedLatencyIncrease";

const POINTS: Record<Metric, (v: number) => number> = {
  packetLoss: scale([0.01, 0.05, 0.25, 0.5], [10, 5, 0, -10, -20]),
  latency: scale([10, 20, 50, 100, 500], [20, 10, 5, 0, -10, -20]),
  loadedLatencyIncrease: scale([10, 20, 50, 100, 500], [20, 10, 5, 0, -10, -20]),
  jitter: scale([10, 20, 100, 500], [10, 5, 0, -10, -20]),
  download: scale([1, 10, 50, 100], [0, 5, 10, 20, 30]), // Mbps
};

/** The most points a metric can earn. */
const MAX_POINTS: Record<Metric, number> = { packetLoss: 10, latency: 20, loadedLatencyIncrease: 20, jitter: 10, download: 30 };

const EXPERIENCES = {
  streaming: { label: "Streaming", input: ["latency", "packetLoss", "download", "loadedLatencyIncrease"], thresholds: [15, 20, 40, 60] },
  gaming: { label: "Online gaming", input: ["latency", "packetLoss", "loadedLatencyIncrease"], thresholds: [5, 15, 25, 30] },
  rtc: { label: "Video calls", input: ["latency", "jitter", "packetLoss", "loadedLatencyIncrease"], thresholds: [5, 15, 25, 40] },
} as const satisfies Record<string, { label: string; input: readonly Metric[]; thresholds: readonly number[] }>;

export type ExperienceId = keyof typeof EXPERIENCES;

export interface Experience {
  id: ExperienceId;
  label: string;
  points: number;
  level: AimLevel;
  name: (typeof AIM_NAMES)[number];
  /** What held the score back, in plain words. Empty when nothing did. */
  limits: string[];
}

function metricValue(m: Measurements, k: Metric): number | null {
  switch (k) {
    case "latency":
      return m.latency;
    case "jitter":
      return m.jitter;
    case "packetLoss":
      return m.packetLoss;
    case "download":
      return m.download;
    case "loadedLatencyIncrease":
      return m.loadedIncrease;
  }
}

function limitText(k: Metric, v: number): string {
  switch (k) {
    case "latency":
      return `idle latency is ${Math.round(v)} ms`;
    case "jitter":
      return `latency varies by ${Math.round(v)} ms from one reading to the next`;
    case "packetLoss":
      return `${(v * 100).toFixed(1)}% of packets had to be resent`;
    case "download":
      return `download speed is ${v >= 10 ? Math.round(v) : v.toFixed(1)} Mbps`;
    case "loadedLatencyIncrease":
      return `latency rises by ${Math.round(v)} ms when the line is busy`;
  }
}

export function experiences(m: Measurements): Experience[] {
  const out: Experience[] = [];
  for (const [id, def] of Object.entries(EXPERIENCES) as Array<[ExperienceId, (typeof EXPERIENCES)[ExperienceId]]>) {
    const inputs = def.input as readonly Metric[];
    // Packet loss that was not measured counts as zero points, as in Cloudflare's AIM, rather than blocking the score.
    const needed = inputs.filter((k) => k !== "packetLoss");
    if (needed.some((k) => metricValue(m, k) === null)) continue;
    let points = 0;
    const limits: Array<{ text: string; lost: number }> = [];
    for (const k of inputs) {
      const v = metricValue(m, k);
      if (v === null) continue;
      const p = POINTS[k](v);
      points += p;
      // A metric that earned under half of what it could is what held the score back.
      if (p < MAX_POINTS[k] / 2) limits.push({ text: limitText(k, v), lost: MAX_POINTS[k] - p });
    }
    points = Math.max(0, points);
    const level = scale([...def.thresholds], [0, 1, 2, 3, 4])(points) as AimLevel;
    out.push({
      id,
      label: def.label,
      points,
      level,
      name: AIM_NAMES[level],
      limits: level === 4 ? [] : limits.sort((a, b) => b.lost - a.lost).slice(0, 2).map((l) => l.text),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ activities */

export interface Activity {
  id: string;
  label: string;
  need: string;
  verdict: Verdict;
  /** Why it is not "great", when that is knowable. */
  note?: string;
}

const tier = (value: number | null, need: number, minimum = need * 0.6): Verdict =>
  value === null ? "poor" : value >= need * 2 ? "great" : value >= need ? "good" : value >= minimum ? "ok" : "poor";

const fromAim = (e: Experience | undefined): Verdict | null =>
  !e ? null : e.level >= 4 ? "great" : e.level === 3 ? "good" : e.level === 2 ? "ok" : "poor";

const RANK: Record<Verdict, number> = { poor: 0, ok: 1, good: 2, great: 3 };
const worst = (...vs: Array<Verdict | null>): Verdict =>
  vs.filter((v): v is Verdict => v !== null).reduce((a, b) => (RANK[b] < RANK[a] ? b : a), "great" as Verdict);

export function activities(m: Measurements): Activity[] {
  const ex = Object.fromEntries(experiences(m).map((e) => [e.id, e])) as Partial<Record<ExperienceId, Experience>>;
  const d = m.download;
  const u = m.upload;
  const both = d !== null && u !== null ? Math.min(d, u) : null;
  const gamingLatency = m.latency === null ? "poor" : m.latency <= 30 ? "great" : m.latency <= 50 ? "good" : m.latency <= 100 ? "ok" : "poor";

  const rows: Activity[] = [
    { id: "browsing", label: "Web, email and social media", need: "about 3 Mbps", verdict: tier(d, 3, 1) },
    {
      id: "hd",
      label: "HD video streaming (1080p)",
      need: "5 Mbps per stream (Netflix)",
      verdict: worst(tier(d, 5, 3), fromAim(ex.streaming)),
      note: ex.streaming?.limits[0],
    },
    {
      id: "4k",
      label: "4K video streaming",
      need: "15 Mbps minimum, 25 recommended (Netflix)",
      verdict: worst(tier(d, 25, 15), fromAim(ex.streaming)),
      note: ex.streaming?.limits[0],
    },
    {
      id: "calls",
      label: "Video calls (Zoom, Meet, Teams)",
      need: "3–4 Mbps each way for HD",
      verdict: worst(tier(both, 4, 2), fromAim(ex.rtc)),
      note: ex.rtc?.limits[0] ?? (both !== null && both < 4 ? `${u !== null && u <= (d ?? Infinity) ? "upload" : "download"} speed is the limit` : undefined),
    },
    {
      id: "gaming",
      label: "Online gaming",
      need: "low latency: under 50 ms, steady under load",
      verdict: worst(gamingLatency, fromAim(ex.gaming)),
      note: ex.gaming?.limits[0],
    },
    {
      id: "cloud-gaming",
      label: "Cloud gaming (GeForce NOW, Xbox Cloud)",
      need: "25 Mbps for 1080p at 60 fps, under 80 ms",
      verdict: worst(tier(d, 25, 15), m.latency === null ? "poor" : m.latency <= 80 ? "great" : m.latency <= 120 ? "ok" : "poor", fromAim(ex.gaming)),
    },
    {
      id: "uploads",
      label: "Large uploads and cloud backup",
      need: "20 Mbps upload (FCC benchmark)",
      verdict: tier(u, 20, 5),
    },
  ];
  return rows;
}

/** How many of each thing the connection could carry together, leaving 20% spare. */
export function capacity(m: Measurements): { streams4k: number; streamsHd: number; calls: number } {
  const d = (m.download ?? 0) * 0.8;
  const both = Math.min(m.download ?? 0, m.upload ?? 0) * 0.8;
  return { streams4k: Math.floor(d / 25), streamsHd: Math.floor(d / 5), calls: Math.floor(both / 4) };
}

/** The FCC's fixed-broadband benchmark since 2024 is 100 Mbps down and 20 Mbps up. */
export function meetsFccBenchmark(m: Pick<Measurements, "download" | "upload">): boolean | null {
  if (m.download === null || m.upload === null) return null;
  return m.download >= 100 && m.upload >= 20;
}

/* ---------------------------------------------------------------------- times */

/** Seconds to move `bytes` at `mbps`. */
export function transferSeconds(bytes: number, mbps: number | null): number | null {
  return mbps && mbps > 0 ? (bytes * 8) / (mbps * 1e6) : null;
}

export const TRANSFER_EXAMPLES: Array<{ label: string; bytes: number; direction: "down" | "up" }> = [
  { label: "Download a 1 GB movie", bytes: 1e9, direction: "down" },
  { label: "Download a 50 GB game", bytes: 50e9, direction: "down" },
  { label: "Upload 500 MB of photos", bytes: 500e6, direction: "up" },
  { label: "Upload a 5 GB video", bytes: 5e9, direction: "up" },
];

/* ------------------------------------------------------------------- insights */

export type InsightTone = "good" | "info" | "warn" | "bad";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * What stands out in a result, most important first. Each line is only
 * produced when the measurements support it, and says what to try, not just
 * what is wrong.
 */
export function insights(m: Measurements): Insight[] {
  const out: Insight[] = [];
  const bloat = bufferbloat(m.loadedIncrease);

  if (bloat && (bloat.grade === "C" || bloat.grade === "D" || bloat.grade === "F")) {
    out.push({
      id: "bufferbloat",
      tone: bloat.grade === "C" ? "warn" : "bad",
      title: `Your connection slows down when it is busy (grade ${bloat.grade})`,
      body: `Latency rose by about ${Math.round(bloat.increase)} ms while data was moving. That is why calls and games lag when someone downloads. The fix is on the router: turn on smart queue management (SQM, Cake or fq_codel) and set its limits to about 90–95% of the speeds measured here. If your router has no such setting, a different router or firmware usually does.`,
    });
  }

  if (m.packetLoss !== null && m.packetLoss >= 0.01) {
    out.push({
      id: "loss",
      tone: m.packetLoss >= 0.03 ? "bad" : "warn",
      title: `About ${(m.packetLoss * 100).toFixed(1)}% of packets were resent`,
      body: "Healthy connections resend well under 1%. Weak Wi-Fi, a damaged cable or a congested line are the usual causes. Try a cable, or move closer to the router, then test again.",
    });
  }

  const steady = [m.consistencyDown, m.consistencyUp].filter((c): c is number => typeof c === "number");
  if (steady.length > 0 && Math.min(...steady) < 0.65) {
    out.push({
      id: "steadiness",
      tone: "warn",
      title: "Your speed was not steady during the test",
      body: `The slowest moments ran at ${pct(Math.min(...steady))} of the fastest. Wi-Fi interference or distance, other devices using the line, or a congested neighbourhood are the usual causes. Test again on a cable or on the 5 GHz band, near the router.`,
    });
  }

  if (m.jitter !== null && m.jitter > 30) {
    out.push({
      id: "jitter",
      tone: "warn",
      title: `Latency is jumpy (jitter ${Math.round(m.jitter)} ms)`,
      body: "Average ping can look fine while individual pings swing widely, which shows up as choppy audio and rubber-banding in games. Wi-Fi is the most common cause.",
    });
  }

  if (m.latency !== null && m.latency > 100) {
    out.push({
      id: "latency",
      tone: "info",
      title: `Round trip is ${Math.round(m.latency)} ms`,
      body: "That is normal on satellite and mobile networks, or through a VPN, which adds a detour. On a home connection without a VPN it can mean poor Wi-Fi or a congested line.",
    });
  }

  if (m.download !== null && m.upload !== null && m.upload < 20 && m.upload < m.download * 0.1) {
    out.push({
      id: "asymmetric",
      tone: "info",
      title: "Upload is much slower than download",
      body: "That is normal for cable and DSL plans and is fine for browsing and streaming. It matters for cloud backups, large uploads and HD video calls, where upload is the limit.",
    });
  }

  if (m.planDown && m.download !== null) {
    const share = m.download / m.planDown;
    if (share < 0.8) {
      out.push({
        id: "plan",
        tone: share < 0.5 ? "bad" : "warn",
        title: `You are getting ${pct(share)} of your ${m.planDown} Mbps plan`,
        body: "Wi-Fi often delivers only half to three quarters of a wired line. Test with a cable straight into the router. If the wired result is still below about 80–90% of the plan, restart the router and contact your provider with the results.",
      });
    } else {
      out.push({
        id: "plan",
        tone: "good",
        title: `You are getting ${pct(Math.min(share, 1.5))} of your ${m.planDown} Mbps plan`,
        body: "That is in the range a healthy connection delivers, since providers quote a maximum and protocol overhead takes a few percent.",
      });
    }
  }

  if (m.connections === 1 && m.download !== null && m.download > 500) {
    out.push({
      id: "browser-limit",
      tone: "info",
      title: "Very fast line: a browser may read low",
      body: `This test used a single ${m.protocol?.toUpperCase() ?? "network"} connection, and browsers cap what one connection can show on multi-gigabit lines. A command-line tester such as iperf3 or Ookla's CLI can read higher.`,
    });
  }

  if (m.cellular || m.saveData) {
    out.push({
      id: "mobile-data",
      tone: "info",
      title: "You may be on mobile data",
      body: "A full or extended test can use hundreds of megabytes. The Quick test uses far less.",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "healthy",
      tone: "good",
      title: "Nothing stands out",
      body: "Speed, latency and responsiveness under load all look healthy for this device and network.",
    });
  }

  const order: Record<InsightTone, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 5);
}

/** A one-line reading of the whole result. */
export function headline(m: Measurements): string {
  const ex = experiences(m);
  const bloat = bufferbloat(m.loadedIncrease);
  const weakest = ex.reduce<Experience | null>((a, b) => (!a || b.level < a.level ? b : a), null);
  if (m.download === null) return "";
  const speed = m.download >= 500 ? "Very fast" : m.download >= 100 ? "Fast" : m.download >= 25 ? "Good" : m.download >= 10 ? "Moderate" : "Slow";
  if (weakest && weakest.level <= 2 && bloat && (bloat.grade === "C" || bloat.grade === "D" || bloat.grade === "F")) {
    return `${speed} line, but it gets sluggish when busy. ${weakest.label} may suffer.`;
  }
  if (weakest && weakest.level <= 2) return `${speed} line. ${weakest.label} may struggle${weakest.limits[0] ? `: ${weakest.limits[0]}` : ""}.`;
  if (m.download >= 100) return "Fast and responsive. Comfortable for 4K streaming, video calls and gaming, with several people at once.";
  if (m.download >= 25) return "Solid and responsive. Comfortable for streaming, video calls and gaming for one or two people.";
  return `${speed} line. Fine for everyday use; several people at once will share it.`;
}
