/**
 * URL and query-string handling for the URL Parser, Query String Parser
 * and Query String Builder. Parsing uses the browser's WHATWG URL class (the
 * one real requests go through) and adds what it does not report: how the
 * raw text was malformed, what the components mean, and which parameters look
 * like secrets that should never be in a URL.
 */

import { splitUrl } from "./request";

export interface QueryParam {
  /** Decoded name and value. */
  key: string;
  value: string;
  /** As written in the URL. */
  rawKey: string;
  rawValue: string;
  /** False when a percent-escape was invalid and left as-is. */
  valid: boolean;
  /** Present without "=", like ?debug. */
  bare: boolean;
}

/** A URL split into the part before ?, the query (without ?), and the #fragment (with #). */
export const splitBase = splitUrl;

export type ArrayFormat = "repeat" | "brackets" | "indices" | "comma";

export interface QueryBuildOptions {
  arrayFormat?: ArrayFormat;
  /** "plus" writes spaces as + (HTML forms); "percent" as %20 (URLs). */
  space?: "plus" | "percent";
  sort?: boolean;
  skipEmpty?: boolean;
  /** Leave characters unencoded except & = # and whitespace. */
  encode?: boolean;
}

/* ------------------------------------------------------------------- query */

function safeDecode(s: string, plusIsSpace: boolean): { text: string; ok: boolean } {
  const prepared = plusIsSpace ? s.replace(/\+/g, " ") : s;
  try {
    return { text: decodeURIComponent(prepared), ok: true };
  } catch {
    // Decode what can be decoded, leaving broken escapes alone.
    const text = prepared.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
      try {
        return decodeURIComponent(run);
      } catch {
        return run;
      }
    });
    return { text, ok: false };
  }
}

/** Parses a query string (with or without the leading ?, or a whole URL) into parameters in order. */
export function parseQuery(input: string, opts: { plusIsSpace?: boolean } = {}): QueryParam[] {
  const plus = opts.plusIsSpace ?? true;
  let q = input.trim();
  const hash = q.indexOf("#");
  if (hash !== -1) q = q.slice(0, hash);
  const qm = q.indexOf("?");
  if (qm !== -1 && (/^[a-z][a-z0-9+.-]*:/i.test(q) || qm === 0 || q.slice(0, qm).includes("/") || q.slice(0, qm).includes("."))) q = q.slice(qm + 1);
  if (!q) return [];
  return q
    .split("&")
    .filter((p) => p !== "")
    .map((pair) => {
      const eq = pair.indexOf("=");
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawValue = eq === -1 ? "" : pair.slice(eq + 1);
      const k = safeDecode(rawKey, plus);
      const v = safeDecode(rawValue, plus);
      return { key: k.text, value: v.text, rawKey, rawValue, valid: k.ok && v.ok, bare: eq === -1 };
    });
}

export type QueryValue = string | QueryValue[] | { [key: string]: QueryValue };

type Container = { [key: string]: QueryValue } | QueryValue[];

function setPath(root: Container, path: string[], value: string): void {
  let node: Container = root;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    const last = i === path.length - 1;
    const next = path[i + 1];
    const nextIsArray = next === "" || /^\d+$/.test(next ?? "");
    if (Array.isArray(node)) {
      if (seg === "") {
        if (last) {
          node.push(value);
          return;
        }
        const child: Container = nextIsArray ? [] : {};
        node.push(child);
        node = child;
        continue;
      }
      const idx = Number(seg);
      if (last) {
        node[idx] = value;
        return;
      }
      if (node[idx] === undefined || typeof node[idx] === "string") node[idx] = nextIsArray ? [] : {};
      node = node[idx] as Container;
      continue;
    }
    if (last) {
      const existing = node[seg];
      if (existing === undefined) node[seg] = value;
      else if (Array.isArray(existing)) existing.push(value);
      else node[seg] = [existing, value];
      return;
    }
    if (node[seg] === undefined || typeof node[seg] === "string") node[seg] = nextIsArray ? [] : {};
    node = node[seg] as Container;
  }
}

/** Groups parameters into an object: repeated names and a[]= / a[0]= / a[b]= become arrays and nested objects. */
export function queryToObject(params: { key: string; value: string }[], opts: { brackets?: boolean } = {}): { [key: string]: QueryValue } {
  const useBrackets = opts.brackets ?? true;
  const root: { [key: string]: QueryValue } = {};
  for (const { key, value } of params) {
    const m = useBrackets ? /^([^[\]]+)((?:\[[^[\]]*\])+)$/.exec(key) : null;
    const path = m ? [m[1], ...[...m[2].matchAll(/\[([^[\]]*)\]/g)].map((x) => x[1])] : [key];
    setPath(root, path, value);
  }
  return root;
}

