"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Chips, Field, Notice, Segmented, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { AlertSettings, DismissAlarm, NotificationHint, Ring, fireAlert, useAlertPrefs, useDocumentTitle } from "@/components/tool/timer-kit";
import { Button } from "@/components/ui/button";
import { markToolCompleted } from "@/lib/analytics";
import { primeAudio } from "@/lib/audio/alarm";
import { useNow } from "@/lib/hooks/useNow";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { describeDuration, diffTo, formatClock, parseDuration, wallClock } from "@/lib/time/timers";
import { cn } from "@/lib/utils";

interface TimerState {
  id: string;
  label: string;
  seconds: number;
  status: "idle" | "running" | "paused";
  /** Wall-clock time the timer ends at, while running. */
  endAt: number | null;
  /** Milliseconds left when idle or paused. */
  remainingMs: number;
}

const PRESETS = [
  { label: "1 min", s: 60 },
  { label: "5 min", s: 300 },
  { label: "10 min", s: 600 },
  { label: "15 min", s: 900 },
  { label: "30 min", s: 1800 },
  { label: "1 hour", s: 3600 },
];

let counter = 0;
const newTimer = (seconds = 300, label = ""): TimerState => ({ id: `t${wallClock().toString(36)}${++counter}`, label, seconds, status: "idle", endAt: null, remainingMs: seconds * 1000 });

function remaining(t: TimerState, now: number): number {
  return t.status === "running" && t.endAt !== null ? Math.max(0, t.endAt - now) : t.remainingMs;
}

