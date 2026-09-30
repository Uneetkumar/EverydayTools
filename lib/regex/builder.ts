/**
 * A block model for building regular expressions without writing one: each
 * block is something you can say in words ("2 to 4 digits", "the text
 * 'abc'", "one of cat, dog"), and compile() turns the list into a JavaScript
 * pattern. Literal text is escaped for you, repeated multi-character pieces
 * are wrapped in a group so the repeat applies to all of it, and describe()
 * reads the blocks back in plain English. The compiled pattern runs through
 * the same engine as the Regex Tester.
 */

export type QuantKind = "once" | "optional" | "star" | "plus" | "exact" | "min" | "range";

export interface Quant {
  kind: QuantKind;
  n?: number;
  m?: number;
  /** Match as few as possible instead of as many. */
  lazy?: boolean;
}

export type SetClass = "lower" | "upper" | "digit" | "underscore" | "hyphen" | "space" | "dot";

export type BlockType =
  | "text"
  | "digit"
  | "letter"
  | "alnum"
  | "word"
  | "space"
  | "any"
  | "set"
  | "oneof"
  | "group"
  | "look"
  | "start"
  | "end"
  | "boundary"
  | "raw";

export interface Block {
  id: string;
  type: BlockType;
  quant: Quant;
  /** text / raw */
  text?: string;
  /** digit, letter, alnum, word, space: match anything that is NOT this. */
  negate?: boolean;
  /** letter: any alphabet, not just A–Z. */
  unicode?: boolean;
  /** set */
  classes?: SetClass[];
  custom?: string;
  /** oneof: alternatives, as literal text. */
  options?: string[];
  /** group */
  capture?: boolean;
  name?: string;
  children?: Block[];
  /** look */
  dir?: "ahead" | "behind";
  negative?: boolean;
}

let counter = 0;
export const newId = () => `b${++counter}${Math.random().toString(36).slice(2, 6)}`;

const ONCE: Quant = { kind: "once" };

export function makeBlock(type: BlockType, patch: Partial<Block> = {}): Block {
  const base: Block = { id: newId(), type, quant: { ...ONCE } };
  switch (type) {
    case "text":
      base.text = "";
      break;
    case "letter":
      base.quant = { kind: "plus" };
      break;
    case "digit":
      base.quant = { kind: "plus" };
      break;
    case "set":
      base.classes = ["lower"];
      base.custom = "";
      break;
    case "oneof":
      base.options = ["", ""];
      break;
    case "group":
      base.capture = true;
      base.name = "";
      base.children = [];
      break;
    case "look":
      base.dir = "ahead";
      base.negative = false;
      base.children = [];
      break;
    case "raw":
      base.text = "";
      break;
  }
  return { ...base, ...patch };
}

/** Block types that cannot be repeated. */
export const NO_QUANT: BlockType[] = ["start", "end", "boundary", "look"];

/* ---------------------------------------------------------------- compile */

const SYNTAX = /[\\^$.*+?()[\]{}|]/g;
export const escapeLiteral = (s: string) => s.replace(SYNTAX, "\\$&");

/**
 * The characters a person typed into a "custom characters" box, as the inside
 * of a character class. A hyphen between two characters makes a range (a-f);
 * one at either end is a literal hyphen. Backslash, brackets and ^ are always
 * literal, so nothing typed here can break the class.
 */
function classBody(s: string): string {
  const chars = Array.from(s);
  return chars
    .map((c, i) => {
      if (c === "\\") return "\\\\";
      if (c === "]" || c === "[" || c === "^") return `\\${c}`;
      if (c === "-") return i === 0 || i === chars.length - 1 ? "\\-" : "-";
      return c;
    })
    .join("");
}

const CLASS_SRC: Record<SetClass, string> = {
  lower: "a-z",
  upper: "A-Z",
  digit: "0-9",
  underscore: "_",
  hyphen: "\\-",
  space: "\\s",
  dot: ".",
};