/** Encodes one component. Stricter than encodeURIComponent: also escapes ! ' ( ) *. */
export function encodeComponent(s: string, space: "plus" | "percent" = "percent"): string {
  const e = encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  return space === "plus" ? e.replace(/%20/g, "+") : e;
}

/** Encodes only what would break the query string: & = # % + and whitespace, control characters. */
function encodeMinimal(s: string, space: "plus" | "percent"): string {
  return s.replace(/[&=#%+\s\u0000-\u001f]/g, (c) => (c === " " && space === "plus" ? "+" : encodeURIComponent(c)));
}

export interface BuilderEntry {
  key: string;
  value: string;
}

/** Turns a JSON-like object into flat key/value pairs using the chosen array format. */
export function flattenObject(value: unknown, format: ArrayFormat = "repeat", prefix = ""): BuilderEntry[] {
  const out: BuilderEntry[] = [];
  const walk = (v: unknown, key: string) => {
    if (v === null || v === undefined) {
      out.push({ key, value: "" });
    } else if (Array.isArray(v)) {
      if (format === "comma") out.push({ key, value: v.map((x) => (typeof x === "object" && x !== null ? JSON.stringify(x) : String(x))).join(",") });
      else
        v.forEach((item, i) => {
          const k = format === "brackets" ? `${key}[]` : format === "indices" ? `${key}[${i}]` : key;
          if (item !== null && typeof item === "object") walk(item, k);
          else out.push({ key: k, value: item === null || item === undefined ? "" : String(item) });
        });
    } else if (typeof v === "object") {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) walk(x, key ? `${key}[${k}]` : k);
    } else out.push({ key, value: String(v) });
  };
  if (value !== null && typeof value === "object" && !Array.isArray(value)) for (const [k, x] of Object.entries(value as Record<string, unknown>)) walk(x, prefix ? `${prefix}[${k}]` : k);
  return out;
}

/**
 * Builds a query string from rows. Rows that share a name become an array in
 * the chosen format, so the same table can produce `a=1&a=2`, `a[]=1&a[]=2`,
 * `a[0]=1&a[1]=2` or `a=1,2`.
 */
export function buildQuery(rows: BuilderEntry[], opts: QueryBuildOptions = {}): string {
  const format = opts.arrayFormat ?? "repeat";
  const space = opts.space ?? "percent";
  const encode = opts.encode ?? true;
  let list = rows.filter((r) => r.key !== "" || r.value !== "");
  if (opts.skipEmpty) list = list.filter((r) => r.value !== "");
  if (opts.sort) list = [...list].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const enc = (s: string) => (encode ? encodeComponent(s, space) : encodeMinimal(s, space));
  const encKey = (s: string) => (encode ? encodeComponent(s, space) : encodeMinimal(s, space)).replace(/%5B/gi, "[").replace(/%5D/gi, "]");

  // Group repeated names to apply the array format; keep first-seen order.
  const order: string[] = [];
  const groups = new Map<string, string[]>();
  for (const r of list) {
    if (!groups.has(r.key)) {
      groups.set(r.key, []);
      order.push(r.key);
    }
    groups.get(r.key)!.push(r.value);
  }
  const parts: string[] = [];
  for (const key of order) {
    const values = groups.get(key)!;
    // Keys already in bracket form (from flattened objects) are left as the user wrote them.
    const bracketed = /\[[^\]]*\]$/.test(key);
    if (values.length === 1 || bracketed) {
      for (const v of values) parts.push(`${encKey(key)}=${enc(v)}`);
    } else if (format === "comma") parts.push(`${encKey(key)}=${values.map(enc).join(encode ? "%2C" : ",")}`);
    else if (format === "brackets") for (const v of values) parts.push(`${encKey(key)}[]=${enc(v)}`);
    else if (format === "indices") values.forEach((v, i) => parts.push(`${encKey(key)}[${i}]=${enc(v)}`));
    else for (const v of values) parts.push(`${encKey(key)}=${enc(v)}`);
  }
  return parts.join("&");
}

/* --------------------------------------------------------------------- URL */

export type IssueLevel = "error" | "warning" | "info";

export interface UrlIssue {
  level: IssueLevel;
  title: string;
  detail: string;
}

export interface ParsedUrl {
  href: string;
  protocol: string;
  scheme: string;
  username: string;
  password: string;
  hostname: string;
  /** Unicode form when the host is an internationalised domain name. */
  unicodeHostname?: string;
  port: string;
  defaultPort?: string;
  origin: string;
  pathname: string;
  pathSegments: string[];
  search: string;
  query: QueryParam[];
  hash: string;
  hashParams: QueryParam[];
  isIp: boolean;
  isLocal: boolean;
  /** Labels of the host, right to left, with the TLD flagged. */
  labels: string[];
  issues: UrlIssue[];
}