function TimerCard({ t, now, ringing, onChange, onRemove, onStart, onAck, only }: { t: TimerState; now: number; ringing: boolean; onChange: (t: TimerState) => void; onRemove: () => void; onStart: () => void; onAck: () => void; only: boolean }) {
  const id = useId();
  const [text, setText] = useState("");
  const ms = remaining(t, now);
  const finished = t.status === "running" && ms === 0;
  const secs = Math.ceil(ms / 1000);
  const fraction = t.seconds > 0 ? ms / (t.seconds * 1000) : 0;
  const editing = t.status === "idle";
  const h = Math.floor(t.seconds / 3600);
  const m = Math.floor((t.seconds % 3600) / 60);
  const s = t.seconds % 60;
  const setDuration = (seconds: number) => {
    const clamped = Math.max(1, Math.min(seconds, 99 * 3600 + 59 * 60 + 59));
    onChange({ ...t, seconds: clamped, remainingMs: clamped * 1000 });
  };
  const num = (v: string, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));

  const typed = text.trim() ? parseDuration(text) : null;

  return (
    <div className={cn("rounded-xl border bg-background p-4 @md:p-5", finished && "border-success/50")}>
      <div className="flex items-center gap-2">
        <TextInput aria-label="Timer label" value={t.label} onChange={(e) => onChange({ ...t, label: e.target.value })} placeholder="Label (optional) — tea, laundry, break…" maxLength={40} className="h-9 border-transparent bg-transparent px-2 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent" />
        {!only && (
          <Button type="button" variant="ghost" size="icon" aria-label="Delete this timer" onClick={onRemove}>
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="mt-3 grid items-center gap-5 @xl:grid-cols-[auto_1fr]">
        <Ring fraction={editing ? 1 : finished ? 0 : fraction} size={200} stroke={9} tone={finished ? "success" : t.status === "paused" ? "warning" : editing ? "muted" : "primary"}>
          <div className={cn("font-semibold tracking-tight tabular-nums text-foreground", secs >= 3600 ? "text-4xl" : "text-5xl")} role="timer" aria-label={`${t.label || "Timer"}: ${describeDuration(secs)} left`}>
            {finished ? "0:00" : formatClock(secs)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{finished ? "Time's up" : t.status === "running" ? "Running" : t.status === "paused" ? "Paused" : `of ${describeDuration(t.seconds)}`}</div>
        </Ring>

        <div className="space-y-4">
          {editing && (
            <>
              <div className="flex flex-wrap items-end gap-2">
                {(
                  [
                    { label: "Hours", value: h, max: 99, set: (v: number) => setDuration(v * 3600 + m * 60 + s) },
                    { label: "Minutes", value: m, max: 59, set: (v: number) => setDuration(h * 3600 + v * 60 + s) },
                    { label: "Seconds", value: s, max: 59, set: (v: number) => setDuration(h * 3600 + m * 60 + v) },
                  ] as const
                ).map((f) => (
                  <Field key={f.label} label={f.label} htmlFor={`${id}-${f.label}`}>
                    <TextInput id={`${id}-${f.label}`} inputMode="numeric" value={String(f.value)} onChange={(e) => f.set(num(e.target.value, f.max))} onFocus={(e) => e.target.select()} className="w-20 text-center text-lg tabular-nums" />
                  </Field>
                ))}
              </div>
              <Chips ariaLabel="Presets" value={PRESETS.find((p) => p.s === t.seconds)?.label ?? null} onChange={(l) => setDuration(PRESETS.find((p) => p.label === l)!.s)} options={PRESETS.map((p) => ({ value: p.label, label: p.label }))} />
              <Field label="Or type a time" htmlFor={`${id}-typed`} hint={typed === null && text.trim() ? "Try 90, 1:30, 25 min or 1h 15m." : typed !== null ? `= ${describeDuration(typed)}` : "Like 90, 1:30, 25 min or 1h 15m."}>
                <TextInput
                  id={`${id}-typed`}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    const v = parseDuration(e.target.value);
                    if (v) setDuration(v);
                  }}
                  placeholder="e.g. 45 min"
                  className="max-w-48"
                />
              </Field>
            </>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {ringing ? (
              <DismissAlarm onDismiss={onAck} />
            ) : t.status === "running" && !finished ? (
              <Button type="button" size="lg" variant="outline" onClick={() => onChange({ ...t, status: "paused", endAt: null, remainingMs: ms })}>
                <Pause aria-hidden="true" /> Pause
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  primeAudio();
                  onStart();
                }}
                disabled={t.seconds < 1 && t.status === "idle"}
              >
                <Play aria-hidden="true" /> {t.status === "paused" ? "Resume" : finished ? "Start again" : "Start"}
              </Button>
            )}
            {t.status === "running" && !finished && (
              <Button type="button" variant="outline" size="lg" onClick={() => onChange({ ...t, endAt: (t.endAt ?? now) + 60_000 })}>
                <Plus aria-hidden="true" /> 1 min
              </Button>
            )}
            {(t.status !== "idle" || finished) && (
              <Button type="button" variant="ghost" size="lg" onClick={() => { onAck(); onChange({ ...t, status: "idle", endAt: null, remainingMs: t.seconds * 1000 }); }}>
                <RotateCcw aria-hidden="true" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="assertive">{ringing ? `${t.label || "Timer"} is finished` : ""}</span>
    </div>
  );
}

function DateCountdown() {
  const id = useId();
  const nextYear = new Date().getFullYear() + 1;
  const [name, setName] = usePersistentState<string>("date-countdown-name", "");
  const [target, setTarget] = usePersistentState<string>("date-countdown-target", `${nextYear}-01-01T00:00`);
  const now = useNow(true, 500);

  const targetMs = useMemo(() => {
    const ms = Date.parse(target);
    return Number.isNaN(ms) ? null : ms;
  }, [target]);
  const diff = targetMs !== null && now ? diffTo(targetMs, now) : null;

  const preset = (month: number, day: number, label: string) => {
    const d = new Date();
    let y = d.getFullYear();
    if (new Date(y, month - 1, day, 23, 59, 59).getTime() < wallClock()) y++;
    const pad = (n: number) => String(n).padStart(2, "0");
    setTarget(`${y}-${pad(month)}-${pad(day)}T00:00`);
    setName(label);
  };

  const cells: [string, number][] = diff ? [["Days", diff.days], ["Hours", diff.hours], ["Minutes", diff.minutes], ["Seconds", diff.seconds]] : [["Days", 0], ["Hours", 0], ["Minutes", 0], ["Seconds", 0]];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {name || "Your event"} {diff?.past ? "was" : "is in"}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 @md:gap-4" role="timer" aria-label={diff ? `${diff.days} days ${diff.hours} hours ${diff.minutes} minutes ${diff.seconds} seconds ${diff.past ? "ago" : "remaining"}` : "Pick a date"}>
          {cells.map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-background px-1 py-4 @md:py-6">
              <div className="text-3xl font-semibold tabular-nums text-foreground @md:text-5xl">{String(value).padStart(2, "0")}</div>
              <div className="mt-1 text-xs text-muted-foreground @md:text-sm">{label}</div>
            </div>
          ))}
        </div>
        {diff?.past && <p className="mt-3 text-sm text-muted-foreground">ago. The date has passed. Pick a new one below.</p>}
        {diff && !diff.past && <p className="mt-3 text-sm text-muted-foreground tabular-nums">That is {Math.floor(diff.totalSeconds / 3600).toLocaleString()} hours, or {Math.floor(diff.totalSeconds / 60).toLocaleString()} minutes, from now.</p>}
      </div>
      <ToolDivider />
      <ToolSection title="Choose the date">
        <div className="grid gap-4 @md:grid-cols-2">
          <Field label="Event name" htmlFor={`${id}-name`}>
            <TextInput id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Holiday, exam, launch…" maxLength={60} />
          </Field>
          <Field label="Date and time" htmlFor={`${id}-when`} hint="In your local time zone.">
            <input id={`${id}-when`} type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Next</span>
          {[
            ["New Year", 1, 1],
            ["Republic Day", 1, 26],
            ["Valentine's Day", 2, 14],
            ["Independence Day", 8, 15],
            ["Halloween", 10, 31],
            ["Christmas", 12, 25],
          ].map(([label, m, d]) => (
            <button key={String(label)} type="button" onClick={() => preset(m as number, d as number, String(label))} className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {label}
            </button>
          ))}
        </div>
        {targetMs === null && <Notice tone="warning">Enter a valid date and time.</Notice>}
      </ToolSection>
    </div>
  );
}