export const SET_CLASS_LABEL: Record<SetClass, string> = {
  lower: "a–z",
  upper: "A–Z",
  digit: "0–9",
  underscore: "_",
  hyphen: "-",
  space: "whitespace",
  dot: ".",
};

function quantSuffix(q: Quant): string {
  const lazy = q.lazy ? "?" : "";
  switch (q.kind) {
    case "once":
      return "";
    case "optional":
      return `?${lazy}`;
    case "star":
      return `*${lazy}`;
    case "plus":
      return `+${lazy}`;
    case "exact":
      return `{${q.n ?? 1}}${lazy}`;
    case "min":
      return `{${q.n ?? 1},}${lazy}`;
    case "range":
      return `{${q.n ?? 1},${q.m ?? q.n ?? 1}}${lazy}`;
  }
}

const codePoints = (s: string) => Array.from(s).length;

/** Is `src` a single unit a quantifier can attach to? */
function isAtom(src: string): boolean {
  if (/^\\.$/.test(src) || /^\\[pP]\{[^}]+\}$/.test(src)) return true;
  if (codePoints(src) === 1) return true;
  if (/^\[(?:[^\]\\]|\\.)*\]$/.test(src)) return true;
  // A single bracketed group: starts with ( and its matching ) is the last character.
  if (src.startsWith("(")) {
    let depth = 0;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === "\\") i++;
      else if (c === "[") {
        i++;
        while (i < src.length && src[i] !== "]") {
          if (src[i] === "\\") i++;
          i++;
        }
      } else if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) return i === src.length - 1;
      }
    }
  }
  return false;
}

export interface Compiled {
  pattern: string;
  /** Flags the pattern needs (for example `u` for \p{L}). */
  requiredFlags: string;
  /** Problems found while compiling, such as an invalid custom piece. */
  issues: string[];
}

function compileBlock(b: Block, out: { flags: Set<string>; issues: string[] }): string {
  let atom = "";
  switch (b.type) {
    case "text":
      atom = escapeLiteral(b.text ?? "");
      if (!atom) return "";
      break;
    case "digit":
      atom = b.negate ? "\\D" : "\\d";
      break;
    case "word":
      atom = b.negate ? "\\W" : "\\w";
      break;
    case "space":
      atom = b.negate ? "\\S" : "\\s";
      break;
    case "letter":
      if (b.unicode) {
        out.flags.add("u");
        atom = b.negate ? "\\P{L}" : "\\p{L}";
      } else atom = b.negate ? "[^A-Za-z]" : "[A-Za-z]";
      break;
    case "alnum":
      atom = b.negate ? "[^A-Za-z0-9]" : "[A-Za-z0-9]";
      break;
    case "any":
      atom = ".";
      break;
    case "set": {
      const parts = (b.classes ?? []).map((c) => CLASS_SRC[c]);
      const custom = classBody(b.custom ?? "");
      const body = parts.join("") + custom;
      if (!body) return "";
      atom = `[${b.negate ? "^" : ""}${body}]`;
      try {
        new RegExp(atom);
      } catch {
        out.issues.push(`The characters “${b.custom}” do not make a valid set (a range such as z-a runs backwards).`);
      }
      break;
    }
    case "oneof": {
      const opts = (b.options ?? []).filter((o) => o !== "").map(escapeLiteral);
      if (!opts.length) return "";
      atom = opts.length === 1 && isAtom(opts[0]) ? opts[0] : `(?:${opts.join("|")})`;
      break;
    }
    case "group": {
      const inner = (b.children ?? []).map((c) => compileBlock(c, out)).join("");
      const name = b.name?.trim();
      if (b.capture && name) {
        if (!/^[A-Za-z_$][\w$]*$/.test(name)) out.issues.push(`“${name}” is not a valid group name. Use letters, digits and _, starting with a letter.`);
        atom = `(?<${name}>${inner})`;
      } else atom = b.capture ? `(${inner})` : `(?:${inner})`;
      break;
    }
    case "look": {
      const inner = (b.children ?? []).map((c) => compileBlock(c, out)).join("");
      return `(?${b.dir === "behind" ? "<" : ""}${b.negative ? "!" : "="}${inner})`;
    }
    case "start":
      return "^";
    case "end":
      return "$";
    case "boundary":
      return b.negate ? "\\B" : "\\b";
    case "raw": {
      const src = b.text ?? "";
      if (!src) return "";
      try {
        new RegExp(src);
      } catch (e) {
        out.issues.push(`The custom piece “${src}” is not valid: ${(e as Error).message.replace(/^Invalid regular expression: /, "")}`);
      }
      // Alternations and sequences need a group before they can be repeated.
      atom = isAtom(src) ? src : `(?:${src})`;
      if (b.quant.kind === "once" && !/\|/.test(src)) return src;
      break;
    }
  }
  const suffix = quantSuffix(b.quant);
  if (!suffix) return atom;
  return (isAtom(atom) ? atom : `(?:${atom})`) + suffix;
}

