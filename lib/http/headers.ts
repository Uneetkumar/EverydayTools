/**
 * Parsing and analysing raw HTTP header blocks — what `curl -I`, browser dev
 * tools and server logs give you. Nothing here fetches anything: it reads the
 * text you paste and tells you what each header means and what is wrong or
 * missing.
 */

import { type HeaderInfo, getHeaderInfo } from "./header-info";
import { getStatus } from "./status";

/* ------------------------------------------------------------------ parsing */

export interface HeaderEntry {
  name: string;
  value: string;
  /** 1-based line in the pasted text. */
  line: number;
  info?: HeaderInfo;
}

export interface StartLine {
  kind: "response" | "request";
  version?: string;
  status?: number;
  reason?: string;
  method?: string;
  target?: string;
  raw: string;
}

export interface HeaderBlock {
  start?: StartLine;
  headers: HeaderEntry[];
  problems: string[];
}

const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const RESPONSE_LINE = /^HTTP\/(\d(?:\.\d)?)\s+(\d{3})(?:\s+(.*))?$/i;
const REQUEST_LINE = /^([A-Za-z]+)\s+(\S+)\s+HTTP\/(\d(?:\.\d)?)$/i;

/**
 * Parses pasted headers. Accepts a bare list of "Name: value" lines, a full
 * HTTP message head with a status or request line, HTTP/2 pseudo-headers, and
 * `curl -i` output with several redirect responses (each becomes a block).
 */
export function parseHeaderBlocks(input: string): HeaderBlock[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: HeaderBlock[] = [];
  let cur: HeaderBlock | null = null;
  let sawBlank = false;
  let inBody = false;

  const open = (): HeaderBlock => {
    const b: HeaderBlock = { headers: [], problems: [] };
    blocks.push(b);
    return b;
  };

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    // curl -v prefixes lines with "< " (response) or "> " (request).
    const line = raw.replace(/^[<>]\s?/, "");
    if (line.trim() === "") {
      if (cur && cur.start && cur.headers.length && !inBody) sawBlank = true;
      return;
    }
    const resp = RESPONSE_LINE.exec(line.trim());
    const req = !resp ? REQUEST_LINE.exec(line.trim()) : null;
    if (resp || req) {
      // A new message begins with its start line.
      cur = open();
      sawBlank = false;
      inBody = false;
      cur.start = resp
        ? { kind: "response", version: resp[1], status: Number(resp[2]), reason: resp[3]?.trim() || getStatus(Number(resp[2]))?.name, raw: line.trim() }
        : { kind: "request", method: req![1].toUpperCase(), target: req![2], version: req![3], raw: line.trim() };
      return;
    }
    if (inBody) return;
    if (sawBlank && cur) {
      // Anything after the blank line that ends a message head is its body.
      inBody = true;
      sawBlank = false;
      cur.problems.push(`The message body (from line ${lineNo}) was skipped. Only the headers are read.`);
      return;
    }
    if (!cur) cur = open();
    // Obsolete line folding: a line starting with whitespace continues the previous header.
    if (/^[ \t]/.test(line) && cur.headers.length) {
      const last = cur.headers[cur.headers.length - 1];
      last.value = `${last.value} ${line.trim()}`;
      return;
    }
    // HTTP/2 pseudo-headers (":status: 200") start with a colon.
    const pseudo = line.startsWith(":");
    const colon = line.indexOf(":", pseudo ? 1 : 0);
    if (colon <= 0) {
      cur.problems.push(`Line ${lineNo} is not a header (no colon): "${line.trim().slice(0, 60)}"`);
      return;
    }
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (pseudo) {
      if (name === ":status" && !cur.start) {
        const status = Number(value);
        cur.start = { kind: "response", version: "2", status, reason: getStatus(status)?.name, raw: `HTTP/2 ${status}` };
      } else if (name === ":method") {
        cur.start = { ...(cur.start ?? { kind: "request", raw: "" }), kind: "request", method: value, version: "2", raw: `${value} … HTTP/2` };
      } else if (name === ":path" && cur.start) cur.start = { ...cur.start, target: value };
      return;
    }
    if (!TOKEN.test(name)) cur.problems.push(`Line ${lineNo}: "${name.slice(0, 40)}" is not a valid header name (only letters, digits and - _ . ! # $ % & ' * + ^ \` | ~ are allowed).`);
    cur.headers.push({ name, value, line: lineNo, info: getHeaderInfo(name) });
  });

  return blocks.filter((b) => b.start || b.headers.length || b.problems.length);
}

/* ------------------------------------------------------------------- values */

export type Level = "good" | "warn" | "bad" | "info";

export interface Finding {
  level: Level;
  title: string;
  detail: string;
  /** The header (or headers) the finding is about. */
  header?: string;
}

const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
const lower = (h: HeaderEntry[], n: string) => h.filter((x) => x.name.toLowerCase() === n.toLowerCase());
const first = (h: HeaderEntry[], n: string) => lower(h, n)[0]?.value;