export const DEFAULT_PORTS: Record<string, string> = { "http:": "80", "https:": "443", "ftp:": "21", "ws:": "80", "wss:": "443", "ssh:": "22" };

const SECRET_NAMES = /^(?:.*[_-])?(?:token|access_?token|api_?key|apikey|key|secret|password|passwd|pwd|auth|authorization|session|sessionid|sid|jwt|signature|sig|credential)s?$/i;

export type ParseResult = { ok: true; url: ParsedUrl } | { ok: false; error: string; suggestion?: string };

export function parseUrl(input: string): ParseResult {
  const raw = input;
  const text = input.trim();
  if (!text) return { ok: false, error: "Enter a URL." };
  const issues: UrlIssue[] = [];

  let target = text;
  let addedScheme = false;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(target) || /^[a-z0-9.-]+:\d+(\/|$)/i.test(target)) {
    // "example.com/path" or "localhost:3000" — no scheme.
    if (target.startsWith("//")) target = `https:${target}`;
    else target = `https://${target}`;
    addedScheme = true;
  }
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    const hint = /\s/.test(text) ? "It contains spaces; encode them as %20." : undefined;
    return { ok: false, error: "This is not a valid URL.", suggestion: hint ?? "Check the scheme (https://), the host name and any brackets or stray characters." };
  }

  if (raw !== text) issues.push({ level: "warning", title: "Leading or trailing whitespace", detail: "Spaces around a URL are ignored by browsers, but copy-pasted whitespace breaks scripts and config files." });
  if (addedScheme) issues.push({ level: "info", title: "No scheme in the input", detail: `Parsed as ${url.protocol}// because a scheme is required. Add https:// so it is unambiguous.` });
  if (/\\/.test(text.split("?")[0])) issues.push({ level: "warning", title: "Backslashes in the URL", detail: "Browsers turn \\ into /, but other tools do not. URLs use forward slashes." });
  if (/\s/.test(text)) issues.push({ level: "error", title: "Spaces inside the URL", detail: "Spaces must be written as %20 (or + in a query). Browsers fix them silently, servers and libraries often do not." });
  if (/[^\u0000-\u007f]/.test(text.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i, ""))) issues.push({ level: "info", title: "Non-ASCII characters", detail: "The path or query contains characters outside ASCII. They are sent percent-encoded as UTF-8; the normalised form is shown below." });
  if (/%(?![0-9A-Fa-f]{2})/.test(text)) issues.push({ level: "error", title: "Broken percent-escape", detail: "A % is not followed by two hex digits. Write a literal percent sign as %25." });
  if (url.username || url.password) issues.push({ level: "warning", title: "Credentials inside the URL", detail: "user:password@ in a URL ends up in logs, browser history and Referer headers, and browsers strip or block it. Send credentials in an Authorization header instead." });
  if (url.protocol === "http:" && !isLocalHost(url.hostname)) issues.push({ level: "warning", title: "Unencrypted http://", detail: "Traffic can be read and changed on the way. Use https:// unless this is a local development address." });
  if (url.hostname.endsWith(".")) issues.push({ level: "info", title: "Trailing dot in the host", detail: "A trailing dot makes the hostname fully qualified. Most sites work with it, but cookies, TLS certificates and Host-based routing often do not." });
  if (/[A-Z]/.test(text.replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0]) ) issues.push({ level: "info", title: "Capital letters in the host", detail: "Host names are case-insensitive, so it was lower-cased. Paths and queries are case-sensitive and were left alone." });
  if (url.pathname.includes("//")) issues.push({ level: "info", title: "Double slash in the path", detail: "// creates an empty path segment. Many servers treat /a//b and /a/b differently, and it often signals a joined-path bug." });
  if (text.length > 2000) issues.push({ level: "warning", title: `Long URL (${text.length} characters)`, detail: "Browsers accept about 2 MB but many servers, proxies and CDNs cut off at 2–8 KB. Move large data into a POST body." });
  const hashQuery = url.hash.indexOf("?");
  if (hashQuery !== -1 && !url.search) issues.push({ level: "info", title: "Query string is after the #", detail: "Everything after # stays in the browser and is never sent to the server. If ?name=value should reach the server, put it before the #." });
  if (url.port && DEFAULT_PORTS[url.protocol] === url.port) issues.push({ level: "info", title: "Default port written out", detail: `:${url.port} is the default for ${url.protocol}//, so it is dropped when the URL is normalised.` });

  const query = parseQuery(url.search.replace(/^\?/, ""));
  const secrets = query.filter((p) => SECRET_NAMES.test(p.key) && p.value !== "");
  if (secrets.length) issues.push({ level: "warning", title: `Possible secret in the query string (${secrets.map((s) => s.key).join(", ")})`, detail: "Query strings are stored in server logs, browser history and analytics, and sent in Referer headers. Put tokens and keys in a header or POST body." });
  if (query.some((p) => !p.valid)) issues.push({ level: "error", title: "Invalid percent-encoding in a parameter", detail: "At least one parameter contains a malformed %-escape and could not be decoded." });
  const names = query.map((p) => p.key);
  const dupes = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  if (dupes.length) issues.push({ level: "info", title: `Repeated parameter${dupes.length > 1 ? "s" : ""}: ${dupes.join(", ")}`, detail: "How repeated names are handled depends on the server: PHP keeps the last, Express builds an array, Rails needs name[]. Check what your backend expects." });

  const hostname = url.hostname;
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith("[");
  let unicodeHostname: string | undefined;
  if (hostname.includes("xn--")) {
    try {
      // Decode punycode labels through the URL machinery available: Intl-free fallback is left as-is.
      unicodeHostname = decodePunycodeHost(hostname);
    } catch {
      unicodeHostname = undefined;
    }
    issues.push({ level: "info", title: "Internationalised domain name", detail: "The host uses Unicode characters, written on the wire in ASCII \"xn--\" (Punycode) form. Look-alike characters are used in phishing, so check it carefully." });
  }

  const pathSegments = url.pathname.split("/").filter((s, i) => !(i === 0 && s === "")).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  return {
    ok: true,
    url: {
      href: url.href,
      protocol: url.protocol,
      scheme: url.protocol.replace(/:$/, ""),
      username: decodeMaybe(url.username),
      password: decodeMaybe(url.password),
      hostname,
      unicodeHostname,
      port: url.port,
      defaultPort: DEFAULT_PORTS[url.protocol],
      origin: url.origin === "null" ? `${url.protocol}//${url.host}` : url.origin,
      pathname: url.pathname,
      pathSegments: pathSegments.filter((_, i, a) => !(i === a.length - 1 && a[i] === "")),
      search: url.search,
      query,
      hash: url.hash,
      hashParams: url.hash.includes("=") ? parseQuery(url.hash.replace(/^#\/?\??/, "")) : [],
      isIp,
      isLocal: isLocalHost(hostname),
      labels: isIp ? [hostname] : hostname.split(".").filter(Boolean).reverse(),
      issues,
    },
  };
}

function decodeMaybe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function isLocalHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "[::1]" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "0.0.0.0"
  );
}

