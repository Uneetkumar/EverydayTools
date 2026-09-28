/**
 * On-device plain-English pass.
 *
 * Replaces wordy phrases and formal words with plain ones, splits sentences
 * joined by semicolons, and measures readability before and after. The
 * scores are reported as measured — an earlier version reported the higher
 * of the two, so the result could never look worse than the input.
 */

import { PLAIN_WORDS, WORDY_PHRASES } from "./plain-language";
import { Change, Readability, applyRules, readability, tidy } from "./text";

export interface SimplifiedResult {
  simplifiedText: string;
  before: Readability;
  after: Readability;
  changes: Change[];
  /** Kept for callers that read the old field names. */
  originalScore: number;
  simplifiedScore: number;
  jargonReplacedCount: number;
}

export function simplifyTextLocally(text: string): SimplifiedResult {
  const before = readability(text);
  if (!text.trim()) {
    return {
      simplifiedText: "",
      before,
      after: before,
      changes: [],
      originalScore: 0,
      simplifiedScore: 0,
      jargonReplacedCount: 0,
    };
  }

  const changes: Change[] = [];
  let out = applyRules(text, WORDY_PHRASES, changes);
  out = applyRules(out, PLAIN_WORDS, changes);

  // "…first clause; second clause" reads more easily as two sentences.
  out = out.replace(/;\s+(\p{Ll})/gu, (m, c: string) => {
    changes.push({ from: ";", to: "." });
    return `. ${c.toUpperCase()}`;
  });

  out = tidy(out);
  const after = readability(out);
  return {
    simplifiedText: out,
    before,
    after,
    changes,
    originalScore: before.ease,
    simplifiedScore: after.ease,
    jargonReplacedCount: changes.length,
  };
}

/** Kept for existing imports. */
export function calculateFleschScore(text: string): number {
  return readability(text).ease;
}
