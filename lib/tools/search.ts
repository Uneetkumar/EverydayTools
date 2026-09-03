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
  // sample, demo & testing shorthand
  demo: ["sample", "test", "dummy", "mock", "placeholder", "generator"],
  sample: ["demo", "test", "dummy", "mock", "placeholder", "generator"],
  random: ["generator", "uuid", "password", "sample", "dummy", "hash", "shuffle"],
  test: ["sample", "demo", "dummy", "mock", "diff", "checker", "tester"],
  dummy: ["sample", "demo", "mock", "placeholder", "generator"],
  mock: ["sample", "demo", "dummy", "data", "json", "generator"],
  placeholder: ["sample", "demo", "dummy", "image", "generator"],
  fake: ["sample", "dummy", "mock", "generator"],

  // pdf & document actions
  pdf: ["editor", "merge", "split", "compress", "rotate", "word"],
  edit: ["editor", "modify", "draw", "sign", "crop", "resizer", "diff"],
  editor: ["edit", "draw", "sign", "fill", "form", "text"],
  sign: ["signature", "pdf", "editor"],
  draw: ["editor", "pdf", "draw"],
  form: ["filler", "pdf", "editor", "formfield"],
  fill: ["form", "pdf", "editor"],
  whiteout: ["redact", "erase", "cover", "editor"],

  // media & image actions
  compress: ["compressor", "reduce", "shrink", "size", "kb", "mb", "optimizer"],
  shrink: ["compress", "reduce"],
  reduce: ["compress", "smaller"],
  smaller: ["compress", "reduce"],
  resize: ["resizer", "scale", "dimensions", "width", "height"],
  crop: ["cut", "trim", "image"],
  convert: ["converter", "transform", "export", "format"],
  combine: ["merge", "join"],
  join: ["merge", "combine"],
  divide: ["split", "separate"],
  separate: ["split", "divide"],
  turn: ["rotate", "spin"],
  erase: ["remove", "watermark", "whiteout"],
  delete: ["remove", "audio", "watermark"],
  mute: ["audio", "sound", "silent", "video"],
  cut: ["cutter", "trim", "trimmer", "crop", "split"],
  trim: ["cutter", "crop", "shorten"],

  // currency & finance shorthand
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
  calc: ["calculator", "calculate"],
  calculate: ["calculator"],
  profit: ["margin", "markup", "business"],
  loan: ["emi", "interest", "mortgage"],
  tax: ["gst", "vat"],

  // media formats & shorthand
  photo: ["image", "picture"],
  photos: ["image"],
  pic: ["image"],
  pics: ["image"],
  picture: ["image"],
  img: ["image"],
  jpeg: ["jpg"],
  vid: ["video", "download", "cutter"],
  video: ["download", "stream", "media", "cutter", "player"],
  mp4: ["video", "media", "download", "cutter"],
  webm: ["video", "media", "clip"],
  mov: ["video", "media"],
  audio: ["sound", "voice", "speech", "tts", "mute"],
  voice: ["speech", "audio", "transcriber", "tts"],
  listen: ["speech", "tts", "player"],
  transcribe: ["speech", "voice", "audio", "dictation"],

  // developer & security shorthand
  pw: ["password", "generator"],
  pass: ["password", "generator"],
  qr: ["qrcode", "generator"],
  doc: ["word", "document", "docx"],
  docx: ["word", "document"],
  age: ["birthday", "date", "calculator"],
  emi: ["loan", "calculator"],
  auth: ["jwt", "token", "password"],
  token: ["jwt", "decoder", "auth"],
  guid: ["uuid", "generator"],
  hash: ["sha256", "md5", "generator"],
  diff: ["compare", "comparison", "difference"],
  compare: ["diff", "checker", "text"],
  notes: ["notepad", "scratchpad"],
  note: ["notepad", "text"],

  // new financial & math shortcuts
  sip: ["calculator", "mutual", "investment", "fund", "returns"],
  compound: ["interest", "calculator", "growth", "savings"],
  interest: ["compound", "calculator", "emi", "sip", "loan"],
  bmi: ["calculator", "weight", "body", "mass", "health"],
  weight: ["bmi", "calculator", "ideal", "mass"],
  salary: ["calculator", "ctc", "inhand", "takehome", "tax", "deductions"],
  ctc: ["salary", "calculator", "inhand", "takehome"],
  inhand: ["salary", "calculator", "ctc", "takehome"],
  takehome: ["salary", "calculator", "ctc"],
  breakeven: ["calculator", "profit", "margin", "roi", "business"],
  roi: ["breakeven", "calculator", "profit", "business"],

  // new developer & writing shortcuts
  lorem: ["ipsum", "generator", "placeholder", "dummy", "text"],
  ipsum: ["lorem", "generator", "placeholder", "dummy", "text"],
  slug: ["generator", "url", "seo", "permalink", "title"],
  csv: ["json", "spreadsheet", "excel", "table", "converter"],
  excel: ["csv", "json", "spreadsheet", "table"],
  spreadsheet: ["csv", "json", "table", "excel"],
  regex: ["tester", "debugger", "expression", "matcher", "pattern"],
  regexp: ["regex", "tester", "debugger", "pattern"],
  html: ["entity", "converter", "encoder", "decoder", "escape"],
  entities: ["html", "converter", "encoder", "decoder"],
  color: ["converter", "palette", "hex", "rgb", "hsl", "contrast"],
  hex: ["color", "converter", "rgb", "hsl"],
  rgb: ["color", "converter", "hex", "hsl"],
  hsl: ["color", "converter", "hex", "rgb"],
  cmyk: ["color", "converter", "print"],
  contrast: ["checker", "wcag", "accessibility", "color", "blindness"],
  wcag: ["contrast", "checker", "accessibility", "color"],
  a11y: ["contrast", "checker", "accessibility", "wcag"],
  accessibility: ["contrast", "checker", "wcag"],
  ts: ["typescript", "json", "interface", "generator"],
  typescript: ["json", "interface", "type", "generator"],
  cron: ["explainer", "builder", "schedule", "crontab", "job"],
  crontab: ["cron", "explainer", "builder", "schedule"],
  epoch: ["timestamp", "unix", "converter", "date", "clock"],
  timestamp: ["epoch", "unix", "converter", "date"],
  unix: ["epoch", "timestamp", "converter", "date"],
  utm: ["builder", "campaign", "url", "analytics", "tracking", "cleaner"],
  tracking: ["utm", "builder", "campaign", "url"],
  campaign: ["utm", "builder", "url", "marketing"],
  working: ["days", "calculator", "business", "workdays", "calendar"],
  business: ["days", "working", "calculator", "breakeven", "margin", "profit"],
  workdays: ["working", "days", "calculator", "business"],
  aspect: ["ratio", "calculator", "dimension", "resizer", "16:9", "scale"],
  ratio: ["aspect", "calculator", "dimension", "scale"],
  exif: ["viewer", "image", "metadata", "camera", "photo", "reader"],
  metadata: ["exif", "viewer", "image", "camera"],
  table: ["markdown", "generator", "spreadsheet", "grid", "csv"],
  markdown: ["table", "generator", "notepad", "text"],
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
function scoreTool(tool: ToolDefinition, groups: string[][], rawQuery?: string): number {
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

  // Exact phrase match bonus for multi-word queries
  if (rawQuery) {
    const norm = normalize(rawQuery);
    if (norm.length > 2) {
      if (name.includes(norm)) score += 60;
      else if (keywords.includes(norm)) score += 35;
      else if (blob.includes(norm)) score += 15;
    }
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
    .map((tool) => ({ tool, score: scoreTool(tool, groups, query) }))
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