/** RFC 3492 decoder, enough to show the Unicode form of an xn-- host. */
function decodePunycodeHost(host: string): string {
  return host
    .split(".")
    .map((label) => (label.startsWith("xn--") ? punycodeDecode(label.slice(4)) : label))
    .join(".");
}

function punycodeDecode(input: string): string {
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  let n = 128, i = 0, bias = 72;
  const output: number[] = [];
  const basic = input.lastIndexOf("-");
  for (let j = 0; j < Math.max(basic, 0); j++) output.push(input.charCodeAt(j));
  const adapt = (delta: number, points: number, first: boolean) => {
    let k = 0;
    delta = first ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / points);
    for (; delta > ((base - tMin) * tMax) >> 1; k += base) delta = Math.floor(delta / (base - tMin));
    return Math.floor(k + ((base - tMin + 1) * delta) / (delta + skew));
  };
  for (let idx = basic > 0 ? basic + 1 : 0; idx < input.length; ) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (idx >= input.length) throw new Error("bad punycode");
      const c = input.charCodeAt(idx++);
      const digit = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base;
      if (digit >= base) throw new Error("bad punycode");
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    n += Math.floor(i / out);
    i %= out;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

/** Rebuilds a URL string from parts, encoding each part correctly. Empty parts are left out. */
export function buildUrl(parts: {
  scheme: string;
  username?: string;
  password?: string;
  host: string;
  port?: string;
  path?: string;
  query?: string;
  hash?: string;
}): { url: string; error?: string } {
  try {
    const scheme = parts.scheme.replace(/:?\/*$/, "") || "https";
    const u = new URL(`${scheme}://placeholder.invalid`);
    u.hostname = parts.host;
    if (parts.port) u.port = parts.port;
    if (parts.username) u.username = parts.username;
    if (parts.password) u.password = parts.password;
    u.pathname = parts.path ? (parts.path.startsWith("/") ? parts.path : `/${parts.path}`) : "/";
    u.search = parts.query ? (parts.query.startsWith("?") ? parts.query : `?${parts.query}`) : "";
    u.hash = parts.hash ? (parts.hash.startsWith("#") ? parts.hash : `#${parts.hash}`) : "";
    if (u.hostname === "placeholder.invalid") return { url: "", error: "Enter a host name." };
    return { url: u.href };
  } catch {
    return { url: "", error: "Those parts do not make a valid URL." };
  }
}
