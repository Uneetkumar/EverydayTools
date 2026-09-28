/**
 * On-device tone edits.
 *
 * This is a rule-based editor, not a language model: it cannot restructure a
 * paragraph, but every edit it makes is one that is safe in context, and each
 * is reported so the user can see exactly what changed. The earlier version
 * swapped common words for "formal" ones regardless of meaning ("talk about"
 * became "discuss approximately", "check out" became "verify out"); those
 * rules are gone.
 */

import { PLAIN_WORDS, WORDY_PHRASES, word } from "./plain-language";
import { Change, Rule, applyRules, tidy } from "./text";

export type ToneType = "professional" | "friendly" | "concise" | "formal" | "casual" | "simple";

export interface RewriteResult {
  text: string;
  changes: Change[];
}

const A = "['’]";

/** Contractions → full forms. "he's"/"she's" are skipped: is or has? */
const EXPAND: Rule[] = (
  [
    ["can't", "cannot"],
    ["won't", "will not"],
    ["shan't", "shall not"],
    ["don't", "do not"],
    ["doesn't", "does not"],
    ["didn't", "did not"],
    ["isn't", "is not"],
    ["aren't", "are not"],
    ["wasn't", "was not"],
    ["weren't", "were not"],
    ["haven't", "have not"],
    ["hasn't", "has not"],
    ["hadn't", "had not"],
    ["wouldn't", "would not"],
    ["shouldn't", "should not"],
    ["couldn't", "could not"],
    ["mustn't", "must not"],
    ["I'm", "I am"],
    ["I've", "I have"],
    ["I'll", "I will"],
    ["I'd", "I would"],
    ["you're", "you are"],
    ["you've", "you have"],
    ["you'll", "you will"],
    ["we're", "we are"],
    ["we've", "we have"],
    ["we'll", "we will"],
    ["they're", "they are"],
    ["they've", "they have"],
    ["they'll", "they will"],
    ["it's", "it is"],
    ["that's", "that is"],
    ["there's", "there is"],
    ["here's", "here is"],
    ["what's", "what is"],
    ["who's", "who is"],
    ["let's", "let us"],
  ] as [string, string][]
).map(([from, to]) => [new RegExp(`\\b${from.replace("'", A)}(?![\\w'’])`, "gi"), to]);

/**
 * Full forms → contractions, only where a contraction is grammatical: never at
 * the end of a clause ("that's what it is" cannot become "…what it's").
 */
const CONTRACT: Rule[] = (
  [
    ["do not", "don't"],
    ["does not", "doesn't"],
    ["did not", "didn't"],
    ["is not", "isn't"],
    ["are not", "aren't"],
    ["was not", "wasn't"],
    ["were not", "weren't"],
    ["have not", "haven't"],
    ["has not", "hasn't"],
    ["cannot", "can't"],
    ["will not", "won't"],
    ["would not", "wouldn't"],
    ["should not", "shouldn't"],
    ["could not", "couldn't"],
    ["I am", "I'm"],
    ["I will", "I'll"],
    ["you are", "you're"],
    ["you will", "you'll"],
    ["we are", "we're"],
    ["we will", "we'll"],
    ["they are", "they're"],
    ["they will", "they'll"],
    ["it is", "it's"],
    ["that is", "that's"],
    ["there is", "there's"],
  ] as [string, string][]
).map(([from, to]) => [new RegExp(`\\b${from.replace(" ", "\\s+")}\\b(?=\\s+[\\p{L}])`, "giu"), to]);

/** Chat shorthand and slang that reads as careless in business writing. */
const SLANG: Rule[] = [
  [word("gonna"), "going to"],
  [word("wanna"), "want to"],
  [word("gotta"), "have to"],
  [word("kinda"), "kind of"],
  [word("sorta"), "sort of"],
  [word("dunno"), "don't know"],
  [word("lemme"), "let me"],
  [word("gimme"), "give me"],
  [word("yeah"), "yes"],
  [word("yep"), "yes"],
  [word("nope"), "no"],
  [word("pls"), "please"],
  [word("plz"), "please"],
  [word("thx"), "thanks"],
  [word("btw"), "by the way"],
  [word("fyi"), "for your information"],
  [word("imo"), "in my opinion"],
  [word("tbh"), "to be honest"],
  [word("idk"), "I don't know"],
  // Lower-case and standalone only: "U-turn" and the R language stay put.
  [/(?<=^|\s)u(?=\s)/g, "you"],
  [/(?<=^|\s)ur(?=\s)/g, "your"],
  [word("1-on-1"), "one-to-one"],
  [/\bhey(?:\s+there)?\b/gi, "hello"],
  [/\bthanks a lot\b/gi, "thank you very much"],
  [/\bthanks\b/gi, "thank you"],
];

