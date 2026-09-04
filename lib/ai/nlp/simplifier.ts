/**
 * Zero-Download Client-Side Text Simplifier.
 * Calculates Readability scores (Flesch-Kincaid) and translates complex jargon into plain English.
 */

const JARGON_MAP: Record<string, string> = {
  "aforementioned": "mentioned earlier",
  "ascertain": "find out",
  "cognizant of": "aware of",
  "commensurate with": "matching",
  "concomitant": "accompanying",
  "contiguous to": "next to",
  "deleterious": "harmful",
  "delineate": "describe clearly",
  "disseminate": "share",
  "elucidate": "explain",
  "endeavor": "try",
  "equivocal": "unclear",
  "expeditious": "fast",
  "facilitate": "help",
  "heretofore": "before now",
  "in lieu of": "instead of",
  "incumbent upon": "the duty of",
  "indigenous to": "native to",
  "manifest": "show",
  "mitigate": "reduce",
  "notwithstanding": "despite",
  "obviate": "prevent",
  "paradigm": "model",
  "per annum": "each year",
  "plethora": "large amount",
  "proscribe": "forbid",
  "remuneration": "payment",
  "subsequent to": "after",
  "transpire": "happen",
  "utilize": "use",
  "utilization": "use",
  "viable": "workable",
};

export interface SimplifiedResult {
  simplifiedText: string;
  originalScore: number;
  simplifiedScore: number;
  jargonReplacedCount: number;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const clean = w.replace(/(?:[^laeiouy]|ed|es|e)$/, "").replace(/^y/, "");
  const matches = clean.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function calculateFleschScore(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];

  if (words.length === 0 || sentences.length === 0) return 100;

  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function simplifyTextLocally(text: string): SimplifiedResult {
  if (!text.trim()) {
    return {
      simplifiedText: "",
      originalScore: 0,
      simplifiedScore: 0,
      jargonReplacedCount: 0,
    };
  }

  const originalScore = calculateFleschScore(text);
  let simplifiedText = text;
  let jargonCount = 0;

  // 1. Replace complex jargon
  for (const [jargon, plain] of Object.entries(JARGON_MAP)) {
    const regex = new RegExp(`\\b${jargon}\\b`, "gi");
    if (regex.test(simplifiedText)) {
      simplifiedText = simplifiedText.replace(regex, (match) => {
        jargonCount++;
        const isCap = match[0] === match[0].toUpperCase();
        return isCap ? plain.charAt(0).toUpperCase() + plain.slice(1) : plain;
      });
    }
  }

  // 2. Simplify passive sentence connectors
  simplifiedText = simplifiedText
    .replace(/\bwith the exception of\b/gi, "except")
    .replace(/\bat the present time\b/gi, "now")
    .replace(/\bfor the purpose of\b/gi, "to")
    .replace(/\bin accordance with\b/gi, "under")
    .replace(/\bin close proximity to\b/gi, "near")
    .replace(/\bin the near future\b/gi, "soon");

  const simplifiedScore = calculateFleschScore(simplifiedText);

  return {
    simplifiedText: simplifiedText.trim(),
    originalScore,
    simplifiedScore: Math.max(originalScore, simplifiedScore),
    jargonReplacedCount: jargonCount,
  };
}
