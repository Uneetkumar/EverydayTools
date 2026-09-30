/**
 * Fair randomness for the coin, dice, number and picker tools.
 *
 * Everything draws from crypto.getRandomValues — the operating system's
 * cryptographic generator — instead of Math.random(), whose output is
 * predictable and, in some engines, not uniformly distributed. Converting
 * random bits to a range uses rejection sampling: taking `value % range`
 * would make the smaller numbers slightly more likely whenever the range does
 * not divide 2^32, which is a real (if small) bias. Rejected draws are simply
 * redrawn.
 */

function fill(buf: Uint32Array): Uint32Array {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") return crypto.getRandomValues(buf);
  // Extremely old or non-browser runtimes: better than throwing in a tool.
  for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 4294967296);
  return buf;
}

const one = new Uint32Array(1);

/** A uniform random integer in [0, range). range must be 1 … 2^32. */
export function randomBelow(range: number): number {
  if (!Number.isInteger(range) || range < 1 || range > 4294967296) throw new RangeError("range must be an integer from 1 to 2^32");
  if (range === 1) return 0;
  // Largest multiple of range that fits in 2^32; values above it are rejected.
  const limit = 4294967296 - (4294967296 % range);
  let x: number;
  do {
    x = fill(one)[0];
  } while (x >= limit);
  return x % range;
}

/** A uniform random integer in [min, max], both inclusive. Handles ranges wider than 2^32. */
export function randomInt(min: number, max: number): number {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) throw new RangeError("min and max must be safe integers with min <= max");
  const range = max - min + 1;
  if (range <= 4294967296) return min + randomBelow(range);
  // Wider than 32 bits: compose from two draws and reject out-of-range values.
  const buf = new Uint32Array(2);
  const span = 2 ** 53;
  const limit = span - (span % range);
  let x: number;
  do {
    fill(buf);
    x = (buf[0] >>> 0) * 2097152 + (buf[1] >>> 11); // 53 random bits
  } while (x >= limit);
  return min + (x % range);
}

/** A uniform float in [0, 1) with 53 bits of randomness. */
export function randomFloat(): number {
  const buf = fill(new Uint32Array(2));
  return ((buf[0] >>> 5) * 67108864 + (buf[1] >>> 6)) / 9007199254740992;
}

/** Fisher–Yates: every ordering is equally likely. Returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `count` distinct picks from the list, each subset equally likely. */
export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, Math.min(count, items.length)));
}

/** `count` distinct integers in [min, max]. Uses a sparse Fisher–Yates so huge ranges stay cheap. */
export function uniqueInts(count: number, min: number, max: number): number[] {
  const size = max - min + 1;
  if (count > size) throw new RangeError("Cannot pick more unique numbers than the range holds");
  const swapped = new Map<number, number>();
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const j = i + randomInt(0, size - 1 - i);
    const vj = swapped.get(j) ?? j;
    const vi = swapped.get(i) ?? i;
    swapped.set(j, vi);
    out.push(min + vj);
  }
  return out;
}

/** Random decimal in [min, max] rounded to `places`. */
export function randomDecimal(min: number, max: number, places: number): number {
  const f = 10 ** places;
  const lo = Math.ceil(min * f);
  const hi = Math.floor(max * f);
  if (lo > hi) return Number(min.toFixed(places));
  return randomInt(lo, hi) / f;
}

/* -------------------------------------------------------------------- dice */

export type DiceSides = number | "F";

export interface DiceTerm {
  sign: 1 | -1;
  count: number;
  sides: DiceSides;
  /** keep the highest or lowest n dice. */
  keep?: { mode: "high" | "low"; n: number };
  /** Roll again (and add) whenever a die shows its maximum. */
  exploding?: boolean;
}

export interface DiceExpression {
  terms: DiceTerm[];
  /** Flat modifier added to the total. */
  modifier: number;
}

export type DiceParse = { ok: true; expr: DiceExpression; canonical: string } | { ok: false; error: string };

export const MAX_DICE = 200;
export const MAX_SIDES = 1000;

const TERM = /^([+-]?)(\d*)d(%|F|f|\d+)(?:(kh|kl|k)(\d+))?(!)?$/i;

/**
 * Parses standard tabletop notation: `d20`, `2d6+3`, `4d6kh3` (keep highest
 * three), `2d20kl1` (disadvantage), `1d6!` (exploding), `d%` (percentile),
 * `4dF` (Fate dice) and sums of these, such as `2d6+1d4-1`.
 */
