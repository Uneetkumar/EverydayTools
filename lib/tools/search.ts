/**
 * Shared tool search.
 *
 * Replaces `field.includes(wholeQuery)`, which could only ever match a query
 * that appeared verbatim in one field. "rs to" matched nothing, because no
 * field contains that exact string — every multi-word query failed the same
 * way. This tokenises instead: each word must match, so typing more words
 * narrows the results rather than eliminating them.
 *
 * It runs against the full registry on the server and against the slim
 * /tool-index.json in the browser, so it only depends on the fields below.
 */

export interface SearchableTool {
  slug: string;
  name: string;
  shortName: string;
  tagline?: string;
  description: string;
  category: string;
  categoryName: string;
  keywords: string[];
  aliases?: string[];
  features?: string[];
  isPopular?: boolean;
  /** Prominence, lower first. Only used to order equally good matches. */
  searchRank?: number;
}

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
 * the tool definitions stay readable. Per-tool phrasings live in each tool's
 * `aliases` in the registry instead.
 */
const ALIASES: Record<string, string[]> = {
  // random-choice verbs: "toss dice", "throw a coin", "flip a die"
  toss: ["roll", "flip", "throw"],
  throw: ["roll", "toss", "flip"],

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
  compress: ["compressor", "reduce", "shrink", "kb", "mb", "optimizer"],
  shrink: ["compress", "reduce"],
  reduce: ["compress", "smaller"],
  smaller: ["compress", "reduce"],
  size: ["compress", "resize", "resizer", "dimensions", "kb"],
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

  // dates & time
  date: ["age", "days", "calendar", "timestamp", "birthday", "difference"],
  dates: ["date", "days", "calendar", "difference"],
  day: ["days", "date", "calendar"],
  time: ["timer", "stopwatch", "timestamp", "clock", "hours"],
  birthday: ["age", "birth"],

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

  // financial & math shortcuts
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

  // developer & writing shortcuts
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

  // simple / basic calculator shortcuts
  simple: ["calculator", "basic", "standard", "math"],
  basic: ["simple", "calculator", "standard", "math"],
  standard: ["simple", "calculator", "basic", "math"],
  math: ["calculator", "simple", "basic", "standard"],
};

/** British spellings map onto the spelling the index uses. */
const SPELLING: Record<string, string> = {
  colour: "color",
  colours: "colors",
  summarise: "summarize",
  summariser: "summarizer",
  optimise: "optimize",
  optimiser: "optimizer",
  organise: "organize",
  analyse: "analyze",
  centre: "center",
};

/**
 * Connector words carry no intent and appear in half the tool names
 * ("pdf to word", "image to pdf"). Left in, a query like "rs to" would match
 * every one of them on the word "to" alone.
 */
const STOPWORDS = new Set([
  "to", "from", "in", "into", "of", "the", "a", "an", "and", "or",
  "for", "my", "me", "i", "is", "it", "with", "on", "at", "convert",
  "how", "can", "do", "online", "free", "tool",
]);

