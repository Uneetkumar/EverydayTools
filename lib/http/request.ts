/**
 * One model of an HTTP request that every API tool shares: the cURL parser
 * produces it, the cURL generator, the request builder and the code
 * generators consume it. Keeping a single shape means "cURL → fetch",
 * "cURL → Python" and "builder → cURL" cannot drift apart.
 */

export interface HeaderPair {
  name: string;
  value: string;
}

export interface FormField {
  name: string;
  value: string;
  /** A file part: `value` is the file name, the content stays on disk. */
  file?: boolean;
  contentType?: string;
}

export type RequestBody =
  | { kind: "none" }
  /** Sent exactly as written (JSON, XML, plain text, GraphQL…). */
  | { kind: "raw"; text: string }
  /** application/x-www-form-urlencoded, one pair per field (values are not yet encoded). */
  | { kind: "urlencoded"; fields: FormField[] }
  /** multipart/form-data. */
  | { kind: "multipart"; fields: FormField[] }
  /** A file read from disk (`-d @file`, `--data-binary @file`, `-T file`). */
  | { kind: "file"; path: string };

export interface RequestOptions {
  followRedirects: boolean;
  insecure: boolean;
  compressed: boolean;
  /** Seconds. */
  timeout?: number;
  /** Fail on HTTP errors (curl -f). */
  failOnError: boolean;
  /** Include response headers in the output (curl -i). */
  includeHeaders: boolean;
  proxy?: string;
}

export interface HttpRequest {
  method: string;
  url: string;
  headers: HeaderPair[];
  body: RequestBody;
  /** Basic auth from -u; the generators turn it into the right header or option. */
  basicAuth?: { user: string; password: string };
  options: RequestOptions;
}

export const defaultOptions = (): RequestOptions => ({
  followRedirects: false,
  insecure: false,
  compressed: false,
  failOnError: false,
  includeHeaders: false,
});

export const emptyRequest = (): HttpRequest => ({
  method: "GET",
  url: "",
  headers: [],
  body: { kind: "none" },
  options: defaultOptions(),
});

export function getHeader(headers: HeaderPair[], name: string): string | undefined {
  const n = name.toLowerCase();
  return headers.find((h) => h.name.toLowerCase() === n)?.value;
}

export function hasHeader(headers: HeaderPair[], name: string): boolean {
  return getHeader(headers, name) !== undefined;
}

export function setHeader(headers: HeaderPair[], name: string, value: string): HeaderPair[] {
  const n = name.toLowerCase();
  const i = headers.findIndex((h) => h.name.toLowerCase() === n);
  if (i === -1) return [...headers, { name, value }];
  return headers.map((h, j) => (j === i ? { name: h.name, value } : h));
}

export function removeHeader(headers: HeaderPair[], name: string): HeaderPair[] {
  const n = name.toLowerCase();
  return headers.filter((h) => h.name.toLowerCase() !== n);
}

/** A Content-Type header's media type without parameters, lower-cased. */
export function mediaType(contentType: string | undefined): string {
  return (contentType ?? "").split(";")[0].trim().toLowerCase();
}

export function isJsonMedia(type: string): boolean {
  return type === "application/json" || type.endsWith("+json") || type === "text/json";
}

export function isFormMedia(type: string): boolean {
  return type === "application/x-www-form-urlencoded";
}

/** Parses `a=1&b=two` into fields, decoding percent-escapes and `+`. */
export function parseUrlEncoded(text: string): FormField[] {
  if (!text) return [];
  return text
    .split("&")
    .filter((p) => p !== "")
    .map((pair) => {
      const eq = pair.indexOf("=");
      const raw = (s: string) => {
        const plus = s.replace(/\+/g, " ");
        try {
          return decodeURIComponent(plus);
        } catch {
          return plus;
        }
      };
      return eq === -1 ? { name: raw(pair), value: "" } : { name: raw(pair.slice(0, eq)), value: raw(pair.slice(eq + 1)) };
    });
}

/** Encodes a value the way HTML forms do (application/x-www-form-urlencoded). */
export function formEncode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+").replace(/[!'()~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

export function serializeUrlEncoded(fields: FormField[]): string {
  return fields.map((f) => `${formEncode(f.name)}=${formEncode(f.value)}`).join("&");
}

/** Parsed JSON, or undefined when the text is not valid JSON. */
export function tryParseJson(text: string): { value: unknown } | undefined {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return undefined;
  }
}

/** Methods whose semantics normally carry no request body. */
export const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/** Splits a URL into its base (before `?`/`#`) and keeps the query and hash apart. */
export function splitUrl(url: string): { base: string; query: string; hash: string } {
  const hashAt = url.indexOf("#");
  const hash = hashAt === -1 ? "" : url.slice(hashAt);
  const noHash = hashAt === -1 ? url : url.slice(0, hashAt);
  const q = noHash.indexOf("?");
  return q === -1 ? { base: noHash, query: "", hash } : { base: noHash.slice(0, q), query: noHash.slice(q + 1), hash };
}

/** Adds fields to a URL's query string (used by `curl -G`). */
export function appendQuery(url: string, query: string): string {
  if (!query) return url;
  const { base, query: existing, hash } = splitUrl(url);
  return `${base}?${existing ? `${existing}&` : ""}${query}${hash}`;
}

/** Headers browsers refuse to let a script set. Setting them in fetch/XHR has no effect. */
export const FORBIDDEN_BROWSER_HEADERS = [
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "cookie2",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
];

export function isForbiddenBrowserHeader(name: string): boolean {
  const n = name.toLowerCase();
  return FORBIDDEN_BROWSER_HEADERS.includes(n) || n.startsWith("proxy-") || n.startsWith("sec-");
}

/** Final headers as they'd go on the wire from a generator: auth folded in, content type inferred. */
export function effectiveHeaders(req: HttpRequest, opts: { auth?: boolean; contentType?: boolean } = {}): HeaderPair[] {
  let headers = req.headers.map((h) => ({ ...h }));
  if (opts.auth !== false && req.basicAuth && !hasHeader(headers, "authorization")) {
    headers = [...headers, { name: "Authorization", value: `Basic ${base64(`${req.basicAuth.user}:${req.basicAuth.password}`)}` }];
  }
  if (opts.contentType !== false && !hasHeader(headers, "content-type")) {
    const b = req.body;
    if (b.kind === "urlencoded") headers = [...headers, { name: "Content-Type", value: "application/x-www-form-urlencoded" }];
  }
  return headers;
}

export function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
}
