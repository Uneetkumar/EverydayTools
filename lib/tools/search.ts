import { ToolDefinition } from "./registry";

/**
 * Shared tool search.
 *
 * Replaces `field.includes(wholeQuery)`, which could only ever match a query
 * that appeared verbatim in one field. "rs to" matched nothing, because no
 * field contains that exact string — every multi-word query failed the same
 * way. This tokenises instead: each word must match, so typing more words
 * narrows the results rather than eliminating them.
 */

/** Symbols must be mapped before punctuation is stripped. */
const SYMBOL_WORDS: Record<string, string> = {
  "₹": " rupee inr ",
  "$": " dollar usd ",
  "€": " euro eur ",
  "£": " pound gbp ",
  "¥": " yen jpy ",
  "%": " percent percentage ",
};

/**
 * Query-side synonyms. Keyed by the word a user types, valued by extra terms
 * folded into the search. Only applied to the query, never to the index, so
 * the tool definitions stay readable.
 */
const ALIASES: Record<string, string[]> = {
  // currency shorthand
  rs: ["rupee", "inr"],
  inr: ["rupee"],
  rupees: ["rupee"],
  usd: ["dollar"],
  dollars: ["dollar"],
  buck: ["dollar"],
  eur: ["euro"],
  gbp: ["pound"],
  aed: ["dirham"],
  sar: ["riyal"],
  jpy: ["yen"],
  forex: ["currency", "exchange"],
  fx: ["currency", "exchange"],
  money: ["currency"],
  // media shorthand
  photo: ["image", "picture"],
  photos: ["image"],
  pic: ["image"],
  pics: ["image"],
  picture: ["image"],
  img: ["image"],
  jpeg: ["jpg"],
  vid: ["video", "download"],
  video: ["download", "stream", "media"],
  mp4: ["video", "media"],
  webm: ["video", "media"],
  mov: ["video", "media"],
  stream: ["video", "download"],
  // action shorthand
  shrink: ["compress", "reduce"],
  reduce: ["compress"],
  smaller: ["compress"],
  resize: ["resizer", "scale"],
  combine: ["merge"],
  join: ["merge"],
  divide: ["split"],
  separate: ["split"],
  turn: ["rotate"],
  erase: ["remove"],
  delete: ["remove"],
  // misc shorthand
  pw: ["password"],
  pass: ["password"],
  qr: ["qrcode"],
  doc: ["word", "document"],
  docx: ["word"],
  age: ["birthday"],
  emi: ["loan"],
};

/**
 * Connector words carry no intent and appear in half the tool names
 * ("pdf to word", "image to pdf"). Left in, a query like "rs to" would match
 * every one of them on the word "to" alone.
 */
const STOPWORDS = new Set([
  "to", "from", "in", "into", "of", "the", "a", "an", "and", "or",
  "for", "my", "me", "i", "is", "it", "with", "on", "at", "convert",
]);

function normalize(text: string): string {
  let out = text.toLowerCase();
  for (const [symbol, words] of Object.entries(SYMBOL_WORDS)) {
    out = out.split(symbol).join(words);
  }
  // Hyphens and slashes become spaces so "pdf-to-word" indexes as three words.
  return out.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Everything about a tool that should be searchable, as one normalized blob. */
function buildBlob(tool: ToolDefinition): string {
  return normalize(
    [
      tool.name,
      tool.shortName,
      tool.slug,
      tool.description,
      tool.categoryName,
      tool.category,
      tool.keywords.join(" "),
      tool.features.join(" "),
    ].join(" ")
  );
}

const blobCache = new WeakMap<ToolDefinition, string>();
function getBlob(tool: ToolDefinition): string {
  let blob = blobCache.get(tool);
  if (!blob) {
    blob = buildBlob(tool);
    blobCache.set(tool, blob);
  }
  return blob;
}

/**
 * Expands a query into one group per typed word, each holding that word plus
 * its synonyms.
 *
 * Grouping is what makes extra words narrow the results. A flat token list
 * cannot: "rs" only matches via its alias "rupee", so requiring every token
 * would reject it, while requiring any token would let "pdf to word" match
 * every PDF tool. Requiring one hit per group gives both — "rs" matches
 * through its own group, and "pdf word" must satisfy the pdf group and the
 * word group.
 */
export function tokenize(query: string): string[][] {
  const raw = normalize(query).split(" ").filter(Boolean);
  // Keep stopwords only if the query is nothing but stopwords, so searching
  // literally for "to" still does something rather than nothing.
  const meaningful = raw.filter((t) => !STOPWORDS.has(t));
  const base = meaningful.length > 0 ? meaningful : raw;

  return base.map((token) => [token, ...(ALIASES[token] ?? [])]);
}

/**
 * Whole-word prefix match, so a token matches as the user is still typing
 * ("wor" finds "word") without "at" matching inside "formatter".
 */
function blobHasToken(blob: string, token: string): boolean {
  if (!token) return true;
  return blob === token
    || blob.startsWith(token + " ")
    || blob.includes(" " + token);
}

/** Returns 0 when any group is unmatched, so every typed word must land. */
function scoreTool(tool: ToolDefinition, groups: string[][]): number {
  if (groups.length === 0) return 0;
  const blob = getBlob(tool);
  const name = normalize(`${tool.name} ${tool.shortName} ${tool.slug}`);
  const keywords = normalize(tool.keywords.join(" "));
  const category = normalize(`${tool.categoryName} ${tool.category}`);

  let score = 0;
  for (const group of groups) {
    // Best hit within the group; synonyms score slightly lower than the word
    // the user actually typed, so literal matches rank above inferred ones.
    let best = 0;
    group.forEach((token, index) => {
      const penalty = index === 0 ? 0 : 2;
      let hit = 0;
      if (blobHasToken(name, token)) hit = 40;
      else if (blobHasToken(keywords, token)) hit = 20;
      else if (blobHasToken(category, token)) hit = 12;
      else if (blobHasToken(blob, token)) hit = 6;
      if (hit > 0) best = Math.max(best, hit - penalty);
    });
    if (best === 0) return 0;
    score += best;
  }
  return score;
}

/**
 * Ranked search. Results must match at least one meaningful token; tools
 * matching more tokens rank higher, so extra words narrow the list.
 */
export function searchTools(
  tools: ToolDefinition[],
  query: string,
  limit?: number
): ToolDefinition[] {
  const groups = tokenize(query);
  if (groups.length === 0) return limit ? tools.slice(0, limit) : tools;

  const scored = tools
    .map((tool) => ({ tool, score: scoreTool(tool, groups) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Stable, predictable ordering for equal scores.
      if (!!b.tool.isPopular !== !!a.tool.isPopular) {
        return a.tool.isPopular ? -1 : 1;
      }
      return a.tool.name.localeCompare(b.tool.name);
    })
    .map((entry) => entry.tool);

  return limit ? scored.slice(0, limit) : scored;
}
