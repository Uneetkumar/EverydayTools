/**
 * Zero-Download Client-Side Keyword & Keyphrase Extractor.
 * Extracts ranked unigrams, bigrams, and trigrams using term frequency & lexical position.
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
  "yourself", "yourselves", "also", "just", "like", "using", "make", "get"
]);

export interface KeywordItem {
  keyword: string;
  count: number;
  score: number;
}

export interface KeywordExtractionResult {
  primaryKeywords: KeywordItem[];
  secondaryKeywords: KeywordItem[];
  keyPhrases: string[];
}

export function extractKeywordsLocally(
  text: string,
  topN: number = 10
): KeywordExtractionResult {
  const clean = text.trim();
  if (!clean) {
    return { primaryKeywords: [], secondaryKeywords: [], keyPhrases: [] };
  }

  // Tokenize words
  const words = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const totalWords = words.length;
  const wordFreq: Record<string, number> = {};

  // 1. Unigram frequency
  for (const word of words) {
    if (!STOPWORDS.has(word) && !/^\d+$/.test(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // 2. Bigrams & Trigrams for key phrases
  const phraseFreq: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];

    if (!STOPWORDS.has(w1) && !STOPWORDS.has(w2)) {
      const bigram = `${w1} ${w2}`;
      phraseFreq[bigram] = (phraseFreq[bigram] || 0) + 1;
    }

    if (i < words.length - 2) {
      const w3 = words[i + 2];
      if (!STOPWORDS.has(w1) && !STOPWORDS.has(w3)) {
        const trigram = `${w1} ${w2} ${w3}`;
        phraseFreq[trigram] = (phraseFreq[trigram] || 0) + 1;
      }
    }
  }

  // Rank keywords by TF-IDF proxy
  const rankedKeywords: KeywordItem[] = Object.entries(wordFreq)
    .map(([keyword, count]) => {
      const tf = count / Math.max(totalWords, 1);
      const score = Math.round(tf * 100 * Math.log(count + 1) * 10) / 10;
      return { keyword, count, score };
    })
    .sort((a, b) => b.count - a.count || b.score - a.score);

  const primary = rankedKeywords.slice(0, Math.ceil(topN / 2));
  const secondary = rankedKeywords.slice(Math.ceil(topN / 2), topN);

  const keyPhrases = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([phrase]) => phrase);

  return {
    primaryKeywords: primary,
    secondaryKeywords: secondary,
    keyPhrases,
  };
}
