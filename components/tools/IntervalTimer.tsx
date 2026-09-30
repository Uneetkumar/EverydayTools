"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Chips, Field, ToolDivider, ToolSection, UnitInput } from "@/components/tool/kit";
import { AlertSettings, NotificationHint, fireAlert, useAlertPrefs, useDocumentTitle } from "@/components/tool/timer-kit";
import { Button } from "@/components/ui/button";
import { markToolCompleted } from "@/lib/analytics";
import { playAlarm, playTick, primeAudio, stopAlarm } from "@/lib/audio/alarm";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
import { useNow } from "@/lib/hooks/useNow";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { DEFAULT_INTERVAL, INTERVAL_PRESETS, SEGMENT_LABEL, buildSchedule, describeDuration, formatClock, scheduleSeconds, wallClock, type IntervalPlan, type SegmentKind } from "@/lib/time/timers";
import { cn } from "@/lib/utils";

interface Run {
  status: "idle" | "running" | "paused";
  /** Wall-clock time the workout began (shifted forward by pauses), while running. */
  startedAt: number | null;
  /** Elapsed milliseconds when idle or paused. */
  elapsedMs: number;
}

const SURFACE: Record<SegmentKind, string> = {
  prepare: "bg-muted/60",
  work: "bg-primary/10",
  rest: "bg-success/10",
  setrest: "bg-warning/10",
  cooldown: "bg-muted/60",
};

const INPUTS: { key: keyof IntervalPlan; label: string; unit: string; hint?: string; min: number; max: number }[] = [
  { key: "prepareSec", label: "Get ready", unit: "sec", min: 0, max: 600 },
  { key: "workSec", label: "Work", unit: "sec", min: 1, max: 3600 },
  { key: "restSec", label: "Rest", unit: "sec", hint: "Between rounds. 0 for none.", min: 0, max: 3600 },
  { key: "rounds", label: "Rounds", unit: "", min: 1, max: 99 },
  { key: "sets", label: "Sets", unit: "", min: 1, max: 20 },
  { key: "restBetweenSetsSec", label: "Rest between sets", unit: "sec", min: 0, max: 3600 },
  { key: "cooldownSec", label: "Cool down", unit: "sec", min: 0, max: 1800 },
];

