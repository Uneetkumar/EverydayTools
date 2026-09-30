/**
 * Pure logic for the countdown, Pomodoro and interval timers: parsing and
 * formatting durations, and the schedules the two multi-phase timers follow.
 * Timing itself is always computed from wall-clock timestamps elsewhere, never
 * by counting ticks, so a throttled background tab cannot drift the clock.
 */

/** The current time in ms. A named function so event handlers can read the clock without the render-purity lint mistaking them for render code. */
export function wallClock(): number {
  return Date.now();
}

/** 3725 → "1:02:05"; 65 → "01:05". Hours appear only when needed (or forced). */
export function formatClock(totalSeconds: number, opts: { hours?: boolean } = {}): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 || opts.hours ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "1 hr 5 min", "45 sec" — for summaries, not the big display. */
export function describeDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hr`);
  if (m) parts.push(`${m} min`);
  if (sec || !parts.length) parts.push(`${sec} sec`);
  return parts.join(" ");
}

/**
 * Reads what people type into a duration box: `90` (seconds), `1:30`
 * (minutes:seconds), `1:30:00`, `1h 30m`, `45s`, `2 hours`, `1.5h`, `90 min`.
 * Returns seconds, or null when it can't be understood.
 */
export function parseDuration(input: string): number | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);
  // "1h30" and "5m30": the last number takes the next smaller unit.
  const shorthand = /^(\d+)\s*(h|m)\s*(\d+)$/.exec(t);
  if (shorthand) return shorthand[2] === "h" ? Number(shorthand[1]) * 3600 + Number(shorthand[3]) * 60 : Number(shorthand[1]) * 60 + Number(shorthand[3]);
  const colon = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(t);
  if (colon) {
    const a = Number(colon[1]);
    const b = Number(colon[2]);
    const c = colon[3] === undefined ? null : Number(colon[3]);
    return c === null ? a * 60 + b : a * 3600 + b * 60 + c;
  }
  const re = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g;
  let total = 0;
  let matched = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const n = Number(m[1]);
    const u = m[2][0];
    total += u === "h" ? n * 3600 : u === "m" ? n * 60 : n;
    matched += m[0].length;
  }
  return matched > 0 && t.replace(re, "").replace(/[\s,and]+/g, "") === "" ? Math.round(total) : null;
}

/* ---------------------------------------------------------------- Pomodoro */

export interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  /** Focus sessions before a long break. */
  cyclesBeforeLong: number;
  autoStart: boolean;
}

export const DEFAULT_POMODORO: PomodoroSettings = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, cyclesBeforeLong: 4, autoStart: false };

export type PomodoroKind = "focus" | "short" | "long";

export interface PomodoroPhase {
  kind: PomodoroKind;
  seconds: number;
  /** 1-based number of the focus session this phase belongs to, within the current set. */
  session: number;
  /** Focus sessions completed before this phase. */
  completedFocus: number;
}

/**
 * Phase `index` in the repeating sequence: focus, short break, focus, short
 * break … and a long break in place of the short one after every
 * `cyclesBeforeLong`th focus session.
 */
export function pomodoroPhase(index: number, s: PomodoroSettings): PomodoroPhase {
  const cycles = Math.max(1, s.cyclesBeforeLong);
  const focusNumber = Math.floor(index / 2) + 1;
  if (index % 2 === 0) return { kind: "focus", seconds: Math.round(s.focusMin * 60), session: ((focusNumber - 1) % cycles) + 1, completedFocus: focusNumber - 1 };
  const isLong = focusNumber % cycles === 0;
  return { kind: isLong ? "long" : "short", seconds: Math.round((isLong ? s.longBreakMin : s.shortBreakMin) * 60), session: ((focusNumber - 1) % cycles) + 1, completedFocus: focusNumber };
}

export const POMODORO_PRESETS: { id: string; label: string; settings: PomodoroSettings }[] = [
  { id: "classic", label: "Classic 25 / 5", settings: { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, cyclesBeforeLong: 4, autoStart: false } },
  { id: "long", label: "Deep work 50 / 10", settings: { focusMin: 50, shortBreakMin: 10, longBreakMin: 30, cyclesBeforeLong: 3, autoStart: false } },
  { id: "short", label: "Short 15 / 3", settings: { focusMin: 15, shortBreakMin: 3, longBreakMin: 10, cyclesBeforeLong: 4, autoStart: false } },
  { id: "ultradian", label: "90 / 20 rhythm", settings: { focusMin: 90, shortBreakMin: 20, longBreakMin: 30, cyclesBeforeLong: 2, autoStart: false } },
];

/* ---------------------------------------------------------------- Interval */

export interface IntervalPlan {
  prepareSec: number;
  workSec: number;
  restSec: number;
  rounds: number;
  sets: number;
  restBetweenSetsSec: number;
  cooldownSec: number;
}

export type SegmentKind = "prepare" | "work" | "rest" | "setrest" | "cooldown";

export interface Segment {
  kind: SegmentKind;
  seconds: number;
  round: number;
  set: number;
}

export const DEFAULT_INTERVAL: IntervalPlan = { prepareSec: 10, workSec: 20, restSec: 10, rounds: 8, sets: 1, restBetweenSetsSec: 60, cooldownSec: 0 };

export const INTERVAL_PRESETS: { id: string; label: string; detail: string; plan: IntervalPlan }[] = [
  { id: "tabata", label: "Tabata", detail: "20 s on, 10 s off × 8", plan: { prepareSec: 10, workSec: 20, restSec: 10, rounds: 8, sets: 1, restBetweenSetsSec: 60, cooldownSec: 0 } },
  { id: "hiit", label: "HIIT 30/30", detail: "30 s on, 30 s off × 10", plan: { prepareSec: 10, workSec: 30, restSec: 30, rounds: 10, sets: 1, restBetweenSetsSec: 60, cooldownSec: 0 } },
  { id: "emom", label: "EMOM 10", detail: "Every minute on the minute × 10", plan: { prepareSec: 10, workSec: 60, restSec: 0, rounds: 10, sets: 1, restBetweenSetsSec: 0, cooldownSec: 0 } },
  { id: "boxing", label: "Boxing 3 min", detail: "3 min round, 1 min rest × 12", plan: { prepareSec: 10, workSec: 180, restSec: 60, rounds: 12, sets: 1, restBetweenSetsSec: 0, cooldownSec: 0 } },
  { id: "circuit", label: "Circuit", detail: "45 s on, 15 s off × 6, 3 sets", plan: { prepareSec: 10, workSec: 45, restSec: 15, rounds: 6, sets: 3, restBetweenSetsSec: 90, cooldownSec: 0 } },
];

/** Every segment of the workout in order. A zero-length rest is skipped, and the last rest of a set is replaced by the set break. */
export function buildSchedule(p: IntervalPlan): Segment[] {
  const out: Segment[] = [];
  if (p.prepareSec > 0) out.push({ kind: "prepare", seconds: p.prepareSec, round: 0, set: 1 });
  for (let set = 1; set <= p.sets; set++) {
    for (let round = 1; round <= p.rounds; round++) {
      out.push({ kind: "work", seconds: p.workSec, round, set });
      const lastRound = round === p.rounds;
      const lastSet = set === p.sets;
      if (!lastRound && p.restSec > 0) out.push({ kind: "rest", seconds: p.restSec, round, set });
      else if (lastRound && !lastSet && p.restBetweenSetsSec > 0) out.push({ kind: "setrest", seconds: p.restBetweenSetsSec, round, set });
    }
  }
  if (p.cooldownSec > 0) out.push({ kind: "cooldown", seconds: p.cooldownSec, round: p.rounds, set: p.sets });
  return out.filter((s) => s.seconds > 0);
}

export function scheduleSeconds(segments: Segment[]): number {
  return segments.reduce((n, s) => n + s.seconds, 0);
}

export const SEGMENT_LABEL: Record<SegmentKind, string> = {
  prepare: "Get ready",
  work: "Work",
  rest: "Rest",
  setrest: "Set break",
  cooldown: "Cool down",
};

/* --------------------------------------------------------------- countdown */

export interface TargetDiff {
  past: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/** Time from `now` to `target` (or since it, when past), broken into days, hours, minutes, seconds. */
export function diffTo(targetMs: number, nowMs: number): TargetDiff {
  const diff = targetMs - nowMs;
  const past = diff < 0;
  const total = Math.floor(Math.abs(diff) / 1000);
  return {
    past,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalSeconds: total,
  };
}