/** Words that add nothing in professional writing. */
const FILLERS: Rule[] = [
  [/\b(?:basically|actually|literally)\s+(?=\p{L})/giu, ""],
  // "just" only where it is padding ("I just wanted to…"), not where it
  // means "only" ("just $5") or "exactly" ("just in time").
  [/\bjust\s+(?=(?:wanted|want|checking|following|thought|wondering)\b)/gi, ""],
  [/\bhonestly,\s*/gi, ""],
  [/,?\s*\byou know\b,?/gi, ""],
  [/\bI mean,\s*/gi, ""],
];

/** Warmer openings and sign-offs for the friendly and casual tones. */
const WARM: Rule[] = [
  [/\bdear sir(?:\s*\/\s*|\s+or\s+)madam\b/gi, "Hi there"],
  [/\bto whom it may concern\b/gi, "Hello"],
  [/\b(?:kind\s+|best\s+)?regards,/gi, "Best,"],
  [/\byours (?:sincerely|faithfully),/gi, "Thanks,"],
  [/\bsincerely,/gi, "Thanks,"],
  [/\bwe regret to inform you that\s+/gi, "Unfortunately, "],
  [/\bplease do not hesitate to contact (?:us|me)\b/gi, "feel free to get in touch"],
  [/\bat your earliest convenience\b/gi, "when you can"],
  [/\bthank you for your cooperation\b/gi, "thanks for your help"],
  [/\bplease find attached\b/gi, "I've attached"],
];

/** Everyday alternatives for stiff words, used by the casual tone. */
const EVERYDAY: Rule[] = [
  // Sentence-initial only: "The plan, however, failed" must stay intact.
  [/(^|[.!?]\s+)However,\s+/g, (_m, lead: string) => `${lead}But `],
  [word("approximately"), "about"],
  [word("sufficient"), "enough"],
  [word("commence"), "start"],
  [word("assist"), "help"],
  [word("inquire"), "ask"],
  [word("utilize"), "use"],
  [word("obtain"), "get"],
  [word("require"), "need"],
  [word("requires"), "needs"],
];

/** More than one "!" in a row, and "!" in formal text, become one full stop. */
const CALM_PUNCTUATION: Rule[] = [[/!{2,}/g, "!"], [/\?{2,}/g, "?"]];
const NO_EXCLAMATION: Rule[] = [[/!(?=\s|$)/g, "."]];

const RULES: Record<ToneType, Rule[][]> = {
  professional: [SLANG, FILLERS, CALM_PUNCTUATION],
  formal: [SLANG, FILLERS, EXPAND, WORDY_PHRASES, CALM_PUNCTUATION, NO_EXCLAMATION],
  friendly: [WARM, CONTRACT],
  casual: [WARM, EVERYDAY, WORDY_PHRASES, CONTRACT],
  concise: [FILLERS, WORDY_PHRASES, [[/\bvery\s+(?=\p{L})/giu, ""], [/\bin my opinion,?\s*/gi, ""], [/\bI think that\s+/gi, ""]]],
  simple: [WORDY_PHRASES, PLAIN_WORDS],
};

export function rewriteWithChanges(text: string, tone: ToneType = "professional"): RewriteResult {
  if (!text.trim()) return { text: "", changes: [] };
  const changes: Change[] = [];
  let out = text;
  for (const rules of RULES[tone]) out = applyRules(out, rules, changes);
  return { text: tidy(out), changes };
}

/** Kept for existing imports. */
export function rewriteTextLocally(text: string, tone: ToneType = "professional"): string {
  return rewriteWithChanges(text, tone).text;
}
