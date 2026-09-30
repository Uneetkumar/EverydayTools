"use client";

import React from "react";
import { Check } from "lucide-react";
import { formatMs, formatSpeed, speedText, type SpeedUnit } from "@/lib/speedtest/format";
import type { Phase } from "@/lib/speedtest/engine";
import { cn } from "@/lib/utils";
import type { LiveState } from "./use-speed-test";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Ready",
  latency: "Measuring latency",
  download: "Testing download",
  upload: "Testing upload",
  done: "Complete",
};

/**
 * The dial. The ring sits on a log scale up to about 2 Gbps, so 5 Mbps and
 * 500 Mbps both look meaningful; during the latency phase it shows progress.
 */
export function Gauge({ live, unit }: { live: LiveState; unit: SpeedUnit }) {
  const r = 88;
  const c = 2 * Math.PI * r;
  const latencyPhase = live.phase === "latency";
  const speed = live.mbps;
  const level = speed === null ? 0 : Math.min(1, Math.log10(1 + speed) / 3.3);
  const ring = latencyPhase ? live.fraction : live.phase === "done" ? 1 : level;
  const shown = latencyPhase ? { value: live.latency === null ? "—" : String(Math.round(live.latency)), unit: "ms" } : formatSpeed(speed, unit);

  return (
    <div className="relative mx-auto grid size-56 place-items-center sm:size-60">
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0.015, ring))}
          className={cn("transition-[stroke-dashoffset] duration-200 ease-out", live.phase === "upload" ? "stroke-chart-2" : "stroke-chart-1")}
        />
      </svg>
      <div className="text-center">
        <div className="text-[2.75rem] leading-none font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">{shown.value}</div>
        <div className="mt-1.5 text-sm text-muted-foreground">{shown.unit}</div>
        <div className="mt-2 text-xs font-medium text-muted-foreground">{PHASE_LABEL[live.phase]}</div>
      </div>
    </div>
  );
}

/** Latency → Download → Upload, each showing its result once it is in. */
export function PhaseSteps({ live, unit }: { live: LiveState; unit: SpeedUnit }) {
  const order: Phase[] = ["latency", "download", "upload"];
  const at = live.phase === "done" ? 3 : order.indexOf(live.phase);
  const steps = [
    { id: "latency", label: "Latency", value: live.latency !== null ? formatMs(live.latency) : null, color: "bg-foreground/60" },
    { id: "download", label: "Download", value: live.downDone !== null ? speedText(live.downDone, unit) : null, color: "bg-chart-1" },
    { id: "upload", label: "Upload", value: live.upDone !== null ? speedText(live.upDone, unit) : null, color: "bg-chart-2" },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Test progress">
      {steps.map((s, i) => {
        const done = i < at || (live.phase === "done");
        const active = i === at && live.phase !== "idle" && live.phase !== "done";
        return (
          <li key={s.id} className={cn("min-w-0 rounded-lg border px-3 py-2 transition-colors", active ? "border-foreground/25 bg-accent/60" : "bg-background")} aria-current={active ? "step" : undefined}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {done ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <span className={cn("size-2 rounded-full", active ? s.color : "bg-muted-foreground/30", active && "animate-pulse")} aria-hidden="true" />}
              {s.label}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground tabular-nums">{s.value ?? (active ? "…" : "—")}</div>
          </li>
        );
      })}
    </ol>
  );
}