export function parseDice(input: string): DiceParse {
  const s = input.replace(/\s+/g, "").replace(/×/g, "*");
  if (!s) return { ok: false, error: "Enter dice such as 2d6+3." };
  const pieces = s.match(/[+-]?[^+-]+/g);
  if (!pieces || pieces.join("") !== s) return { ok: false, error: "That isn't valid dice notation. Try 2d6+3 or 4d6kh3." };
  const terms: DiceTerm[] = [];
  let modifier = 0;
  for (const piece of pieces) {
    const m = TERM.exec(piece);
    if (m) {
      const sign = m[1] === "-" ? -1 : 1;
      const count = m[2] === "" ? 1 : Number(m[2]);
      const sidesRaw = m[3];
      const sides: DiceSides = sidesRaw === "%" ? 100 : /f/i.test(sidesRaw) ? "F" : Number(sidesRaw);
      if (count < 1 || count > MAX_DICE) return { ok: false, error: `Roll between 1 and ${MAX_DICE} dice at a time.` };
      if (sides !== "F" && (sides < 2 || sides > MAX_SIDES)) return { ok: false, error: `A die needs 2 to ${MAX_SIDES} sides.` };
      let keep: DiceTerm["keep"];
      if (m[4]) {
        const n = Number(m[5]);
        if (n < 1 || n > count) return { ok: false, error: `You can keep between 1 and ${count} of ${count} dice.` };
        keep = { mode: m[4].toLowerCase() === "kl" ? "low" : "high", n };
      }
      if (m[6] && sides === "F") return { ok: false, error: "Fate dice cannot explode." };
      terms.push({ sign, count, sides, keep, exploding: !!m[6] });
      continue;
    }
    if (/^[+-]?\d+$/.test(piece)) {
      modifier += Number(piece);
      continue;
    }
    return { ok: false, error: `"${piece.replace(/^[+-]/, "")}" is not a dice roll or a number.` };
  }
  if (!terms.length) return { ok: false, error: "Add at least one die, such as d6." };
  if (terms.reduce((n, t) => n + t.count, 0) > MAX_DICE) return { ok: false, error: `Roll at most ${MAX_DICE} dice in total.` };
  const expr = { terms, modifier };
  return { ok: true, expr, canonical: formatDice(expr) };
}

export function formatDice(expr: DiceExpression): string {
  const parts = expr.terms.map((t, i) => {
    const body = `${t.count === 1 ? "" : t.count}d${t.sides}${t.keep ? (t.keep.mode === "high" ? "kh" : "kl") + t.keep.n : ""}${t.exploding ? "!" : ""}`;
    return `${t.sign === -1 ? "-" : i > 0 ? "+" : ""}${body}`;
  });
  if (expr.modifier) parts.push(`${expr.modifier > 0 ? "+" : "-"}${Math.abs(expr.modifier)}`);
  return parts.join("");
}

export interface DieRoll {
  value: number;
  /** Not counted (kept-highest/lowest drops it). */
  dropped: boolean;
  /** Extra die rolled because the previous one showed its maximum. */
  exploded: boolean;
}

export interface TermRoll {
  term: DiceTerm;
  rolls: DieRoll[];
  subtotal: number;
}

export interface DiceRoll {
  groups: TermRoll[];
  modifier: number;
  total: number;
  /** Lowest and highest total this expression can produce (exploding dice have no real maximum). */
  min: number;
  max: number | null;
}

const EXPLOSION_LIMIT = 100;

export function rollDice(expr: DiceExpression): DiceRoll {
  const groups: TermRoll[] = expr.terms.map((term) => {
    const rolls: DieRoll[] = [];
    const face = () => (term.sides === "F" ? randomInt(-1, 1) : randomInt(1, term.sides));
    for (let i = 0; i < term.count; i++) {
      let v = face();
      rolls.push({ value: v, dropped: false, exploded: false });
      if (term.exploding && term.sides !== "F") {
        let guard = 0;
        while (v === term.sides && guard++ < EXPLOSION_LIMIT) {
          v = face();
          rolls.push({ value: v, dropped: false, exploded: true });
        }
      }
    }
    if (term.keep) {
      // Consider the original dice only; explosions belong to the die that produced them.
      const base = rolls.filter((r) => !r.exploded);
      const order = base.map((r, i) => ({ r, i })).sort((a, b) => (term.keep!.mode === "high" ? b.r.value - a.r.value : a.r.value - b.r.value));
      order.slice(term.keep.n).forEach(({ r }) => (r.dropped = true));
    }
    const subtotal = rolls.filter((r) => !r.dropped).reduce((n, r) => n + r.value, 0) * term.sign;
    return { term, rolls, subtotal };
  });
  const total = groups.reduce((n, g) => n + g.subtotal, 0) + expr.modifier;
  let min = expr.modifier;
  let max: number | null = expr.modifier;
  for (const t of expr.terms) {
    const kept = t.keep ? t.keep.n : t.count;
    const lo = t.sides === "F" ? -1 : 1;
    const hi = t.sides === "F" ? 1 : t.sides;
    if (t.sign === 1) {
      min += kept * lo;
      if (max !== null) max = t.exploding ? null : max + kept * hi;
    } else {
      min -= kept * hi;
      if (max !== null) max -= kept * lo;
    }
  }
  return { groups, modifier: expr.modifier, total, min, max };
}

/** Exact probability of each total when rolling `count` dice with `sides` faces (no keep/explode). */
export function sumDistribution(count: number, sides: number): { total: number; probability: number }[] {
  // dp[s] = ways to reach s; probabilities instead of counts so large cases don't overflow.
  let dp = new Map<number, number>([[0, 1]]);
  for (let i = 0; i < count; i++) {
    const next = new Map<number, number>();
    for (const [s, p] of dp) for (let face = 1; face <= sides; face++) next.set(s + face, (next.get(s + face) ?? 0) + p / sides);
    dp = next;
  }
  return [...dp.entries()].sort((a, b) => a[0] - b[0]).map(([total, probability]) => ({ total, probability }));
}

/** Plain-language mean of an expression, for the "what to expect" line. */
export function expectedValue(expr: DiceExpression): number | null {
  let e = expr.modifier;
  for (const t of expr.terms) {
    if (t.keep) return null;
    const mean = t.sides === "F" ? 0 : (t.sides + 1) / 2;
    const perDie = t.exploding && t.sides !== "F" ? mean * (t.sides / (t.sides - 1)) : mean;
    e += t.sign * t.count * perDie;
  }
  return e;
}
