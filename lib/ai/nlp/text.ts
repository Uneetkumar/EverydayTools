/**
 * Shared text utilities for the on-device engines: sentence splitting, word
 * counting, case-preserving replacement, readability and a word diff.
 */

export const STOPWORDS = new Set(
  (
    "a about above after again against all almost also although always am among an and another any anyone anything are aren't around as at " +
    "be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't done down " +
    "during each either else enough etc even ever every few for from further get gets getting got had hadn't has hasn't have haven't having he " +
    "he'd he'll he's her here here's hers herself him himself his how how's however i i'd i'll i'm i've if in into is isn't it it's its itself " +
    "just least less let's like made make makes many may me might more most much must mustn't my myself neither never no nor not now of off " +
    "often on once one only onto or other others ought our ours ourselves out over own per perhaps quite rather really same shall shan't she " +
    "she'd she'll she's should shouldn't since so some something such than that that's the their theirs them themselves then there there's " +
    "these they they'd they'll they're they've this those though through thus to too toward towards under until up upon us use used using " +
    "very via was wasn't way we we'd we'll we're we've well were weren't what what's whatever when when's where where's whether which while " +
    "who who's whom whose why why's will with within without won't would wouldn't yet you you'd you'll you're you've your yours yourself yourselves"
  ).split(" ")
);

/** Words, ignoring punctuation and numbers-only tokens are kept. */
export function countWords(text: string): number {
  const m = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
}