export interface CacheDirectives {
  directives: { name: string; value?: string }[];
  has: (d: string) => boolean;
  num: (d: string) => number | undefined;
}

export function parseCacheControl(value: string): CacheDirectives {
  const directives = list(value).map((d) => {
    const eq = d.indexOf("=");
    return eq === -1 ? { name: d.toLowerCase() } : { name: d.slice(0, eq).trim().toLowerCase(), value: d.slice(eq + 1).trim().replace(/^"|"$/g, "") };
  });
  return {
    directives,
    has: (d) => directives.some((x) => x.name === d),
    num: (d) => {
      const v = directives.find((x) => x.name === d)?.value;
      return v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined;
    },
  };
}

export const CACHE_DIRECTIVE_HELP: Record<string, string> = {
  "max-age": "Fresh for this many seconds. Browsers and shared caches can reuse it without asking the server.",
  "s-maxage": "Like max-age but only for shared caches such as CDNs; it overrides max-age there.",
  "no-store": "Do not store the response anywhere. Use it for private or sensitive data.",
  "no-cache": "A cache may store it but must revalidate with the server before every reuse.",
  private: "Only the user's own browser may cache it, not shared caches or CDNs.",
  public: "Any cache, including shared ones, may store it, even if it would not by default.",
  "must-revalidate": "Once stale, do not serve it without revalidating. No serving stale on errors.",
  "proxy-revalidate": "Like must-revalidate but for shared caches only.",
  immutable: "The content will never change while fresh, so browsers skip revalidation even on reload. Use it with versioned file names.",
  "stale-while-revalidate": "After it goes stale, serve the old copy for this many seconds while fetching a new one in the background.",
  "stale-if-error": "If the server errors, serve a stale copy for up to this many seconds.",
  "no-transform": "Intermediaries must not change the body, for example by recompressing images.",
  "only-if-cached": "Request directive: answer from cache only, never contact the server.",
  "max-stale": "Request directive: the client accepts a response that is up to this many seconds stale.",
  "min-fresh": "Request directive: only return responses that stay fresh for at least this many more seconds.",
};

export interface SetCookie {
  name: string;
  value: string;
  attributes: { name: string; value?: string }[];
  secure: boolean;
  httpOnly: boolean;
  sameSite?: "strict" | "lax" | "none" | string;
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: string;
  partitioned: boolean;
}

export function parseSetCookie(value: string): SetCookie | null {
  const parts = value.split(";").map((s) => s.trim());
  const first = parts.shift() ?? "";
  const eq = first.indexOf("=");
  if (eq <= 0) return null;
  const attributes = parts.filter(Boolean).map((p) => {
    const i = p.indexOf("=");
    return i === -1 ? { name: p } : { name: p.slice(0, i).trim(), value: p.slice(i + 1).trim() };
  });
  const attr = (n: string) => attributes.find((a) => a.name.toLowerCase() === n);
  return {
    name: first.slice(0, eq).trim(),
    value: first.slice(eq + 1).trim(),
    attributes,
    secure: !!attr("secure"),
    httpOnly: !!attr("httponly"),
    sameSite: attr("samesite")?.value?.toLowerCase(),
    path: attr("path")?.value,
    domain: attr("domain")?.value,
    maxAge: attr("max-age")?.value !== undefined && /^-?\d+$/.test(attr("max-age")!.value!) ? Number(attr("max-age")!.value) : undefined,
    expires: attr("expires")?.value,
    partitioned: !!attr("partitioned"),
  };
}

export interface CspDirective {
  name: string;
  sources: string[];
}

export function parseCsp(value: string): CspDirective[] {
  return value
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [name, ...sources] = d.split(/\s+/);
      return { name: name.toLowerCase(), sources };
    });
}

