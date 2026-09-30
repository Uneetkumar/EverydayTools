"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Gauge as GaugeIcon, Play, Square } from "lucide-react";
import { Field, Notice, Segmented, UnitInput } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { Gauge, PhaseSteps } from "@/components/speedtest/gauge";
import { ThroughputChart, type ChartSeries } from "@/components/speedtest/charts";
import { HistorySection } from "@/components/speedtest/history";
import { Report, type NetInfo } from "@/components/speedtest/report";
import { useSpeedTest } from "@/components/speedtest/use-speed-test";
import { useStored } from "@/components/speedtest/use-stored";
import { PLANS, type Mode } from "@/lib/speedtest/engine";
import { formatMs, type SpeedUnit } from "@/lib/speedtest/format";
import { HISTORY_LIMIT, toHistoryRecord, type HistoryRecord } from "@/lib/speedtest/result";
import { markToolCompleted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const MODES: Array<{ value: Mode; label: string; blurb: string }> = [
  { value: "quick", label: "Quick", blurb: "About 15 seconds. Data use follows your speed: roughly 140 MB at 100 Mbps, capped near 450 MB. Right for most connections." },
  { value: "full", label: "Full", blurb: "About 25 seconds and, on a fast line, one to a few gigabytes. More accurate above 300 Mbps; avoid it on mobile data." },
  { value: "extended", label: "Extended", blurb: "About a minute and up to several gigabytes on a fast line. Shows how steady your speed is over time; avoid it on mobile data." },
];

const WHAT_IT_MEASURES = [
  ["Speed", "Download and upload, averaged over the steady part of the test."],
  ["Latency and jitter", "How quickly the connection answers, and how much that varies."],
  ["Responsiveness under load", "An A+ to F grade for how much lag appears when the line is busy."],
  ["What it is good for", "Streaming, calls and gaming, checked against what each needs."],
] as const;

const parsePlan = (s: string): number | null => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function SpeedTest() {
  const [mode, setMode] = useStored<Mode>("speedtest-mode", "quick");
  const [unit, setUnit] = useStored<SpeedUnit>("speedtest-unit", "Mbps");
  const [planText, setPlanText] = useStored("speedtest-plan", { down: "", up: "" });
  const [history, setHistory] = useStored<HistoryRecord[]>("speedtest-history-v2", []);
  const [net, setNet] = useState<NetInfo | null>(null);
  const [online, setOnline] = useState(true);

  const { live, result, error, running, start, stop } = useSpeedTest((r) => {
    markToolCompleted();
    setHistory((h) => [toHistoryRecord(r), ...h].slice(0, HISTORY_LIMIT));
  });

  useEffect(() => {
    const t = setTimeout(() => {
      const c = (navigator as unknown as { connection?: NetInfo }).connection;
      if (c) setNet({ effectiveType: c.effectiveType, downlink: c.downlink, rtt: c.rtt, saveData: c.saveData, type: c.type });
      setOnline(navigator.onLine);
    }, 0);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const plan = useMemo(() => ({ down: parsePlan(planText.down), up: parsePlan(planText.up) }), [planText]);
  const planMode = result?.mode ?? mode;
  const p = PLANS[planMode];
  const active = MODES.find((m) => m.value === mode)!;
  const hasRun = running || result !== null;

  const series: ChartSeries[] = [];
  if (live.down.length) series.push({ id: "download", label: "Download", slices: live.down, headline: result?.download?.mbps ?? live.downDone, warmupMs: Math.min(p.warmupMs, p.downloadMs * 0.3) });
  if (live.up.length) series.push({ id: "upload", label: "Upload", slices: live.up, headline: result?.upload?.mbps ?? live.upDone, warmupMs: Math.min(p.warmupMs, p.uploadMs * 0.3) });

  const announce = running
    ? `${live.phase === "latency" ? "Measuring latency" : live.phase === "download" ? "Testing download speed" : "Testing upload speed"}`
    : result
      ? "Test complete. Results are below."
      : "";

  return (
    <div className="space-y-8">
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <section aria-label="Speed test" className="grid gap-x-8 gap-y-6 @3xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] @3xl:items-center">
        <div className="space-y-5">
          <Gauge live={live} unit={unit} />
          <div className="flex justify-center">
            {running ? (
              <Button type="button" variant="outline" size="lg" onClick={stop} className="min-w-44">
                <Square aria-hidden="true" /> Stop
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={() => void start(mode)} disabled={!online} className="min-w-44">
                <Play aria-hidden="true" /> {result ? "Test again" : "Start test"}
              </Button>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {hasRun ? (
            <>
              <PhaseSteps live={live} unit={unit} />
              <div className="rounded-lg border bg-background p-3 pr-2">
                <ThroughputChart series={series} unit={unit} expected={{ download: p.downloadMs / 1000, upload: p.uploadMs / 1000 }} />
              </div>
              <p className={cn("min-h-5 text-sm text-muted-foreground", !running && "invisible")} aria-hidden={!running}>
                {live.phase === "latency" && "Sending small requests to measure how fast the connection answers…"}
                {(live.phase === "download" || live.phase === "upload") && (
                  <>
                    Ping while the line is busy: <span className="font-medium text-foreground tabular-nums">{live.loaded === null ? "measuring…" : formatMs(live.loaded)}</span>
                    {live.latency !== null && live.loaded !== null && <span> (idle {formatMs(live.latency)})</span>}
                  </>
                )}
              </p>
            </>
          ) : (
            <ul className="grid gap-2.5 @xl:grid-cols-2" aria-label="What this test measures">
              {WHAT_IT_MEASURES.map(([title, body]) => (
                <li key={title} className="rounded-lg border bg-background px-3.5 py-3">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Test options" className="space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 @3xl:justify-start">
          <Segmented size="sm" ariaLabel="Test length" value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: m.label }))} className={running ? "pointer-events-none opacity-60" : undefined} />
          <Segmented size="sm" ariaLabel="Speed unit" value={unit} onChange={setUnit} options={[{ value: "Mbps", label: "Mbps" }, { value: "MB/s", label: "MB/s" }]} />
        </div>
        <p className="text-center text-xs text-muted-foreground @3xl:text-left" aria-live="polite">
          {active.blurb}
        </p>
        <details className="group rounded-lg border bg-background px-3.5 py-2.5">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground marker:content-none">
            <GaugeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            Compare with the plan you pay for
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </summary>
          <div className="mt-3 grid gap-3 @md:grid-cols-2">
            <Field label="Download speed of your plan" htmlFor="plan-down" hint="From your bill or provider's app.">
              <UnitInput id="plan-down" unit="Mbps" inputMode="decimal" placeholder="e.g. 300" value={planText.down} onChange={(e) => setPlanText({ ...planText, down: e.target.value.slice(0, 7) })} />
            </Field>
            <Field label="Upload speed of your plan" htmlFor="plan-up" hint="Leave blank if you do not know.">
              <UnitInput id="plan-up" unit="Mbps" inputMode="decimal" placeholder="e.g. 300" value={planText.up} onChange={(e) => setPlanText({ ...planText, up: e.target.value.slice(0, 7) })} />
            </Field>
          </div>
        </details>
      </section>

      {!online && <Notice tone="warning">You appear to be offline. Connect to the internet to run the test.</Notice>}
      {net?.saveData && <Notice tone="info">Your browser is in data-saver mode. Use the Quick test to limit data use.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {result && result.mode === "quick" && (result.download?.mbps ?? 0) > 300 && (
        <Notice tone="info">This is a fast line. The Quick test ends early to save data, so the Full test gives a more accurate reading above about 300 Mbps.</Notice>
      )}

      {result && <Report result={result} unit={unit} plan={plan} net={net} />}

      {history.length > 0 && <HistorySection records={history} unit={unit} onClear={() => setHistory([])} />}

      <p className="text-xs text-muted-foreground">
        The test moves data between this browser and Cloudflare&apos;s public speed-test servers, the nearest of which is chosen automatically. Results depend on this device, Wi-Fi signal, other traffic, a VPN and the route to that server, so they show what this device gets from this server, not a guarantee from your provider.
      </p>
    </div>
  );
}
