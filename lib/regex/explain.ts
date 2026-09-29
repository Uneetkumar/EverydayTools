/**
 * Reading a JavaScript regular expression back in plain English, one piece
 * per line, the way regex101's explanation panel does. Also finds the
 * capture groups (and their names) in order.
 *
 * This is a reader for explanation, not a validator: the browser's RegExp
 * decides whether a pattern is valid.
 */

export interface ExplainLine {
  /** The piece of the pattern. */
  token: string;
  text: string;
  /** Nesting inside groups, for indentation. */
  depth: number;
}

const ESCAPES: Record<string, string> = {
  d: "a digit (0–9)",
  D: "any character except a digit",
  w: "a word character (letter, digit or _)",
  W: "any character except a word character",
  s: "whitespace (space, tab, line break)",
  S: "any character except whitespace",
  b: "a word boundary",
  B: "a position that isn't a word boundary",
  t: "a tab",
  n: "a line feed (new line)",
  r: "a carriage return",
  f: "a form feed",
  v: "a vertical tab",
  "0": "the null character",
};

const CLASS_ESCAPES: Record<string, string> = {
  d: "digits",
  D: "non-digits",
  w: "word characters",
  W: "non-word characters",
  s: "whitespace",
  S: "non-whitespace",
  t: "tab",
  n: "line feed",
  r: "carriage return",
};

function quote(s: string): string {
  return `“${s}”`;
}

function describeCharName(c: string): string {
  if (c === " ") return "a space";
  return quote(c);
}

/** Reads one escape starting at pattern[i] === "\\"; returns its text and length. */
function readEscape(p: string, i: number): { raw: string; text: string; backref?: string } {
  const c = p[i + 1];
  if (c === undefined) return { raw: "\\", text: "a backslash (unfinished escape)" };
  if (ESCAPES[c]) return { raw: `\\${c}`, text: ESCAPES[c] };
  if (c === "x" && /^[0-9a-f]{2}$/i.test(p.slice(i + 2, i + 4))) {
    const ch = String.fromCharCode(parseInt(p.slice(i + 2, i + 4), 16));
    return { raw: p.slice(i, i + 4), text: `the character ${describeCharName(ch)}` };
  }
  if (c === "u") {
    const braced = /^\{([0-9a-f]+)\}/i.exec(p.slice(i + 2));
    if (braced) {
      const ch = String.fromCodePoint(parseInt(braced[1], 16));
      return { raw: p.slice(i, i + 2 + braced[0].length), text: `the character ${describeCharName(ch)} (U+${braced[1].toUpperCase()})` };
    }
    if (/^[0-9a-f]{4}$/i.test(p.slice(i + 2, i + 6))) {
      const ch = String.fromCharCode(parseInt(p.slice(i + 2, i + 6), 16));
      return { raw: p.slice(i, i + 6), text: `the character ${describeCharName(ch)} (U+${p.slice(i + 2, i + 6).toUpperCase()})` };
    }
  }
  if (c === "p" || c === "P") {
    const prop = /^\{([^}]+)\}/.exec(p.slice(i + 2));
    if (prop) {
      const name = prop[1].replace(/^(Script|sc|Script_Extensions|scx|General_Category|gc)=/, "");
      const known: Record<string, string> = {
        L: "a letter in any language",
        Letter: "a letter in any language",
        Lu: "an upper-case letter",
        Ll: "a lower-case letter",
        N: "a number in any script",
        Nd: "a decimal digit in any script",
        P: "punctuation",
        S: "a symbol",
        Emoji: "an emoji",
        Emoji_Presentation: "an emoji",
      };
      const what = known[name] ?? `a character with the Unicode property ${name}`;
      return { raw: p.slice(i, i + 2 + prop[0].length), text: c === "p" ? what : `anything except ${what}` };
    }
  }
  if (c === "k") {
    const named = /^<([^>]+)>/.exec(p.slice(i + 2));
    if (named) return { raw: p.slice(i, i + 2 + named[0].length), text: `the same text group “${named[1]}” matched`, backref: named[1] };
  }
  if (/[1-9]/.test(c)) {
    const num = /^\d+/.exec(p.slice(i + 1))![0];
    return { raw: `\\${num}`, text: `the same text group #${num} matched`, backref: num };
  }
  if (c === "c" && /[a-z]/i.test(p[i + 2] ?? "")) return { raw: p.slice(i, i + 3), text: `the control character Ctrl+${p[i + 2].toUpperCase()}` };
  return { raw: `\\${c}`, text: `the character ${describeCharName(c)}` };
}

