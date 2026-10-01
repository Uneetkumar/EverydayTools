"use client";

import React from "react";
import { Activity, ArrowDown, ArrowUp, AudioWaveform, Check, Play, type LucideIcon } from "lucide-react";
import { bufferbloat } from "@/lib/speedtest/aim";
import type { Phase, SpeedResult, TestPlan } from "@/lib/speedtest/engine";
import { formatMs, formatPercent, formatSpeed, GAUGE_STOPS, gaugePosition, speedText, type Formatted, type SpeedUnit } from "@/lib/speedtest/format";
import { toMeasurements } from "@/lib/speedtest/result";
import { cn } from "@/lib/utils";
import type { LiveState } from "./use-speed-test";

/* ------------------------------------------------------------------- dial */

// Drawing units. The arc spans 270°, opening at the bottom, so the box is cut
// just below the arc's ends instead of being square.
const W = 240;
const H = 206;
const CX = 120;
const CY = 120;
const R = 100;
const CIRC = 2 * Math.PI * R;
const SWEEP = 270;
const START = 135; // degrees clockwise from 3 o'clock: the bottom-left end

const PHASE_COLOR: Record<Phase, string> = {
  idle: "var(--chart-1)",
  latency: "var(--chart-4)",
  download: "var(--chart-1)",
  upload: "var(--chart-2)",
  done: "var(--chart-1)",
};

const polar = (deg: number, radius: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
};

const tickLabel = (v: number) => (v >= 1000 ? `${v / 1000}G` : String(v));

const msParts = (ms: number | null): Formatted => (ms === null ? { value: "—", unit: "ms" } : { value: ms < 10 ? ms.toFixed(1) : String(Math.round(ms)), unit: "ms" });

/**
 * The speedometer. Idle, it holds the Start button; while a transfer runs, the
 * arc and its knob follow the live speed on a stepped scale; when the test is
 * done it rests on the download result.
 */
