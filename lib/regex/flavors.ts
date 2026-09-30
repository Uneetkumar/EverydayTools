/**
 * Regular expressions differ between languages. The Regex Tester and Builder
 * run JavaScript's engine, so this module answers the next question: "will
 * this work in my language, and how do I write it there?" It produces a ready
 * code snippet for each language with the quoting and flags that language
 * needs, and lists the features the pattern uses that the target does not
 * support or spells differently. It also spots syntax from other engines in
 * a pattern pasted into the JavaScript tester and offers the JavaScript
 * equivalent.
 */

export type Language = "javascript" | "python" | "php" | "java" | "csharp" | "go" | "ruby" | "rust";

export const LANGUAGES: { id: Language; label: string; engine: string }[] = [
  { id: "javascript", label: "JavaScript", engine: "ECMAScript" },
  { id: "python", label: "Python", engine: "re module" },
  { id: "php", label: "PHP", engine: "PCRE2 (preg_*)" },
  { id: "java", label: "Java", engine: "java.util.regex" },
  { id: "csharp", label: "C#", engine: ".NET Regex" },
  { id: "go", label: "Go", engine: "RE2 (regexp)" },
  { id: "ruby", label: "Ruby", engine: "Onigmo" },
  { id: "rust", label: "Rust", engine: "regex crate (RE2-like)" },
];

export interface Feature {
  id: string;
  label: string;
  test: (p: string) => boolean;
}

/** Removes escaped characters and the inside of character classes, so feature tests do not trip on literals. */
function skeleton(p: string): string {
  let out = "";
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "\\") {
      out += "\\" + (p[i + 1] ?? "");
      i++;
    } else if (c === "[") {
      out += "[]";
      i++;
      if (p[i] === "^") i++;
      if (p[i] === "]") i++;
      while (i < p.length && p[i] !== "]") {
        if (p[i] === "\\") i++;
        i++;
      }
    } else out += c;
  }
  return out;
}