export default function CountdownTimer() {
  const [mode, setMode] = useState<"timer" | "date">("timer");
  const [timers, setTimers, , restored] = usePersistentState<TimerState[]>("countdown-timers", [newTimer(300)]);
  const [acked, setAcked] = useState<string[]>([]);
  const prefs = useAlertPrefs();
  const anyRunning = timers.some((t) => t.status === "running");
  const now = useNow(anyRunning, 250);
  const fired = useRef<Set<string>>(new Set());

  // Timers that ended while the page was closed come back finished; they are not announced again.
  useEffect(() => {
    if (!restored) return;
    for (const t of timers) if (t.status === "running" && t.endAt !== null && t.endAt <= wallClock()) fired.current.add(`${t.id}:${t.endAt}`);
    // Only on restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

  // Ring the alarm exactly once per finished run.
  useEffect(() => {
    if (!now) return;
    for (const t of timers) {
      if (t.status !== "running" || t.endAt === null || t.endAt > now) continue;
      const key = `${t.id}:${t.endAt}`;
      if (fired.current.has(key)) continue;
      fired.current.add(key);
      fireAlert(prefs, t.label ? `${t.label}: time's up` : "Time's up", `Your ${describeDuration(t.seconds)} timer has finished.`);
      markToolCompleted();
    }
  }, [now, timers, prefs]);

  useWakeLock(anyRunning && prefs.awake);

  const soonest = timers
    .filter((t) => t.status === "running" && t.endAt !== null)
    .map((t) => ({ t, ms: Math.max(0, (t.endAt as number) - now) }))
    .sort((a, b) => a.ms - b.ms)[0];
  useDocumentTitle(soonest && now ? `${formatClock(Math.ceil(soonest.ms / 1000))} · ${soonest.t.label || "Timer"}` : null);

  const update = (t: TimerState) => setTimers(timers.map((x) => (x.id === t.id ? t : x)));
  const isRinging = (t: TimerState) => t.status === "running" && t.endAt !== null && now > 0 && t.endAt <= now && !acked.includes(`${t.id}:${t.endAt}`);

  const start = (t: TimerState) => {
    const base = t.status === "paused" ? t.remainingMs : t.status === "running" ? t.seconds * 1000 : t.remainingMs > 0 ? t.remainingMs : t.seconds * 1000;
    update({ ...t, status: "running", endAt: wallClock() + base, remainingMs: base });
  };

  return (
    <div className="space-y-8">
      <Segmented ariaLabel="Timer type" value={mode} onChange={setMode} options={[{ value: "timer", label: "Countdown timer" }, { value: "date", label: "Count down to a date" }]} />

      {mode === "timer" ? (
        <>
          <div className="space-y-4">
            {timers.map((t) => (
              <TimerCard
                key={t.id}
                t={t}
                now={now || wallClock()}
                ringing={isRinging(t)}
                only={timers.length === 1}
                onChange={update}
                onRemove={() => setTimers(timers.filter((x) => x.id !== t.id))}
                onStart={() => start(t)}
                onAck={() => t.endAt !== null && setAcked((a) => [...a, `${t.id}:${t.endAt}`])}
              />
            ))}
            {timers.length < 6 && (
              <Button type="button" variant="outline" onClick={() => setTimers([...timers, newTimer(600)])}>
                <Plus aria-hidden="true" /> Add another timer
              </Button>
            )}
          </div>
          <NotificationHint />
          <ToolSection title="Alerts" description="Used by every timer on this page.">
            <AlertSettings prefs={prefs} />
          </ToolSection>
        </>
      ) : (
        <DateCountdown />
      )}
    </div>
  );
}