const ABBREVIATIONS = /\b(?:e\.g|i\.e|etc|vs|mr|mrs|ms|dr|prof|sr|jr|st|no|fig|inc|ltd|co|approx|dept|est|min|max|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.$/i;

/**
 * Split into sentences. Line breaks always end a sentence (headings, list
 * items). Within a line, Intl.Segmenter does the work where the browser has
 * it; the fallback avoids splitting on decimals and common abbreviations.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  const segmenter = Seg ? new Seg("en", { granularity: "sentence" }) : null;

  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parts: string[];
    if (segmenter) {
      parts = Array.from(segmenter.segment(trimmed), (s) => s.segment.trim()).filter(Boolean);
      // ICU splits after "e.g." and similar; glue those back together.
      const merged: string[] = [];
      for (const p of parts) {
        const prev = merged[merged.length - 1];
        if (prev && ABBREVIATIONS.test(prev)) merged[merged.length - 1] = `${prev} ${p}`;
        else merged.push(p);
      }
      parts = merged;
    } else {
      parts = [];
      let start = 0;
      const re = /[.!?]+["”’)]?\s+(?=["“(]?[A-Z0-9])/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(trimmed))) {
        const candidate = trimmed.slice(start, m.index + m[0].trimEnd().length);
        if (ABBREVIATIONS.test(candidate)) continue;
        parts.push(candidate.trim());
        start = m.index + m[0].length;
      }
      parts.push(trimmed.slice(start).trim());
    }
    out.push(...parts.filter(Boolean));
  }
  return out;
}

/** Keep the case pattern of `original` when substituting `replacement`. */
export function matchCase(original: string, replacement: string): string {
  if (!replacement) return replacement;
  if (original.length > 1 && original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return replacement.toUpperCase();
  }
  if (original[0] && original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export interface Change {
  from: string;
  to: string;
}

export type Rule = [RegExp, string | ((match: string, ...groups: string[]) => string)];

/**
 * Apply rules in order. Every pattern must be global. A removal at the start
 * of a sentence capitalises whatever follows it.
 */
export function applyRules(text: string, rules: Rule[], changes: Change[]): string {
  let out = text;
  for (const [re, rep] of rules) {
    out = out.replace(re, (...args) => {
      const match = args[0] as string;
      const offset = args[args.length - 2] as number;
      const whole = args[args.length - 1] as string;
      const groups = args.slice(1, -2) as string[];
      let to = typeof rep === "function" ? rep(match, ...groups) : matchCase(match, rep);
      const atSentenceStart = offset === 0 || /(^|[.!?]["”’)]?\s+|\n\s*)$/.test(whole.slice(Math.max(0, offset - 4), offset));
      if (to === "" && atSentenceStart) {
        // Mark the next letter for capitalising.
        to = "\u0000";
      } else if (atSentenceStart && to) {
        to = to[0].toUpperCase() + to.slice(1);
      }
      if (to.replace("\u0000", "") !== match) changes.push({ from: match.trim(), to: to.replace("\u0000", "").trim() });
      return to;
    });
    out = out.replace(/\u0000\s*(\p{L})/gu, (_, c: string) => c.toUpperCase()).replace(/\u0000/g, "");
  }
  return out;
}

/** Collapse the spacing left behind by removals. */
export function tidy(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/([.!?])\s*,/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/(^|[.!?]\s+)i\b/g, "$1I")
    .replace(/\bi\b(?=['’ ])/g, "I")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Readability                                                         */
/* ------------------------------------------------------------------ */

export function countSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]).replace(/^y/, "");
  const groups = w.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

export interface Readability {
  words: number;
  sentences: number;
  /** Flesch reading ease, 0–100 (higher is easier). */
  ease: number;
  /** Flesch–Kincaid US school grade. */
  grade: number;
  /** Sentences over 25 words. */
  longSentences: string[];
  /** Rough count of passive constructions ("was written", "are given"). */
  passive: number;
}

const PASSIVE =
  /\b(?:am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(?:\w+ed|given|taken|made|done|seen|written|known|shown|built|sent|paid|held|told|found|brought|bought|kept|left|lost|chosen|driven|eaten|forgotten|hidden|spoken|stolen|thrown|worn|put|set|cut|read)\b/gi;

export function readability(text: string): Readability {
  const sentences = splitSentences(text).filter((s) => countWords(s) > 0);
  const words = text.match(/[\p{L}]+(?:['’-][\p{L}]+)*/gu) ?? [];
  const nW = words.length;
  const nS = Math.max(1, sentences.length);
  if (!nW) return { words: 0, sentences: 0, ease: 0, grade: 0, longSentences: [], passive: 0 };
  const syl = words.reduce((n, w) => n + countSyllables(w), 0);
  const ease = 206.835 - 1.015 * (nW / nS) - 84.6 * (syl / nW);
  const grade = 0.39 * (nW / nS) + 11.8 * (syl / nW) - 15.59;
  return {
    words: countWords(text),
    sentences: sentences.length,
    ease: Math.round(Math.min(100, Math.max(0, ease))),
    grade: Math.max(0, Math.round(grade * 10) / 10),
    longSentences: sentences.filter((s) => countWords(s) > 25),
    passive: (text.match(PASSIVE) ?? []).length,
  };
}

export function easeLabel(ease: number): string {
  if (ease >= 80) return "Very easy";
  if (ease >= 70) return "Easy";
  if (ease >= 60) return "Plain English";
  if (ease >= 50) return "Fairly difficult";
  if (ease >= 30) return "Difficult";
  return "Very difficult";
}

/* ------------------------------------------------------------------ */
/* Word diff                                                           */
/* ------------------------------------------------------------------ */

export interface DiffPart {
  type: "same" | "added" | "removed";
  text: string;
}

/**
 * Word-level diff (LCS). Whitespace is attached to the preceding word so the
 * output can be rendered by concatenation. Falls back to a whole replace for
 * very large inputs, where an O(n·m) table would be too slow.
 */
export function diffWords(a: string, b: string): DiffPart[] {
  const tok = (s: string) => s.match(/\S+\s*|\s+/g) ?? [];
  const A = tok(a);
  const B = tok(b);
  const n = A.length;
  const m = B.length;
  if (n * m > 4_000_000) return [{ type: "removed", text: a }, { type: "added", text: b }];
  const key = (t: string) => t.trimEnd();
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = key(A[i]) === key(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(A[i]) === key(B[j])) {
      push("same", B[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("removed", A[i++]);
    } else {
      push("added", B[j++]);
    }
  }
  while (i < n) push("removed", A[i++]);
  while (j < m) push("added", B[j++]);
  return parts;
}
