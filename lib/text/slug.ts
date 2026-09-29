/**
 * URL slugs: "How to Build a Fast Web App!" → "how-to-build-a-fast-web-app".
 *
 * Accents are removed (é → e), letters that don't decompose are spelled out
 * (ß → ss, Ł → L), and Cyrillic, Greek and Devanagari are transliterated —
 * or, if you prefer, kept as they are: browsers and search engines handle
 * Unicode slugs, and they read better in the language of the page.
 */

const LATIN: Record<string, string> = {
  ß: "ss", ẞ: "SS", æ: "ae", Æ: "AE", œ: "oe", Œ: "OE", ø: "o", Ø: "O", đ: "d", Đ: "D", ð: "d", Ð: "D",
  þ: "th", Þ: "TH", ł: "l", Ł: "L", ı: "i", ħ: "h", Ħ: "H", ŧ: "t", Ŧ: "T", ŋ: "n", Ŋ: "N", ĸ: "k", ſ: "s",
};

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", і: "i", ї: "yi", є: "ye", ґ: "g", ў: "u", ј: "j",
  љ: "lj", њ: "nj", ћ: "c", ђ: "dj", џ: "dz",
};

const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n",
  ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};

const DEV_VOWELS: Record<string, string> = {
  अ: "a", आ: "a", इ: "i", ई: "i", उ: "u", ऊ: "u", ऋ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऑ: "o", ॐ: "om",
};
const DEV_MATRAS: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o",
};
const DEV_CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n", च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n", ट: "t", ठ: "th",
  ड: "d", ढ: "dh", ण: "n", त: "t", थ: "th", द: "d", ध: "dh", न: "n", प: "p", फ: "ph", ब: "b", भ: "bh",
  म: "m", य: "y", र: "r", ल: "l", व: "v", श: "sh", ष: "sh", स: "s", ह: "h", ळ: "l",
};
/** Consonants written with a nukta dot. */
const DEV_NUKTA: Record<string, string> = { क: "q", ख: "kh", ग: "g", ज: "z", ड: "r", ढ: "rh", फ: "f", य: "y" };
const VIRAMA = "्";
const NUKTA = "़";

type Token = { kind: "consonant" | "vowel" | "schwa" | "other"; latin: string };
const isVowel = (t?: Token) => t?.kind === "vowel" || t?.kind === "schwa";

/**
 * One word of Hindi, Marathi or Nepali in Devanagari, spelt the way people
 * write it in Latin letters. Every consonant carries an "a" unless a vowel
 * sign or virama follows; as in speech, that "a" is dropped at the end of a
 * word (कमल → kamal) and between two consonants that sit between vowels
 * (सरकार → sarkar, जनवरी → janvari).
 */
function devanagari(word: string): string {
  // NFD splits precomposed nukta letters (ज़) into letter + nukta.
  const chars = [...word.normalize("NFD")];
  const toks: Token[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (DEV_CONSONANTS[c]) {
      let latin = DEV_CONSONANTS[c];
      if (chars[i + 1] === NUKTA) {
        latin = DEV_NUKTA[c] ?? latin;
        i++;
      }
      toks.push({ kind: "consonant", latin });
      const next = chars[i + 1];
      if (next === VIRAMA) i++;
      else if (DEV_MATRAS[next]) {
        toks.push({ kind: "vowel", latin: DEV_MATRAS[next] });
        i++;
      } else toks.push({ kind: "schwa", latin: "a" });
    } else if (DEV_VOWELS[c]) toks.push({ kind: "vowel", latin: DEV_VOWELS[c] });
    else if (DEV_MATRAS[c]) toks.push({ kind: "vowel", latin: DEV_MATRAS[c] });
    else if (c === "ं" || c === "ँ") toks.push({ kind: "consonant", latin: "n" });
    else if (c === "ः") toks.push({ kind: "consonant", latin: "h" });
    else if (c >= "०" && c <= "९") toks.push({ kind: "other", latin: String(c.charCodeAt(0) - 0x966) });
    else if (c === "।" || c === "॥") toks.push({ kind: "other", latin: " " });
    else if (c !== NUKTA && c !== VIRAMA) toks.push({ kind: "other", latin: c });
  }
  const last = toks.length - 1;
  if (toks[last]?.kind === "schwa" && toks.slice(0, last).some(isVowel)) toks.pop();
  for (let i = 2; i < toks.length - 2; i++) {
    const [a, b, c, d, e] = toks.slice(i - 2, i + 3);
    if (c.kind === "schwa" && isVowel(a) && b.kind === "consonant" && d.kind === "consonant" && isVowel(e)) toks.splice(i, 1);
  }
  return toks.map((t) => t.latin).join("");
}