export function compile(blocks: Block[]): Compiled {
  const out = { flags: new Set<string>(), issues: [] as string[] };
  const pattern = blocks.map((b) => compileBlock(b, out)).join("");
  return { pattern, requiredFlags: [...out.flags].join(""), issues: out.issues };
}

/* --------------------------------------------------------------- describe */

export interface DescribeLine {
  depth: number;
  text: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function times(q: Quant): string {
  const lazy = q.lazy && q.kind !== "once" && q.kind !== "exact" ? ", as few as possible" : "";
  switch (q.kind) {
    case "once":
      return "";
    case "optional":
      return "optional";
    case "star":
      return `zero or more times${lazy}`;
    case "plus":
      return `one or more times${lazy}`;
    case "exact":
      return `exactly ${q.n ?? 1} ${plural(q.n ?? 1, "time", "times")}`;
    case "min":
      return `${q.n ?? 1} or more times${lazy}`;
    case "range":
      return `${q.n ?? 1} to ${q.m ?? q.n ?? 1} times${lazy}`;
  }
}

const NOUN: Record<string, [string, string]> = {
  digit: ["a digit", "digits"],
  letter: ["a letter", "letters"],
  alnum: ["a letter or digit", "letters or digits"],
  word: ["a word character (letter, digit or _)", "word characters"],
  space: ["a whitespace character", "whitespace characters"],
  any: ["any character", "any characters"],
};

function describeBlock(b: Block, depth: number, out: DescribeLine[]): void {
  const q = times(b.quant);
  const many = b.quant.kind !== "once" && b.quant.kind !== "optional" && !(b.quant.kind === "exact" && b.quant.n === 1);
  const withQ = (base: string) => (q ? `${base} — ${q}` : base);
  switch (b.type) {
    case "text":
      if (b.text) out.push({ depth, text: withQ(`The text “${b.text}”`) });
      break;
    case "digit":
    case "letter":
    case "alnum":
    case "word":
    case "space":
    case "any": {
      const [one, plural] = NOUN[b.type];
      let phrase = many ? plural : one;
      if (b.negate && b.type !== "any") phrase = phrase.replace(/^a /, "a non-").replace(/^(letters|digits|word characters|whitespace characters|letters or digits)/, "non-$1");
      if (b.type === "letter" && b.unicode && !b.negate) phrase = many ? "letters from any alphabet" : "a letter from any alphabet";
      out.push({ depth, text: withQ(`Match ${phrase}`) });
      break;
    }
    case "set": {
      const items = [...(b.classes ?? []).map((c) => SET_CLASS_LABEL[c]), ...(b.custom ? [`“${b.custom}”`] : [])];
      if (items.length) out.push({ depth, text: withQ(`Match ${b.negate ? "any character except" : "one of"} ${items.join(", ")}`) });
      break;
    }
    case "oneof": {
      const opts = (b.options ?? []).filter(Boolean);
      if (opts.length) out.push({ depth, text: withQ(`One of: ${opts.map((o) => `“${o}”`).join(", ")}`) });
      break;
    }
    case "group": {
      const label = b.capture ? (b.name ? `A captured group named “${b.name}”` : "A captured group") : "A group (not captured)";
      out.push({ depth, text: withQ(`${label}, containing:`) });
      if (!b.children?.length) out.push({ depth: depth + 1, text: "(empty)" });
      b.children?.forEach((c) => describeBlock(c, depth + 1, out));
      break;
    }
    case "look":
      out.push({ depth, text: `${b.negative ? "Not " : ""}${b.dir === "behind" ? "preceded by" : "followed by"}:`.replace(/^(.)/, (c) => c.toUpperCase()) });
      if (!b.children?.length) out.push({ depth: depth + 1, text: "(empty)" });
      b.children?.forEach((c) => describeBlock(c, depth + 1, out));
      break;
    case "start":
      out.push({ depth, text: "Start of the text (or of each line, with the multiline flag)" });
      break;
    case "end":
      out.push({ depth, text: "End of the text (or of each line, with the multiline flag)" });
      break;
    case "boundary":
      out.push({ depth, text: b.negate ? "Not at a word boundary" : "A word boundary (edge of a word)" });
      break;
    case "raw":
      if (b.text) out.push({ depth, text: withQ(`Custom pattern ${"`"}${b.text}${"`"}`) });
      break;
  }
}

export function describe(blocks: Block[]): DescribeLine[] {
  const out: DescribeLine[] = [];
  blocks.forEach((b) => describeBlock(b, 0, out));
  return out;
}

/* --------------------------------------------------------------- templates */

const B = {
  text: (text: string, quant?: Quant) => makeBlock("text", { text, quant: quant ?? { ...ONCE } }),
  digit: (quant: Quant) => makeBlock("digit", { quant }),
  word: (quant: Quant) => makeBlock("word", { quant }),
  space: (quant: Quant) => makeBlock("space", { quant }),
  any: (quant: Quant) => makeBlock("any", { quant }),
  set: (classes: SetClass[], custom: string, quant: Quant, negate = false) => makeBlock("set", { classes, custom, quant, negate }),
  group: (children: Block[], quant: Quant, opts: { capture?: boolean; name?: string } = {}) => makeBlock("group", { children, quant, capture: opts.capture ?? false, name: opts.name ?? "" }),
  oneof: (options: string[], quant: Quant = { ...ONCE }) => makeBlock("oneof", { options, quant }),
  raw: (text: string, quant: Quant = { ...ONCE }) => makeBlock("raw", { text, quant }),
  start: () => makeBlock("start"),
  end: () => makeBlock("end"),
  boundary: () => makeBlock("boundary"),
  look: (children: Block[], dir: "ahead" | "behind" = "ahead", negative = false) => makeBlock("look", { children, dir, negative }),
};

const q = {
  plus: { kind: "plus" } as Quant,
  star: { kind: "star" } as Quant,
  opt: { kind: "optional" } as Quant,
  exact: (n: number): Quant => ({ kind: "exact", n }),
  range: (n: number, m: number): Quant => ({ kind: "range", n, m }),
  min: (n: number): Quant => ({ kind: "min", n }),
};

export interface Template {
  id: string;
  label: string;
  description: string;
  flags: string;
  sample: string;
  build: () => Block[];
}

export const TEMPLATES: Template[] = [
  {
    id: "email",
    label: "Email address",
    description: "name@domain.tld — practical, not RFC-complete.",
    flags: "gi",
    sample: "Write to alice@example.com or support+billing@mail.example.co.in, not to @example or bob@localhost.",
    build: () => [B.set(["lower", "upper", "digit", "underscore", "dot", "hyphen"], "+", q.plus), B.text("@"), B.set(["lower", "upper", "digit", "underscore", "hyphen"], "", q.plus), B.group([B.text("."), B.set(["lower", "upper", "digit", "underscore", "hyphen"], "", q.plus)], q.plus)],
  },
  {
    id: "date",
    label: "Date (YYYY-MM-DD)",
    description: "Four-digit year, then month and day, each captured by name.",
    flags: "g",
    sample: "Due 2026-09-29, paid 2026-10-01. Not valid: 26-9-29.",
    build: () => [B.boundary(), B.group([B.digit(q.exact(4))], { kind: "once" }, { capture: true, name: "year" }), B.text("-"), B.group([B.digit(q.exact(2))], { kind: "once" }, { capture: true, name: "month" }), B.text("-"), B.group([B.digit(q.exact(2))], { kind: "once" }, { capture: true, name: "day" }), B.boundary()],
  },
  {
    id: "time",
    label: "Time (24-hour HH:MM)",
    description: "00:00 to 23:59 using a custom piece for the hour.",
    flags: "g",
    sample: "Meet at 09:30, lunch 12:45, last train 23:59. Not a time: 24:10, 7:5.",
    build: () => [B.boundary(), B.raw("[01]\\d|2[0-3]"), B.text(":"), B.raw("[0-5]\\d"), B.boundary()],
  },
  {
    id: "mobile-in",
    label: "Indian mobile number",
    description: "Optional +91, then ten digits starting 6–9.",
    flags: "g",
    sample: "Call +919876543210, or +91-7012345678, or 9123456789. Not valid: 5123456789 and 12345.",
    build: () => [B.look([B.digit({ kind: "once" })], "behind", true), B.group([B.text("+91"), B.set(["space", "hyphen"], "", q.opt)], q.opt), B.set([], "6-9", { kind: "once" }), B.digit(q.exact(9)), B.boundary()],
  },
  {
    id: "pan",
    label: "PAN number",
    description: "Five letters, four digits, one letter.",
    flags: "g",
    sample: "PAN ABCPE1234F is well-formed; ABCDE1234 and abcpe1234f are not.",
    build: () => [B.boundary(), B.set(["upper"], "", q.exact(5)), B.digit(q.exact(4)), B.set(["upper"], "", { kind: "once" }), B.boundary()],
  },
  {
    id: "url",
    label: "Web address (URL)",
    description: "http or https, a host, and an optional path.",
    flags: "gi",
    sample: "Docs at https://example.com/docs?page=2 and http://localhost:3000/path (local). ftp://x.org is ignored.",
    build: () => [B.text("http"), B.text("s", q.opt), B.text("://"), B.set(["lower", "upper", "digit", "hyphen", "dot"], ":", q.plus), B.group([B.text("/"), B.set(["space"], "", q.star, true)], q.opt)],
  },
  {
    id: "hex",
    label: "Hex colour",
    description: "#RGB or #RRGGBB.",
    flags: "g",
    sample: "Brand #2563EB, text #111 and #abcdef. Not a colour: #12345, #xyz.",
    build: () => [B.text("#"), B.group([B.set(["digit"], "a-fA-F", q.exact(3))], q.range(1, 2)), B.boundary()],
  },
  {
    id: "ipv4",
    label: "IPv4 address (loose)",
    description: "Four groups of 1–3 digits. Does not check each is ≤ 255.",
    flags: "g",
    sample: "Servers 192.168.1.10 and 10.0.0.255 (256.1.1.1 also matches: this pattern does not check the range).",
    build: () => [B.boundary(), B.group([B.digit(q.range(1, 3)), B.text(".")], q.exact(3)), B.digit(q.range(1, 3)), B.boundary()],
  },
  {
    id: "username",
    label: "Username (3–16)",
    description: "Lower-case letters, digits and underscores, the whole text.",
    flags: "gm",
    sample: "ada_lovelace\nab\nUPPER\nvalid_name_99\nway_too_long_username_here",
    build: () => [B.start(), B.set(["lower", "digit", "underscore"], "", q.range(3, 16)), B.end()],
  },
  {
    id: "password",
    label: "Strong password",
    description: "8+ characters with a digit, a lower-case and an upper-case letter (look-aheads).",
    flags: "gm",
    sample: "Passw0rdOK\npassword\nSHORT1a\nNoDigitsHere",
    build: () => [B.start(), B.look([B.any(q.star), B.digit({ kind: "once" })]), B.look([B.any(q.star), B.set(["lower"], "", { kind: "once" })]), B.look([B.any(q.star), B.set(["upper"], "", { kind: "once" })]), B.any(q.min(8)), B.end()],
  },
  {
    id: "slug",
    label: "URL slug",
    description: "lower-case words joined by single hyphens.",
    flags: "gm",
    sample: "my-first-post\nBad_Slug\ndouble--hyphen\nok-2026",
    build: () => [B.start(), B.set(["lower", "digit"], "", q.plus), B.group([B.text("-"), B.set(["lower", "digit"], "", q.plus)], q.star), B.end()],
  },
  {
    id: "number",
    label: "Number (integer or decimal)",
    description: "Optional minus, digits, optional fractional part.",
    flags: "g",
    sample: "Totals: 42, -7, 3.14159 and 1000.",
    build: () => [B.text("-", q.opt), B.digit(q.plus), B.group([B.text("."), B.digit(q.plus)], q.opt)],
  },
  {
    id: "otp",
    label: "6-digit code (OTP)",
    description: "Exactly six digits standing alone.",
    flags: "g",
    sample: "Your OTP is 482913. Order 12345 and 1234567 are not codes.",
    build: () => [B.boundary(), B.digit(q.exact(6)), B.boundary()],
  },
  {
    id: "hashtag",
    label: "Hashtag",
    description: "# followed by word characters.",
    flags: "g",
    sample: "Loving the #sunset at #GoaBeach2026 — no tag here: # alone.",
    build: () => [B.text("#"), B.word(q.plus)],
  },
];

/** Returns a deep copy with fresh ids, so editing a template never changes the original. */
export function cloneBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) => ({ ...b, id: newId(), quant: { ...b.quant }, classes: b.classes ? [...b.classes] : undefined, options: b.options ? [...b.options] : undefined, children: b.children ? cloneBlocks(b.children) : undefined }));
}

