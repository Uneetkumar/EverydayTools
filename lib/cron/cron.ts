/**
 * Cron expressions: reading them, describing them in plain English and
 * working out when they next run.
 *
 * Four dialects are understood, because the same text means different things
 * in each:
 *   standard  minute hour day month weekday          Linux crontab, GitHub
 *             Actions, Kubernetes. Weekday 0–7, Sunday is 0 or 7. When both
 *             day fields are restricted the job runs when EITHER matches.
 *   seconds   second minute hour day month weekday   Spring, node-cron.
 *             Weekday numbered as in standard; both day fields must match.
 *   quartz    second minute hour day month weekday [year]   Quartz.
 *             Weekday 1–7 with Sunday = 1; one day field must be "?".
 *   aws       minute hour day month weekday year     AWS EventBridge.
 *             Weekday 1–7 with Sunday = 1; one day field must be "?".
 *
 * Special characters L, W and # (last day, nearest weekday, nth weekday) are
 * read in every dialect, with a warning where the scheduler would reject them.
 */

export type Flavour = "standard" | "seconds" | "quartz" | "aws";
export type FieldKey = "second" | "minute" | "hour" | "dom" | "month" | "dow" | "year";

export const FLAVOURS: { value: Flavour; label: string; fields: string; note: string }[] = [
  { value: "standard", label: "Standard", fields: "5 fields", note: "Linux crontab, GitHub Actions, Kubernetes, Vercel and most cloud schedulers." },
  { value: "seconds", label: "With seconds", fields: "6 fields", note: "Seconds first, as in Spring and node-cron. Sunday is 0 or 7." },
  { value: "quartz", label: "Quartz", fields: "6 or 7 fields", note: "Seconds first and an optional year. Sunday is 1, and one day field must be ?." },
  { value: "aws", label: "AWS EventBridge", fields: "6 fields", note: "Year last. Sunday is 1, and one day field must be ?. Times are UTC." },
];

interface Spec {
  key: FieldKey;
  label: string;
  min: number;
  max: number;
}

const SPECS: Record<FieldKey, Spec> = {
  second: { key: "second", label: "Second", min: 0, max: 59 },
  minute: { key: "minute", label: "Minute", min: 0, max: 59 },
  hour: { key: "hour", label: "Hour", min: 0, max: 23 },
  dom: { key: "dom", label: "Day of month", min: 1, max: 31 },
  month: { key: "month", label: "Month", min: 1, max: 12 },
  dow: { key: "dow", label: "Day of week", min: 0, max: 7 },
  year: { key: "year", label: "Year", min: 1970, max: 2199 },
};

export function fieldOrder(flavour: Flavour, count: number): FieldKey[] {
  switch (flavour) {
    case "standard":
      return ["minute", "hour", "dom", "month", "dow"];
    case "seconds":
      return ["second", "minute", "hour", "dom", "month", "dow"];
    case "quartz":
      return count === 7
        ? ["second", "minute", "hour", "dom", "month", "dow", "year"]
        : ["second", "minute", "hour", "dom", "month", "dow"];
    case "aws":
      return ["minute", "hour", "dom", "month", "dow", "year"];
  }
}

