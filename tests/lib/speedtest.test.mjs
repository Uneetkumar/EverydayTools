/** The measurement arithmetic and scoring behind the Internet Speed Test. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const timing = await load("speedtest/timing.ts");
const stats = await load("speedtest/stats.ts");
const aim = await load("speedtest/aim.ts");
const fmt = await load("speedtest/format.ts");
const result = await load("speedtest/result.ts");

// Headers captured from speed.cloudflare.com.
const SERVER_TIMING =
  'cfSpeedEdge;dur=2, cfSpeedWorker;dur=21, cfL4;desc="?proto=TCP&rtt=26821&min_rtt=24034&rtt_var=11004&sent=5&recv=7&lost=0&retrans=0&sent_bytes=2838&recv_bytes=514&delivery_rate=173254&cwnd=53&unsent_bytes=0&cid=e2a8b04e93cd4952&ts=53&x=0"';

describe("server timing", () => {
  it("adds the server's own processing time so it can be subtracted from a ping", () => {
    assert.equal(timing.parseServerTime(SERVER_TIMING), 23);
    assert.equal(timing.parseServerTime("cfRequestDuration;dur=11.5"), 11.5);
    assert.equal(timing.parseServerTime("cache;desc=HIT"), undefined);
    assert.equal(timing.parseServerTime(null), undefined);
  });
  it("reads the server's TCP statistics in milliseconds", () => {
    const t = timing.parseTcpSnapshot(SERVER_TIMING);
    assert.equal(t.cid, "e2a8b04e93cd4952");
    assert.equal(t.proto, "TCP");
    assert.ok(Math.abs(t.rttMs - 26.821) < 1e-9);
    assert.ok(Math.abs(t.minRttMs - 24.034) < 1e-9);
    assert.equal(t.sent, 5);
    assert.equal(t.retrans, 0);
  });
  it("ignores headers without usable counters", () => {
    assert.equal(timing.parseTcpSnapshot("cfSpeedEdge;dur=2"), null);
    assert.equal(timing.parseTcpSnapshot('cfL4;desc="?proto=TCP&sent=x"'), null);
  });
  it("measures retransmissions over a window per connection, not cumulatively", () => {
    const snap = (cid, sent, retrans) => ({ cid, sent, recv: 0, lost: 0, retrans, proto: "TCP", minRttMs: 10 });
    // One connection: 1000 → 11000 packets sent, 20 → 120 retransmitted = 100 / 10000 = 1%.
    const a = timing.summarizeTcp([snap("a", 11000, 120), snap("a", 1000, 20)]);
    assert.equal(a.sent, 10000);
    assert.equal(a.retrans, 100);
    assert.equal(a.ratio, 0.01);
    assert.equal(a.connections, 1);
    // A connection seen once cannot give a window, so it adds nothing but is still counted.
    const b = timing.summarizeTcp([snap("a", 5000, 0), snap("a", 9000, 0), snap("z", 50, 1)]);
    assert.equal(b.sent, 4000);
    assert.equal(b.ratio, 0);
    assert.equal(b.connections, 2);
    assert.equal(timing.summarizeTcp([]), null);
  });
});

describe("statistics", () => {
  it("interpolates percentiles like Cloudflare's library", () => {
    assert.equal(stats.percentile([1, 2, 3, 4], 0.5), 2.5);
    assert.equal(stats.percentile([10, 20, 30, 40, 50], 0.9), 46);
    assert.equal(stats.percentile([5], 0.9), 5);
    assert.ok(Number.isNaN(stats.percentile([], 0.5)));
  });
  it("defines jitter as the mean change between consecutive pings", () => {
    assert.equal(stats.jitterOf([10, 14, 10]), 4);
    assert.equal(stats.jitterOf([10]), 0);
  });
  it("summarises latency", () => {
    const s = stats.summarizeLatency([20, 22, 21, 80, 20]);
    assert.equal(s.median, 21);
    assert.equal(s.min, 20);
    assert.equal(s.max, 80);
    assert.ok(s.p95 > 60);
  });
  it("turns a byte counter into the right speed per slice", () => {
    // 12.5 MB every second = 100 Mbps, recorded every 10 ms.
    const points = [];
    for (let t = 0; t <= 4000; t += 10) points.push({ t, bytes: (12_500_000 * t) / 1000 });
    const slices = stats.toSlices(points, 4000);
    assert.equal(slices.length, 16);
    for (const s of slices) assert.ok(Math.abs(s.mbps - 100) < 0.01, `${s.mbps}`);
  });
  it("reports a steady line as steady and ignores the ramp-up", () => {
    // Ramp for 1 s (0 → 100 Mbps), then steady at 100 for 5 s.
    const slices = [];
    for (let i = 0; i < 24; i++) slices.push({ t: i * 0.25, mbps: i < 4 ? (i + 1) * 20 : 100 });
    const s = stats.summarizeTransfer(slices, 1000);
    assert.ok(Math.abs(s.mbps - 100) < 0.01);
    assert.ok(Math.abs(s.average - 100) < 0.01);
    assert.ok(s.consistency > 0.99);
  });
  it("does not let a few spikes or stalls decide the headline speed", () => {
    // 40 slices near 100 Mbps with two wild spikes and two stalls.
    const slices = Array.from({ length: 40 }, (_, i) => ({ t: i * 0.25, mbps: 100 }));
    slices[10].mbps = 900;
    slices[20].mbps = 800;
    slices[15].mbps = 0;
    slices[30].mbps = 0;
    const s = stats.summarizeTransfer(slices, 0);
    assert.ok(Math.abs(s.mbps - 100) < 1, `headline ${s.mbps}`);
    assert.ok(s.average > 110, "the plain mean is pulled up by the spikes");
  });
  it("flags an erratic line through consistency", () => {
    const slices = Array.from({ length: 60 }, (_, i) => ({ t: i * 0.25, mbps: Math.floor(i / 4) % 2 === 0 ? 200 : 40 }));
    const s = stats.summarizeTransfer(slices, 0);
    assert.ok(s.consistency < 0.4, `consistency ${s.consistency}`);
  });
  it("uses a short test in full rather than returning nothing", () => {
    const s = stats.summarizeTransfer([{ t: 0, mbps: 50 }, { t: 0.25, mbps: 60 }], 5000);
    assert.equal(s.average, 55);
    assert.equal(stats.summarizeTransfer([], 1000).mbps, 0);
  });
  it("downsamples a long timeline", () => {
    const slices = Array.from({ length: 500 }, (_, i) => ({ t: i * 0.25, mbps: i }));
    const d = stats.downsample(slices, 100);
    assert.ok(d.length <= 100);
    assert.equal(d[0].t, 0);
  });
});

describe("bufferbloat grade", () => {
  it("uses the A+ to F scale at its boundaries", () => {
    const g = (x) => aim.bufferbloat(x).grade;
    assert.equal(g(0), "A+");
    assert.equal(g(4.9), "A+");
    assert.equal(g(5), "A");
    assert.equal(g(29), "A");
    assert.equal(g(30), "B");
    assert.equal(g(59), "B");
    assert.equal(g(60), "C");
    assert.equal(g(199), "C");
    assert.equal(g(200), "D");
    assert.equal(g(399), "D");
    assert.equal(g(400), "F");
    assert.equal(aim.bufferbloat(null), null);
    assert.equal(aim.bufferbloat(-5).grade, "A+");
  });
});

const GOOD = { download: 300, upload: 50, latency: 12, jitter: 2, loadedIncrease: 8, packetLoss: 0 };
const BAD = { download: 4, upload: 0.8, latency: 140, jitter: 60, loadedIncrease: 450, packetLoss: 0.06 };

describe("experience scores (Cloudflare AIM)", () => {
  it("rates a fast, responsive line great everywhere", () => {
    const e = Object.fromEntries(aim.experiences(GOOD).map((x) => [x.id, x]));
    assert.equal(e.streaming.name, "great");
    assert.equal(e.gaming.name, "great");
    assert.equal(e.rtc.name, "great");
    assert.deepEqual(e.streaming.limits, []);
  });
  it("rates a slow, laggy line bad and says why", () => {
    const e = Object.fromEntries(aim.experiences(BAD).map((x) => [x.id, x]));
    assert.equal(e.streaming.level, 0);
    assert.equal(e.gaming.level, 0);
    assert.ok(e.gaming.limits.length > 0);
    assert.match(e.gaming.limits.join(" "), /ms|packets/);
  });
  it("matches the published point tables", () => {
    // latency 12 ms → 10 pts, loaded +8 ms → 20, jitter 2 → 10, loss 0 → 10 ⇒ rtc 50 (≥ 40 = great)
    const rtc = aim.experiences(GOOD).find((x) => x.id === "rtc");
    assert.equal(rtc.points, 50);
    // gaming: 10 + 10 + 20 = 40 (≥ 30 = great)
    assert.equal(aim.experiences(GOOD).find((x) => x.id === "gaming").points, 40);
  });
  it("still scores when packet loss could not be measured", () => {
    const e = aim.experiences({ ...GOOD, packetLoss: null });
    assert.equal(e.length, 3);
  });
  it("skips an experience it cannot score instead of guessing", () => {
    assert.equal(aim.experiences({ ...GOOD, latency: null }).length, 0);
  });
});

describe("what a speed is good for", () => {
  it("rates activities against vendor needs", () => {
    const a = Object.fromEntries(aim.activities(GOOD).map((x) => [x.id, x.verdict]));
    assert.equal(a.browsing, "great");
    assert.equal(a["4k"], "great");
    assert.equal(a.calls, "great");
    assert.equal(a.uploads, "great");
    const b = Object.fromEntries(aim.activities(BAD).map((x) => [x.id, x.verdict]));
    assert.equal(b["4k"], "poor");
    assert.equal(b.calls, "poor");
    assert.equal(b.gaming, "poor");
  });
  it("blames upload when upload is what limits video calls", () => {
    const row = aim.activities({ ...GOOD, download: 200, upload: 2 }).find((x) => x.id === "calls");
    assert.notEqual(row.verdict, "great");
    assert.match(row.note ?? "", /upload/);
  });
  it("counts how many things fit at once, leaving headroom", () => {
    assert.deepEqual(aim.capacity({ download: 300, upload: 50 }), { streams4k: 9, streamsHd: 48, calls: 10 });
    assert.deepEqual(aim.capacity({ download: 10, upload: 1 }), { streams4k: 0, streamsHd: 1, calls: 0 });
  });
  it("checks the FCC 100/20 benchmark", () => {
    assert.equal(aim.meetsFccBenchmark({ download: 100, upload: 20 }), true);
    assert.equal(aim.meetsFccBenchmark({ download: 300, upload: 10 }), false);
    assert.equal(aim.meetsFccBenchmark({ download: null, upload: 10 }), null);
  });
  it("computes transfer times", () => {
    assert.equal(aim.transferSeconds(1e9, 800), 10);
    assert.equal(aim.transferSeconds(1e9, 0), null);
  });
});

describe("insights", () => {
  const kinds = (m) => aim.insights(m).map((i) => i.id);
  it("says nothing is wrong when nothing is", () => {
    assert.deepEqual(kinds(GOOD), ["healthy"]);
  });
  it("finds bufferbloat, loss, jitter and unsteady speed, worst first", () => {
    const ids = kinds({ ...BAD, consistencyDown: 0.4 });
    assert.ok(ids.includes("bufferbloat"));
    assert.ok(ids.includes("loss"));
    assert.ok(ids.includes("jitter"));
    assert.ok(ids.includes("steadiness"));
    assert.ok(aim.insights(BAD).length <= 5);
    assert.notEqual(aim.insights(BAD)[0].tone, "good");
  });
  it("compares with the plan in both directions", () => {
    assert.match(aim.insights({ ...GOOD, planDown: 500 }).find((i) => i.id === "plan").title, /60%/);
    assert.equal(aim.insights({ ...GOOD, planDown: 500 }).find((i) => i.id === "plan").tone, "warn");
    assert.equal(aim.insights({ ...GOOD, planDown: 300 }).find((i) => i.id === "plan").tone, "good");
  });
  it("warns that a browser may read low on a multi-gigabit line", () => {
    assert.ok(kinds({ ...GOOD, download: 900, connections: 1, protocol: "HTTP/2" }).includes("browser-limit"));
    assert.ok(!kinds({ ...GOOD, download: 900, connections: 4 }).includes("browser-limit"));
  });
  it("explains a lopsided plan without calling it a fault", () => {
    const i = aim.insights({ ...GOOD, download: 300, upload: 10 }).find((x) => x.id === "asymmetric");
    assert.equal(i.tone, "info");
  });
});

describe("formatting", () => {
  it("scales speeds to a readable unit", () => {
    assert.deepEqual(fmt.formatSpeed(850), { value: "850", unit: "Mbps" });
    assert.deepEqual(fmt.formatSpeed(1250), { value: "1.25", unit: "Gbps" });
    assert.deepEqual(fmt.formatSpeed(0.64), { value: "640", unit: "kbps" });
    assert.deepEqual(fmt.formatSpeed(8, "MB/s"), { value: "1.00", unit: "MB/s" });
    assert.deepEqual(fmt.formatSpeed(12000, "MB/s"), { value: "1.50", unit: "GB/s" });
    assert.equal(fmt.formatSpeed(null).value, "—");
    assert.equal(fmt.speedText(23.456), "23.5 Mbps");
  });
  it("writes durations people can read", () => {
    assert.equal(fmt.formatDuration(0.4), "under a second");
    assert.equal(fmt.formatDuration(45), "45 s");
    assert.equal(fmt.formatDuration(130), "2 min 10 s");
    assert.equal(fmt.formatDuration(4320), "1 h 12 min");
    assert.equal(fmt.formatDuration(259200), "about 3 days");
    assert.equal(fmt.formatDuration(null), "—");
  });
});

const RUN = {
  version: 2, mode: "quick", startedAt: 1, finishedAt: 1_700_000_000_000, durationMs: 15000,
  latency: { median: 20, min: 18, max: 40, p95: 30, jitter: 3, samples: 12, values: [20] },
  download: { mbps: 200, average: 190, peak: 230, consistency: 0.9, timeline: [], bytes: 1e8, durationMs: 6000, warmupMs: 1200, streams: 4, loaded: { median: 50, min: 40, max: 90, p95: 80, jitter: 5, samples: 10, values: [50] } },
  upload: { mbps: 40, average: 38, peak: 45, consistency: 0.8, timeline: [], bytes: 3e7, durationMs: 5000, warmupMs: 1200, streams: 4, loaded: { median: 300, min: 100, max: 500, p95: 450, jitter: 50, samples: 10, values: [300] } },
  tcp: { connections: 1, protocol: "TCP", sent: 50000, retrans: 25, ratio: 0.0005 },
  protocol: "HTTP/2", meta: { ip: "203.0.113.9", isp: "Example ISP", coloCity: "Mumbai" }, bytesDownloaded: 1e8, bytesUploaded: 3e7, serverTimeRemoved: true,
};

describe("result helpers", () => {
  it("derives scoring inputs, taking the worse of the two directions for bufferbloat", () => {
    const m = result.toMeasurements(RUN);
    assert.equal(m.download, 200);
    assert.equal(m.loadedIncrease, 280); // upload: 300 - 20
    assert.equal(m.packetLoss, 0.0005);
    assert.equal(m.connections, 1);
  });
  it("does not report loss from too few packets", () => {
    assert.equal(result.toMeasurements({ ...RUN, tcp: { ...RUN.tcp, sent: 50 } }).packetLoss, null);
  });
  it("builds a compact history record with the grade", () => {
    const r = result.toHistoryRecord(RUN);
    assert.equal(r.down, 200);
    assert.equal(r.grade, "D");
    assert.equal(r.isp, "Example ISP");
    assert.ok(JSON.stringify(r).length < 250);
  });
  it("summarises history", () => {
    const s = result.historyStats([{ down: 100, up: 10, ping: 20 }, { down: 300, up: 30, ping: 40 }, { down: 200, up: null, ping: 30 }]);
    assert.equal(s.medianDown, 200);
    assert.equal(s.bestDown, 300);
    assert.equal(s.worstDown, 100);
    assert.equal(s.medianUp, 20);
  });
  it("never puts the IP address in a shared summary or an exported report", () => {
    assert.ok(!result.summaryText(RUN, "Mbps").includes("203.0.113.9"));
    assert.ok(!result.reportJson(RUN).includes("203.0.113.9"));
    assert.match(result.summaryText(RUN, "Mbps"), /200 Mbps down, 40\.0 Mbps up/);
  });
  it("quotes CSV cells safely", () => {
    const csv = result.historyCsv([{ at: 0, mode: "quick", down: 1, up: 2, ping: 3, jitter: 4, bloat: 5, grade: "A", isp: 'Acme, "Fast" Net', city: "X" }]);
    assert.match(csv.split("\n")[1], /"Acme, ""Fast"" Net"/);
  });
});
