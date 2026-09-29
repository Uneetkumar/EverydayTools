/**
 * Unix timestamps and dates: reading either, in any unit or time zone.
 *
 * Timestamps come in seconds (Unix, most APIs), milliseconds (JavaScript,
 * Java), microseconds (Python, PostgreSQL) and nanoseconds (Go, logs); the
 * unit is guessed from the number of digits unless chosen.
 */

export type Unit = "s" | "ms" | "us" | "ns";

export const UNITS: { value: Unit; label: string; per: number }[] = [
  { value: "s", label: "Seconds", per: 1 },
  { value: "ms", label: "Milliseconds", per: 1e3 },
  { value: "us", label: "Microseconds", per: 1e6 },
  { value: "ns", label: "Nanoseconds", per: 1e9 },
];

/** Magnitudes: seconds reach 1e11 only after the year 5000; later units are 1000× each. */
export function detectUnit(n: number): Unit {
  const a = Math.abs(n);
  if (a < 1e11) return "s";
  if (a < 1e14) return "ms";
  if (a < 1e17) return "us";
  return "ns";
}

export interface Instant {
  /** Milliseconds since 1970-01-01T00:00:00Z, possibly fractional. */
  ms: number;
  /** How the input was read. */
  from: "epoch" | "date";
  unit?: Unit;
  /** Exact nanoseconds as digits, when a non-negative number was typed (floats can't hold 19 digits). */
  ns?: string;
}

const EXP: Record<Unit, number> = { s: 9, ms: 6, us: 3, ns: 0 };

/** "1790000000.5" × 10^exp as whole digits, without floating-point rounding. */
function shiftDigits(text: string, exp: number): string {
  const [int, frac = ""] = text.replace(/^\+/, "").split(".");
  return `${int}${frac.padEnd(exp, "0").slice(0, exp)}`.replace(/^0+(?=\d)/, "");
}

const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/;

/** The offset of a time zone from UTC at an instant, in minutes (IST is +330). */
export function zoneOffset(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** A wall-clock time in a time zone to the instant it names (DST gaps move forward, like browsers do). */
export function wallToInstant(y: number, mo: number, d: number, h: number, mi: number, s: number, frac: number, timeZone: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s) + frac;
  let ms = guess - zoneOffset(guess, timeZone) * 60000;
  // Once more with the offset at the corrected time, for days when clocks change.
  ms = guess - zoneOffset(ms, timeZone) * 60000;
  return ms;
}

/**
 * Reads a timestamp (any unit, negative for before 1970, decimals allowed)
 * or a date: ISO 8601, RFC 2822 and HTTP dates, or a plain
 * "2026-09-29 14:30" read in `zone`.
 */
export function parseInstant(input: string, unit: Unit | "auto", zone: string): Instant | { error: string } | null {
  const t = input.trim();
  if (!t) return null;
  if (/^[+-]?\d+(\.\d+)?$/.test(t)) {
    const n = Number(t);
    const u = unit === "auto" ? detectUnit(n) : unit;
    const ms = n / (UNITS.find((x) => x.value === u)!.per / 1000);
    if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return { error: "That's outside the range a date can hold (about 270,000 years either side of 1970)." };
    return { ms, from: "epoch", unit: u, ns: t.startsWith("-") ? undefined : shiftDigits(t, EXP[u]) };
  }
  const naive = NAIVE.exec(t);
  if (naive) {
    const [, y, mo, d, h = "0", mi = "0", s = "0", frac = ""] = naive;
    const ms = wallToInstant(+y, +mo, +d, +h, +mi, +s, frac ? Number(`0.${frac}`) * 1000 : 0, zone);
    if (Number.isNaN(ms) || +mo < 1 || +mo > 12 || +d < 1 || +d > 31) return { error: "That date doesn't exist." };
    return { ms, from: "date" };
  }
  const parsed = Date.parse(t.replace(/^(\d{4}-\d{2}-\d{2}) (\d)/, "$1T$2"));
  if (Number.isNaN(parsed)) {
    return { error: "Couldn't read that. Try a number like 1790000000, or a date like 2026-09-29T14:30:00Z." };
  }
  return { ms: parsed, from: "date" };
}

const pad = (n: number, w = 2) => String(Math.abs(Math.trunc(n))).padStart(w, "0");

export function offsetText(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  return `${sign}${pad(Math.abs(minutes) / 60)}:${pad(Math.abs(minutes) % 60)}`;
}

/** ISO 8601 with the zone's offset, e.g. 2026-09-29T20:00:00+05:30. */
export function isoInZone(ms: number, timeZone: string): string {
  const off = zoneOffset(ms, timeZone);
  const d = new Date(Math.floor(ms) + off * 60000);
  const frac = Math.floor(ms) % 1000 ? `.${pad(((Math.floor(ms) % 1000) + 1000) % 1000, 3)}` : "";
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${frac}${off === 0 && timeZone === "UTC" ? "Z" : offsetText(off)}`;
}

/** "Tue, 29 Sep 2026 14:30:00 +0000" — RFC 2822, as email and RSS use. */
export function rfc2822(ms: number): string {
  return new Date(ms).toUTCString().replace("GMT", "+0000");
}

export function sqlUtc(ms: number): string {
  return new Date(Math.floor(ms)).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

/** ISO 8601 week number and its year (weeks start on Monday; week 1 holds the first Thursday). */
export function isoWeek(ms: number): { year: number; week: number } {
  const d = new Date(Math.floor(ms));
  const day = (d.getUTCDay() + 6) % 7;
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart) / 86400000 + 1) / 7);
  return { year: thursday.getUTCFullYear(), week };
}

export function dayOfYear(ms: number): number {
  const d = new Date(Math.floor(ms));
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1;
}

/**
 * Whole-number timestamps in each unit, written out without exponent
 * notation. With `exactNs` the digits are sliced from it exactly; otherwise
 * precision below a microsecond is dropped.
 */
export function epochs(ms: number, exactNs?: string): Record<Unit, string> {
  if (exactNs && /^\d+$/.test(exactNs)) {
    const cut = (n: number) => exactNs.slice(0, -n).replace(/^0+(?=\d)/, "") || "0";
    return { s: cut(9), ms: cut(6), us: cut(3), ns: exactNs };
  }
  const secs = Math.floor(ms / 1000);
  const msInt = Math.floor(ms);
  const subMs = Math.round((ms - msInt) * 1e3) * 1000; // within the millisecond, to the microsecond
  return {
    s: String(secs),
    ms: String(msInt),
    us: `${msInt}${pad(Math.floor(subMs / 1000), 3)}`.replace(/^(-?)0+(?=\d)/, "$1"),
    ns: `${msInt}${pad(subMs, 6)}`.replace(/^(-?)0+(?=\d)/, "$1"),
  };
}

/** When 32-bit signed seconds run out: 2038-01-19T03:14:07Z. */
export const Y2038_SECONDS = 2147483647;

export function timeZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
    if (list?.length) return list.includes("UTC") ? list : ["UTC", ...list];
  } catch {
    /* older browsers */
  }
  return [
    "UTC", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Europe/London",
    "Europe/Berlin", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  ];
}
