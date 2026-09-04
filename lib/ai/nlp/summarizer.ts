/**
 * Zero-Download Client-Side Text Summarizer using Lexical Scoring & TextRank Heuristics.
 * Runs 100% in browser memory with 0ms delay and zero server cost.
 */

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
  "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves"
]);

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
}

export function summarizeTextLocally(
  text: string,
  options: SummarizerOptions = {}
): SummaryResult {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      summary: "",
      keyPoints: [],
      originalWords: 0,
      summaryWords: 0,
      reductionPercentage: 0,
    };
  }

  // 1. Split into sentences
  const sentenceRegex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
  const rawSentences = cleanText.match(sentenceRegex) || [cleanText];
  const sentences = rawSentences
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  if (sentences.length <= 2) {
    return {
      summary: cleanText,
      keyPoints: [cleanText],
      originalWords: wordCount,
      summaryWords: wordCount,
      reductionPercentage: 0,
    };
  }

  // 2. Compute Word Frequency
  const wordFreq: Record<string, number> = {};
  const words = cleanText.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);

  for (const word of words) {
    if (word && !STOPWORDS.has(word) && word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // Max frequency for normalization
  const maxFreq = Math.max(...Object.values(wordFreq), 1);
  for (const w in wordFreq) {
    wordFreq[w] = wordFreq[w] / maxFreq;
  }

  // 3. Score Sentences with Position and Length Bonuses
  const scoredSentences = sentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    let score = 0;

    for (const w of sWords) {
      if (wordFreq[w]) {
        score += wordFreq[w];
      }
    }

    // Normalize by sentence length to avoid bias toward long sentences
    score = score / Math.max(sWords.length, 1);

    // Position bonus: First sentence and last sentence carry high information value
    if (index === 0) score *= 1.35;
    if (index === sentences.length - 1) score *= 1.15;
    if (index === 1) score *= 1.1;

    return { sentence, score, index };
  });

  // 4. Determine target sentence count based on length option
  const mode = options.length || "medium";
  let targetCount = Math.max(1, Math.round(sentences.length * 0.35));
  if (mode === "short") {
    targetCount = Math.max(1, Math.min(3, Math.round(sentences.length * 0.2)));
  } else if (mode === "detailed") {
    targetCount = Math.max(2, Math.round(sentences.length * 0.55));
  }

  // Pick top scoring sentences and reorder them by original document index
  const topSentences = [...scoredSentences]
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.index - b.index);

  const summary = topSentences.map((s) => s.sentence).join(" ");
  const keyPoints = topSentences.map((s) => s.sentence.replace(/^[•\-\s]+/, "").trim());
  const summaryWords = summary.split(/\s+/).filter(Boolean).length;
  const reductionPercentage = Math.round(
    Math.max(0, ((wordCount - summaryWords) / wordCount) * 100)
  );

  return {
    summary,
    keyPoints,
    originalWords: wordCount,
    summaryWords,
    reductionPercentage,
  };
}