export default function IntervalTimer() {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const fs = useFullscreen(wrap);
  const prefs = useAlertPrefs();
  const [plan, setPlan] = usePersistentState<IntervalPlan>("interval-plan", DEFAULT_INTERVAL);
  const [run, setRun] = useState<Run>({ status: "idle", startedAt: null, elapsedMs: 0 });
  const now = useNow(run.status === "running", 100);

  const schedule = useMemo(() => buildSchedule(plan), [plan]);
  const cumulative = useMemo(() => schedule.reduce<number[]>((acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + s.seconds * 1000], []), [schedule]);
  const totalMs = cumulative[cumulative.length - 1] ?? 0;

  // Everything below is derived from the clock, so pauses, skips and slow ticks cannot drift it.
  const elapsed = run.status === "running" && run.startedAt !== null && now ? Math.max(0, now - run.startedAt) : run.elapsedMs;
  const done = totalMs > 0 && elapsed >= totalMs;
  let index = cumulative.findIndex((end) => elapsed < end);
  if (index === -1) index = schedule.length - 1;
  const seg = schedule[index];
  const segEnd = cumulative[index] ?? 0;
  const segStart = index > 0 ? cumulative[index - 1] : 0;
  const leftMs = done ? 0 : Math.max(0, segEnd - elapsed);
  const leftSec = Math.ceil(leftMs / 1000);
  const next = schedule[index + 1];
  const kind: SegmentKind = seg?.kind ?? "work";

  // Sound cues: a countdown in the last three seconds, a different tone at each change.
  const lastIndex = useRef(-1);
  const lastTick = useRef(-1);
  useEffect(() => {
    if (run.status !== "running") {
      lastIndex.current = -1;
      lastTick.current = -1;
      return;
    }
    if (prefs.sound === "off" || !seg) return;
    if (done) {
      if (lastIndex.current !== -2) {
        lastIndex.current = -2;
        fireAlert(prefs, "Workout complete", `${describeDuration(totalMs / 1000)} finished.`, 2);
        markToolCompleted();
      }
      return;
    }
    if (index !== lastIndex.current) {
      if (lastIndex.current !== -1) {
        if (seg.kind === "work") playAlarm("beep", 1);
        else playTick(true);
      }
      lastIndex.current = index;
      lastTick.current = -1;
    }
    if (seg.seconds > 4 && leftSec >= 1 && leftSec <= 3 && lastTick.current !== leftSec) {
      lastTick.current = leftSec;
      playTick(false);
    }
  }, [run.status, index, leftSec, done, seg, prefs, totalMs]);

  useWakeLock(run.status === "running" && !done && prefs.awake);
  useDocumentTitle(run.status === "running" && now && !done && seg ? `${formatClock(leftSec)} · ${SEGMENT_LABEL[kind]}` : null);

  const start = () => {
    primeAudio();
    if (done) {
      setRun({ status: "running", startedAt: wallClock(), elapsedMs: 0 });
      return;
    }
    setRun({ status: "running", startedAt: wallClock() - run.elapsedMs, elapsedMs: run.elapsedMs });
  };
  const pause = () => setRun({ status: "paused", startedAt: null, elapsedMs: elapsed });
  const reset = () => {
    stopAlarm();
    setRun({ status: "idle", startedAt: null, elapsedMs: 0 });
  };
  const seek = (toMs: number) => {
    const target = Math.max(0, Math.min(toMs, totalMs));
    setRun(run.status === "running" ? { status: "running", startedAt: wallClock() - target, elapsedMs: target } : { status: run.status, startedAt: null, elapsedMs: target });
  };
  const skip = () => seek(segEnd);
  const back = () => seek(elapsed - segStart > 2000 || index === 0 ? segStart : cumulative[index - 2] ?? 0);

  const change = (patch: Partial<IntervalPlan>) => {
    setPlan({ ...plan, ...patch });
    setRun({ status: "idle", startedAt: null, elapsedMs: 0 });
  };

  const active = INTERVAL_PRESETS.find((p) => JSON.stringify(p.plan) === JSON.stringify(plan))?.id ?? null;
  const workRounds = schedule.filter((s) => s.kind === "work").length;
  const rounds = schedule.filter((s) => s.kind === "work" && cumulative[schedule.indexOf(s)] <= elapsed).length;

  return (
    <div className="space-y-8">
      <div ref={wrap} className={cn("space-y-5", fs.active && "flex min-h-dvh flex-col justify-center bg-background p-6", fs.overlay && "fixed inset-0 z-50 overflow-auto")}>
        <div className={cn("rounded-2xl border px-4 py-8 text-center transition-colors @md:py-12", done ? "bg-success/10" : SURFACE[kind])}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground tabular-nums">{schedule.length ? `${formatClock(Math.ceil((totalMs - Math.min(elapsed, totalMs)) / 1000))} left in total` : ""}</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={fs.active ? "Exit full screen" : "Full screen"} onClick={fs.toggle}>
              {fs.active ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            </Button>
          </div>
          <p className={cn("mt-2 font-semibold tracking-wide text-foreground uppercase", fs.active ? "text-4xl" : "text-2xl")} aria-live="polite">
            {done ? "Complete" : run.status === "idle" ? "Ready" : SEGMENT_LABEL[kind]}
          </p>
          <div className={cn("mt-2 font-semibold tracking-tight tabular-nums text-foreground", fs.active ? "text-[9rem] leading-none" : "text-7xl @md:text-8xl")} role="timer" aria-label={`${SEGMENT_LABEL[kind]}: ${leftSec} seconds left`}>
            {run.status === "idle" && seg ? formatClock(seg.seconds) : formatClock(leftSec)}
          </div>
          <p className="mt-3 text-sm text-muted-foreground tabular-nums">
            {done ? `${workRounds} ${workRounds === 1 ? "round" : "rounds"} done in ${describeDuration(totalMs / 1000)}` : seg && kind !== "prepare" && kind !== "cooldown" ? `Round ${seg.round} of ${plan.rounds}${plan.sets > 1 ? ` · Set ${seg.set} of ${plan.sets}` : ""}` : seg ? `${workRounds} ${workRounds === 1 ? "round" : "rounds"} ahead` : ""}
          </p>
          {!done && next && run.status !== "idle" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Next: {SEGMENT_LABEL[next.kind]} · {describeDuration(next.seconds)}
            </p>
          )}
          <div className="mx-auto mt-5 h-1.5 max-w-md overflow-hidden rounded-full bg-background/70" role="presentation">
            <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${totalMs ? Math.min(100, (elapsed / totalMs) * 100) : 0}%` }} />
          </div>
          <p className="sr-only" aria-live="polite">{rounds > 0 ? `${rounds} rounds complete` : ""}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" size="lg" onClick={back} disabled={run.status === "idle" || done} aria-label="Previous interval">
            <SkipBack aria-hidden="true" />
          </Button>
          {run.status === "running" && !done ? (
            <Button type="button" size="lg" variant="outline" onClick={pause} className="min-w-36">
              <Pause aria-hidden="true" /> Pause
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={start} disabled={!schedule.length} className="min-w-36">
              <Play aria-hidden="true" /> {done ? "Go again" : run.status === "paused" ? "Resume" : "Start"}
            </Button>
          )}
          <Button type="button" variant="outline" size="lg" onClick={skip} disabled={run.status === "idle" || done} aria-label="Next interval">
            <SkipForward aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={reset}>
            <RotateCcw aria-hidden="true" /> Reset
          </Button>
        </div>
      </div>

      <NotificationHint />
      <ToolDivider />

      <ToolSection title="Workout" description={schedule.length ? `${workRounds} work intervals · ${describeDuration(scheduleSeconds(schedule))} in total` : "Add at least one work interval."}>
        <Chips ariaLabel="Workouts" value={active} onChange={(pid) => change(INTERVAL_PRESETS.find((p) => p.id === pid)!.plan)} options={INTERVAL_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        {active && <p className="text-xs text-muted-foreground">{INTERVAL_PRESETS.find((p) => p.id === active)!.detail}</p>}
        <div className="grid gap-4 @md:grid-cols-2 @3xl:grid-cols-4">
          {INPUTS.map((f) => (
            <Field key={f.key} label={f.label} htmlFor={`${id}-${f.key}`} hint={f.hint}>
              <UnitInput id={`${id}-${f.key}`} type="number" min={f.min} max={f.max} unit={f.unit || "×"} value={plan[f.key]} onChange={(e) => change({ [f.key]: Math.max(f.min, Math.min(f.max, Math.floor(Number(e.target.value)) || 0)) } as Partial<IntervalPlan>)} />
            </Field>
          ))}
        </div>
      </ToolSection>

      <ToolSection title="Sound and screen">
        <AlertSettings prefs={prefs} />
        <p className="text-xs text-muted-foreground">Each interval starts with a tone and the last three seconds tick down. Set the sound to Silent to turn the tones off.</p>
      </ToolSection>
    </div>
  );
}