/** Human-readable breakdown of a header's value, for the headers that have structure. */
export function describeValue(name: string, value: string): { label: string; value: string }[] | null {
  const n = name.toLowerCase();
  const rows: { label: string; value: string }[] = [];
  if (n === "cache-control") {
    const cc = parseCacheControl(value);
    for (const d of cc.directives) rows.push({ label: d.value !== undefined ? `${d.name}=${d.value}` : d.name, value: CACHE_DIRECTIVE_HELP[d.name] ?? "Unrecognised directive." });
    return rows;
  }
  if (n === "content-security-policy" || n === "content-security-policy-report-only") {
    for (const d of parseCsp(value)) rows.push({ label: d.name, value: d.sources.join(" ") || "(no sources)" });
    return rows;
  }
  if (n === "set-cookie") {
    const c = parseSetCookie(value);
    if (!c) return null;
    rows.push({ label: "Name", value: c.name }, { label: "Value", value: c.value.length > 80 ? `${c.value.slice(0, 80)}… (${c.value.length} characters)` : c.value });
    for (const a of c.attributes) rows.push({ label: a.name, value: a.value ?? "set" });
    return rows;
  }
  if (n === "strict-transport-security") {
    for (const p of value.split(";").map((s) => s.trim()).filter(Boolean)) {
      const [k, v] = p.split("=");
      const key = k.toLowerCase();
      rows.push({
        label: p,
        value:
          key === "max-age"
            ? `Use HTTPS only for ${formatSeconds(Number(v))}.`
            : key === "includesubdomains"
              ? "Applies to every subdomain too."
              : key === "preload"
                ? "Consents to being in browsers' built-in HSTS preload lists."
                : "Unrecognised directive.",
      });
    }
    return rows;
  }
  if (n === "accept" || n === "accept-language" || n === "accept-encoding" || n === "accept-charset") {
    const items = list(value).map((s) => {
      const [t, ...params] = s.split(";").map((x) => x.trim());
      const q = params.find((p) => p.startsWith("q="));
      return { t, q: q ? Number(q.slice(2)) : 1 };
    });
    items.sort((a, b) => b.q - a.q);
    return items.map((i) => ({ label: i.t, value: `preference ${i.q}` }));
  }
  if (n === "content-type") {
    const [type, ...params] = value.split(";").map((s) => s.trim());
    rows.push({ label: "Media type", value: type });
    for (const p of params) {
      const i = p.indexOf("=");
      if (i > 0) rows.push({ label: p.slice(0, i).trim(), value: p.slice(i + 1).trim().replace(/^"|"$/g, "") });
    }
    return rows;
  }
  if (n === "authorization" || n === "proxy-authorization") {
    const m = /^(\S+)\s+(.+)$/.exec(value);
    if (!m) return null;
    rows.push({ label: "Scheme", value: m[1] });
    if (/^basic$/i.test(m[1])) {
      try {
        const decoded = atob(m[2]);
        const c = decoded.indexOf(":");
        rows.push({ label: "User", value: c === -1 ? decoded : decoded.slice(0, c) }, { label: "Password", value: c === -1 ? "(none)" : "•".repeat(Math.min(12, decoded.length - c - 1)) + " (hidden)" });
      } catch {
        rows.push({ label: "Credentials", value: "Not valid Base64" });
      }
    } else if (/^bearer$/i.test(m[1]) && m[2].split(".").length === 3) {
      rows.push({ label: "Token", value: "Looks like a JWT (three dot-separated parts). Decode it with the JWT Decoder." });
    }
    return rows;
  }
  if (n === "cookie") {
    return value.split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
      const i = p.indexOf("=");
      return { label: i === -1 ? p : p.slice(0, i), value: i === -1 ? "" : p.slice(i + 1) };
    });
  }
  if (n === "content-disposition") {
    const [type, ...params] = value.split(";").map((s) => s.trim());
    rows.push({ label: "Disposition", value: type });
    for (const p of params) {
      const i = p.indexOf("=");
      if (i > 0) rows.push({ label: p.slice(0, i).trim(), value: p.slice(i + 1).trim().replace(/^"|"$/g, "") });
    }
    return rows;
  }
  if (n === "link") {
    return value.split(/,\s*(?=<)/).map((l) => {
      const m = /^<([^>]*)>(.*)$/.exec(l.trim());
      return { label: m ? m[1] : l, value: m ? m[2].replace(/^;\s*/, "").replace(/;\s*/g, " · ") : "" };
    });
  }
  if (n === "etag") {
    const weak = value.startsWith("W/");
    return [
      { label: "Strength", value: weak ? "Weak (W/): same content, maybe different bytes" : "Strong: byte-for-byte identical" },
      { label: "Value", value: value.replace(/^W\//, "").replace(/^"|"$/g, "") },
    ];
  }
  if (n === "vary") return list(value).map((v) => ({ label: v, value: v === "*" ? "Every request differs: the response is effectively uncacheable." : "A separate cached copy is kept for each value of this request header." }));
  if (n === "access-control-allow-methods" || n === "access-control-allow-headers" || n === "access-control-expose-headers" || n === "allow" || n === "connection") {
    return list(value).map((v) => ({ label: v, value: "" }));
  }
  if (n === "permissions-policy") {
    return value.split(/,(?![^()]*\))/).map((s) => s.trim()).filter(Boolean).map((p) => {
      const i = p.indexOf("=");
      return { label: i === -1 ? p : p.slice(0, i), value: i === -1 ? "" : p.slice(i + 1) === "()" ? "Disabled for everyone" : p.slice(i + 1) };
    });
  }
  if (n === "range" || n === "content-range") return [{ label: "Value", value }];
  return null;
}

