"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, LineChart, Play, RotateCcw, Square, Target } from "lucide-react";
import { toast } from "sonner";
import { Field, Notice, Segmented, UnitInput } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Gauge, LiveTiles, TestProgress } from "@/components/speedtest/gauge";
import { ThroughputChart, type ChartSeries } from "@/components/speedtest/charts";
import { HistorySection } from "@/components/speedtest/history";
import { Report, type NetInfo } from "@/components/speedtest/report";
import { useSpeedTest } from "@/components/speedtest/use-speed-test";
import { useStored } from "@/components/speedtest/use-stored";
import { PLANS, type Mode } from "@/lib/speedtest/engine";
import type { SpeedUnit } from "@/lib/speedtest/format";
import { HISTORY_LIMIT, toHistoryRecord, type HistoryRecord } from "@/lib/speedtest/result";
import { markToolCompleted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const MODES: Array<{ value: Mode; label: string; time: string; blurb: string }> = [
  { value: "quick", label: "Quick", time: "about 15 seconds", blurb: "About 15 seconds. Data use follows your speed: roughly 140 MB at 100 Mbps, capped near 450 MB. Right for most connections." },
  { value: "full", label: "Full", time: "about 25 seconds", blurb: "About 25 seconds and, on a fast line, one to a few gigabytes. More accurate above 300 Mbps; avoid it on mobile data." },
  { value: "extended", label: "Extended", time: "about a minute", blurb: "About a minute and up to several gigabytes on a fast line. Shows how steady your speed is over time; avoid it on mobile data." },
];

const CHART_HEIGHT = 220;
const REPORT_ID = "speed-test-report";

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
  // The mode of the run on screen: changing the picker mid-run must not redraw its chart.
  const [runMode, setRunMode] = useState<Mode>("quick");

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
  const planMode = running ? runMode : (result?.mode ?? mode);
  const p = PLANS[planMode];
  const active = MODES.find((m) => m.value === mode)!;
  const hasRun = running || result !== null;

  const run = (m: Mode) => {
    setRunMode(m);
    void start(m);
  };
  const onStop = () => {
    stop();
    toast("Test stopped", { description: "Nothing was saved. Start again whenever you are ready." });
  };
  const clearHistory = () => {
    const removed = history;
    setHistory([]);
    // Undo puts the old tests back behind any run that finished in the meantime.
    toast("Test history cleared", { duration: 10_000, action: { label: "Undo", onClick: () => setHistory((h) => [...h, ...removed].slice(0, HISTORY_LIMIT)) } });
  };
  const showReport = () => document.getElementById(REPORT_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const series: ChartSeries[] = [];
  if (live.down.length) series.push({ id: "download", label: "Download", slices: live.down, headline: result?.download?.mbps ?? live.downDone, warmupMs: Math.min(p.warmupMs, p.downloadMs * 0.3) });
  if (live.up.length) series.push({ id: "upload", label: "Upload", slices: live.up, headline: result?.upload?.mbps ?? live.upDone, warmupMs: Math.min(p.warmupMs, p.uploadMs * 0.3) });

  const announce = running
    ? `${live.phase === "latency" ? "Measuring latency" : live.phase === "download" ? "Testing download speed" : "Testing upload speed"}`
    : result
      ? "Test complete. Results are below."
      : "";

  const planLabel = plan.down ? `Plan ${plan.down}${plan.up ? ` / ${plan.up}` : ""} Mbps` : "Compare with your plan";

  return (
    <div className="space-y-6">
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      {/* Options ---------------------------------------------------------- */}
      <section aria-label="Test options" className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
          <Segmented
            size="sm"
            ariaLabel="Test length"
            value={mode}
            onChange={setMode}
            options={MODES.map((m) => ({ value: m.value, label: m.label }))}
            className={running ? "pointer-events-none opacity-60" : undefined}
          />
          <Segmented size="sm" ariaLabel="Speed unit" value={unit} onChange={setUnit} options={[{ value: "Mbps", label: "Mbps" }, { value: "MB/s", label: "MB/s" }]} />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className={cn("@xl:ml-auto", plan.down && "border-primary/40 text-brand-subtle-foreground")}>
                <Target aria-hidden="true" /> {planLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-3 p-4">
              <PopoverHeader>
                <PopoverTitle>Compare with the plan you pay for</PopoverTitle>
                <PopoverDescription>The speeds on your bill or in your provider&apos;s app. The result then shows how much of it reaches this device.</PopoverDescription>
              </PopoverHeader>
              <Field label="Download" htmlFor="plan-down">
                <UnitInput id="plan-down" unit="Mbps" inputMode="decimal" placeholder="e.g. 300" value={planText.down} onChange={(e) => setPlanText({ ...planText, down: e.target.value.slice(0, 7) })} />
              </Field>
              <Field label="Upload" htmlFor="plan-up" hint="Leave blank if you do not know.">
                <UnitInput id="plan-up" unit="Mbps" inputMode="decimal" placeholder="e.g. 300" value={planText.up} onChange={(e) => setPlanText({ ...planText, up: e.target.value.slice(0, 7) })} />
              </Field>
              {(planText.down || planText.up) && (
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setPlanText({ down: "", up: "" })}>
                  Clear plan
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {active.blurb}
        </p>
      </section>

      {/* The test --------------------------------------------------------- */}
      <section aria-label="Speed test" className="grid gap-x-8 gap-y-6 @3xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] @3xl:items-center">
        <div className="flex flex-col items-center gap-4">
          <Gauge live={live} unit={unit} onStart={() => run(mode)} canStart={online} />
          <div className="flex min-h-16 w-full max-w-[17rem] flex-col items-center justify-center gap-3">
            {running ? (
              <>
                <TestProgress live={live} plan={p} />
                <Button type="button" variant="outline" size="lg" onClick={onStop} className="min-w-36">
                  <Square aria-hidden="true" /> Stop
                </Button>
              </>
            ) : result ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" size="lg" onClick={() => run(mode)} disabled={!online}>
                  <RotateCcw aria-hidden="true" /> Test again
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={showReport}>
                  <ArrowDown aria-hidden="true" /> Full report
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                {active.label} test · {active.time}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <LiveTiles live={live} unit={unit} result={result} planDown={plan.down} />
          <div className="rounded-xl border bg-background p-3 pr-2">
            {hasRun ? (
              <ThroughputChart series={series} unit={unit} height={CHART_HEIGHT} expected={{ download: p.downloadMs / 1000, upload: p.uploadMs / 1000 }} />
            ) : (
              <div className="grid place-items-center text-center" style={{ height: CHART_HEIGHT }}>
                <div className="max-w-xs space-y-2">
                  <LineChart className="mx-auto size-6 text-muted-foreground/60" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Speed over time draws here as the test runs, so dips and slowdowns show up, not just the average.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {!online && <Notice tone="warning">You appear to be offline. Connect to the internet to run the test.</Notice>}
      {net?.saveData && <Notice tone="info">Your browser is in data-saver mode. Use the Quick test to limit data use.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {result && result.mode === "quick" && (result.download?.mbps ?? 0) > 300 && (
        <Notice tone="info">
          This is a fast line. The Quick test ends early to save data, so the Full test gives a more accurate reading above about 300 Mbps.{" "}
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium text-link underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => {
              setMode("full");
              run("full");
            }}
          >
            <Play className="size-3.5" aria-hidden="true" /> Run the Full test
          </button>
        </Notice>
      )}

      {result && (
        <div id={REPORT_ID} className="scroll-mt-24">
          <Report result={result} unit={unit} plan={plan} net={net} />
        </div>
      )}

      {history.length > 0 && <HistorySection records={history} unit={unit} onClear={clearHistory} />}

      <p className="text-xs text-muted-foreground">
        The test moves data between this browser and Cloudflare&apos;s public speed-test servers, the nearest of which is chosen automatically. Results depend on this device, Wi-Fi signal, other traffic, a VPN and the route to that server, so they show what this device gets from this server, not a guarantee from your provider.
      </p>
    </div>
  );
}