export function Gauge({
  live,
  unit,
  onStart,
  canStart,
}: {
  live: LiveState;
  unit: SpeedUnit;
  onStart: () => void;
  canStart: boolean;
}) {
  const stops = GAUGE_STOPS[unit];
  const f = unit === "MB/s" ? 1 / 8 : 1;
  const transfer = live.phase === "download" || live.phase === "upload";
  const mbps = transfer ? live.mbps : live.phase === "done" ? live.downDone : null;
  const pos = gaugePosition(mbps === null ? null : mbps * f, stops);
  const color = PHASE_COLOR[live.phase];
  const knob = polar(START, R);

  const readout: { icon: LucideIcon; label: string; shown: Formatted } | null =
    live.phase === "latency"
      ? { icon: Activity, label: "Ping", shown: msParts(live.latency) }
      : live.phase === "download" || live.phase === "done"
        ? { icon: ArrowDown, label: "Download", shown: formatSpeed(mbps, unit) }
        : live.phase === "upload"
          ? { icon: ArrowUp, label: "Upload", shown: formatSpeed(mbps, unit) }
          : null;

  return (
    <div className="relative mx-auto aspect-[240/206] w-full max-w-[18rem]">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        {/* track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${CIRC * (SWEEP / 360)} ${CIRC}`}
          transform={`rotate(${START} ${CX} ${CY})`}
          className="stroke-muted"
        />
        {/* value */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${CIRC * (SWEEP / 360) * pos} ${CIRC}`}
          transform={`rotate(${START} ${CX} ${CY})`}
          style={{
            stroke: color,
            opacity: pos > 0 ? 1 : 0,
            filter: `drop-shadow(0 0 6px color-mix(in oklch, ${color} 45%, transparent))`,
            transition: "stroke-dasharray 350ms ease-out, opacity 200ms, stroke 300ms",
          }}
        />
        {/* scale */}
        {stops.map((v, i) => {
          const deg = START + (SWEEP * i) / (stops.length - 1);
          const a = polar(deg, R - 15);
          const b = polar(deg, R - 10);
          const t = polar(deg, R - 26);
          const reached = pos > 0 && i / (stops.length - 1) <= pos + 1e-6;
          return (
            <g key={v}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={1.5} strokeLinecap="round" className={reached ? "stroke-foreground/60" : "stroke-muted-foreground/40"} />
              <text x={t.x} y={t.y + 3.5} textAnchor="middle" className={cn("text-[10px] tabular-nums transition-colors", reached ? "fill-foreground" : "fill-muted-foreground")}>
                {tickLabel(v)}
              </text>
            </g>
          );
        })}
        {/* knob at the tip of the arc */}
        <g style={{ transform: `rotate(${SWEEP * pos}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: "transform 350ms ease-out", opacity: pos > 0 ? 1 : 0 }}>
          <circle cx={knob.x} cy={knob.y} r={8} strokeWidth={3.5} className="fill-card" style={{ stroke: color, transition: "stroke 300ms" }} />
        </g>
      </svg>

      <div className="absolute top-[58.25%] left-1/2 flex w-[56%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        {readout ? (
          <>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase" style={{ color }}>
              <readout.icon className="size-3.5" aria-hidden="true" />
              {readout.label}
            </span>
            <span className="mt-1.5 text-[2.6rem] leading-none font-semibold tracking-tight text-foreground tabular-nums @md:text-5xl">{readout.shown.value}</span>
            <span className="mt-1.5 text-sm text-muted-foreground">{readout.shown.unit}</span>
          </>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            aria-label="Start the speed test"
            className="group relative grid aspect-square w-[82%] place-items-center rounded-full bg-primary text-primary-foreground shadow-raised outline-none transition-transform duration-200 hover:scale-[1.04] focus-visible:ring-4 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="absolute -inset-2.5 rounded-full bg-primary/20 motion-safe:animate-pulse" aria-hidden="true" />
            <span className="relative flex flex-col items-center gap-1">
              <Play className="size-5 fill-current" aria-hidden="true" />
              <span className="text-lg font-semibold tracking-wide">Start</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- progress */

const ORDER: Phase[] = ["latency", "download", "upload"];

/** The whole test as one bar, in three parts sized by how long each takes. */
export function TestProgress({ live, plan }: { live: LiveState; plan: TestPlan }) {
  const at = live.phase === "done" ? 3 : ORDER.indexOf(live.phase);
  const parts = [
    { id: "latency", weight: Math.max(1500, plan.latencySamples * 80), cls: "bg-chart-4" },
    { id: "download", weight: plan.downloadMs, cls: "bg-chart-1" },
    { id: "upload", weight: plan.uploadMs, cls: "bg-chart-2" },
  ];
  const fill = (i: number) => (i < at ? 1 : i === at ? Math.min(1, live.fraction) : 0);
  const total = parts.reduce((s, p) => s + p.weight, 0);
  const overall = parts.reduce((s, p, i) => s + p.weight * fill(i), 0) / total;
  return (
    <div role="progressbar" aria-label="Test progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall * 100)} className="flex w-full gap-1">
      {parts.map((p, i) => (
        <div key={p.id} className="h-1.5 basis-0 overflow-hidden rounded-full bg-muted" style={{ flexGrow: p.weight }}>
          <div className={cn("h-full rounded-full transition-[width] duration-200 ease-out", p.cls)} style={{ width: `${fill(i) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ tiles */

type TileState = "idle" | "waiting" | "active" | "done";

const TONE = {
  download: { icon: ArrowDown, chip: "bg-chart-1/12 text-chart-1", active: "border-chart-1/50 ring-3 ring-chart-1/12", dot: "bg-chart-1" },
  upload: { icon: ArrowUp, chip: "bg-chart-2/12 text-chart-2", active: "border-chart-2/50 ring-3 ring-chart-2/12", dot: "bg-chart-2" },
  ping: { icon: Activity, chip: "bg-chart-4/12 text-chart-4", active: "border-chart-4/50 ring-3 ring-chart-4/12", dot: "bg-chart-4" },
  jitter: { icon: AudioWaveform, chip: "bg-chart-3/15 text-chart-3", active: "border-chart-3/50 ring-3 ring-chart-3/12", dot: "bg-chart-3" },
} as const;

function Tile({ tone, label, state, shown, hint }: { tone: keyof typeof TONE; label: string; state: TileState; shown: Formatted; hint?: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <li
      className={cn("min-w-0 rounded-xl border bg-background p-3 transition-[border-color,box-shadow] duration-300", state === "active" && t.active)}
      aria-current={state === "active" ? "step" : undefined}
    >
      <div className="flex items-center gap-2">
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", t.chip)}>
          <t.icon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <span className="ml-auto flex shrink-0 items-center">
          {state === "done" ? (
            <Check className="size-3.5 text-success" aria-hidden="true" />
          ) : state === "active" ? (
            <span className={cn("size-2 rounded-full motion-safe:animate-pulse", t.dot)} aria-hidden="true" />
          ) : null}
          {(state === "done" || state === "active") && <span className="sr-only">{state === "done" ? "done" : "measuring"}</span>}
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-1 truncate">
        <span className={cn("text-2xl leading-none font-semibold tracking-tight tabular-nums", state === "active" ? "text-foreground/75" : state === "done" ? "text-foreground" : "text-muted-foreground/60")}>
          {shown.value}
        </span>
        <span className="text-xs text-muted-foreground">{shown.unit}</span>
      </p>
      <p className="mt-1.5 min-h-8 text-xs leading-4 text-muted-foreground">{hint}</p>
    </li>
  );
}

const steadyText = (c: number | null | undefined) => (c === null || c === undefined ? null : `${formatPercent(c)} steady`);

const jitterWord = (j: number) => (j < 10 ? "Very steady ping" : j < 30 ? "Fairly steady ping" : "Jumpy ping: calls may stutter");

/**
 * Download, upload, ping and jitter, filling in as the test runs. When the
 * test is done each adds the detail behind its number: peak and steadiness,
 * the share of the plan, the delay under load and its grade.
 */
export function LiveTiles({ live, unit, result, planDown }: { live: LiveState; unit: SpeedUnit; result: SpeedResult | null; planDown: number | null }) {
  const at = live.phase === "done" ? 3 : ORDER.indexOf(live.phase);
  const state = (step: number): TileState => (live.phase === "idle" ? "idle" : step < at ? "done" : step === at ? "active" : "waiting");
  const dl = result?.download;
  const ul = result?.upload;
  const bloat = result ? bufferbloat(toMeasurements(result).loadedIncrease) : null;

  const downState = state(1);
  const upState = state(2);
  const pingState = state(0);

  const downHint =
    downState === "idle"
      ? "Averaged over the steady part of the test"
      : downState === "active"
        ? "Live, over the last second"
        : dl
          ? [`Peak ${speedText(dl.peak, unit)}`, steadyText(dl.consistency), planDown ? `${formatPercent(dl.mbps / planDown)} of your plan` : null].filter(Boolean).join(" · ")
          : null;
  const upHint =
    upState === "idle"
      ? "Matters for calls, backups and sharing files"
      : upState === "active"
        ? "Live, over the last second"
        : ul
          ? [`Peak ${speedText(ul.peak, unit)}`, steadyText(ul.consistency)].filter(Boolean).join(" · ")
          : null;
  const pingHint =
    pingState === "idle"
      ? "How quickly the connection answers"
      : pingState === "active"
        ? "Measuring with small requests…"
        : bloat
          ? `Under load +${Math.round(bloat.increase)} ms · grade ${bloat.grade}`
          : live.loaded !== null
            ? `Under load ${formatMs(live.loaded)}`
            : live.phase === "done"
              ? null
              : "Measuring under load…";
  const jitterHint =
    pingState === "idle" ? "How much the ping varies" : pingState === "active" ? "Measuring…" : live.jitter !== null ? jitterWord(live.jitter) : null;

  return (
    <ul className="grid grid-cols-2 gap-2.5 @5xl:grid-cols-4" aria-label="Results so far">
      <Tile tone="download" label="Download" state={downState} shown={formatSpeed(downState === "active" ? live.mbps : live.downDone, unit)} hint={downHint} />
      <Tile tone="upload" label="Upload" state={upState} shown={formatSpeed(upState === "active" ? live.mbps : live.upDone, unit)} hint={upHint} />
      <Tile tone="ping" label="Ping" state={pingState} shown={msParts(live.latency)} hint={pingHint} />
      <Tile tone="jitter" label="Jitter" state={pingState} shown={msParts(live.jitter)} hint={jitterHint} />
    </ul>
  );
}