/** Reads a character class [...] starting at pattern[i] === "[". */
function readClass(p: string, i: number): { raw: string; text: string } {
  let j = i + 1;
  const negated = p[j] === "^";
  if (negated) j++;
  const parts: string[] = [];
  while (j < p.length && p[j] !== "]") {
    let item: string;
    let len: number;
    if (p[j] === "\\") {
      const e = readEscape(p, j);
      const c = p[j + 1];
      item = CLASS_ESCAPES[c] ?? e.text.replace(/^the character /, "");
      len = e.raw.length;
    } else if (p[j] === "[") {
      // v-flag nested class; keep it short.
      const end = p.indexOf("]", j);
      item = p.slice(j, end + 1);
      len = end - j + 1;
    } else {
      item = quote(p[j]);
      len = 1;
    }
    // A range such as a-z.
    if (p[j + len] === "-" && p[j + len + 1] !== undefined && p[j + len + 1] !== "]" && p[j] !== "\\") {
      let endLen = 1;
      let endChar = p[j + len + 1];
      if (endChar === "\\") {
        const e = readEscape(p, j + len + 1);
        endChar = e.text.replace(/^the character /, "").replace(/[“”]/g, "");
        endLen = e.raw.length;
      }
      parts.push(`${p[j]}–${endChar.replace(/[“”]/g, "")}`);
      j += len + 1 + endLen;
      continue;
    }
    parts.push(item);
    j += len;
  }
  const raw = p.slice(i, Math.min(j + 1, p.length));
  const list = parts.length ? parts.join(", ") : "nothing";
  return { raw, text: negated ? `any one character except ${list}` : `one character from: ${list}` };
}

function quantifierText(q: string): string {
  const lazy = q.length > 1 && q.endsWith("?") && q !== "?";
  const base = lazy ? q.slice(0, -1) : q;
  let t: string;
  if (base === "*") t = "zero or more times";
  else if (base === "+") t = "one or more times";
  else if (base === "?") t = "optionally (zero or one time)";
  else {
    const m = /^\{(\d+)(,(\d*))?\}$/.exec(base)!;
    const min = Number(m[1]);
    if (!m[2]) t = min === 1 ? "exactly once" : `exactly ${min} times`;
    else if (m[3] === "") t = `${min} or more times`;
    else t = `between ${min} and ${m[3]} times`;
  }
  if (base === "?" || /^\{\d+\}$/.test(base)) return lazy ? `${t}, preferring fewer` : t;
  return `${t}, ${lazy ? "as few as possible" : "as many as possible"}`;
}

/**
 * The capture groups in order: null for an unnamed group, its name for a
 * named one. Group n in a match is entry n-1.
 */
export function captureGroups(p: string): (string | null)[] {
  const out: (string | null)[] = [];
  let inClass = false;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (inClass) {
      if (c === "]") inClass = false;
      continue;
    }
    if (c === "[") inClass = true;
    else if (c === "(") {
      if (p[i + 1] !== "?") out.push(null);
      else {
        const named = /^\?<([A-Za-z_$][\w$]*)>/.exec(p.slice(i + 1));
        if (named) out.push(named[1]);
      }
    }
  }
  return out;
}