/* ----------------------------------------------------------- tree helpers */

/** Applies `fn` to the block with `id`, anywhere in the tree. Returns a new tree. */
export function updateBlock(blocks: Block[], id: string, fn: (b: Block) => Block | null): Block[] {
  return blocks.flatMap((b) => {
    if (b.id === id) {
      const r = fn(b);
      return r ? [r] : [];
    }
    return [b.children ? { ...b, children: updateBlock(b.children, id, fn) } : b];
  });
}

/** Adds a block to the top level or inside a group/look-around (`parentId`). */
export function addBlock(blocks: Block[], block: Block, parentId?: string): Block[] {
  if (!parentId) return [...blocks, block];
  return blocks.map((b) => (b.id === parentId ? { ...b, children: [...(b.children ?? []), block] } : b.children ? { ...b, children: addBlock(b.children, block, parentId) } : b));
}

/** Moves the block one place up or down within its siblings. */
export function moveBlock(blocks: Block[], id: string, delta: -1 | 1): Block[] {
  const i = blocks.findIndex((b) => b.id === id);
  if (i !== -1) {
    const j = i + delta;
    if (j < 0 || j >= blocks.length) return blocks;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }
  return blocks.map((b) => (b.children ? { ...b, children: moveBlock(b.children, id, delta) } : b));
}

export function countBlocks(blocks: Block[]): number {
  return blocks.reduce((n, b) => n + 1 + (b.children ? countBlocks(b.children) : 0), 0);
}
