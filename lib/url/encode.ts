/**
 * Percent-encoding for URLs, the way each part of a URL needs it, and a
 * decoder that copes with the malformed input people actually paste.
 */

export type EncodeTarget = "component" | "url" | "form";

export const TARGETS: { value: EncodeTarget; label: string; description: string }[] = [
  {
    value: "component",
    label: "A value or path part",
    description: "Encodes everything except letters, digits and - _ . ! ~ * ' ( ). Use it for one query value or one path segment.",
  },
  {
    value: "url",
    label: "A whole URL",
    description: "Keeps : / ? # & = and the other characters that give a URL its structure, and encodes spaces and non-ASCII text.",
  },
  {
    value: "form",
    label: "Form data",
    description: "As sent by an HTML form (application/x-www-form-urlencoded): spaces become +.",
  },
];

/** RFC 3986 reserves ! ' ( ) * too; encodeURIComponent leaves them, so they're added here. */
function strictComponent(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function encodeUrlText(text: string, target: EncodeTarget, opts: { strict?: boolean } = {}): string {
  switch (target) {
    case "component":
      return opts.strict ? strictComponent(text) : encodeURIComponent(text);
    case "url":
      // encodeURI would double-encode an existing %20; keep valid escapes as they are.
      return text
        .split(/(%[0-9A-Fa-f]{2})/)
        .map((part, i) => (i % 2 ? part : encodeURI(part)))
        .join("");
    case "form":
      return strictComponent(text).replace(/%20/g, "+");
  }
}

export interface DecodeResult {
  text: string;
  /** Escapes that aren't valid UTF-8 and were left as they are. */
  invalid: string[];
}

/**
 * Decodes percent-escapes. Unlike decodeURIComponent it doesn't give up on
 * the whole text when one escape is broken: each run of escapes is decoded on
 * its own, and runs that aren't valid UTF-8 are kept as written.
 */
export function decodeUrlText(text: string, opts: { plusIsSpace?: boolean } = {}): DecodeResult {
  const invalid: string[] = [];
  const src = opts.plusIsSpace ? text.replace(/\+/g, " ") : text;
  const out = src.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      // Decode what can be decoded inside the run, byte sequence by sequence.
      let result = "";
      const bytes = run.match(/%[0-9A-Fa-f]{2}/g)!;
      let i = 0;
      while (i < bytes.length) {
        let done = false;
        for (let len = Math.min(4, bytes.length - i); len > 0; len--) {
          try {
            result += decodeURIComponent(bytes.slice(i, i + len).join(""));
            i += len;
            done = true;
            break;
          } catch {
            /* try a shorter sequence */
          }
        }
        if (!done) {
          invalid.push(bytes[i]);
          result += bytes[i];
          i++;
        }
      }
      return result;
    }
  });
  const stray = src.match(/%(?![0-9A-Fa-f]{2})/g);
  if (stray) invalid.push(...stray.map(() => "%"));
  return { text: out, invalid };
}

/** Escapes that survive decoding (%2520 → %20) mean the text was encoded twice. */
export function stillEncoded(text: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(text);
}

export interface UrlPart {
  label: string;
  value: string;
}

export interface UrlBreakdown {
  parts: UrlPart[];
  params: { key: string; value: string; raw: string }[];
}

/** The pieces of a URL, decoded for reading. */
export function breakDown(input: string): UrlBreakdown | { error: string } | null {
  const t = input.trim();
  if (!t) return null;
  let u: URL;
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
  } catch {
    return { error: "That isn't a complete URL. It should look like https://example.com/page?x=1." };
  }
  const dec = (s: string) => decodeUrlText(s).text;
  const parts: UrlPart[] = [{ label: "Scheme", value: u.protocol.replace(/:$/, "") }];
  if (u.username) parts.push({ label: "User", value: dec(u.username) });
  if (u.password) parts.push({ label: "Password", value: "••••••" });
  parts.push({ label: "Host", value: u.hostname });
  if (u.port) parts.push({ label: "Port", value: u.port });
  parts.push({ label: "Path", value: dec(u.pathname) });
  if (u.hash) parts.push({ label: "Fragment", value: dec(u.hash.slice(1)) });
  const params = u.search
    .slice(1)
    .split("&")
    .filter(Boolean)
    .map((raw) => {
      const i = raw.indexOf("=");
      const k = i < 0 ? raw : raw.slice(0, i);
      const v = i < 0 ? "" : raw.slice(i + 1);
      return { key: decodeUrlText(k, { plusIsSpace: true }).text, value: decodeUrlText(v, { plusIsSpace: true }).text, raw };
    });
  return { parts, params };
}
