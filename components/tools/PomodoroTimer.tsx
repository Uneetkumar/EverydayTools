"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Chips, Field, Segmented, TextInput, ToggleRow, ToolDivider, ToolSection, UnitInput } from "@/components/tool/kit";
import { AlertSettings, DismissAlarm, NotificationHint, Ring, fireAlert, useAlertPrefs, useDocumentTitle } from "@/components/tool/timer-kit";
import { Button } from "@/components/ui/button";
import { markToolCompleted } from "@/lib/analytics";
import { primeAudio } from "@/lib/audio/alarm";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
import { useNow } from "@/lib/hooks/useNow";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { DEFAULT_POMODORO, POMODORO_PRESETS, describeDuration, formatClock, pomodoroPhase, wallClock, type PomodoroKind, type PomodoroSettings } from "@/lib/time/timers";
import { cn } from "@/lib/utils";

interface Run {
  index: number;
  status: "idle" | "running" | "paused";
  endAt: number | null;
  remainingMs: number;
}

interface Stats {
  date: string;
  sessions: number;
  minutes: number;
}

type Persisted = PomodoroSettings & { goal: number };

const KIND_LABEL: Record<PomodoroKind, string> = { focus: "Focus", short: "Short break", long: "Long break" };
const today = () => new Date(wallClock()).toLocaleDateString("en-CA");