/** Range text shown under each field, in the dialect's own numbering. */
export function fieldRange(key: FieldKey, flavour: Flavour): string {
  if (key === "dow") return flavour === "quartz" || flavour === "aws" ? "1–7 or SUN–SAT" : "0–7 or SUN–SAT";
  if (key === "month") return "1–12 or JAN–DEC";
  const s = SPECS[key];
  return `${s.min}–${s.max}`;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

type DomSpecial =
  | { type: "last"; offset: number }
  | { type: "lastWeekday" }
  | { type: "nearestWeekday"; day: number };
type DowSpecial = { type: "nth"; dow: number; n: number } | { type: "lastOf"; dow: number };

export interface Field {
  key: FieldKey;
  text: string;
  /** Matching values, sorted. Weekdays are 0–6 with Sunday = 0 in every dialect. */
  values: number[];
  /** Written as "*" or "?" (or starting with "*"), which decides how the two day fields combine. */
  star: boolean;
  /** Written as "?". */
  none: boolean;
  domSpecials: DomSpecial[];
  dowSpecials: DowSpecial[];
  error?: string;
}

export interface Cron {
  flavour: Flavour;
  /** What was typed, trimmed. */
  source: string;
  /** The five-field expansion when a macro such as @daily was used. */
  macro?: { name: string; expands: string };
  reboot?: boolean;
  fields: Field[];
  byKey: Partial<Record<FieldKey, Field>>;
  /** Problems that stop the expression from working. */
  errors: string[];
  /** Things that work but are easy to get wrong. */
  warnings: string[];
  /** "either" when classic cron runs on days matching either day field. */
  dayRule: "either" | "both";
}

const ORD_WORDS = ["", "first", "second", "third", "fourth", "fifth"];

export function ordinal(n: number): string {
  const s = n % 100;
  if (s >= 11 && s <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export function joinList(items: string[], conj = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conj} ${items[items.length - 1]}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 24-hour clock time, with seconds only when they matter. */
export function clock(h: number, m: number, s?: number): string {
  return s === undefined ? `${pad2(h)}:${pad2(m)}` : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// ── Parsing ────────────────────────────────────────────────────────────────

/** Weekday numbering: standard counts Sunday as 0 (or 7); Quartz and AWS count it as 1. */
function sundayIsOne(flavour: Flavour) {
  return flavour === "quartz" || flavour === "aws";
}

function readNumber(token: string, key: FieldKey, flavour: Flavour): number | string {
  const t = token.toUpperCase();
  if (/^\d+$/.test(t)) return Number(t);
  if (key === "month") {
    const i = MONTH_ABBR.indexOf(t);
    if (i >= 0) return i + 1;
    return `“${token}” isn't a month. Use 1–12 or JAN–DEC.`;
  }
  if (key === "dow") {
    const i = DAY_ABBR.indexOf(t);
    if (i >= 0) return sundayIsOne(flavour) ? i + 1 : i;
    return `“${token}” isn't a day. Use ${sundayIsOne(flavour) ? "1–7" : "0–7"} or SUN–SAT.`;
  }
  return `“${token}” isn't a number.`;
}

function bounds(key: FieldKey, flavour: Flavour): [number, number] {
  if (key === "dow") return sundayIsOne(flavour) ? [1, 7] : [0, 7];
  return [SPECS[key].min, SPECS[key].max];
}

/** Brings a weekday in the dialect's numbering to 0–6, Sunday = 0. */
function normDow(v: number, flavour: Flavour): number {
  return sundayIsOne(flavour) ? v - 1 : v % 7;
}

function parseField(text: string, key: FieldKey, flavour: Flavour, warnings: string[]): Field {
  const label = SPECS[key].label.toLowerCase();
  const field: Field = { key, text, values: [], star: text.startsWith("*") || text === "?", none: text === "?", domSpecials: [], dowSpecials: [] };
  const fail = (msg: string): Field => ({ ...field, error: msg });
  const [lo, hi] = bounds(key, flavour);
  // A "*" weekday covers the seven days once, not Sunday twice.
  const starHi = key === "dow" && !sundayIsOne(flavour) ? 6 : hi;
  const values = new Set<number>();

  if (text === "?") {
    if (key !== "dom" && key !== "dow") return fail(`? can only be used for the day of month or day of week.`);
    for (let v = lo; v <= starHi; v++) values.add(v);
  } else {
    for (const item of text.split(",")) {
      if (!item) return fail(`There's an empty item in the ${label} list.`);
      const up = item.toUpperCase();

      if (key === "dom") {
        if (up === "L") { field.domSpecials.push({ type: "last", offset: 0 }); continue; }
        if (up === "LW") { field.domSpecials.push({ type: "lastWeekday" }); continue; }
        const lOff = /^L-(\d+)$/.exec(up);
        if (lOff) {
          const n = Number(lOff[1]);
          if (n > 30) return fail(`L-${n} goes back further than a month.`);
          field.domSpecials.push({ type: "last", offset: n });
          continue;
        }
        const w = /^(\d+)W$/.exec(up);
        if (w) {
          const n = Number(w[1]);
          if (n < 1 || n > 31) return fail(`${n}W: the day must be 1–31.`);
          field.domSpecials.push({ type: "nearestWeekday", day: n });
          continue;
        }
      }
      if (key === "dow") {
        const nth = /^([A-Z]{3}|\d)#(\d)$/.exec(up);
        if (nth) {
          const d = readNumber(nth[1], key, flavour);
          if (typeof d === "string") return fail(d);
          if (d < lo || d > hi) return fail(`Day ${d} is out of range (${lo}–${hi}).`);
          const n = Number(nth[2]);
          if (n < 1 || n > 5) return fail(`${item}: a month has at most five of each weekday.`);
          field.dowSpecials.push({ type: "nth", dow: normDow(d, flavour), n });
          continue;
        }
        if (up === "L") {
          // Quartz: L on its own in the weekday field is Saturday.
          values.add(sundayIsOne(flavour) ? 7 : 6);
          continue;
        }
        const last = /^([A-Z]{3}|\d)L$/.exec(up);
        if (last) {
          const d = readNumber(last[1], key, flavour);
          if (typeof d === "string") return fail(d);
          if (d < lo || d > hi) return fail(`Day ${d} is out of range (${lo}–${hi}).`);
          field.dowSpecials.push({ type: "lastOf", dow: normDow(d, flavour) });
          continue;
        }
      }

      const m = /^([^/]+)(?:\/(.*))?$/.exec(item);
      if (!m) return fail(`“${item}” can't be read.`);
      const [, base, stepText] = m;
      let step = 1;
      if (stepText !== undefined) {
        if (!/^\d+$/.test(stepText)) return fail(`The step after / must be a whole number, not “${stepText}”.`);
        step = Number(stepText);
        if (step < 1) return fail(`A step of 0 never moves on. Use 1 or more.`);
      }

      let from: number;
      let to: number;
      if (base === "*") {
        from = lo;
        to = starHi;
      } else {
        const r = /^([^-]+)(?:-(.+))?$/.exec(base);
        if (!r) return fail(`“${base}” can't be read.`);
        const a = readNumber(r[1], key, flavour);
        if (typeof a === "string") return fail(a);
        from = a;
        if (r[2] !== undefined) {
          const b = readNumber(r[2], key, flavour);
          if (typeof b === "string") return fail(b);
          to = b;
        } else {
          // "5/15" means from 5 to the end, every 15.
          to = stepText !== undefined ? hi : a;
        }
      }
      for (const v of [from, to]) {
        if (v < lo || v > hi) return fail(`${SPECS[key].label} ${v} is out of range. Use ${lo}–${hi}.`);
      }
      if (from > to) {
        // Quartz wraps a backwards range around (22-2 is 22, 23, 0, 1, 2).
        if (flavour !== "quartz") {
          return fail(`${base} runs backwards. Write it as two parts, for example ${from}-${hi},${lo}-${to}.`);
        }
        for (let v = from; v <= hi; v += step) values.add(v);
        for (let v = lo; v <= to; v += step) values.add(v);
        continue;
      }
      if (step > to - from && stepText !== undefined && to > from) {
        warnings.push(`In the ${label} field, a step of ${step} is longer than the range, so only ${from} is used.`);
      }
      for (let v = from; v <= to; v += step) values.add(v);
    }
  }

  let list = [...values];
  if (key === "dow") list = list.map((v) => normDow(v, flavour));
  field.values = [...new Set(list)].sort((a, b) => a - b);
  return field;
}

/** Field count a dialect accepts. */
function expectedCounts(flavour: Flavour): number[] {
  return flavour === "standard" ? [5] : flavour === "quartz" ? [6, 7] : [6];
}

/**
 * The dialect an expression most likely comes from, keeping `current` when it
 * fits. Six fields are ambiguous: a "?" or a year shows where the day fields
 * sit, and so whether seconds come first (Quartz) or a year comes last (AWS).
 */
export function guessFlavour(text: string, current: Flavour): Flavour {
  const t = text.trim();
  if (!t || t.startsWith("@")) return current;
  const parts = t.split(/\s+/);
  if (parts.length === 5) return "standard";
  if (parts.length === 7) return "quartz";
  if (parts.length !== 6) return current;
  if (parts[2] === "?" || parts[4] === "?" || /^\d{4}([-,/]\d{1,4})*$/.test(parts[5])) return "aws";
  if (parts[3] === "?" || parts[5] === "?") return current === "seconds" ? "seconds" : "quartz";
  return current === "standard" ? "seconds" : current;
}

export function parseCron(input: string, flavour: Flavour): Cron {
  const source = input.trim().replace(/\s+/g, " ");
  const base: Cron = { flavour, source, fields: [], byKey: {}, errors: [], warnings: [], dayRule: "both" };
  if (!source) return { ...base, errors: ["Type a cron expression, or pick a preset below."] };

  if (source.startsWith("@")) {
    const name = source.toLowerCase();
    if (name === "@reboot") return { ...base, reboot: true };
    const expands = MACROS[name];
    if (!expands) {
      return { ...base, errors: [`${source} isn't a known shortcut. Use @yearly, @monthly, @weekly, @daily, @hourly or @reboot.`] };
    }
    const inner = parseCron(expands, "standard");
    const warnings = flavour === "standard" ? inner.warnings : [...inner.warnings, `${source} is a Linux crontab shortcut; it's read here as ${expands}.`];
    return { ...inner, source, macro: { name, expands }, warnings };
  }

  const parts = source.split(" ");
  const counts = expectedCounts(flavour);
  if (!counts.includes(parts.length)) {
    const need = counts.join(" or ");
    return {
      ...base,
      errors: [`${FLAVOURS.find((f) => f.value === flavour)!.label} cron needs ${need} fields separated by spaces; this has ${parts.length}.`],
    };
  }

  const warnings: string[] = [];
  const keys = fieldOrder(flavour, parts.length);
  const fields = keys.map((k, i) => parseField(parts[i], k, flavour, warnings));
  const byKey: Partial<Record<FieldKey, Field>> = {};
  for (const f of fields) byKey[f.key] = f;
  const errors = fields.filter((f) => f.error).map((f) => `${SPECS[f.key].label}: ${f.error}`);

  const dom = byKey.dom!;
  const dow = byKey.dow!;
  let dayRule: Cron["dayRule"] = "both";

  if (flavour === "quartz" || flavour === "aws") {
    if (!dom.none && !dow.none && !errors.length) {
      errors.push("Put ? in either the day of month or the day of week. This scheduler doesn't accept both.");
    }
  } else {
    const special = [...fields].some((f) => f.domSpecials.length || f.dowSpecials.length || (f.key === "dow" && /L/i.test(f.text)));
    if (flavour === "standard") {
      if (special) warnings.push("Linux crontab doesn't accept L, W or #. Quartz, AWS and some other schedulers do.");
      if (dom.none || dow.none) warnings.push("Linux crontab doesn't accept ?. Use * instead.");
      if (!dom.star && !dow.star) dayRule = "either";
    } else if (!dom.star && !dow.star) {
      warnings.push(
        "Both day fields are set. Linux cron runs when either matches, but node-cron and Spring need both to match. The times below assume both."
      );
    }
  }

  if (!errors.length) warnings.push(...commonMistakes(fields, byKey, dayRule));
  return { ...base, fields, byKey, errors, warnings, dayRule };
}

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function commonMistakes(fields: Field[], f: Partial<Record<FieldKey, Field>>, dayRule: Cron["dayRule"]): string[] {
  const out: string[] = [];
  const min = f.minute!;
  const hour = f.hour!;
  if (min.values.length === 60 && hour.values.length < 24 && (!f.second || f.second.values.length === 1)) {
    const fixed = fields.map((x) => (x.key === "minute" ? "0" : x.text)).join(" ");
    out.push(
      `With * in the minute field this runs every minute of ${hour.values.length === 1 ? "that hour" : "those hours"} — ${60 * hour.values.length} times a day. To run once an hour, set the minute: ${fixed}`
    );
  }
  const unevenStep = (fld: Field | undefined, size: number, unit: string) => {
    if (!fld) return;
    const m = /^\*\/(\d+)$/.exec(fld.text);
    if (!m) return;
    const n = Number(m[1]);
    if (n > 1 && n < size && size % n !== 0) {
      const last = fld.values[fld.values.length - 1];
      out.push(`*/${n} starts again at 0 each ${unit === "minute" ? "hour" : unit === "second" ? "minute" : "day"}, so the gap after ${last} is only ${size - last} ${unit}${size - last === 1 ? "" : "s"}, not ${n}.`);
    }
  };
  unevenStep(f.second, 60, "second");
  unevenStep(min, 60, "minute");
  unevenStep(hour, 24, "hour");
  // A date late in the month is skipped in shorter months — a surprise when
  // it's the only date given.
  const dom = f.dom!;
  const first = dom.values[0];
  if (!dom.star && dayRule === "both" && !dom.domSpecials.length && first >= 29) {
    const months = f.month!.values;
    const missing = months.filter((m) => MONTH_DAYS[m - 1] < first);
    const leapOnly = first === 29 && months.includes(2);
    if (missing.length === months.length && !leapOnly) {
      out.push(`${joinList(missing.map((m) => MONTH_NAMES[m - 1]))} never ${missing.length === 1 ? "has" : "have"} a ${ordinal(first)}, so this never runs.`);
    } else if (missing.length || leapOnly) {
      const names = missing.map((m) => MONTH_NAMES[m - 1]);
      if (leapOnly) names.push("February outside leap years");
      out.push(`There's no ${ordinal(first)} in ${joinList(names)}, so ${missing.length + (leapOnly ? 1 : 0) === 1 ? "that month is" : "those months are"} skipped. Use L for the last day of the month where your scheduler supports it.`);
    }
  }
  return out;
}

// ── Descriptions ───────────────────────────────────────────────────────────

type Shape =
  | { kind: "all" }
  | { kind: "one"; v: number }
  | { kind: "range"; from: number; to: number }
  | { kind: "step"; from: number; to: number; step: number; cycle: boolean }
  | { kind: "list"; values: number[] };

function shapeOf(values: number[], min: number, max: number): Shape {
  if (values.length === max - min + 1) return { kind: "all" };
  if (values.length === 1) return { kind: "one", v: values[0] };
  const d = values[1] - values[0];
  const even = values.every((v, i) => i === 0 || v - values[i - 1] === d);
  const from = values[0];
  const to = values[values.length - 1];
  if (even && d === 1) return { kind: "range", from, to };
  if (even) {
    const cycle = from - d < min && to + d > max;
    if (values.length >= 3 || cycle) return { kind: "step", from, to, step: d, cycle };
  }
  return { kind: "list", values };
}

function everyN(n: number, unit: string): string {
  return n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;
}

function describeTime(c: Cron): string {
  const secs = c.byKey.second?.values ?? [0];
  const mins = c.byKey.minute!.values;
  const hours = c.byKey.hour!.values;
  const S = shapeOf(secs, 0, 59);
  const M = shapeOf(mins, 0, 59);
  const H = shapeOf(hours, 0, 23);
  const secondsMatter = !(S.kind === "one" && S.v === 0);

  // A handful of fixed times reads best as a list: "at 09:00 and 17:30".
  const total = secs.length * mins.length * hours.length;
  const hourCycle = H.kind === "step" && H.cycle;
  const listable =
    S.kind !== "all" && M.kind !== "all" && H.kind !== "all" &&
    !(hourCycle && hours.length > 4) &&
    (total <= 6 || (secs.length === 1 && mins.length === 1 && H.kind === "list" && hours.length <= 12));
  if (listable) {
    const times: string[] = [];
    for (const h of hours) for (const m of mins) for (const s of secs) times.push(clock(h, m, secondsMatter ? s : undefined));
    return `at ${joinList(times)}`;
  }

  const minutePhrase = (): string => {
    switch (M.kind) {
      case "all":
        return "every minute";
      case "one":
        return M.v === 0 ? "on the hour" : `at ${M.v} minutes past the hour`;
      case "range":
        return `every minute from :${pad2(M.from)} to :${pad2(M.to)}`;
      case "step":
        return M.cycle && M.from === 0
          ? everyN(M.step, "minute")
          : `${everyN(M.step, "minute")} from :${pad2(M.from)} to :${pad2(M.to)}`;
      case "list":
        return `at ${joinList(M.values.map((v) => `:${pad2(v)}`))}`;
    }
  };
  const nthHour = (step: number) => (step === 2 ? "every other hour" : `every ${ordinal(step)} hour`);

  let text: string;
  if (H.kind === "all") {
    text = M.kind === "one" ? (M.v === 0 ? "at the start of every hour" : `at ${M.v} minutes past every hour`) : minutePhrase();
  } else if (H.kind === "one" || H.kind === "range") {
    const [a, b] = H.kind === "one" ? [H.v, H.v] : [H.from, H.to];
    if (M.kind === "one") text = `every hour from ${clock(a, M.v)} to ${clock(b, M.v)}`;
    else if (M.kind === "all" || (M.kind === "step" && M.cycle && M.from === 0)) {
      text = `${minutePhrase()} from ${clock(a, mins[0])} to ${clock(b, mins[mins.length - 1])}`;
    } else text = `${minutePhrase()}, from ${clock(a, 0)} to ${clock(b, 59)}`;
  } else if (H.kind === "step") {
    if (M.kind === "one") {
      text =
        H.cycle && H.from === 0
          ? `${everyN(H.step, "hour")}, ${M.v === 0 ? "on the hour" : `at ${M.v} minutes past`}`
          : `${everyN(H.step, "hour")} from ${clock(H.from, M.v)} to ${clock(H.to, M.v)}`;
    } else {
      text = `${minutePhrase()}, during ${nthHour(H.step)}${H.from ? ` from ${clock(H.from, 0)}` : ""}`;
    }
  } else {
    const hs = H.values.map((h) => clock(h, 0));
    text = M.kind === "one" ? `at ${M.v} minutes past ${joinList(hs)}` : `${minutePhrase()} during the ${joinList(hs)} hours`;
  }

  if (!secondsMatter) return text;
  let secPhrase: string;
  switch (S.kind) {
    case "all":
      secPhrase = "every second";
      break;
    case "one":
      secPhrase = `at second ${S.v}`;
      break;
    case "range":
      secPhrase = `every second from :${pad2(S.from)} to :${pad2(S.to)}`;
      break;
    case "step":
      secPhrase = S.cycle && S.from === 0 ? everyN(S.step, "second") : `${everyN(S.step, "second")} from :${pad2(S.from)} to :${pad2(S.to)}`;
      break;
    case "list":
      secPhrase = `at seconds ${joinList(S.values.map((v) => `:${pad2(v)}`))}`;
      break;
  }
  if (M.kind === "all") {
    if (H.kind === "all") return S.kind === "one" ? `${secPhrase} of every minute` : secPhrase;
    if (H.kind === "one" || H.kind === "range") {
      const [a, b] = H.kind === "one" ? [H.v, H.v] : [H.from, H.to];
      return `${secPhrase} from ${clock(a, 0)} to ${clock(b, 59)}`;
    }
  }
  return `${secPhrase}, ${text}`;
}

/** Weekdays in Monday-first order for reading (Sunday last). */
const mondayFirst = (d: number) => (d === 0 ? 7 : d);

function describeDow(f: Field): string {
  const parts: string[] = [];
  if (f.values.length && !(f.values.length === 7)) {
    const ordered = [...f.values].map(mondayFirst).sort((a, b) => a - b);
    const name = (d: number) => DAY_NAMES[d % 7];
    const key = ordered.join(",");
    if (key === "1,2,3,4,5") parts.push("on weekdays (Monday to Friday)");
    else if (key === "6,7") parts.push("on weekends (Saturday and Sunday)");
    else {
      const sh = shapeOf(ordered, 1, 7);
      if (sh.kind === "one") parts.push(`every ${name(sh.v)}`);
      else if (sh.kind === "range" && ordered.length >= 3) parts.push(`every day from ${name(sh.from)} to ${name(sh.to)}`);
      else parts.push(`every ${joinList(ordered.map(name))}`);
    }
  }
  for (const sp of f.dowSpecials) {
    parts.push(
      sp.type === "nth"
        ? `on the ${ORD_WORDS[sp.n]} ${DAY_NAMES[sp.dow]} of the month`
        : `on the last ${DAY_NAMES[sp.dow]} of the month`
    );
  }
  return joinList(parts);
}

function describeDom(f: Field): string {
  const parts: string[] = [];
  if (f.values.length && f.values.length !== 31) {
    const sh = shapeOf(f.values, 1, 31);
    if (sh.kind === "one") parts.push(`the ${ordinal(sh.v)}`);
    else if (sh.kind === "range") parts.push(`the ${ordinal(sh.from)} to the ${ordinal(sh.to)}`);
    else if (sh.kind === "step" && sh.step === 2 && sh.cycle) parts.push(sh.from === 1 ? "odd-numbered days" : "even-numbered days");
    else if (f.values.length <= 7) parts.push(`the ${joinList(f.values.map(ordinal))}`);
    else if (sh.kind === "step") parts.push(`every ${ordinal(sh.step)} day from the ${ordinal(sh.from)}`);
    else parts.push(`${f.values.length} days`);
  }
  for (const sp of f.domSpecials) {
    if (sp.type === "last") parts.push(sp.offset ? `${sp.offset} day${sp.offset === 1 ? "" : "s"} before the last day` : "the last day");
    else if (sp.type === "lastWeekday") parts.push("the last weekday (Monday to Friday)");
    else parts.push(`the weekday nearest the ${ordinal(sp.day)}`);
  }
  return parts.length ? `on ${joinList(parts)} of the month` : "";
}

function describeMonths(f: Field): string {
  const sh = shapeOf(f.values, 1, 12);
  const name = (m: number) => MONTH_NAMES[m - 1];
  switch (sh.kind) {
    case "all":
      return "";
    case "one":
      return `in ${name(sh.v)}`;
    case "range":
      return `from ${name(sh.from)} to ${name(sh.to)}`;
    default:
      return `in ${joinList(f.values.map(name))}`;
  }
}

function describeYears(f: Field | undefined): string {
  if (!f || f.star) return "";
  const sh = shapeOf(f.values, 1970, 2199);
  if (sh.kind === "one") return `in ${sh.v}`;
  if (sh.kind === "range") return `from ${sh.from} to ${sh.to}`;
  if (sh.kind === "step") return `every ${sh.step} years from ${sh.from}`;
  return `in ${joinList(f.values.map(String))}`;
}

/** "a Monday", "a weekday", "the first Monday of the month" — for "only when that day is …". */
function dowCondition(f: Field): string {
  const parts: string[] = [];
  if (f.values.length && f.values.length < 7) {
    const ordered = [...f.values].map(mondayFirst).sort((a, b) => a - b);
    const name = (d: number) => DAY_NAMES[d % 7];
    const key = ordered.join(",");
    if (key === "1,2,3,4,5") parts.push("a weekday");
    else if (key === "6,7") parts.push("a Saturday or Sunday");
    else {
      const sh = shapeOf(ordered, 1, 7);
      parts.push(sh.kind === "range" && ordered.length >= 3 ? `${name(sh.from)} to ${name(sh.to)}` : `a ${joinList(ordered.map(name), "or")}`);
    }
  }
  for (const sp of f.dowSpecials) {
    parts.push(sp.type === "nth" ? `the ${ORD_WORDS[sp.n]} ${DAY_NAMES[sp.dow]} of the month` : `the last ${DAY_NAMES[sp.dow]} of the month`);
  }
  return joinList(parts, "or");
}

const domRestricted = (f: Field) => f.values.length < 31 || f.domSpecials.length > 0;
const dowRestricted = (f: Field) => f.values.length < 7 || f.dowSpecials.length > 0;

export function describe(c: Cron): string {
  if (c.reboot) return "Runs once each time the computer starts, not on a schedule.";
  if (c.errors.length) return "";
  const time = describeTime(c);
  const dom = c.byKey.dom!;
  const dow = c.byKey.dow!;
  const domText = domRestricted(dom) ? describeDom(dom) : "";
  const dowText = dowRestricted(dow) ? describeDow(dow) : "";

  let days = "";
  let months = describeMonths(c.byKey.month!);
  const monthShape = shapeOf(c.byKey.month!.values, 1, 12);
  if (domText && dowText) {
    days = c.dayRule === "either" ? `${domText}, and also ${dowText}` : `${domText}, but only when that day is ${dowCondition(dow)}`;
  } else if (domText && monthShape.kind === "one") {
    // "on 1 January" rather than "on the 1st of the month in January".
    const month = MONTH_NAMES[monthShape.v - 1];
    days = dom.values.length === 1 && !dom.domSpecials.length ? `on ${dom.values[0]} ${month}` : domText.replace(/ of the month$/, ` of ${month}`);
    months = "";
  } else {
    days = domText || dowText;
  }
  const fixedTime = time.startsWith("at ") && !time.includes("every");
  if (!days && fixedTime) days = "every day";

  const rest = [days, months, describeYears(c.byKey.year)].filter(Boolean).join(" ");
  const sentence = rest ? `${time}${time.includes(",") && !time.startsWith("at ") ? "," : ""} ${rest}` : time;
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

/** A short reading of one field, for the breakdown under the expression. */
export function describeField(f: Field): string {
  if (f.error) return "Not valid";
  if (f.none) return "No specific value";
  const n = f.values;
  switch (f.key) {
    case "second":
    case "minute": {
      const unit = f.key;
      const sh = shapeOf(n, 0, 59);
      if (sh.kind === "all") return `Every ${unit}`;
      if (sh.kind === "one") return `At :${pad2(sh.v)}`;
      if (sh.kind === "step" && sh.cycle && sh.from === 0) return `Every ${sh.step} ${unit}s`;
      if (sh.kind === "range") return `:${pad2(sh.from)} to :${pad2(sh.to)}`;
      return n.length <= 4 ? n.map((v) => `:${pad2(v)}`).join(", ") : `${n.length} ${unit}s`;
    }
    case "hour": {
      const sh = shapeOf(n, 0, 23);
      if (sh.kind === "all") return "Every hour";
      if (sh.kind === "one") return hour12(sh.v);
      if (sh.kind === "step" && sh.cycle && sh.from === 0) return `Every ${sh.step} hours`;
      if (sh.kind === "range") return `${hour12(sh.from)} to ${hour12(sh.to)}`;
      return n.length <= 3 ? n.map(hour12).join(", ") : `${n.length} hours`;
    }
    case "dom": {
      const bits: string[] = [];
      if (n.length === 31) return "Every day";
      const sh = shapeOf(n, 1, 31);
      if (n.length) {
        if (sh.kind === "one") bits.push(ordinal(sh.v));
        else if (sh.kind === "range") bits.push(`${ordinal(sh.from)} to ${ordinal(sh.to)}`);
        else if (sh.kind === "step" && sh.cycle) bits.push(`Every ${ordinal(sh.step)} day`);
        else bits.push(n.length <= 4 ? n.map(ordinal).join(", ") : `${n.length} days`);
      }
      for (const sp of f.domSpecials) {
        bits.push(sp.type === "last" ? (sp.offset ? `Last − ${sp.offset}` : "Last day") : sp.type === "lastWeekday" ? "Last weekday" : `Weekday near ${ordinal(sp.day)}`);
      }
      return bits.join(", ");
    }
    case "month": {
      const sh = shapeOf(n, 1, 12);
      const ab = (m: number) => MONTH_NAMES[m - 1].slice(0, 3);
      if (sh.kind === "all") return "Every month";
      if (sh.kind === "range") return `${ab(sh.from)} to ${ab(sh.to)}`;
      return n.length <= 4 ? n.map(ab).join(", ") : `${n.length} months`;
    }
    case "dow": {
      const bits: string[] = [];
      const ordered = n.map(mondayFirst).sort((a, b) => a - b);
      const ab = (d: number) => DAY_NAMES[d % 7].slice(0, 3);
      if (n.length === 7) return "Every day";
      if (n.length) {
        const key = ordered.join(",");
        const sh = shapeOf(ordered, 1, 7);
        if (key === "1,2,3,4,5") bits.push("Mon to Fri");
        else if (sh.kind === "range" && ordered.length >= 3) bits.push(`${ab(sh.from)} to ${ab(sh.to)}`);
        else bits.push(ordered.map(ab).join(", "));
      }
      for (const sp of f.dowSpecials) {
        bits.push(sp.type === "nth" ? `${ordinal(sp.n)} ${DAY_NAMES[sp.dow].slice(0, 3)}` : `Last ${DAY_NAMES[sp.dow].slice(0, 3)}`);
      }
      return bits.join(", ");
    }
    case "year": {
      if (f.star) return "Every year";
      const sh = shapeOf(n, 1970, 2199);
      if (sh.kind === "one") return String(sh.v);
      if (sh.kind === "range") return `${sh.from} to ${sh.to}`;
      return n.length <= 3 ? n.join(", ") : `${n.length} years`;
    }
  }
}

function hour12(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

/** How many times the job fires on a day it runs. */
export function runsPerDay(c: Cron): number {
  if (c.errors.length || c.reboot) return 0;
  return (c.byKey.second?.values.length ?? 1) * c.byKey.minute!.values.length * c.byKey.hour!.values.length;
}

// ── Next run times ─────────────────────────────────────────────────────────

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const weekday = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

function domMatches(f: Field, y: number, m: number, d: number): boolean {
  if (f.values.includes(d)) return true;
  const dim = daysIn(y, m);
  for (const sp of f.domSpecials) {
    if (sp.type === "last" && d === dim - sp.offset) return true;
    if (sp.type === "lastWeekday") {
      let last = dim;
      while (weekday(y, m, last) === 0 || weekday(y, m, last) === 6) last--;
      if (d === last) return true;
    }
    if (sp.type === "nearestWeekday" && sp.day <= dim) {
      const wd = weekday(y, m, sp.day);
      let target = sp.day;
      // The nearest weekday stays inside the month.
      if (wd === 6) target = sp.day === 1 ? 3 : sp.day - 1;
      else if (wd === 0) target = sp.day === dim ? sp.day - 2 : sp.day + 1;
      if (d === target) return true;
    }
  }
  return false;
}

function dowMatches(f: Field, y: number, m: number, d: number): boolean {
  const wd = weekday(y, m, d);
  if (f.values.includes(wd)) return true;
  for (const sp of f.dowSpecials) {
    if (sp.dow !== wd) continue;
    if (sp.type === "nth" && Math.ceil(d / 7) === sp.n) return true;
    if (sp.type === "lastOf" && d + 7 > daysIn(y, m)) return true;
  }
  return false;
}

function dayMatches(c: Cron, y: number, m: number, d: number): boolean {
  const dom = c.byKey.dom!;
  const dow = c.byKey.dow!;
  const a = domMatches(dom, y, m, d);
  const b = dowMatches(dow, y, m, d);
  return c.dayRule === "either" ? a || b : a && b;
}

const firstAtLeast = (list: number[], v: number) => list.find((x) => x >= v);

/**
 * The next `count` times the schedule fires after `from`, reading the clock in
 * UTC or in this device's time zone. Stops looking `years` years ahead, so an
 * impossible date such as 30 February returns an empty list.
 */
export function nextRuns(c: Cron, from: Date, count: number, zone: "local" | "utc", years = 30): Date[] {
  if (c.errors.length || c.reboot || !c.fields.length) return [];
  const utc = zone === "utc";
  const hasSec = !!c.byKey.second;
  const secs = c.byKey.second?.values ?? [0];
  const mins = c.byKey.minute!.values;
  const hours = c.byKey.hour!.values;
  const months = c.byKey.month!.values;
  const yearField = c.byKey.year;
  const yearList = yearField && !yearField.star ? yearField.values : null;

  let y = utc ? from.getUTCFullYear() : from.getFullYear();
  let mo = (utc ? from.getUTCMonth() : from.getMonth()) + 1;
  let d = utc ? from.getUTCDate() : from.getDate();
  let h = utc ? from.getUTCHours() : from.getHours();
  let mi = utc ? from.getUTCMinutes() : from.getMinutes();
  let s = utc ? from.getUTCSeconds() : from.getSeconds();
  if (hasSec) s += 1;
  else {
    s = 0;
    mi += 1;
  }

  const limit = y + years;
  const out: Date[] = [];
  const carry = () => {
    if (s > 59) { s = 0; mi++; }
    if (mi > 59) { mi = 0; h++; }
    if (h > 23) { h = 0; d++; }
    if (d > daysIn(y, mo)) { d = 1; mo++; }
    if (mo > 12) { mo = 1; y++; }
  };
  const nextDay = () => { d++; h = 0; mi = 0; s = 0; carry(); };

  for (let guard = 0; guard < 200_000 && out.length < count; guard++) {
    carry();
    if (y > limit) break;
    if (yearList && !yearList.includes(y)) {
      const ny = firstAtLeast(yearList, y);
      if (ny === undefined) break;
      y = ny; mo = 1; d = 1; h = 0; mi = 0; s = 0;
      continue;
    }
    if (!months.includes(mo)) {
      const nm = firstAtLeast(months, mo);
      if (nm === undefined) { y++; mo = months[0]; } else mo = nm;
      d = 1; h = 0; mi = 0; s = 0;
      continue;
    }
    if (!dayMatches(c, y, mo, d)) { nextDay(); continue; }
    if (!hours.includes(h)) {
      const nh = firstAtLeast(hours, h);
      if (nh === undefined) nextDay();
      else { h = nh; mi = 0; s = 0; }
      continue;
    }
    if (!mins.includes(mi)) {
      const nm = firstAtLeast(mins, mi);
      if (nm === undefined) { h++; mi = 0; s = 0; } else { mi = nm; s = 0; }
      continue;
    }
    if (!secs.includes(s)) {
      const ns = firstAtLeast(secs, s);
      if (ns === undefined) { mi++; s = 0; } else s = ns;
      continue;
    }

    const date = utc ? new Date(Date.UTC(y, mo - 1, d, h, mi, s)) : new Date(y, mo - 1, d, h, mi, s);
    // A local time that doesn't exist (the hour skipped when clocks go
    // forward) comes back as a different time; skip it.
    const real = utc || (date.getHours() === h && date.getMinutes() === mi && date.getDate() === d);
    if (real && date.getTime() > from.getTime()) out.push(date);
    if (hasSec) s++;
    else mi++;
  }
  return out;
}

// ── Builder ────────────────────────────────────────────────────────────────

export type BuildFrequency = "minutes" | "hourly" | "daily" | "weekly" | "monthly";

export interface BuildOptions {
  frequency: BuildFrequency;
  /** Every n minutes (minutes) or hours (hourly). */
  every: number;
  /** Minute past the hour, for hourly schedules. */
  minute: number;
  /** "HH:MM", for daily, weekly and monthly schedules. */
  time: string;
  /** Daily: which days. */
  days: "all" | "weekdays" | "weekends";
  /** Weekly: weekdays 0–6, Sunday = 0. */
  weekdays: number[];
  /** Monthly: day of the month, or "L" for the last day (Quartz and AWS only). */
  monthDay: number | "L";
}

/** Collapses sorted numbers into ranges: [1,2,3,5] → "1-3,5". */
function compress(values: number[], name: (v: number) => string): string {
  const out: string[] = [];
  for (let i = 0; i < values.length; i++) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
    out.push(j - i >= 2 ? `${name(values[i])}-${name(values[j])}` : values.slice(i, j + 1).map(name).join(","));
    i = j;
  }
  return out.join(",");
}

/** Writes a schedule as an expression in the chosen dialect. */
export function buildCron(o: BuildOptions, flavour: Flavour): string {
  const [hh, mm] = o.time.split(":").map((v) => Number(v) || 0);
  let minute = "0";
  let hour = "*";
  let dom = "*";
  let dow: number[] | null = null;

  switch (o.frequency) {
    case "minutes":
      minute = o.every > 1 ? `*/${o.every}` : "*";
      break;
    case "hourly":
      minute = String(o.minute);
      hour = o.every > 1 ? `*/${o.every}` : "*";
      break;
    case "daily":
      minute = String(mm);
      hour = String(hh);
      dow = o.days === "weekdays" ? [1, 2, 3, 4, 5] : o.days === "weekends" ? [6, 0] : null;
      break;
    case "weekly":
      minute = String(mm);
      hour = String(hh);
      dow = o.weekdays.length && o.weekdays.length < 7 ? o.weekdays : null;
      break;
    case "monthly":
      minute = String(mm);
      hour = String(hh);
      dom = String(o.monthDay);
      break;
  }

  const named = flavour === "quartz" || flavour === "aws";
  let dowText = "*";
  if (dow) {
    // Ranges never cross Sunday, which not every scheduler accepts.
    const sorted = [...dow].sort((a, b) => a - b);
    dowText = named ? compress(sorted, (d) => DAY_ABBR[d]) : compress(sorted, String);
  }

  if (named) {
    // One of the two day fields has to be "?".
    const dayOfMonth = dow ? "?" : dom;
    const dayOfWeek = dow ? dowText : "?";
    return flavour === "quartz"
      ? `0 ${minute} ${hour} ${dayOfMonth} * ${dayOfWeek}`
      : `${minute} ${hour} ${dayOfMonth} * ${dayOfWeek} *`;
  }
  const five = `${minute} ${hour} ${dom} * ${dowText}`;
  return flavour === "seconds" ? `0 ${five}` : five;
}
