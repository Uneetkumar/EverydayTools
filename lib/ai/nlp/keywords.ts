/**
 * On-device keyword and key-phrase extraction.
 *
 * Single keywords are ranked by how often they occur (plurals folded into
 * their singular), key phrases by RAKE: candidate phrases are the runs of
 * words between stopwords and punctuation, and each word scores by how often
 * it appears inside longer phrases relative to how often it appears at all.
 */

import { STOPWORDS } from "./text";

const EXTRA_STOPWORDS = new Set([
  "able", "across", "actually", "along", "already", "always", "back", "come", "comes", "day", "days", "different", "does",
  "done", "etc", "even", "find", "first", "give", "given", "going", "good", "great", "help", "helps", "keep", "know",
  "last", "let", "lot", "lots", "need", "needs", "new", "next", "part", "put", "said", "say", "says", "see", "seem",
  "set", "show", "shows", "take", "takes", "thing", "things", "think", "time", "times", "today", "try", "two", "want",
  "wants", "way", "ways", "work", "works", "year", "years", "yes", "one", "three", "every", "like", "many", "much",
]);

const isStop = (w: string) => STOPWORDS.has(w) || EXTRA_STOPWORDS.has(w) || w.length < 3 || /^\d+$/.test(w);

/**
 * Common verbs end a key phrase: "net metering lets homeowners" should give
 * "net metering", not a phrase with the verb glued on. They still count as
 * keywords on their own.
 */
const PHRASE_BREAKS = new Set(
  (
    "allow allows allowed become becomes check checks convert converts converted cost costs cut cuts get gets got " +
    "give gives help helps include includes including install installing installed keep keeps let lets lower lowers " +
    "make makes making offer offers pay pays provide provides reduce reduces run runs sell sells show shows start starts " +
    "turn turns use uses using used lets mean means require requires required"
  ).split(" ")
);

const singular = (w: string) =>
  w.length > 4 && w.endsWith("ies")
    ? `${w.slice(0, -3)}y`
    : w.length > 4 && /(?:ches|shes|xes|sses)$/.test(w)
      ? w.slice(0, -2)
      : w.length > 3 && w.endsWith("s") && !/(?:ss|us|is)$/.test(w)
        ? w.slice(0, -1)
        : w;

export interface KeywordItem {
  keyword: string;
  count: number;
  /** Share of all words, in percent. */
  density: number;
  score: number;
}

export interface PhraseItem {
  phrase: string;
  count: number;
  score: number;
}

export interface KeywordExtractionResult {
  keywords: KeywordItem[];
  phrases: PhraseItem[];
  totalWords: number;
  /** Kept for callers that read the old shape. */
  primaryKeywords: KeywordItem[];
  secondaryKeywords: KeywordItem[];
  keyPhrases: string[];
}

export function extractKeywordsLocally(text: string, topN = 10): KeywordExtractionResult {
  const empty: KeywordExtractionResult = {
    keywords: [],
    phrases: [],
    totalWords: 0,
    primaryKeywords: [],
    secondaryKeywords: [],
    keyPhrases: [],
  };
  const clean = text.trim();
  if (!clean) return empty;

  // Tokens with their original spelling, and sentence/punctuation breaks.
  const tokens = clean.match(/[\p{L}\p{N}]+(?:['’.+#-][\p{L}\p{N}]+)*[+#]*|[.,;:!?()[\]{}"“”\n]/gu) ?? [];
  const words = tokens.filter((t) => /[\p{L}\p{N}]/u.test(t));
  const totalWords = words.length;

  // Count keywords under their singular form, remembering the most common
  // surface spelling to display ("APIs" and "API" → shown as "API").
  const counts = new Map<string, number>();
  const surface = new Map<string, Map<string, number>>();
  for (const w of words) {
    const lower = w.toLowerCase();
    if (isStop(lower)) continue;
    const key = singular(lower);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const forms = surface.get(key) ?? new Map<string, number>();
    const display = singular(w).toLowerCase() === key ? singular(w) : w;
    forms.set(display, (forms.get(display) ?? 0) + 1);
    surface.set(key, forms);
  }
  const displayOf = (key: string) => {
    const forms = surface.get(key);
    if (!forms) return key;
    return [...forms.entries()].sort((a, b) => b[1] - a[1] || (a[0] === key ? -1 : 1))[0][0];
  };

  // RAKE candidate phrases.
  // Each candidate keeps its words as typed, so a phrase is shown the way it
  // appears in the text ("delivers", not the folded "deliver").
  const candidates: string[][] = [];
  const surfaces: string[] = [];
  let current: string[] = [];
  let currentSurface: string[] = [];
  const flush = () => {
    if (current.length) {
      candidates.push(current);
      surfaces.push(currentSurface.join(" "));
    }
    current = [];
    currentSurface = [];
  };
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (!/[\p{L}\p{N}]/u.test(t) || isStop(lower) || PHRASE_BREAKS.has(lower)) flush();
    else {
      current.push(singular(lower));
      currentSurface.push(t);
      if (current.length === 3) flush();
    }
  }
  flush();

  const freq = new Map<string, number>();
  const degree = new Map<string, number>();
  for (const c of candidates) {
    for (const w of c) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
      degree.set(w, (degree.get(w) ?? 0) + c.length);
    }
  }
  const wordScore = (w: string) => (degree.get(w) ?? 0) / (freq.get(w) ?? 1);

  const phraseMap = new Map<string, { words: string[]; count: number; surface: string }>();
  candidates.forEach((c, i) => {
    if (c.length < 2) return;
    const k = c.join(" ");
    const entry = phraseMap.get(k) ?? { words: c, count: 0, surface: surfaces[i] };
    entry.count++;
    phraseMap.set(k, entry);
  });
  const phrases: PhraseItem[] = [...phraseMap.values()]
    .map(({ words: ws, count, surface: shown }) => ({
      phrase: shown,
      count,
      // Repeated phrases, and phrases made of the text's frequent words, first.
      score:
        Math.round(
          (ws.reduce((n, w) => n + wordScore(w) + ((counts.get(w) ?? 0) > 1 ? 2 : 0), 0) + (count - 1) * 3) * 10
        ) / 10,
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 8);

  const keywords: KeywordItem[] = [...counts.entries()]
    .map(([key, count]) => ({
      keyword: displayOf(key),
      count,
      density: Math.round((count / Math.max(totalWords, 1)) * 1000) / 10,
      score: Math.round((count + wordScore(key) / 4) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count || b.score - a.score)
    .slice(0, topN);

  const half = Math.ceil(keywords.length / 2);
  return {
    keywords,
    phrases,
    totalWords,
    primaryKeywords: keywords.slice(0, half),
    secondaryKeywords: keywords.slice(half),
    keyPhrases: phrases.map((p) => p.phrase),
  };
}