export function normalize(text: string): string {
  let out = text.toLowerCase();
  for (const [symbol, words] of Object.entries(SYMBOL_WORDS)) {
    out = out.split(symbol).join(words);
  }
  // Hyphens and slashes become spaces so "pdf-to-word" indexes as three words.
  return out.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

interface Indexed {
  blob: string;
  name: string;
  keywords: string;
  category: string;
}

/** Everything about a tool that should be searchable, normalized once. */
const indexCache = new WeakMap<SearchableTool, Indexed>();
function getIndexed(tool: SearchableTool): Indexed {
  let idx = indexCache.get(tool);
  if (!idx) {
    const aliases = (tool.aliases ?? []).join(" ");
    idx = {
      name: normalize(`${tool.name} ${tool.shortName} ${tool.slug}`),
      keywords: normalize(`${tool.keywords.join(" ")} ${aliases}`),
      category: normalize(`${tool.categoryName} ${tool.category}`),
      blob: normalize(
        [
          tool.name,
          tool.shortName,
          tool.slug,
          tool.tagline ?? "",
          tool.description,
          tool.categoryName,
          tool.category,
          tool.keywords.join(" "),
          aliases,
          (tool.features ?? []).join(" "),
        ].join(" ")
      ),
    };
    indexCache.set(tool, idx);
  }
  return idx;
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
  const raw = normalize(query)
    .split(" ")
    .filter(Boolean)
    .map((t) => SPELLING[t] ?? t);
  // Keep stopwords only if the query is nothing but stopwords, so searching
  // literally for "to" still does something rather than nothing.
  const meaningful = raw.filter((t) => !STOPWORDS.has(t));
  const base = meaningful.length > 0 ? meaningful : raw;

  const heads = new Set(base);
  return base.map((token) => [
    token,
    ...(ALIASES[token] ?? []).filter(
      // A synonym that is itself another typed word would let one piece of
      // evidence satisfy two groups ("fill pdf form" → every PDF tool).
      // Generic nouns ("converter") match half the catalogue, so they are
      // only kept for explicit abbreviations like "calc".
      (syn) => !heads.has(syn) && (!GENERIC.has(syn) || ABBREVIATIONS.has(token))
    ),
  ]);
}

const GENERIC = new Set([
  "converter", "calculator", "generator", "checker", "tester", "builder",
  "viewer", "explainer", "decoder", "encoder", "reader", "maker", "cleaner",
  "debugger", "matcher",
]);
const ABBREVIATIONS = new Set(["calc", "calculate", "simple", "basic", "standard", "math"]);

/**
 * Whole-word prefix match, so a token matches as the user is still typing
 * ("wor" finds "word") without "at" matching inside "formatter".
 */
function hasToken(text: string, token: string): boolean {
  if (!token) return true;
  return text === token || text.startsWith(token + " ") || text.includes(" " + token) || text.startsWith(token);
}

/** 2 = the token is a whole word in `text`, 1 = it starts a word, 0 = neither. */
function wordMatch(text: string, token: string): 0 | 1 | 2 {
  const padded = ` ${text} `;
  if (padded.includes(` ${token} `)) return 2;
  return padded.includes(` ${token}`) ? 1 : 0;
}

/* ---------------------------------------------------------------------------
   Typo tolerance

   A word that matches nothing anywhere is compared against the index
   vocabulary; words within a small edit distance are added to its group at a
   lower score. "comprss", "pasword" and "calculater" all land. Short words
   get one edit at most, and only when they matched nothing at all.
--------------------------------------------------------------------------- */
const vocabCache = new WeakMap<readonly SearchableTool[], string[]>();
function getVocab(tools: readonly SearchableTool[]): string[] {
  let vocab = vocabCache.get(tools);
  if (!vocab) {
    const set = new Set<string>();
    for (const t of tools) for (const w of getIndexed(t).blob.split(" ")) if (w.length >= 3) set.add(w);
    vocab = [...set];
    vocabCache.set(tools, vocab);
  }
  return vocab;
}

/** Optimal-string-alignment distance, bailing out once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

function typoCandidates(token: string, vocab: string[]): string[] {
  if (token.length < 3 || /^\d+$/.test(token)) return [];
  const max = token.length >= 8 ? 2 : 1;
  const hits: Array<[number, string]> = [];
  for (const word of vocab) {
    // Compare against the word's prefix too, so a misspelt partial word
    // ("compres" typed as "comrpes") still finds "compressor".
    const d = Math.min(
      editDistance(token, word, max),
      word.length > token.length ? editDistance(token, word.slice(0, token.length), max) : max + 1
    );
    if (d <= max) hits.push([d, word]);
  }
  return hits.sort((a, b) => a[0] - b[0]).slice(0, 6).map(([, w]) => w);
}

/**
 * Adds typo corrections to groups that matched nothing, and returns the query
 * as the user meant it ("calculater" → "calculator"), which the name bonuses
 * below compare against.
 */
function withTypos(groups: string[][], tools: readonly SearchableTool[]): { groups: string[][]; corrected: string } {
  const words: string[] = [];
  const out = groups.map((group) => {
    const anyHit = tools.some((t) => group.some((tok) => hasToken(getIndexed(t).blob, tok)));
    if (anyHit) {
      words.push(group[0]);
      return group;
    }
    const fixes = typoCandidates(group[0], getVocab(tools));
    words.push(fixes[0] ?? group[0]);
    return fixes.length ? [...group, ...fixes] : group;
  });
  return { groups: out, corrected: words.join(" ") };
}

/**
 * How closely a tool's own name matches the whole query. This is what puts
 * the basic Calculator first for "calculator" or "calc", Age Calculator first
 * for "age", and Word Counter first for "word": the tool whose name IS, or
 * STARTS WITH, what was typed beats tools that merely mention it.
 */
function nameBonus(tool: SearchableTool, phrase: string): number {
  if (!phrase) return 0;
  // The URL slug only confirms a match. Counted at full weight it let "Merge PDF"
  // claim to START with "pdf" because its slug is pdf-merge, and outrank tools
  // that really are named "PDF to ...".
  const names: Array<[string, number]> = [
    [normalize(tool.name), 1],
    [normalize(tool.shortName), 1],
    [normalize(tool.slug), 0.5],
  ];
  let best = 0;
  for (const [n, weight] of names) {
    let b = 0;
    if (n === phrase) b = 300;
    else if (n.startsWith(phrase + " ")) b = 140;
    else if (n.startsWith(phrase)) b = 120;
    else if (` ${n} `.includes(` ${phrase} `)) b = 60;
    else if (` ${n}`.includes(` ${phrase}`)) b = 40;
    best = Math.max(best, b * weight);
  }
  return best;
}

/* ---------------------------------------------------------------------------
   Conversions: "pdf to word", "png to", "json to c"

   "X to Y" is not a bag of words. "to" says which side is the source, so
   "pdf to" asks for tools that START from a PDF, and Merge PDF, which merely
   mentions PDFs, is not one of them. The same holds while the target is half
   typed: "pdf to i" is heading for "image", so PDF to JPG must beat every tool
   that only contains the word "pdf". Treating "to" and "i" as filler words, as
   the plain tokeniser does, collapsed "pdf to i" into "pdf" and lost all of it.

   Each tool's conversions are read from its own name, aliases and keywords
   ("PDF to Word Converter", "pdf to docx", "word to pdf"), so a tool that does
   both directions is found from either end.
--------------------------------------------------------------------------- */

interface Conversion {
  from: string[];
  to: string[];
}

const SPLIT_WORDS = new Set(["to", "into", "2"]);
/** Words that lead a request without naming the source: "how to convert pdf to ...". */
const LEAD_FILLER = new Set(["convert", "free", "online", "how", "to", "turn", "change", "make", "save", "export", "can", "i", "you", "do", "a", "an", "the", "my", "quickly", "easily"]);
/** Words that trail a target without naming it: "... word converter". */
const TRAIL_FILLER = new Set(["converter", "conversion", "convert", "tool", "tools", "online", "free", "generator", "maker", "changer", "file", "files"]);
/** Words typed after "to" that mean nothing yet: "pdf to the". */
const TARGET_NOISE = new Set(["the", "a", "an", "my", "your", "this", "that", "it", "file", "files", "format", "formats", "online", "free"]);

/**
 * A listed phrase that opens with one of these does something TO a file rather
 * than converting between formats: "add text to pdf", "insert page numbers into
 * document". Reading those as "text → pdf" made PDF Editor look like a converter.
 */
const ACTION_VERBS = new Set([
  "add", "insert", "stamp", "attach", "sign", "fill", "edit", "draw", "reduce", "compress", "resize",
  "extract", "remove", "merge", "split", "combine", "join", "copy", "upload", "download", "send",
  "move", "apply", "set", "go", "print", "share", "link", "number",
]);

/** A typed or listed word also matches these: "image" is what people say for jpg, png and webp. */
const FORMAT_SYNONYMS: Record<string, string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "svg", "gif"],
  images: ["jpg", "jpeg", "png", "webp", "svg", "gif"],
  photo: ["image", "jpg", "jpeg", "png"],
  photos: ["image", "jpg", "jpeg", "png"],
  picture: ["image", "jpg", "jpeg", "png"],
  pictures: ["image", "jpg", "jpeg", "png"],
  jpeg: ["jpg"],
  doc: ["word", "docx"],
  docx: ["word", "doc"],
  word: ["docx", "doc"],
  document: ["word", "docx", "pdf"],
  excel: ["csv", "xlsx"],
  spreadsheet: ["csv", "xlsx"],
};