export function explain(p: string, flags: string): ExplainLine[] {
  const lines: ExplainLine[] = [];
  const groupStack: string[] = [];
  let groupNo = 0;
  let depth = 0;
  let i = 0;
  const dotAll = flags.includes("s");
  const multiline = flags.includes("m");

  const push = (token: string, text: string) => lines.push({ token, text, depth });

  while (i < p.length) {
    const c = p[i];
    // Quantifier after the previous piece.
    const q = /^(\*\??|\+\??|\?\??|\{\d+(?:,\d*)?\}\??)/.exec(p.slice(i));
    if (q && lines.length && !(c === "?" && p[i - 1] === "(")) {
      const last = lines[lines.length - 1];
      // A run of literal text: the quantifier applies to its last character only.
      if (/^the text “/i.test(last.text) && last.token.length > 1 && !last.token.startsWith("\\")) {
        const kept = last.token.slice(0, -1);
        const ch = last.token.slice(-1);
        last.token = kept;
        last.text = kept.length === 1 ? `the character ${describeCharName(kept)}` : `the text ${quote(kept)}`;
        lines.push({ token: ch + q[0], text: `the character ${describeCharName(ch)}, ${quantifierText(q[0])}`, depth });
      } else {
        last.token += q[0];
        last.text += `, ${quantifierText(q[0])}`;
      }
      i += q[0].length;
      continue;
    }

    if (c === "\\") {
      const e = readEscape(p, i);
      push(e.raw, e.text.charAt(0).toUpperCase() + e.text.slice(1));
      i += e.raw.length;
      continue;
    }
    if (c === "[") {
      const cls = readClass(p, i);
      push(cls.raw, cls.text.charAt(0).toUpperCase() + cls.text.slice(1));
      i += cls.raw.length;
      continue;
    }
    if (c === "(") {
      const rest = p.slice(i);
      let token = "(";
      let text: string;
      const named = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(rest);
      if (named) {
        groupNo++;
        token = named[0];
        text = `Start of group #${groupNo}, named “${named[1]}”`;
        groupStack.push(`group #${groupNo} (“${named[1]}”)`);
      } else if (rest.startsWith("(?:")) {
        token = "(?:";
        text = "Start of a group that isn't captured";
        groupStack.push("the non-capturing group");
      } else if (rest.startsWith("(?=")) {
        token = "(?=";
        text = "Followed by (look ahead, without consuming):";
        groupStack.push("the look-ahead");
      } else if (rest.startsWith("(?!")) {
        token = "(?!";
        text = "Not followed by (look ahead):";
        groupStack.push("the negative look-ahead");
      } else if (rest.startsWith("(?<=")) {
        token = "(?<=";
        text = "Preceded by (look behind):";
        groupStack.push("the look-behind");
      } else if (rest.startsWith("(?<!")) {
        token = "(?<!";
        text = "Not preceded by (look behind):";
        groupStack.push("the negative look-behind");
      } else {
        groupNo++;
        text = `Start of group #${groupNo}`;
        groupStack.push(`group #${groupNo}`);
      }
      push(token, text);
      depth++;
      i += token.length;
      continue;
    }
    if (c === ")") {
      depth = Math.max(0, depth - 1);
      push(")", `End of ${groupStack.pop() ?? "a group (this one was never opened)"}`);
      i++;
      continue;
    }
    if (c === "|") {
      push("|", "Or");
      i++;
      continue;
    }
    if (c === ".") {
      push(".", dotAll ? "Any character, including line breaks" : "Any character except a line break");
      i++;
      continue;
    }
    if (c === "^") {
      push("^", multiline ? "The start of a line" : "The start of the text");
      i++;
      continue;
    }
    if (c === "$") {
      push("$", multiline ? "The end of a line" : "The end of the text");
      i++;
      continue;
    }

    // Literal text: gather a run of ordinary characters.
    let j = i;
    while (j < p.length && !/[\\[\]().|^$*+?{]/.test(p[j])) j++;
    if (j === i) j = i + 1;
    const lit = p.slice(i, j);
    push(lit, lit.length === 1 ? `The character ${describeCharName(lit)}` : `The text ${quote(lit)}`);
    i = j;
  }

  // Capitalise lines that were extended by a quantifier.
  return lines.map((l) => ({ ...l, text: l.text.charAt(0).toUpperCase() + l.text.slice(1) }));
}

export const FLAG_INFO: { flag: string; name: string; help: string }[] = [
  { flag: "g", name: "global", help: "Find every match, not just the first" },
  { flag: "i", name: "ignore case", help: "A matches a" },
  { flag: "m", name: "multiline", help: "^ and $ match at each line" },
  { flag: "s", name: "dot all", help: ". also matches line breaks" },
  { flag: "u", name: "unicode", help: "Full Unicode, \\p{…} and \\u{…}" },
  { flag: "y", name: "sticky", help: "Match only at the current position" },
];

/** The pattern as a JavaScript literal: /…/flags, with bare slashes escaped. */
export function toLiteral(pattern: string, flags: string): string {
  let out = "";
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\") {
      out += c + (pattern[i + 1] ?? "");
      i++;
      continue;
    }
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    out += c === "/" && !inClass ? "\\/" : c === "\n" ? "\\n" : c;
  }
  return `/${out}/${flags}`;
}

/** The pattern as new RegExp("…", "flags"). */
export function toConstructor(pattern: string, flags: string): string {
  return `new RegExp(${JSON.stringify(pattern)}${flags ? `, ${JSON.stringify(flags)}` : ""})`;
}