export function formatSeconds(total: number): string {
  if (!Number.isFinite(total) || total < 0) return "an unknown time";
  if (total === 0) return "0 seconds";
  const units: [string, number][] = [["year", 31536000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const out: string[] = [];
  let rest = total;
  for (const [name, size] of units) {
    const n = Math.floor(rest / size);
    if (n > 0) {
      out.push(`${n} ${name}${n === 1 ? "" : "s"}`);
      rest -= n * size;
    }
    if (out.length === 2) break;
  }
  return out.join(" ");
}

/* ----------------------------------------------------------------- analysis */

export interface Analysis {
  findings: Finding[];
  /** How many of the recommended security headers are set (responses only). */
  security?: { present: number; total: number; items: { label: string; ok: boolean; header: string }[] };
  caching?: { summary: string[] };
}

const SINGLETONS = ["content-type", "content-length", "host", "location", "etag", "last-modified", "date", "server", "content-encoding", "transfer-encoding", "expires", "age"];

export function analyze(block: HeaderBlock): Analysis {
  const h = block.headers;
  const findings: Finding[] = [];
  const isResponse = block.start ? block.start.kind === "response" : looksLikeResponse(h);
  const status = block.start?.status;
  const add = (level: Level, title: string, detail: string, header?: string) => findings.push({ level, title, detail, header });

  // ---- Structure
  for (const n of SINGLETONS) {
    const all = lower(h, n);
    if (all.length > 1 && new Set(all.map((x) => x.value)).size > 1) add("bad", `${all[0].name} appears ${all.length} times with different values`, "This header may only appear once. Conflicting copies are a source of request-smuggling and caching bugs; proxies may reject the message.", all[0].name);
    else if (all.length > 1) add("warn", `${all[0].name} is repeated`, "The value is the same each time, but the header should be sent once.", all[0].name);
  }
  if (first(h, "content-length") !== undefined && /chunked/i.test(first(h, "transfer-encoding") ?? "")) add("bad", "Content-Length and Transfer-Encoding: chunked together", "A message must not carry both. Conflicting framing is what request-smuggling attacks rely on.", "Content-Length");
  const cl = first(h, "content-length");
  if (cl !== undefined && !/^\d+$/.test(cl.trim())) add("bad", "Content-Length is not a number", `"${cl}" must be a non-negative integer of bytes.`, "Content-Length");

  if (!isResponse) return { findings: [...findings, ...analyzeRequest(h, block)] };

  // ---- Status-specific expectations
  if (status !== undefined) {
    const loc = first(h, "location");
    if ([301, 302, 303, 307, 308].includes(status) && !loc) add("bad", `${status} without a Location header`, "A redirect must say where to go. Browsers show an error or a blank page.", "Location");
    if (status === 201 && !loc) add("info", "201 Created without Location", "The response should give the new resource's URL in Location (or Content-Location).", "Location");
    if (status === 401 && !first(h, "www-authenticate")) add("warn", "401 without WWW-Authenticate", "A 401 must name the authentication scheme so clients know how to sign in.", "WWW-Authenticate");
    if (status === 405 && !first(h, "allow")) add("warn", "405 without Allow", "A 405 must list the supported methods in the Allow header.", "Allow");
    if ((status === 429 || status === 503) && !first(h, "retry-after")) add("info", `${status} without Retry-After`, "Adding Retry-After tells clients and crawlers how long to back off.", "Retry-After");
    if (status === 206 && !first(h, "content-range")) add("bad", "206 without Content-Range", "A partial response must say which bytes it contains.", "Content-Range");
    if (status === 200 && !first(h, "content-type") && (cl ?? "0") !== "0") add("warn", "No Content-Type on a response with a body", "Without it browsers guess the type (MIME sniffing). Always declare it.", "Content-Type");
    if (status === 304 && first(h, "content-length") && first(h, "content-length") !== "0") add("info", "304 with a Content-Length", "A 304 has no body; Content-Length here describes the cached copy, which is allowed but easy to misread.", "Content-Length");
  }

  // ---- Content
  const ct = first(h, "content-type");
  if (ct) {
    if (/^text\//i.test(ct) && !/charset=/i.test(ct)) add("info", "Text response without a charset", "Add ; charset=utf-8 so browsers do not have to guess the encoding (HTML can also declare it in a <meta> tag).", "Content-Type");
    if (/^application\/json\s*;\s*charset=/i.test(ct)) add("info", "charset on application/json is redundant", "JSON is always UTF-8 (RFC 8259); the parameter is harmless but unnecessary.", "Content-Type");
    if (/^text\/javascript|^application\/javascript/i.test(ct) && /^application\/javascript/i.test(ct)) add("info", "application/javascript is obsolete", "RFC 9239 makes text/javascript the standard type for JavaScript.", "Content-Type");
    if (/^multipart\//i.test(ct) && !/boundary=/i.test(ct)) add("bad", "multipart type without a boundary", "A multipart Content-Type must carry a boundary parameter.", "Content-Type");
  }
  if (/attachment/i.test(first(h, "content-disposition") ?? "")) add("info", "The browser will download this instead of showing it", "Content-Disposition: attachment forces a download, using the filename parameter as the file name.", "Content-Disposition");

  // ---- Security
  const security = securityChecklist(h, findings);
  // ---- Cookies
  for (const c of lower(h, "set-cookie")) checkCookie(c.value, findings);
  // ---- CORS
  checkCors(h, findings);
  // ---- Info disclosure
  const server = first(h, "server");
  if (server && /\d+\.\d+/.test(server)) add("warn", "Server header reveals a version number", `"${server}" tells attackers exactly which software and version to target. Show the product only, or nothing.`, "Server");
  else if (server) add("info", "Server header is present", `"${server}". Harmless without a version, but it is not needed.`, "Server");
  for (const n of ["x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"]) {
    const v = first(h, n);
    if (v) add("warn", `${lower(h, n)[0].name} exposes the technology stack`, `"${v}". Remove it: it helps attackers and gives visitors nothing.`, lower(h, n)[0].name);
  }
  for (const e of h) {
    if (e.info?.deprecated && !["x-xss-protection", "pragma"].includes(e.name.toLowerCase())) add("info", `${e.name} is deprecated`, e.info.summary, e.name);
  }
  // ---- Caching
  const caching = checkCaching(h, status, findings);

  const order: Record<Level, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  return { findings, security, caching };
}

function looksLikeResponse(h: HeaderEntry[]): boolean {
  return h.some((x) => ["server", "set-cookie", "etag", "last-modified", "content-length", "strict-transport-security", "location", "age", "access-control-allow-origin", "cache-control", "content-security-policy"].includes(x.name.toLowerCase())) && !h.some((x) => ["host", "user-agent", "cookie", "authorization", "accept"].includes(x.name.toLowerCase()));
}

function securityChecklist(h: HeaderEntry[], findings: Finding[]): NonNullable<Analysis["security"]> {
  const add = (level: Level, title: string, detail: string, header?: string) => findings.push({ level, title, detail, header });
  const items: { label: string; ok: boolean; header: string }[] = [];

  // HSTS
  const hsts = first(h, "strict-transport-security");
  if (hsts) {
    const age = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? NaN);
    if (Number.isNaN(age)) add("bad", "Strict-Transport-Security has no max-age", "max-age is required; without it browsers ignore the header.", "Strict-Transport-Security");
    else if (age === 0) add("warn", "HSTS is switched off (max-age=0)", "This tells browsers to forget the site's HSTS state. Use it only to roll HSTS back.", "Strict-Transport-Security");
    else if (age < 15768000) add("warn", `HSTS lasts only ${formatSeconds(age)}`, "Use at least 6 months (15768000 s), and one year or more (31536000) if you want to qualify for preloading.", "Strict-Transport-Security");
    else add("good", "HSTS forces HTTPS", `Browsers will use HTTPS only for ${formatSeconds(age)}${/includeSubDomains/i.test(hsts) ? ", including subdomains" : ""}.`, "Strict-Transport-Security");
    items.push({ label: "HSTS (HTTPS only)", ok: age >= 15768000, header: "Strict-Transport-Security" });
  } else {
    add("warn", "No Strict-Transport-Security", "HSTS stops downgrade attacks on HTTPS sites. It only means anything over HTTPS, so ignore this for plain-HTTP responses.", "Strict-Transport-Security");
    items.push({ label: "HSTS (HTTPS only)", ok: false, header: "Strict-Transport-Security" });
  }

  // CSP
  const csp = first(h, "content-security-policy");
  const cspRo = first(h, "content-security-policy-report-only");
  if (csp) {
    const d = parseCsp(csp);
    const script = d.find((x) => x.name === "script-src") ?? d.find((x) => x.name === "default-src");
    if (!script) add("warn", "CSP does not restrict scripts", "There is no script-src or default-src, so scripts can load from anywhere.", "Content-Security-Policy");
    else {
      if (script.sources.includes("'unsafe-inline'") && !script.sources.some((s) => s.startsWith("'nonce-") || s.startsWith("'sha") || s === "'strict-dynamic'")) add("warn", "CSP allows 'unsafe-inline' scripts", "Inline script injection (XSS) is not blocked. Use nonces or hashes instead.", "Content-Security-Policy");
      if (script.sources.includes("'unsafe-eval'")) add("warn", "CSP allows 'unsafe-eval'", "eval() and similar are permitted, which weakens protection against injected code.", "Content-Security-Policy");
      if (script.sources.some((s) => s === "*" || s === "http:" || s === "https:" || s === "data:")) add("warn", "CSP script sources are very broad", `${script.name} allows ${script.sources.filter((s) => ["*", "http:", "https:", "data:"].includes(s)).join(", ")}, which lets attackers load script from anywhere.`, "Content-Security-Policy");
    }
    if (!d.some((x) => x.name === "frame-ancestors")) add("info", "CSP has no frame-ancestors", "Add frame-ancestors 'self' (or 'none') to control who can embed the page; it replaces X-Frame-Options.", "Content-Security-Policy");
    add("good", "Content-Security-Policy is set", `${d.length} directive${d.length === 1 ? "" : "s"}.`, "Content-Security-Policy");
  } else if (cspRo) add("info", "CSP is in report-only mode", "Violations are reported but nothing is blocked yet. Enforce it once the reports are clean.", "Content-Security-Policy-Report-Only");
  else add("warn", "No Content-Security-Policy", "A CSP is the strongest defence against cross-site scripting. Start with default-src 'self'.", "Content-Security-Policy");
  items.push({ label: "Content-Security-Policy", ok: !!csp, header: "Content-Security-Policy" });

  // nosniff
  const nosniff = first(h, "x-content-type-options");
  if (nosniff?.toLowerCase() === "nosniff") add("good", "MIME sniffing is disabled", "X-Content-Type-Options: nosniff makes browsers trust the declared Content-Type.", "X-Content-Type-Options");
  else if (nosniff) add("warn", `X-Content-Type-Options: ${nosniff}`, "The only valid value is nosniff.", "X-Content-Type-Options");
  else add("warn", "No X-Content-Type-Options", "Add X-Content-Type-Options: nosniff so a file uploaded as an image cannot be run as a script.", "X-Content-Type-Options");
  items.push({ label: "X-Content-Type-Options", ok: nosniff?.toLowerCase() === "nosniff", header: "X-Content-Type-Options" });

  // Framing
  const xfo = first(h, "x-frame-options");
  const fa = csp ? parseCsp(csp).some((x) => x.name === "frame-ancestors") : false;
  if (xfo && /^(deny|sameorigin)$/i.test(xfo.trim())) add("good", "Clickjacking protection", `X-Frame-Options: ${xfo}.`, "X-Frame-Options");
  else if (xfo && /allow-from/i.test(xfo)) add("warn", "X-Frame-Options ALLOW-FROM does nothing", "Browsers dropped ALLOW-FROM. Use CSP frame-ancestors.", "X-Frame-Options");
  else if (!fa) add("warn", "Page can be framed by any site", "Set X-Frame-Options: DENY (or SAMEORIGIN), or CSP frame-ancestors, to block clickjacking.", "X-Frame-Options");
  items.push({ label: "Framing protection", ok: fa || (!!xfo && /^(deny|sameorigin)$/i.test(xfo.trim())), header: "X-Frame-Options" });

  // Referrer
  const rp = first(h, "referrer-policy");
  if (rp) {
    if (/unsafe-url|^origin-when-cross-origin$/i.test(rp.trim())) add("warn", `Referrer-Policy: ${rp} leaks the full URL`, "Full URLs, including query strings, are sent to other sites. Use strict-origin-when-cross-origin or stricter.", "Referrer-Policy");
    else add("good", "Referrer-Policy is set", rp, "Referrer-Policy");
  } else add("info", "No Referrer-Policy", "Browsers default to strict-origin-when-cross-origin, which is fine, but setting it explicitly protects older browsers.", "Referrer-Policy");
  items.push({ label: "Referrer-Policy", ok: !!rp, header: "Referrer-Policy" });

  // Permissions
  const pp = first(h, "permissions-policy") ?? first(h, "feature-policy");
  if (pp) add("good", "Permissions-Policy is set", "Browser features are restricted for this page.", "Permissions-Policy");
  else add("info", "No Permissions-Policy", "Turn off camera, microphone and geolocation for the page if it does not use them.", "Permissions-Policy");
  items.push({ label: "Permissions-Policy", ok: !!pp, header: "Permissions-Policy" });

  // Cross-origin isolation trio
  for (const [n, rec] of [["cross-origin-opener-policy", "same-origin"], ["cross-origin-resource-policy", "same-origin (or same-site)"], ["cross-origin-embedder-policy", "require-corp"]] as const) {
    const v = first(h, n);
    if (v) add("good", `${lower(h, n)[0].name}: ${v}`, "Cross-origin isolation header present.", lower(h, n)[0].name);
    else add("info", `No ${n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("-")}`, `Optional hardening. A common value is ${rec}. Cross-origin isolation needs both COOP and COEP.`);
  }

  // Legacy
  const xxp = first(h, "x-xss-protection");
  if (xxp && xxp.trim() !== "0") add("info", "X-XSS-Protection is obsolete", "The browser XSS filter it controlled is gone and could itself create vulnerabilities. Send 0 or remove it, and use CSP.", "X-XSS-Protection");

  return { present: items.filter((i) => i.ok).length, total: items.length, items };
}

function checkCookie(value: string, findings: Finding[]) {
  const c = parseSetCookie(value);
  const add = (level: Level, title: string, detail: string) => findings.push({ level, title, detail, header: "Set-Cookie" });
  if (!c) {
    add("bad", "Unparseable Set-Cookie", `"${value.slice(0, 60)}" is not name=value.`);
    return;
  }
  const label = `Cookie "${c.name}"`;
  const size = c.name.length + c.value.length;
  if (size > 4096) add("warn", `${label} is ${size} bytes`, "Browsers reject cookies over about 4096 bytes and oversized cookies trigger 431 errors.");
  if (c.sameSite === "none" && !c.secure) add("bad", `${label}: SameSite=None without Secure`, "Browsers reject it. SameSite=None requires the Secure attribute.");
  if (!c.secure && c.sameSite !== "none") add("warn", `${label} is not Secure`, "It is also sent over plain HTTP and can be read on the network. Add Secure to every cookie on an HTTPS site.");
  if (!c.httpOnly) add(/sess|token|auth|jwt|sid|login/i.test(c.name) ? "warn" : "info", `${label} is readable by scripts`, "Without HttpOnly, injected JavaScript can steal it. Set HttpOnly on session and authentication cookies.");
  if (!c.sameSite) add("info", `${label} has no SameSite`, "Browsers treat that as Lax. State it explicitly (Lax, Strict or None) so behaviour is the same everywhere.");
  if (c.name.startsWith("__Host-")) {
    if (!c.secure || c.path !== "/" || c.domain) add("bad", `${label}: invalid __Host- cookie`, "__Host- cookies must be Secure, have Path=/ and no Domain attribute; browsers reject others.");
  } else if (c.name.startsWith("__Secure-") && !c.secure) add("bad", `${label}: invalid __Secure- cookie`, "__Secure- cookies must have the Secure attribute.");
  if (c.maxAge !== undefined && c.expires) add("info", `${label} sets both Max-Age and Expires`, "Max-Age wins; Expires is only for very old browsers.");
}

function checkCors(h: HeaderEntry[], findings: Finding[]) {
  const acao = first(h, "access-control-allow-origin");
  if (acao === undefined) return;
  const add = (level: Level, title: string, detail: string, header = "Access-Control-Allow-Origin") => findings.push({ level, title, detail, header });
  const creds = /^true$/i.test(first(h, "access-control-allow-credentials") ?? "");
  if (acao === "*" && creds) add("bad", "Allow-Origin: * with Allow-Credentials: true", "Browsers refuse this combination. With credentials the server must name the exact origin.");
  else if (acao === "*") add("info", "Any website can read this response", "Allow-Origin: * is right for public data and wrong for anything private.");
  else if (acao === "null") add("warn", "Allow-Origin: null", "The null origin is sent by sandboxed iframes and local files, so allowing it is close to allowing everyone.");
  else if (acao !== "*" && !/(^|,\s*)origin(\s*,|$)/i.test(first(h, "vary") ?? "")) add("warn", "Specific Allow-Origin without Vary: Origin", "When the allowed origin depends on the request, add Vary: Origin so caches do not serve one site's CORS header to another.", "Vary");
  if (first(h, "access-control-allow-headers") === "*" && creds) add("warn", "Allow-Headers: * is not a wildcard with credentials", "For credentialed requests the wildcard is treated literally. List the headers by name.", "Access-Control-Allow-Headers");
}

function checkCaching(h: HeaderEntry[], status: number | undefined, findings: Finding[]): { summary: string[] } {
  const add = (level: Level, title: string, detail: string, header?: string) => findings.push({ level, title, detail, header });
  const ccRaw = first(h, "cache-control");
  const summary: string[] = [];
  const etag = first(h, "etag");
  const lm = first(h, "last-modified");
  const expires = first(h, "expires");
  const vary = first(h, "vary");
  const age = Number(first(h, "age"));

  if (ccRaw !== undefined) {
    const cc = parseCacheControl(ccRaw);
    if (cc.has("public") && cc.has("private")) add("bad", "Cache-Control has both public and private", "They contradict each other. Pick one.", "Cache-Control");
    if (cc.has("no-store") && (cc.num("max-age") ?? 0) > 0) add("info", "no-store overrides max-age", "The response is not stored, so max-age has no effect.", "Cache-Control");
    if (cc.has("no-cache") && cc.has("immutable")) add("info", "no-cache with immutable", "immutable is pointless when every reuse needs revalidation.", "Cache-Control");
    if (cc.has("max-age") && expires) add("info", "Expires is ignored", "Cache-Control: max-age takes priority over Expires.", "Expires");
    if (cc.has("max-age") && cc.num("max-age") === undefined) add("bad", "max-age is not a number", `max-age must be a whole number of seconds.`, "Cache-Control");
    const unknown = cc.directives.filter((d) => !(d.name in CACHE_DIRECTIVE_HELP));
    if (unknown.length) add("info", "Unrecognised Cache-Control directives", unknown.map((d) => d.name).join(", "), "Cache-Control");

    if (cc.has("no-store")) summary.push("Nothing may store this response: every request goes to the origin server.");
    else {
      const maxAge = cc.num("max-age");
      const sMax = cc.num("s-maxage");
      const priv = cc.has("private");
      if (cc.has("no-cache")) summary.push("Caches may store it but must check with the server (revalidate) before every reuse.");
      else if (maxAge !== undefined) summary.push(maxAge === 0 ? "Considered stale immediately, so it is revalidated on each use." : `The browser can reuse it without asking for ${formatSeconds(maxAge)}.`);
      if (sMax !== undefined && !priv) summary.push(`Shared caches (CDNs, proxies) keep it for ${formatSeconds(sMax)} (s-maxage).`);
      else if (!priv && maxAge !== undefined && !cc.has("no-cache")) summary.push(`Shared caches (CDNs, proxies) may also keep it for ${formatSeconds(maxAge)}${age ? ` — it has already aged ${formatSeconds(age)}` : ""}.`);
      if (priv) summary.push("Only the user's browser may cache it; CDNs and proxies must not.");
      if (cc.has("immutable")) summary.push("Browsers skip revalidation, even on reload, while it is fresh.");
      const swr = cc.num("stale-while-revalidate");
      if (swr) summary.push(`After it goes stale it can still be served for ${formatSeconds(swr)} while a fresh copy loads in the background.`);
    }
  } else {
    if (expires) {
      const t = Date.parse(expires);
      if (Number.isNaN(t)) add("warn", "Expires is not a valid date", "An invalid Expires value is treated as already expired.", "Expires");
      else summary.push(`Fresh until ${new Date(t).toUTCString()} (from Expires).`);
    } else if (lm) {
      const date = Date.parse(first(h, "date") ?? "") || Date.now();
      const mod = Date.parse(lm);
      if (!Number.isNaN(mod) && date > mod) {
        const heuristic = Math.floor((date - mod) / 10 / 1000);
        summary.push(`No explicit freshness: caches may guess about ${formatSeconds(heuristic)} (10% of the time since Last-Modified).`);
        add("info", "No Cache-Control", "Without it, browsers and CDNs use heuristic freshness, so behaviour differs between them. State the policy explicitly.", "Cache-Control");
      }
    } else if (status === 200) add("info", "No caching headers", "Add Cache-Control so browsers and CDNs know how long to keep the response: max-age for static files, no-cache or no-store for private data.", "Cache-Control");
  }
  if (etag || lm) summary.push(`Can be revalidated with ${[etag ? "If-None-Match (ETag)" : "", lm ? "If-Modified-Since (Last-Modified)" : ""].filter(Boolean).join(" or ")}, so an unchanged file costs only a 304.`);
  if (vary === "*") add("warn", "Vary: * makes the response uncacheable", "Every request is treated as different.", "Vary");
  else if (vary && /\b(cookie|user-agent)\b/i.test(vary)) add("info", `Vary: ${vary} fragments the cache`, "A separate copy is stored per cookie or user-agent string, which lowers hit rates.", "Vary");
  const pragma = first(h, "pragma");
  if (pragma && ccRaw === undefined) add("info", "Pragma: no-cache is legacy", "Modern caches read Cache-Control. Pragma is only defined for requests.", "Pragma");
  return { summary };
}

function analyzeRequest(h: HeaderEntry[], block: HeaderBlock): Finding[] {
  const out: Finding[] = [];
  const add = (level: Level, title: string, detail: string, header?: string) => out.push({ level, title, detail, header });
  const method = block.start?.method;
  if (block.start && block.start.version?.startsWith("1.1") && !first(h, "host")) add("bad", "HTTP/1.1 request without Host", "Host is required in HTTP/1.1; servers answer 400.", "Host");
  const auth = first(h, "authorization");
  if (auth && /^basic\s/i.test(auth)) add("warn", "Basic authentication sends the password in every request", "The value is only Base64, not encryption. Anyone who can read the request can read the password, so use it over HTTPS only.", "Authorization");
  if (auth && /^bearer\s/i.test(auth)) add("info", "Bearer token present", "Treat this header as a secret: whoever holds the token can act as the user until it expires.", "Authorization");
  if (method && ["POST", "PUT", "PATCH"].includes(method) && !first(h, "content-type") && (first(h, "content-length") ?? "0") !== "0") add("warn", `${method} with a body but no Content-Type`, "Servers may reject or misread the body. Send the media type, such as application/json.", "Content-Type");
  const ae = first(h, "accept-encoding");
  if (ae && !/gzip|br|zstd|deflate/i.test(ae) && !/identity/i.test(ae)) add("info", "Unusual Accept-Encoding", ae, "Accept-Encoding");
  const origin = first(h, "origin");
  if (origin && first(h, "access-control-request-method")) add("info", "This is a CORS preflight", "The browser is asking permission before sending the real request. The server must answer with matching Access-Control-Allow-* headers and a 2xx status.", "Access-Control-Request-Method");
  const fetchSite = first(h, "sec-fetch-site");
  if (fetchSite === "cross-site") add("info", "Cross-site request", "Sec-Fetch-Site: cross-site — the request was triggered by another site. Servers can use this to reject CSRF-style requests.", "Sec-Fetch-Site");
  const ua = first(h, "user-agent");
  if (ua) add("info", "User-Agent present", "Paste it into the User-Agent Parser to see the browser, engine, operating system and device.", "User-Agent");
  const xff = first(h, "x-forwarded-for");
  if (xff) add("info", "Client IP can be spoofed", "X-Forwarded-For is set by whichever proxy handled the request and can be forged by the client. Only trust the entries added by proxies you run.", "X-Forwarded-For");
  return out;
}

/** Response headers whose absence matters — used to render the checklist for a quick pass. */
export const RECOMMENDED_SECURITY_HEADERS = [
  "Strict-Transport-Security",
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
];