function splitConversion(words: string[]): Conversion | null {
  // The last "to": "how to convert pdf to word" converts to "word", not to "convert".
  let at = -1;
  for (let i = words.length - 1; i >= 1; i--) {
    if (SPLIT_WORDS.has(words[i])) {
      at = i;
      break;
    }
  }
  if (at < 1) return null;
  const from = words.slice(0, at);
  const to = words.slice(at + 1);
  while (from.length && LEAD_FILLER.has(from[0])) from.shift();
  if (from.length === 0) return null;
  while (to.length && TARGET_NOISE.has(to[0])) to.shift();
  while (to.length && TRAIL_FILLER.has(to[to.length - 1])) to.pop();
  return { from, to };
}

function parseTypedConversion(query: string): Conversion | null {
  return splitConversion(normalize(query).split(" ").filter(Boolean));
}

const conversionCache = new WeakMap<SearchableTool, Conversion[]>();
function toolConversions(tool: SearchableTool): Conversion[] {
  let list = conversionCache.get(tool);
  if (list) return list;
  const seen = new Set<string>();
  list = [];
  for (const phrase of [tool.name, tool.shortName, ...(tool.aliases ?? []), ...tool.keywords]) {
    const c = splitConversion(normalize(phrase).split(" ").filter(Boolean));
    if (!c || c.to.length === 0 || ACTION_VERBS.has(c.from[0])) continue;
    const key = `${c.from.join(" ")}>${c.to.join(" ")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(c);
  }
  conversionCache.set(tool, list);
  return list;
}

const wordHit = (listed: string, typed: string) => listed.startsWith(typed) || (FORMAT_SYNONYMS[typed] ?? []).some((s) => listed.startsWith(s));
/** Typed words match the listed phrase from its first word on, each as a prefix. */
const leads = (phrase: string[], typed: string[]) => typed.length > 0 && typed.every((t, i) => phrase[i] !== undefined && wordHit(phrase[i], t));
/** Typed words each match some word of the phrase, in any order. */
const mentions = (phrase: string[], typed: string[]) => typed.length > 0 && typed.every((t) => phrase.some((w) => wordHit(w, t)));

/**
 * How well a tool's conversions fit a typed "X to Y". A tool that starts from
 * X and ends at Y scores highest; one that starts from X but ends elsewhere
 * still beats every tool that does not start from X at all.
 */
function conversionBonus(tool: SearchableTool, conv: Conversion): number {
  let best = 0;
  for (const pair of toolConversions(tool)) {
    const fromLeads = leads(pair.from, conv.from);
    if (!fromLeads && !mentions(pair.from, conv.from)) {
      // It does not start from X, but it may still end at Y: "word to pdf" also
      // wants Image to PDF. Only once Y is specific: a lone "i" would match every
      // target that starts with i, from "inr" to "image".
      if (conv.to.join("").length >= 3 && leads(pair.to, conv.to)) best = Math.max(best, 200);
      continue;
    }
    let bonus: number;
    if (conv.to.length === 0) {
      bonus = fromLeads ? 260 : 90;
    } else {
      const toLeads = leads(pair.to, conv.to);
      const toMentions = !toLeads && mentions(pair.to, conv.to);
      bonus = toLeads ? (fromLeads ? 420 : 170) : toMentions ? (fromLeads ? 340 : 140) : fromLeads ? 260 : 40;
      if (toLeads && fromLeads && pair.to.join(" ") === conv.to.join(" ")) bonus += 25;
    }
    best = Math.max(best, bonus);
  }
  return best;
}

/** Returns -Infinity when any group is unmatched, so every typed word must land. */
function scoreTool(tool: SearchableTool, groups: string[][], rawQuery: string, corrected: string, conv: Conversion | null): number {
  if (groups.length === 0) return -Infinity;
  const { blob, name, keywords, category } = getIndexed(tool);

  // A tool that converts between the typed formats may match on its target alone.
  const related = conv ? conversionBonus(tool, conv) : 0;

  let score = 0;
  for (const group of groups) {
    // Best hit within the group. A whole word beats a word the query only
    // starts, and synonyms score clearly lower than the word the user typed,
    // so literal matches rank above inferred ones.
    let best = 0;
    group.forEach((token, index) => {
      const penalty = index === 0 ? 0 : 10;
      let hit = 0;
      // A one- or two-letter token that only STARTS a longer word ("rs" in
      // "rs256") is weak evidence: kept so "pd" still finds PDF tools while
      // typing, but scored below an explicit synonym (rs → rupee), which
      // otherwise lost "rs to" to the JWT Decoder.
      const weak = (full: number) => (token.length <= 2 ? 4 : full);
      const inName = wordMatch(name, token);
      if (inName === 2) hit = 50;
      else if (inName === 1 || hasToken(name, token)) hit = weak(40);
      else if (wordMatch(keywords, token) === 2) hit = 22;
      else if (hasToken(keywords, token)) hit = weak(18);
      else if (wordMatch(category, token) === 2) hit = 12;
      else if (hasToken(category, token)) hit = weak(12);
      else if (wordMatch(blob, token) === 2) hit = 6;
      else if (hasToken(blob, token)) hit = weak(6);
      if (hit > 0) best = Math.max(best, hit - penalty);
    });
    if (best === 0) {
      if (related > 0) continue;
      return -Infinity;
    }
    score += best;
  }

  // The typed phrase WITH its connector words is the stronger signal when it
  // differs: "pdf to" is the start of "PDF to Word", not a search for "pdf".
  // Without this, "pdf to" ranked Merge PDF first (its slug, pdf-merge,
  // starts with "pdf" as well, and the shorter name won the tie).
  const typed = normalize(rawQuery);
  const typedBonus = typed !== corrected ? nameBonus(tool, typed) : 0;
  score += Math.max(nameBonus(tool, corrected), typedBonus > 0 ? typedBonus + 90 : 0);

  // Exact phrase match bonus for multi-word queries. Checked against the
  // query with connector words removed as well, so "how to fill pdf form"
  // still earns the bonus for the alias "fill pdf form".
  const norm = normalize(rawQuery);
  const core = norm.split(" ").filter((w) => !STOPWORDS.has(w)).join(" ");
  for (const phrase of core && core !== norm ? [norm, core] : [norm]) {
    if (phrase.length <= 2) continue;
    // Word-boundary checks: a plain substring test let "age" earn the bonus
    // from "image".
    if (` ${keywords}`.includes(` ${phrase}`)) { score += 35; break; }
    if (` ${blob}`.includes(` ${phrase}`)) { score += 15; break; }
  }

  // Someone who typed "X to Y" wants a conversion. Tools that merely mention X
  // (Merge PDF, Word Counter) stay in the list, below the ones that convert.
  if (conv) score += related > 0 ? related : -150;

  // Fewer words in the name breaks near-ties toward the general tool:
  // "Calculator" before "Scientific Calculator" for the same match.
  score -= normalize(tool.name).split(" ").length;

  return score;
}

/**
 * Ranked search. Every meaningful word must match (directly, through a
 * synonym, or through a typo correction); tools matching more strongly rank
 * higher, so extra words narrow the list.
 */
export function searchTools<T extends SearchableTool>(
  tools: T[],
  query: string,
  limit?: number
): T[] {
  // "pdf to i": the source ("pdf") and the target as typed so far ("i") are both
  // required words, but the target keeps its short words (the plain tokeniser
  // would drop "i" as filler). A tool that converts from the source is let
  // through whatever the target says, so conversions stay listed while the
  // target is still being typed or is spelled differently ("image" for jpg).
  const conv = parseTypedConversion(query);
  const targetGroups = conv ? conv.to.map((w) => [SPELLING[w] ?? w, ...(ALIASES[w] ?? [])]) : [];
  const base = conv ? [...tokenize(conv.from.join(" ")), ...targetGroups] : tokenize(query);
  if (base.length === 0) return limit ? tools.slice(0, limit) : tools;
  const { groups, corrected } = withTypos(base, tools);

  const scored = tools
    .map((tool) => ({ tool, score: scoreTool(tool, groups, query, corrected, conv) }))
    .filter((entry) => entry.score > -Infinity)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Equal scores: popular first, then the curated prominence order, which puts
      // the established tool ahead of a newer sibling ("Regex Tester" before
      // "Regex Builder"), then the alphabet. The alphabet alone picked the newer one.
      if (!!b.tool.isPopular !== !!a.tool.isPopular) {
        return a.tool.isPopular ? -1 : 1;
      }
      const ra = a.tool.searchRank ?? Infinity;
      const rb = b.tool.searchRank ?? Infinity;
      if (ra !== rb) return ra - rb;
      return a.tool.name.localeCompare(b.tool.name);
    })
    .map((entry) => entry.tool);

  return limit ? scored.slice(0, limit) : scored;
}