const FEATURES: Feature[] = [
  { id: "lookahead", label: "look-ahead (?= … ) / (?! … )", test: (p) => /\(\?[=!]/.test(skeleton(p)) },
  { id: "lookbehind", label: "look-behind (?<= … ) / (?<! … )", test: (p) => /\(\?<[=!]/.test(skeleton(p)) },
  { id: "backref", label: "back-reference (\\1, \\k<name>)", test: (p) => /\\[1-9]|\\k</.test(skeleton(p)) },
  { id: "named", label: "named groups (?<name> … )", test: (p) => /\(\?<[A-Za-z_]/.test(skeleton(p)) },
  { id: "unicode-prop", label: "Unicode property \\p{…}", test: (p) => /\\[pP]\{/.test(p) },
  { id: "possessive", label: "possessive quantifier (a++)", test: (p) => /[*+?}]\+/.test(skeleton(p)) },
  { id: "atomic", label: "atomic group (?> … )", test: (p) => /\(\?>/.test(skeleton(p)) },
  { id: "lazy", label: "lazy quantifier (a+?)", test: (p) => /[*+?}]\?/.test(skeleton(p)) },
];

const has = (id: string, p: string) => FEATURES.find((f) => f.id === id)!.test(p);

export interface CodeResult {
  code: string;
  /** Things to know: unsupported features, spelling differences, flags that do not exist. */
  notes: string[];
  /** The pattern as it must be written for this engine (named groups converted, and so on). */
  pattern: string;
}

/** Flags after removing the ones that only steer JavaScript's API (g, d, y) — with notes on what to use instead. */
function split(flags: string) {
  return {
    i: flags.includes("i"),
    m: flags.includes("m"),
    s: flags.includes("s"),
    u: flags.includes("u") || flags.includes("v"),
    g: flags.includes("g"),
    y: flags.includes("y"),
    d: flags.includes("d"),
  };
}

/** `(?<name>` → `(?P<name>` (and `\k<name>` → `(?P=name)`) for engines that need the P form. */
function toPythonNames(p: string): string {
  return p.replace(/\(\?<(?![=!])/g, "(?P<").replace(/\\k<([A-Za-z_]\w*)>/g, "(?P=$1)");
}

const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`;

function pyStringLiteral(pattern: string): string {
  const raw = !/\n|\r/.test(pattern) && !pattern.endsWith("\\");
  if (raw && !pattern.includes('"')) return `r"${pattern}"`;
  if (raw && !pattern.includes("'")) return `r'${pattern}'`;
  return q(pattern);
}

function phpSingleQuoted(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; ) {
    if (s[i] === "\\") {
      let n = 0;
      while (s[i + n] === "\\") n++;
      if (s[i + n] === "'") out += "\\".repeat(n * 2 + 1) + "'";
      else out += "\\".repeat(4 * Math.floor(n / 2) + (n % 2));
      i += n + (s[i + n] === "'" ? 1 : 0);
    } else if (s[i] === "'") {
      out += "\\'";
      i++;
    } else {
      out += s[i++];
    }
  }
  return out;
}

export function generateCode(lang: Language, pattern: string, flags: string, sample?: string): CodeResult {
  const f = split(flags);
  const notes: string[] = [];
  const lookahead = has("lookahead", pattern);
  const lookbehind = has("lookbehind", pattern);
  const backref = has("backref", pattern);
  const named = has("named", pattern);
  const prop = has("unicode-prop", pattern);
  const possessive = has("possessive", pattern);
  const atomic = has("atomic", pattern);
  const text = sample ?? "your text here";

  if (f.y) notes.push("The sticky flag (y) only exists in JavaScript. Anchor the match at a position with the language's own match-at-position call.");
  if (f.d) notes.push("The d flag (match indices) is JavaScript-only; other languages report positions through their match objects.");

  switch (lang) {
    case "javascript": {
      const literal = `/${pattern.replace(/\//g, "\\/")}/${flags}`;
      const lines = [`const re = ${literal};`];
      lines.push(f.g ? `const matches = [...${JSON.stringify(text)}.matchAll(re)];` : `const match = ${JSON.stringify(text)}.match(re);`);
      return { code: lines.join("\n"), notes, pattern };
    }
    case "python": {
      const p = toPythonNames(pattern);
      const fl = [f.i && "re.IGNORECASE", f.m && "re.MULTILINE", f.s && "re.DOTALL"].filter(Boolean).join(" | ");
      if (named) notes.push("Python writes named groups as (?P<name>…). They were converted for you.");
      if (prop) notes.push("The built-in re module does not support \\p{…}. Install the third-party regex package (import regex as re) or spell out the characters.");
      if (lookbehind) notes.push("Python look-behind must have a fixed width: (?<=ab) works, (?<=a+) does not.");
      if (/\$/.test(skeleton(pattern)) && !f.m) notes.push("In Python, $ also matches just before a trailing newline. Use \\Z to match only at the very end.");
      if (/\\d|\\w|\\s|\\b/.test(pattern)) notes.push("Python's \\d and \\w match Unicode digits and letters in str patterns. Add re.ASCII to limit them to ASCII.");
      if (possessive || atomic) notes.push("Possessive quantifiers and atomic groups need Python 3.11 or newer.");
      if (f.u) notes.push("Unicode matching is the default for Python 3 strings, so the u flag is not needed.");
      const compile = `pattern = re.compile(${pyStringLiteral(p)}${fl ? `, ${fl}` : ""})`;
      const use = f.g ? `matches = pattern.findall(${q(text)})   # or pattern.finditer() for match objects` : `match = pattern.search(${q(text)})`;
      return { code: `import re\n\n${compile}\n${use}`, notes, pattern: p };
    }
    case "php": {
      const delim = ["/", "~", "#", "%", "@", "!"].find((d) => !pattern.includes(d)) ?? "/";
      const body = delim === "/" && pattern.includes("/") ? pattern.replace(/\//g, "\\/") : pattern;
      const mods = [f.i && "i", f.m && "m", f.s && "s", f.u && "u"].filter(Boolean).join("");
      if (prop && !f.u) notes.push("\\p{…} needs the u modifier in PHP. Add u.");
      if (f.u) notes.push("With u, both the pattern and the subject must be valid UTF-8 or preg_match returns false.");
      const lit = `'${phpSingleQuoted(`${delim}${body}${delim}${mods}`)}'`;
      const fn = f.g ? `preg_match_all(${lit}, ${phpSingleQuoted2(text)}, $matches);` : `preg_match(${lit}, ${phpSingleQuoted2(text)}, $matches);`;
      return { code: `<?php\n${fn}\nprint_r($matches);`, notes, pattern };
    }
    case "java": {
      const fl = [f.i && "Pattern.CASE_INSENSITIVE", f.i && f.u && "Pattern.UNICODE_CASE", f.m && "Pattern.MULTILINE", f.s && "Pattern.DOTALL"].filter(Boolean).join(" | ");
      if (named && /\(\?<[A-Za-z]*_/.test(pattern)) notes.push("Java group names may contain only letters and digits — no underscores.");
      if (lookbehind) notes.push("Java look-behind must have a bounded length: (?<=a{1,3}) works, (?<=a+) does not.");
      if (prop) notes.push("\\p{L} works in Java; to make \\w, \\d and \\b Unicode-aware, add Pattern.UNICODE_CHARACTER_CLASS.");
      const lines = ["import java.util.regex.*;", "", `Pattern pattern = Pattern.compile(${q(pattern)}${fl ? `, ${fl}` : ""});`, `Matcher matcher = pattern.matcher(${q(text)});`, f.g ? "while (matcher.find()) {\n    System.out.println(matcher.group());\n}" : "if (matcher.find()) {\n    System.out.println(matcher.group());\n}"];
      return { code: lines.join("\n"), notes, pattern };
    }
    case "csharp": {
      const fl = [f.i && "RegexOptions.IgnoreCase", f.m && "RegexOptions.Multiline", f.s && "RegexOptions.Singleline"].filter(Boolean).join(" | ");
      if (possessive) notes.push(".NET has no possessive quantifiers; use an atomic group (?>…) instead.");
      if (/\\d/.test(pattern)) notes.push("In .NET, \\d matches digits from any script. Use [0-9] or RegexOptions.ECMAScript for ASCII only.");
      if (f.u) notes.push(".NET regexes are Unicode-aware by default; the u flag is not needed.");
      const verbatim = `@"${pattern.replace(/"/g, '""')}"`;
      const lines = ["using System.Text.RegularExpressions;", "", `var regex = new Regex(${verbatim}${fl ? `, ${fl}` : ""});`, f.g ? `foreach (Match m in regex.Matches(${q(text)}))\n{\n    Console.WriteLine(m.Value);\n}` : `Match match = regex.Match(${q(text)});`];
      return { code: lines.join("\n"), notes, pattern };
    }
    case "go": {
      const p = toPythonNames(pattern);
      const inline = [f.i && "i", f.m && "m", f.s && "s"].filter(Boolean).join("");
      const full = `${inline ? `(?${inline})` : ""}${p}`;
      if (lookahead || lookbehind) notes.push("Go's regexp package (RE2) has no look-ahead or look-behind. Match the surrounding text in a capture group and use it, or use a package such as regexp2.");
      if (backref) notes.push("RE2 has no back-references. They are not supported in Go's regexp package.");
      if (possessive || atomic) notes.push("RE2 does not support possessive quantifiers or atomic groups.");
      if (named) notes.push("Go accepts (?P<name>…), which is what the code uses.");
      const lit = full.includes("`") ? q(full) : `\`${full}\``;
      const lines = ["package main", "", "import (", '\t"fmt"', '\t"regexp"', ")", "", "func main() {", `\tre := regexp.MustCompile(${lit})`, f.g ? `\tfmt.Println(re.FindAllString(${q(text)}, -1))` : `\tfmt.Println(re.FindString(${q(text)}))`, "}"];
      return { code: lines.join("\n"), notes, pattern: full };
    }
    case "ruby": {
      const fl = [f.i && "i", f.s && "m"].filter(Boolean).join("");
      if (f.s) notes.push("Ruby's m flag is JavaScript's s flag (dot matches newline). Ruby's ^ and $ always match at line boundaries; use \\A and \\z for the start and end of the string.");
      else if (!f.m) notes.push("In Ruby ^ and $ always match at the start and end of each line. Use \\A and \\z for the whole string.");
      if (prop) notes.push("\\p{L} works in Ruby without a flag.");
      const lit = `/${pattern.replace(/\//g, "\\/")}/${fl}`;
      return { code: `re = ${lit}\n${f.g ? `matches = ${q(text)}.scan(re)` : `match = re.match(${q(text)})`}`, notes, pattern };
    }
    case "rust": {
      const p = toPythonNames(pattern);
      const inline = [f.i && "i", f.m && "m", f.s && "s"].filter(Boolean).join("");
      const full = `${inline ? `(?${inline})` : ""}${p}`;
      if (lookahead || lookbehind) notes.push("The regex crate has no look-around. Use the fancy-regex crate if you need it.");
      if (backref) notes.push("The regex crate does not support back-references; fancy-regex does.");
      if (possessive || atomic) notes.push("The regex crate does not support possessive quantifiers or atomic groups.");
      const hashes = full.includes('"') ? "#" : "";
      const lines = ["use regex::Regex;", "", `let re = Regex::new(r${hashes}"${full}"${hashes}).unwrap();`, f.g ? `for m in re.find_iter(${q(text)}) {\n    println!("{}", m.as_str());\n}` : `let found = re.find(${q(text)});`];
      return { code: lines.join("\n"), notes, pattern: full };
    }
  }
}

function phpSingleQuoted2(s: string): string {
  return `'${phpSingleQuoted(s)}'`;
}

/** Notes about how a pattern behaves across engines, independent of any one language. */
export function portabilityNotes(pattern: string): { feature: string; support: Record<Language, "yes" | "no" | "limited"> }[] {
  const all: Language[] = LANGUAGES.map((l) => l.id);
  const row = (feature: string, fn: (l: Language) => "yes" | "no" | "limited") => ({ feature, support: Object.fromEntries(all.map((l) => [l, fn(l)])) as Record<Language, "yes" | "no" | "limited"> });
  const rows: ReturnType<typeof portabilityNotes> = [];
  if (has("lookahead", pattern)) rows.push(row("Look-ahead", (l) => (l === "go" || l === "rust" ? "no" : "yes")));
  if (has("lookbehind", pattern)) rows.push(row("Look-behind", (l) => (l === "go" || l === "rust" ? "no" : l === "python" || l === "java" || l === "php" ? "limited" : "yes")));
  if (has("backref", pattern)) rows.push(row("Back-references", (l) => (l === "go" || l === "rust" ? "no" : "yes")));
  if (has("unicode-prop", pattern)) rows.push(row("\\p{…} properties", (l) => (l === "python" ? "no" : "yes")));
  if (has("possessive", pattern) || has("atomic", pattern)) rows.push(row("Possessive / atomic", (l) => (l === "javascript" || l === "go" || l === "rust" ? "no" : l === "python" ? "limited" : "yes")));
  return rows;
}

/* --------------------------------------------------- pasted-pattern detection */

export interface SyntaxIssue {
  id: string;
  message: string;
  /** A rewritten pattern and/or flags that fix it, when there is an automatic fix. */
  fix?: { pattern: string; flags: string; label: string };
}

/** Finds syntax from Python, PCRE, .NET or Java that JavaScript does not understand. */
export function detectForeignSyntax(pattern: string, flags: string): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  const skel = skeleton(pattern);
  const addFlag = (f: string) => (flags.includes(f) ? flags : [...flags, f].join(""));

  if (/\(\?P<[A-Za-z_]/.test(skel)) issues.push({ id: "py-named", message: "(?P<name>…) is Python syntax. JavaScript writes named groups as (?<name>…).", fix: { pattern: pattern.replace(/\(\?P</g, "(?<"), flags, label: "Change to (?<name>…)" } });
  if (/\(\?P=\w+\)/.test(skel)) issues.push({ id: "py-backref", message: "(?P=name) is Python syntax. JavaScript uses \\k<name>.", fix: { pattern: pattern.replace(/\(\?P=(\w+)\)/g, "\\k<$1>"), flags, label: "Change to \\k<name>" } });
  const inline = /^\(\?([imsx]+)\)/.exec(pattern);
  if (inline) {
    const supported = inline[1].split("").filter((c) => "ims".includes(c));
    issues.push({
      id: "inline-flags",
      message: `(?${inline[1]}) at the start sets flags inside the pattern (PCRE/Python style). JavaScript uses flags after the pattern.${inline[1].includes("x") ? " JavaScript has no x (free-spacing) flag." : ""}`,
      fix: { pattern: pattern.slice(inline[0].length), flags: supported.reduce((acc, c) => (acc.includes(c) ? acc : acc + c), flags), label: `Move ${supported.join("") || "them"} to the flags` },
    });
  }
  if (/\\[AZz]/.test(skel)) issues.push({ id: "anchors", message: "\\A, \\Z and \\z are not supported in JavaScript. Use ^ and $ (without the m flag they mean the start and end of the whole text).", fix: { pattern: pattern.replace(/\\A/g, "^").replace(/\\[Zz]/g, "$"), flags, label: "Replace with ^ and $" } });
  if (/[*+?}]\+/.test(skel)) issues.push({ id: "possessive", message: "Possessive quantifiers (a++, a*+) are not supported in JavaScript. Remove the extra + or restructure with a look-ahead." });
  if (/\(\?>/.test(skel)) issues.push({ id: "atomic", message: "Atomic groups (?>…) are not supported in JavaScript. The equivalent is a look-ahead with a back-reference: (?=(…))\\1." });
  if (/\[\[:[a-z]+:\]\]|\[:[a-z]+:\]/.test(pattern)) {
    const map: Record<string, string> = { alpha: "a-zA-Z", digit: "0-9", alnum: "a-zA-Z0-9", upper: "A-Z", lower: "a-z", space: "\\s", punct: "!-\\/:-@\\[-`{-~", xdigit: "0-9a-fA-F", word: "\\w" };
    issues.push({ id: "posix", message: "POSIX classes like [[:alpha:]] are not supported in JavaScript.", fix: { pattern: pattern.replace(/\[:([a-z]+):\]/g, (m, n: string) => map[n] ?? m).replace(/\[\[([^[\]]+)\]\]/g, "[$1]"), flags, label: "Expand to explicit ranges" } });
  }
  if (/\\h|\\R|\\K|\\G|\\X/.test(skel)) issues.push({ id: "pcre-escapes", message: "\\h, \\R, \\K, \\G and \\X are PCRE or Perl escapes that JavaScript does not have." });
  if (/\(\?#/.test(skel)) issues.push({ id: "comment", message: "(?#comment) groups are not supported in JavaScript. Remove the comment." });
  if (/\(\?\(/.test(skel) || /\(\?R\)|\(\?\d\)|\(\?&/.test(skel)) issues.push({ id: "recursion", message: "Conditionals and recursion, such as (?(1)…) or (?R), are not supported in JavaScript." });
  if (/\\p\{/.test(pattern) && !flags.includes("u") && !flags.includes("v")) issues.push({ id: "unicode-flag", message: "\\p{…} needs the u flag in JavaScript.", fix: { pattern, flags: addFlag("u"), label: "Add the u flag" } });
  if (/\(\?[imsx-]+:/.test(skel)) issues.push({ id: "modifier-group", message: "Scoped modifiers like (?i:…) are only supported in very recent browsers. Older ones throw an error." });
  return issues;
}

/** Helpful detail for an error from RegExp, pointing at the usual cause. */
export function explainRegexError(message: string, pattern: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("unterminated group") || m.includes("unmatched ')'")) return "The parentheses don't balance: every ( needs a ). If you meant a literal parenthesis, escape it as \\( or \\).";
  if (m.includes("nothing to repeat")) return "A quantifier (*, +, ?, {n}) has nothing in front of it to repeat. Put it after a character or group, or escape a literal with a backslash.";
  if (m.includes("unterminated character class")) return "A [ was never closed. Add ] or escape a literal bracket as \\[.";
  if (m.includes("invalid group") && /\(\?<[A-Za-z]/.test(pattern) && !/\(\?<[A-Za-z_][\w]*>/.test(pattern)) return "Group names may use letters, digits, _ and $, and must start with a letter.";
  if (m.includes("invalid escape") || m.includes("invalid unicode escape")) return "With the u flag every backslash escape must be a real one. Escape a literal backslash as \\\\ and do not escape ordinary letters.";
  if (m.includes("invalid property name")) return "That Unicode property doesn't exist. Try \\p{L} (letters), \\p{N} (numbers) or \\p{Script=Devanagari}.";
  if (m.includes("lone quantifier")) return "A {, } or quantifier is unmatched. Escape a literal brace as \\{ or \\}.";
  if (m.includes("range out of order")) return "A character range runs backwards, like [z-a]. Put the lower character first.";
  return null;
}
