"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Slice } from "@/lib/speedtest/stats";
import type { SpeedUnit } from "@/lib/speedtest/format";
import type { HistoryRecord } from "@/lib/speedtest/result";
import { cn } from "@/lib/utils";

/** Width of an element, following resizes, so charts draw in real pixels and keep their text crisp. */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A round upper bound for an axis: 1, 2, 2.5, 5 or 10 times a power of ten. */
function niceMax(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

const factor = (unit: SpeedUnit) => (unit === "MB/s" ? 1 / 8 : 1);

/* --------------------------------------------------------------- throughput */

export interface ChartSeries {
  id: "download" | "upload";
  label: string;
  slices: Slice[];
  /** The headline speed, drawn as a reference line. */
  headline?: number | null;
  warmupMs?: number;
}

const GAP_SECONDS = 1.5;
const COLOR: Record<ChartSeries["id"], string> = { download: "var(--chart-1)", upload: "var(--chart-2)" };

/**
 * Speed over time for the whole test, download then upload, left to right.
 * The ramp-up at the start of each transfer is shaded, because it is not
 * counted in the headline figure; a dashed line marks the headline.
 */
export function ThroughputChart({
  series,
  unit,
  expected,
  height = 220,
}: {
  series: ChartSeries[];
  unit: SpeedUnit;
  /** Planned length of each transfer in seconds, so the axis does not jump while a test runs. */
  expected: { download: number; upload: number };
  height?: number;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const f = factor(unit);

  const down = series.find((s) => s.id === "download");
  const up = series.find((s) => s.id === "upload");
  const dEnd = Math.max(expected.download, down?.slices.length ? down.slices[down.slices.length - 1].t + 0.25 : 0);
  const uEnd = up ? Math.max(expected.upload, up.slices.length ? up.slices[up.slices.length - 1].t + 0.25 : 0) : 0;
  const upOffset = dEnd + GAP_SECONDS;
  const xMax = up ? upOffset + uEnd : dEnd;

  const all = series.flatMap((s) => s.slices.map((p) => p.mbps * f));
  const yMax = niceMax(Math.max(1, ...all) * 1.12);

  const m = { top: 22, right: 12, bottom: 24, left: 44 };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;
  const x = (s: number) => m.left + (s / xMax) * w;
  const y = (v: number) => m.top + h - (Math.min(v, yMax) / yMax) * h;

  const points = (s: ChartSeries) => {
    const off = s.id === "upload" ? upOffset : 0;
    return s.slices.map((p) => ({ x: x(off + p.t + 0.125), y: y(p.mbps * f), t: p.t, mbps: p.mbps }));
  };
  const line = (pts: Array<{ x: number; y: number }>) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = (pts: Array<{ x: number; y: number }>) => (pts.length ? `${line(pts)} L${pts[pts.length - 1].x.toFixed(1)},${y(0)} L${pts[0].x.toFixed(1)},${y(0)} Z` : "");

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((q) => q * yMax);
  const fmtTick = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : v % 1 ? v.toFixed(1) : String(v));

  const hit = (clientX: number, rect: DOMRect) => {
    const s = ((clientX - rect.left - m.left) / w) * xMax;
    setHover(Math.min(xMax, Math.max(0, s)));
  };
  // The point under the pointer: in whichever transfer the pointer is over.
  const tip = (() => {
    if (hover === null) return null;
    for (const s of [down, up]) {
      if (!s || s.slices.length === 0) continue;
      const off = s.id === "upload" ? upOffset : 0;
      const end = s.id === "upload" ? uEnd : dEnd;
      if (hover < off || hover > off + end) continue;
      const local = hover - off;
      const p = s.slices.reduce((best, c) => (Math.abs(c.t + 0.125 - local) < Math.abs(best.t + 0.125 - local) ? c : best), s.slices[0]);
      return { s, p, cx: x(off + p.t + 0.125) };
    }
    return null;
  })();

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Speed over time. ${down?.headline ? `Download about ${Math.round(down.headline * f)} ${unit}.` : ""} ${up?.headline ? `Upload about ${Math.round(up.headline * f)} ${unit}.` : ""}`}
          onPointerMove={(e) => hit(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setHover(null)}
          className="touch-pan-y"
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={m.left} x2={m.left + w} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
              <text x={m.left - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                {fmtTick(v)}
              </text>
            </g>
          ))}
          <text x={m.left - 8} y={12} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {unit}
          </text>

          {series.map((s) => {
            const off = s.id === "upload" ? upOffset : 0;
            const pts = points(s);
            const warm = Math.min((s.warmupMs ?? 0) / 1000, s.id === "upload" ? uEnd : dEnd);
            const end = s.id === "upload" ? uEnd : dEnd;
            return (
              <g key={s.id}>
                <text x={x(off)} y={12} className="fill-foreground text-[11px] font-medium">
                  {s.label}
                </text>
                {warm > 0 && s.slices.length > 0 && (
                  <g>
                    <rect x={x(off)} y={m.top} width={x(off + warm) - x(off)} height={h} className="fill-muted/70" />
                    {x(off + warm) - x(off) > 44 && (
                      <text x={x(off) + 6} y={m.top + 12} className="fill-muted-foreground text-[9px]">
                        ramp-up
                      </text>
                    )}
                  </g>
                )}
                <path d={area(pts)} style={{ fill: COLOR[s.id], opacity: 0.12 }} />
                <path d={line(pts)} fill="none" style={{ stroke: COLOR[s.id] }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {s.headline ? (
                  <g>
                    <line x1={x(off + warm)} x2={x(off + end)} y1={y(s.headline * f)} y2={y(s.headline * f)} style={{ stroke: COLOR[s.id] }} strokeWidth={1} strokeDasharray="4 3" />
                  </g>
                ) : null}
              </g>
            );
          })}

          <line x1={m.left} x2={m.left + w} y1={y(0)} y2={y(0)} className="stroke-border" strokeWidth={1} />
          {dEnd > 0 &&
            [0, Math.round(dEnd / 2), Math.round(dEnd)].map((t, i) => (
              <text key={`d${i}`} x={x(t)} y={height - 6} textAnchor={i === 0 ? "start" : i === 2 && !up ? "end" : "middle"} className="fill-muted-foreground text-[10px] tabular-nums">
                {t}s
              </text>
            ))}
          {up && <text x={x(upOffset)} y={height - 6} className="fill-muted-foreground text-[10px] tabular-nums">0s</text>}
          {up && (
            <text x={x(upOffset + uEnd)} y={height - 6} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
              {Math.round(uEnd)}s
            </text>
          )}

          {tip && (
            <g pointerEvents="none">
              <line x1={tip.cx} x2={tip.cx} y1={m.top} y2={y(0)} className="stroke-foreground/30" strokeWidth={1} />
              <circle cx={tip.cx} cy={y(tip.p.mbps * f)} r={4} style={{ fill: COLOR[tip.s.id] }} className="stroke-background" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {tip && width > 0 && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-raised"
          style={{ left: Math.min(Math.max(tip.cx, 60), width - 60) }}
        >
          <span className="font-medium tabular-nums">
            {(tip.p.mbps * f).toFixed(tip.p.mbps * f >= 100 ? 0 : 1)} {unit}
          </span>
          <span className="ml-1.5 text-muted-foreground">
            {tip.s.label.toLowerCase()} · {tip.p.t.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ latency bars */

export interface LatencyRow {
  label: string;
  median: number | null;
  p95?: number | null;
  /** Colours the bar: the extra delay over idle decides it. */
  tone: "idle" | "load";
  extra?: number | null;
}

/** Idle ping against ping while downloading and uploading, on one scale. */
export function LatencyBars({ rows }: { rows: LatencyRow[] }) {
  const shown = rows.filter((r) => r.median !== null);
  const max = niceMax(Math.max(10, ...shown.map((r) => Math.max(r.median ?? 0, r.p95 ?? 0))) * 1.05);
  return (
    <ul className="space-y-3" aria-label="Latency when idle and under load">
      {shown.map((r) => {
        const extra = r.extra ?? 0;
        const tone = r.tone === "idle" ? "bg-chart-1" : extra < 30 ? "bg-success" : extra < 200 ? "bg-warning" : "bg-destructive";
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-foreground tabular-nums">
                {Math.round(r.median!)} ms
                {r.tone === "load" && extra >= 1 && <span className="ml-1.5 font-normal text-muted-foreground">+{Math.round(extra)}</span>}
              </span>
            </div>
            <div className="relative mt-1 h-2 rounded-full bg-muted" role="presentation">
              <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(1.5, (r.median! / max) * 100)}%` }} />
              {r.p95 ? <span className="absolute top-[-2px] h-3 w-0.5 rounded bg-foreground/50" style={{ left: `${Math.min(99, (r.p95 / max) * 100)}%` }} title={`Slowest 5% of pings: ${Math.round(r.p95)} ms`} /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------- trend */

/** Download and upload across recent tests on this device, oldest to newest. */
export function TrendChart({ records, unit, height = 120 }: { records: HistoryRecord[]; unit: SpeedUnit; height?: number }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const f = factor(unit);
  const data = [...records].reverse().slice(-30);
  const max = niceMax(Math.max(1, ...data.flatMap((r) => [r.down ?? 0, r.up ?? 0])) * f * 1.1);
  const m = { top: 8, right: 8, bottom: 8, left: 8 };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;
  const x = (i: number) => m.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v: number) => m.top + h - (Math.min(v * f, max) / max) * h;
  const path = (key: "down" | "up") =>
    data
      .map((r, i) => (r[key] === null ? null : `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r[key]!).toFixed(1)}`))
      .filter(Boolean)
      .join(" ");
  return (
    <div ref={ref} className="w-full">
      {width > 0 && data.length > 1 && (
        <svg width={width} height={height} role="img" aria-label={`Download and upload across the last ${data.length} tests, up to ${Math.round(max)} ${unit}`}>
          <line x1={m.left} x2={m.left + w} y1={y(0)} y2={y(0)} className="stroke-border" />
          <path d={path("down")} fill="none" style={{ stroke: COLOR.download }} strokeWidth={2} strokeLinejoin="round" />
          <path d={path("up")} fill="none" style={{ stroke: COLOR.upload }} strokeWidth={2} strokeLinejoin="round" />
          {data.map((r, i) => (
            <g key={r.at}>
              {r.down !== null && <circle cx={x(i)} cy={y(r.down)} r={2.5} style={{ fill: COLOR.download }} />}
              {r.up !== null && <circle cx={x(i)} cy={y(r.up)} r={2.5} style={{ fill: COLOR.upload }} />}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
