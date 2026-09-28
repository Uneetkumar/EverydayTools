/**
 * On-device extractive summariser.
 *
 * It does not write new sentences: it scores the sentences already in the
 * text and keeps the most informative ones, in their original order. Scores
 * come from word frequency (stopwords removed, plurals folded together), a
 * bonus for sentences that open a paragraph, and a penalty for repeating a
 * sentence already chosen, so the summary covers several points instead of
 * restating one.
 */

import { STOPWORDS, countWords, splitSentences } from "./text";

export interface SummarizerOptions {
  length?: "short" | "medium" | "detailed";
  bulletPoints?: boolean;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  originalWords: number;
  summaryWords: number;
  reductionPercentage: number;
  sentencesKept: number;
  sentencesTotal: number;
}

const stem = (w: string) =>
  w.length > 4 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;

function terms(sentence: string): string[] {
  return (sentence.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [])
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function summarizeTextLocally(text: string, options: SummarizerOptions = {}): SummaryResult {
  const clean = text.trim();
  const originalWords = countWords(clean);
  const empty: SummaryResult = {
    summary: clean,
    keyPoints: clean ? [clean] : [],
    originalWords,
    summaryWords: originalWords,
    reductionPercentage: 0,
    sentencesKept: 0,
    sentencesTotal: 0,
  };
  if (!clean) return { ...empty, keyPoints: [] };

  // Remember which sentences open a paragraph.
  const sentences: { text: string; opensParagraph: boolean; paragraph: number }[] = [];
  clean.split(/\n\s*\n/).forEach((para, p) => {
    splitSentences(para).forEach((s, i) => sentences.push({ text: s, opensParagraph: i === 0, paragraph: p }));
  });
  const usable = sentences.filter((s) => countWords(s.text) >= 4);
  if (usable.length <= 2) return { ...empty, sentencesKept: usable.length, sentencesTotal: usable.length };

  const freq = new Map<string, number>();
  const sentenceTerms = usable.map((s) => {
    const t = terms(s.text);
    for (const w of t) freq.set(w, (freq.get(w) ?? 0) + 1);
    return t;
  });
  const maxFreq = Math.max(1, ...freq.values());

  const scored = usable.map((s, i) => {
    const t = sentenceTerms[i];
    const unique = new Set(t);
    let score = 0;
    for (const w of unique) score += (freq.get(w) ?? 0) / maxFreq;
    // Divide by sqrt(length): long sentences carry more terms but should not
    // win on length alone, and very short ones rarely stand on their own.
    score /= Math.sqrt(Math.max(t.length, 1));
    if (i === 0) score *= 1.3;
    else if (s.opensParagraph) score *= 1.15;
    if (countWords(s.text) < 7) score *= 0.7;
    // A question is usually a setup for the sentence after it.
    if (s.text.trim().endsWith("?")) score *= 0.75;
    return { index: i, text: s.text, score, set: unique };
  });

  const mode = options.length ?? "medium";
  const ratio = mode === "short" ? 0.2 : mode === "detailed" ? 0.5 : 0.33;
  const cap = mode === "short" ? 3 : mode === "detailed" ? 12 : 6;
  const target = Math.max(1, Math.min(cap, Math.round(usable.length * ratio)));

  // Greedy selection with a redundancy penalty (maximal marginal relevance).
  const chosen: typeof scored = [];
  const pool = [...scored];
  while (chosen.length < target && pool.length) {
    let best = 0;
    let bestValue = -Infinity;
    pool.forEach((c, k) => {
      const overlap = chosen.length ? Math.max(...chosen.map((x) => jaccard(x.set, c.set))) : 0;
      const value = c.score - 0.7 * overlap * c.score;
      if (value > bestValue) {
        bestValue = value;
        best = k;
      }
    });
    chosen.push(pool.splice(best, 1)[0]);
  }
  chosen.sort((a, b) => a.index - b.index);

  const keyPoints = chosen.map((c) => c.text.replace(/^[•\-*\s]+/, "").trim());
  const summary = keyPoints.join(" ");
  const summaryWords = countWords(summary);

  return {
    summary,
    keyPoints,
    originalWords,
    summaryWords,
    reductionPercentage: Math.max(0, Math.round((1 - summaryWords / Math.max(originalWords, 1)) * 100)),
    sentencesKept: chosen.length,
    sentencesTotal: usable.length,
  };
}