function transliterate(text: string): string {
  let out = text.replace(/[ऀ-ॿ]+/g, devanagari);
  out = [...out]
    .map((ch) => {
      const lower = ch.toLowerCase();
      const t = LATIN[ch] ?? CYRILLIC[lower] ?? GREEK[lower.normalize("NFD")[0]];
      if (t === undefined) return ch;
      // Keep capitals so the lower-case option still decides.
      return ch !== lower && t ? t[0].toUpperCase() + t.slice(1) : t;
    })
    .join("");
  // é → e: split letters from their accents and drop the accents.
  return out.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "about", "above", "after", "along", "amid", "among", "as", "at", "by",
  "for", "from", "in", "into", "like", "of", "off", "on", "onto", "out", "over", "to", "with", "is", "are", "was",
  "were", "be", "it", "its", "this", "that", "these", "those",
]);

export interface SlugOptions {
  separator: "-" | "_" | "." | "/";
  lowercase: boolean;
  /** Keep letters from other scripts instead of transliterating them. */
  keepUnicode: boolean;
  removeStopWords: boolean;
  /** Characters; 0 for no limit. Cuts at a word boundary. */
  maxLength: number;
  /** "&" → "and", "@" → "at", "%" → "percent". */
  symbolsAsWords: boolean;
  removeNumbers: boolean;
}

export const DEFAULT_SLUG: SlugOptions = {
  separator: "-",
  lowercase: true,
  keepUnicode: false,
  removeStopWords: false,
  maxLength: 0,
  symbolsAsWords: true,
  removeNumbers: false,
};

let letterRe: RegExp | null = null;
/** Anything that isn't a letter, mark or digit, in any script. Built at runtime for older compilers. */
function nonWord(): RegExp {
  letterRe ??= new RegExp("[^\\p{L}\\p{M}\\p{N}]+", "gu");
  return letterRe;
}

let apostropheRe: RegExp | null = null;
function apostrophe(): RegExp {
  apostropheRe ??= new RegExp("(\\p{L})['\u2019\u2018`](\\p{L})", "gu");
  return apostropheRe;
}

export function slugify(input: string, o: SlugOptions): string {
  let text = input.normalize("NFC");
  if (o.symbolsAsWords) {
    text = text.replace(/&/g, " and ").replace(/@/g, " at ").replace(/%/g, " percent ");
  }
  // "Don't" → "dont", not "don-t".
  text = text.replace(apostrophe(), "$1$2");
  if (!o.keepUnicode) text = transliterate(text);
  if (o.lowercase) text = text.toLowerCase();
  if (o.removeNumbers) text = text.replace(/[0-9]/g, " ");

  let words = o.keepUnicode
    ? text.split(nonWord()).filter(Boolean)
    : text.replace(/[^A-Za-z0-9]+/g, " ").split(" ").filter(Boolean);
  if (o.removeStopWords) {
    const kept = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
    // A title made only of stop words keeps them, rather than vanishing.
    if (kept.length) words = kept;
  }

  let slug = words.join(o.separator);
  if (o.maxLength > 0 && slug.length > o.maxLength) {
    const cut = slug.slice(0, o.maxLength + 1);
    const at = cut.lastIndexOf(o.separator);
    slug = at > 0 ? cut.slice(0, at) : slug.slice(0, o.maxLength);
  }
  return slug;
}

/** How long the slug is once percent-encoded in a URL (Unicode letters take 6–12 characters each). */
export function encodedLength(slug: string): number {
  return encodeURIComponent(slug).length;
}
