/**
 * The JavaScript regex syntax on one page. Each entry can be inserted into
 * the pattern at the caret; `caret` says where the cursor goes afterwards
 * (measured from the start of the inserted text) so that `(…)` lands the
 * cursor inside the brackets.
 */

export interface CheatItem {
  /** What is shown. */
  token: string;
  meaning: string;
  /** What is inserted; defaults to `token`. */
  insert?: string;
  caret?: number;
}

export interface CheatGroup {
  title: string;
  items: CheatItem[];
}

export const CHEAT_SHEET: CheatGroup[] = [
  {
    title: "Characters",
    items: [
      { token: ".", meaning: "Any character except a line break" },
      { token: "\\d", meaning: "A digit, 0–9" },
      { token: "\\D", meaning: "Anything that is not a digit" },
      { token: "\\w", meaning: "A letter, digit or underscore" },
      { token: "\\W", meaning: "Anything that is not a word character" },
      { token: "\\s", meaning: "Whitespace: space, tab, line break" },
      { token: "\\S", meaning: "Anything that is not whitespace" },
      { token: "\\t", meaning: "A tab" },
      { token: "\\n", meaning: "A line break" },
      { token: "\\.", meaning: "A literal dot. Put a backslash before . ? * + ( ) [ ] { } | ^ $ to match it as text" },
    ],
  },
  {
    title: "Sets",
    items: [
      { token: "[abc]", meaning: "One of a, b or c", caret: 1 },
      { token: "[^abc]", meaning: "Any character except a, b or c", caret: 2 },
      { token: "[a-z]", meaning: "A lower-case letter", insert: "[a-z]", caret: 5 },
      { token: "[A-Za-z0-9]", meaning: "A letter or digit" },
      { token: "[0-9]", meaning: "A digit (ASCII only, unlike \\d in some languages)" },
    ],
  },
  {
    title: "Repeating",
    items: [
      { token: "*", meaning: "Zero or more" },
      { token: "+", meaning: "One or more" },
      { token: "?", meaning: "Zero or one (optional)" },
      { token: "{3}", meaning: "Exactly 3", insert: "{3}", caret: 2 },
      { token: "{2,}", meaning: "2 or more", insert: "{2,}", caret: 2 },
      { token: "{2,5}", meaning: "Between 2 and 5", insert: "{2,5}", caret: 2 },
      { token: "+?", meaning: "Lazy: as few as possible. Also *? ?? {n,m}?" },
    ],
  },
  {
    title: "Positions",
    items: [
      { token: "^", meaning: "Start of the text (or of each line with the m flag)" },
      { token: "$", meaning: "End of the text (or of each line with the m flag)" },
      { token: "\\b", meaning: "Edge of a word" },
      { token: "\\B", meaning: "Not at the edge of a word" },
    ],
  },
  {
    title: "Groups",
    items: [
      { token: "(…)", meaning: "Capture group: remembers what it matched", insert: "()", caret: 1 },
      { token: "(?:…)", meaning: "Group without capturing", insert: "(?:)", caret: 3 },
      { token: "(?<name>…)", meaning: "Named capture group", insert: "(?<name>)", caret: 8 },
      { token: "a|b", meaning: "Either a or b", insert: "|" },
      { token: "\\1", meaning: "Same text as capture group 1 (back-reference)" },
      { token: "\\k<name>", meaning: "Same text as the named group", insert: "\\k<name>" },
    ],
  },
  {
    title: "Look-around",
    items: [
      { token: "(?=…)", meaning: "Followed by … (not included in the match)", insert: "(?=)", caret: 3 },
      { token: "(?!…)", meaning: "Not followed by …", insert: "(?!)", caret: 3 },
      { token: "(?<=…)", meaning: "Preceded by …", insert: "(?<=)", caret: 4 },
      { token: "(?<!…)", meaning: "Not preceded by …", insert: "(?<!)", caret: 4 },
    ],
  },
  {
    title: "Unicode (u flag)",
    items: [
      { token: "\\p{L}", meaning: "Any letter in any language" },
      { token: "\\p{Lu}", meaning: "An upper-case letter" },
      { token: "\\p{N}", meaning: "Any kind of number" },
      { token: "\\p{Script=Devanagari}", meaning: "A character from the Devanagari script" },
      { token: "\\p{Emoji}", meaning: "An emoji" },
      { token: "\\u{1F600}", meaning: "A character by its code point" },
    ],
  },
];
