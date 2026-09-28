import { useSyncExternalStore } from "react";

/**
 * Calendar dates ("YYYY-MM-DD", as <input type="date"> gives them) handled as
 * local calendar days.
 *
 * `new Date("2026-09-05")` is parsed as midnight UTC. Reading it back with
 * getDay()/getDate() uses local time, so anywhere west of UTC it becomes the
 * previous day — a Saturday turns into a Friday, and ages and date
 * differences come out a day off. Every date tool goes through these helpers
 * instead.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Local midnight for a "YYYY-MM-DD" string, or null if it is not a real date. */
export function parseISODate(value: string): Date | null {
  const m = ISO_DATE.exec(value?.trim() ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(y, mo, d);
  // Rejects 2026-02-30 rather than silently rolling it into March.
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return date;
}

/** "YYYY-MM-DD" for a date's local calendar day. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Whole calendar days from `a` to `b` (negative if b is earlier). Counted on
 * the calendar, so a daylight-saving change in between cannot make it 23 or
 * 25 hours short of a day.
 */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Add calendar months, clamping to the end of the month: 31 January + 1
 * month is 28/29 February, not 3 March as Date#setMonth would give.
 */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

const noop = () => () => {};

/**
 * Today's local date as "YYYY-MM-DD", or "" during server rendering and
 * hydration. Pages are prerendered at build time, so computing "today"
 * during render would bake the build date into the HTML.
 */
export function useTodayISO(): string {
  return useSyncExternalStore(noop, () => toISODate(new Date()), () => "");
}