export default function PomodoroTimer() {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const fs = useFullscreen(wrap);
  const prefs = useAlertPrefs();
  const [settings, setSettings, , restored] = usePersistentState<Persisted>("pomodoro-settings", { ...DEFAULT_POMODORO, goal: 8 });
  const [run, setRun] = usePersistentState<Run>("pomodoro-run", { index: 0, status: "idle", endAt: null, remainingMs: DEFAULT_POMODORO.focusMin * 60_000 });
  const [stats, setStats] = usePersistentState<Stats>("pomodoro-stats", { date: "", sessions: 0, minutes: 0 });
  const [task, setTask] = usePersistentState<string>("pomodoro-task", "");
  const [ringing, setRinging] = useState(false);
  const fired = useRef<Set<string>>(new Set());
  const now = useNow(run.status === "running", 250);

  const phase = pomodoroPhase(run.index, settings);
  const remainingMs = run.status === "running" && run.endAt !== null ? Math.max(0, run.endAt - (now || run.endAt)) : run.remainingMs;
  const secs = Math.ceil(remainingMs / 1000);
  const fraction = phase.seconds > 0 ? remainingMs / (phase.seconds * 1000) : 0;

  const todayStats = stats.date === today() ? stats : { date: today(), sessions: 0, minutes: 0 };

  /** Finish the current phase and move to the next one. */
  const advance = (completed: boolean) => {
    const finished = pomodoroPhase(run.index, settings);
    const nextIndex = run.index + 1;
    const next = pomodoroPhase(nextIndex, settings);
    if (completed && finished.kind === "focus") {
      setStats({ date: today(), sessions: todayStats.sessions + 1, minutes: todayStats.minutes + Math.round(finished.seconds / 60) });
    }
    if (settings.autoStart && completed) setRun({ index: nextIndex, status: "running", endAt: wallClock() + next.seconds * 1000, remainingMs: next.seconds * 1000 });
    else setRun({ index: nextIndex, status: "idle", endAt: null, remainingMs: next.seconds * 1000 });
  };

  // A phase that ended while the page was closed is moved on quietly.
  useEffect(() => {
    if (!restored || run.status !== "running" || run.endAt === null || run.endAt > wallClock()) return;
    fired.current.add(`${run.index}:${run.endAt}`);
    const t = setTimeout(() => advance(true), 0);
    return () => clearTimeout(t);
    // Only on restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

  // The phase just ended: alert once, then move on (deferred, so state is not set inside the effect body).
  useEffect(() => {
    if (!now || run.status !== "running" || run.endAt === null || run.endAt > now) return;
    const key = `${run.index}:${run.endAt}`;
    if (fired.current.has(key)) return;
    fired.current.add(key);
    const finished = pomodoroPhase(run.index, settings);
    const next = pomodoroPhase(run.index + 1, settings);
    fireAlert(prefs, finished.kind === "focus" ? "Focus session complete" : "Break is over", `Next: ${KIND_LABEL[next.kind]} for ${describeDuration(next.seconds)}.`, 2);
    markToolCompleted();
    const t = setTimeout(() => {
      setRinging(true);
      advance(true);
    }, 0);
    return () => clearTimeout(t);
    // advance closes over the current run and settings; the effect reruns when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, run, settings]);

  useWakeLock(run.status === "running" && prefs.awake);
  useDocumentTitle(run.status === "running" && now ? `${formatClock(secs)} · ${KIND_LABEL[phase.kind]}` : null);

  const start = () => {
    primeAudio();
    setRinging(false);
    const base = run.status === "paused" || run.remainingMs > 0 ? run.remainingMs : phase.seconds * 1000;
    setRun({ ...run, status: "running", endAt: wallClock() + base, remainingMs: base });
  };
  const pause = () => setRun({ ...run, status: "paused", endAt: null, remainingMs });
  const reset = () => {
    setRinging(false);
    setRun({ index: 0, status: "idle", endAt: null, remainingMs: pomodoroPhase(0, settings).seconds * 1000 });
  };
  const jump = (kind: PomodoroKind) => {
    const cycles = Math.max(1, settings.cyclesBeforeLong);
    const cycleStart = Math.floor(run.index / (2 * cycles)) * 2 * cycles;
    const session = phase.session;
    const idx = kind === "focus" ? cycleStart + 2 * (session - 1) : kind === "long" ? cycleStart + 2 * cycles - 1 : cycleStart + 2 * (session - 1) + 1;
    setRinging(false);
    setRun({ index: idx, status: "idle", endAt: null, remainingMs: pomodoroPhase(idx, settings).seconds * 1000 });
  };

  const change = (patch: Partial<Persisted>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    // While idle the clock shows the new length straight away.
    if (run.status === "idle") setRun({ ...run, remainingMs: pomodoroPhase(run.index, next).seconds * 1000 });
  };

  const num = (v: string, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number(v) || lo));
  const tone = run.status === "idle" ? "muted" : phase.kind === "focus" ? "primary" : "success";
  const goalDots = Math.min(settings.goal, 16);

  return (
    <div className="space-y-8">
      <div ref={wrap} className={cn("space-y-6", fs.active && "flex min-h-dvh flex-col justify-center bg-background p-6", fs.overlay && "fixed inset-0 z-50 overflow-auto")}>
        <div className="flex items-center justify-between gap-3">
          <Segmented size="sm" ariaLabel="Session type" value={phase.kind} onChange={jump} options={[{ value: "focus", label: "Focus" }, { value: "short", label: "Short break" }, { value: "long", label: "Long break" }]} />
          <Button type="button" variant="ghost" size="icon" aria-label={fs.active ? "Exit full screen" : "Full screen"} onClick={fs.toggle}>
            {fs.active ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </Button>
        </div>

        <Ring fraction={run.status === "idle" ? 1 : fraction} size={fs.active ? 340 : 260} stroke={10} tone={tone}>
          <div className={cn("font-semibold tracking-tight tabular-nums text-foreground", fs.active ? "text-7xl" : "text-6xl")} role="timer" aria-label={`${KIND_LABEL[phase.kind]}: ${describeDuration(secs)} left`}>
            {formatClock(secs)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {KIND_LABEL[phase.kind]} · session {phase.session} of {settings.cyclesBeforeLong}
          </div>
        </Ring>

        <div className="mx-auto max-w-md">
          <label htmlFor={`${id}-task`} className="sr-only">
            What are you working on?
          </label>
          <TextInput id={`${id}-task`} value={task} onChange={(e) => setTask(e.target.value)} placeholder="What are you working on?" maxLength={80} className="text-center" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {ringing && run.status === "idle" ? (
            <>
              <DismissAlarm onDismiss={() => setRinging(false)} label="Stop alarm" />
              <Button type="button" size="lg" onClick={start}>
                <Play aria-hidden="true" /> Start {KIND_LABEL[phase.kind].toLowerCase()}
              </Button>
            </>
          ) : run.status === "running" ? (
            <Button type="button" size="lg" variant="outline" onClick={pause} className="min-w-36">
              <Pause aria-hidden="true" /> Pause
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={start} className="min-w-36">
              <Play aria-hidden="true" /> {run.status === "paused" ? "Resume" : "Start"}
            </Button>
          )}
          <Button type="button" variant="outline" size="lg" onClick={() => { setRinging(false); advance(false); }} aria-label="Skip to the next phase">
            <SkipForward aria-hidden="true" /> Skip
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={reset}>
            <RotateCcw aria-hidden="true" /> Reset
          </Button>
        </div>

        <div className="flex flex-col items-center gap-1.5" aria-label="Today's progress">
          <div className="flex flex-wrap justify-center gap-1.5">
            {Array.from({ length: goalDots }, (_, i) => (
              <span key={i} className={cn("size-3 rounded-full border", i < todayStats.sessions ? "border-primary bg-primary" : "bg-muted")} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            Today: {todayStats.sessions} focus {todayStats.sessions === 1 ? "session" : "sessions"} · {todayStats.minutes} min{settings.goal ? ` · goal ${settings.goal}` : ""}
          </p>
        </div>
      </div>

      <NotificationHint />
      <ToolDivider />

      <ToolSection title="Timing">
        <Chips ariaLabel="Presets" value={POMODORO_PRESETS.find((p) => p.settings.focusMin === settings.focusMin && p.settings.shortBreakMin === settings.shortBreakMin && p.settings.longBreakMin === settings.longBreakMin && p.settings.cyclesBeforeLong === settings.cyclesBeforeLong)?.id ?? null} onChange={(pid) => change({ ...POMODORO_PRESETS.find((p) => p.id === pid)!.settings, goal: settings.goal, autoStart: settings.autoStart })} options={POMODORO_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        <div className="grid gap-4 @md:grid-cols-2 @3xl:grid-cols-4">
          <Field label="Focus" htmlFor={`${id}-f`}>
            <UnitInput id={`${id}-f`} type="number" min={1} max={180} unit="min" value={settings.focusMin} onChange={(e) => change({ focusMin: num(e.target.value, 1, 180) })} />
          </Field>
          <Field label="Short break" htmlFor={`${id}-s`}>
            <UnitInput id={`${id}-s`} type="number" min={1} max={60} unit="min" value={settings.shortBreakMin} onChange={(e) => change({ shortBreakMin: num(e.target.value, 1, 60) })} />
          </Field>
          <Field label="Long break" htmlFor={`${id}-l`}>
            <UnitInput id={`${id}-l`} type="number" min={1} max={90} unit="min" value={settings.longBreakMin} onChange={(e) => change({ longBreakMin: num(e.target.value, 1, 90) })} />
          </Field>
          <Field label="Long break every" htmlFor={`${id}-c`}>
            <UnitInput id={`${id}-c`} type="number" min={1} max={12} unit="sessions" value={settings.cyclesBeforeLong} onChange={(e) => change({ cyclesBeforeLong: num(e.target.value, 1, 12) })} />
          </Field>
        </div>
        <div className="grid gap-4 @md:grid-cols-2">
          <ToggleRow id={`${id}-auto`} label="Start the next phase automatically" description="Breaks and focus sessions follow each other without pressing Start." checked={settings.autoStart} onCheckedChange={(autoStart) => change({ autoStart })} />
          <Field label="Daily goal" htmlFor={`${id}-g`} hint="Focus sessions per day.">
            <UnitInput id={`${id}-g`} type="number" min={0} max={30} unit="sessions" value={settings.goal} onChange={(e) => change({ goal: num(e.target.value, 0, 30) })} />
          </Field>
        </div>
      </ToolSection>

      <ToolSection title="Alerts">
        <AlertSettings prefs={prefs} />
      </ToolSection>
    </div>
  );
}
