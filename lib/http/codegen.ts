/**
 * HttpRequest → code. One generator per client library; each returns the
 * code plus notes about anything the target cannot do the way curl does
 * (browsers forbid some headers, requests follows redirects, and so on),
 * so the output is honest about where it differs from the original command.
 */

import {
  type FormField,
  type HeaderPair,
  type HttpRequest,
  base64,
  hasHeader,
  isFormMedia,
  isForbiddenBrowserHeader,
  isJsonMedia,
  mediaType,
  getHeader,
  removeHeader,
  tryParseJson,
} from "./request";

export type CodeTarget =
  | "fetch"
  | "xhr"
  | "node-https"
  | "jquery"
  | "axios"
  | "python-requests"
  | "python-httpx"
  | "python-urllib";

export interface GenerateOptions {
  /** fetch: `await` (default) or a `.then()` chain. */
  fetchStyle?: "async" | "then";
  /** axios: `axios({...})` (default) or `axios.post(url, data, config)`. */
  axiosStyle?: "config" | "shorthand";
  /** axios / Node: import syntax. */
  modules?: "esm" | "cjs";
  /** Check the status code and print the error. */
  errorHandling?: boolean;
  /** Reproduce curl's "do not follow redirects unless -L" instead of the library default. */
  matchCurlRedirects?: boolean;
  /** Print the response body as JSON, text, or pick from the request. */
  parse?: "auto" | "json" | "text";
}

export interface Generated {
  code: string;
  notes: string[];
}

export const TARGET_LABELS: Record<CodeTarget, string> = {
  fetch: "JavaScript (fetch)",
  xhr: "JavaScript (XMLHttpRequest)",
  "node-https": "Node.js (https)",
  jquery: "jQuery ($.ajax)",
  axios: "Axios",
  "python-requests": "Python (requests)",
  "python-httpx": "Python (httpx)",
  "python-urllib": "Python (urllib)",
};

/* ----------------------------------------------------------------- helpers */

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function jsString(s: string): string {
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `'${escaped}'`;
}

function jsKey(k: string): string {
  return IDENT.test(k) ? k : jsString(k);
}

/** A JS value as source, indented, with single-quoted strings and bare keys where legal. */
export function jsLiteral(value: unknown, indent = 0, step = 2): string {
  const pad = " ".repeat(indent);
  const inner = " ".repeat(indent + step);
  if (value === null) return "null";
  if (typeof value === "string") return jsString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => jsLiteral(v, indent + step, step));
    const oneLine = `[${items.join(", ")}]`;
    if (oneLine.length <= 60 && !oneLine.includes("\n")) return oneLine;
    return `[\n${items.map((i) => `${inner}${i}`).join(",\n")},\n${pad}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  // Short nested objects stay on one line: { sku: 'A-100', qty: 2 }.
  if (indent > 0 && entries.every(([, v]) => v === null || typeof v !== "object")) {
    const oneLine = `{ ${entries.map(([k, v]) => `${jsKey(k)}: ${jsLiteral(v, 0, step)}`).join(", ")} }`;
    if (oneLine.length <= 60) return oneLine;
  }
  return `{\n${entries.map(([k, v]) => `${inner}${jsKey(k)}: ${jsLiteral(v, indent + step, step)}`).join(",\n")},\n${pad}}`;
}

export function pyString(s: string): string {
  // JSON string syntax is a valid Python literal for everything JSON.stringify emits.
  const body = JSON.stringify(s).slice(1, -1);
  // Quotes are easier to read unescaped: use single quotes when the text has "" but no ''.
  if (s.includes('"') && !s.includes("'")) return `'${body.replace(/\\"/g, '"')}'`;
  return `"${body}"`;
}

export function pyLiteral(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  const inner = " ".repeat(indent + 4);
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "string") return pyString(value);
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => pyLiteral(v, indent + 4));
    const oneLine = `[${items.join(", ")}]`;
    if (oneLine.length <= 60 && !oneLine.includes("\n")) return oneLine;
    return `[\n${items.map((i) => `${inner}${i}`).join(",\n")},\n${pad}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  if (indent > 0 && entries.every(([, v]) => v === null || typeof v !== "object")) {
    const oneLine = `{${entries.map(([k, v]) => `${pyString(k)}: ${pyLiteral(v, 0)}`).join(", ")}}`;
    if (oneLine.length <= 60) return oneLine;
  }
  return `{\n${entries.map(([k, v]) => `${inner}${pyString(k)}: ${pyLiteral(v, indent + 4)}`).join(",\n")},\n${pad}}`;
}

/** JSON that survives a round trip through JS numbers. Long integers would silently change. */
function safeJson(text: string): unknown | undefined {
  const parsed = tryParseJson(text);
  if (!parsed) return undefined;
  if (/(?<![.\d"eE+-])-?\d{16,}(?![.\d])/.test(text.replace(/"(?:[^"\\]|\\.)*"/g, '""'))) return undefined;
  return parsed.value;
}

/** `new URLSearchParams(…)` source: an object when names are unique, pairs when a name repeats. */
function paramsSrc(fields: FormField[]): string {
  const arg = hasDuplicateNames(fields)
    ? `[${fields.map((f) => `[${jsString(f.name)}, ${jsString(f.value)}]`).join(", ")}]`
    : jsLiteral(Object.fromEntries(fields.map((f) => [f.name, f.value])), 0);
  return `new URLSearchParams(${arg})`;
}

function hasDuplicateNames(fields: { name: string }[]): boolean {
  return new Set(fields.map((f) => f.name)).size !== fields.length;
}

function hasDuplicateHeaders(headers: HeaderPair[]): boolean {
  return new Set(headers.map((h) => h.name.toLowerCase())).size !== headers.length;
}

function isJsonRequest(req: HttpRequest): boolean {
  return req.body.kind === "raw" && isJsonMedia(mediaType(getHeader(req.headers, "content-type")));
}

function bodyJson(req: HttpRequest): unknown | undefined {
  return isJsonRequest(req) && req.body.kind === "raw" ? safeJson(req.body.text) : undefined;
}

function wantsJsonResponse(req: HttpRequest, parse: GenerateOptions["parse"]): boolean {
  if (parse === "json") return true;
  if (parse === "text") return false;
  return /json/i.test(getHeader(req.headers, "accept") ?? "") || isJsonRequest(req);
}

function urlParts(url: string): { protocol: string; hostname: string; port: string; path: string } {
  try {
    const u = new URL(url);
    return { protocol: u.protocol, hostname: u.hostname, port: u.port, path: `${u.pathname}${u.search}` || "/" };
  } catch {
    return { protocol: "https:", hostname: url, port: "", path: "/" };
  }
}

const isBodyless = (m: string) => m === "GET" || m === "HEAD";

/** Repeated header names joined into one value, as HTTP allows (Cookie uses "; "). */
function mergeHeaders(headers: HeaderPair[]): { headers: HeaderPair[]; merged: boolean } {
  const out: HeaderPair[] = [];
  let merged = false;
  for (const h of headers) {
    const at = out.findIndex((x) => x.name.toLowerCase() === h.name.toLowerCase());
    if (at === -1) out.push({ ...h });
    else {
      merged = true;
      out[at] = { name: out[at].name, value: `${out[at].value}${h.name.toLowerCase() === "cookie" ? "; " : ", "}${h.value}` };
    }
  }
  return { headers: out, merged };
}

const MERGE_NOTE = "Repeated headers were combined into one comma-separated value, which HTTP treats the same way.";

/**
 * Header object source for JS at base indent 0. Only fetch accepts a list of
 * pairs for repeated names; everything else gets the merged object.
 */
function jsHeaders(headers: HeaderPair[], notes?: string[], allowPairs = false): string | null {
  if (headers.length === 0) return null;
  if (hasDuplicateHeaders(headers)) {
    if (allowPairs) return `[\n${headers.map((h) => `  [${jsString(h.name)}, ${jsString(h.value)}]`).join(",\n")},\n]`;
    const m = mergeHeaders(headers);
    notes?.push(MERGE_NOTE);
    return jsHeaders(m.headers);
  }
  return `{\n${headers.map((h) => `  ${jsKey(h.name)}: ${jsString(h.value)}`).join(",\n")},\n}`;
}

/** Notes that apply to every browser-based target. */
function browserNotes(req: HttpRequest): string[] {
  const notes: string[] = [];
  const blocked = req.headers.filter((h) => isForbiddenBrowserHeader(h.name)).map((h) => h.name);
  if (blocked.length) {
    notes.push(
      `Browsers refuse to let scripts set ${[...new Set(blocked)].join(", ")}. The header is silently dropped in a browser, but works in Node.js and other servers-side runtimes.`
    );
  }
  return notes;
}

function commonNotes(req: HttpRequest, target: CodeTarget): string[] {
  const notes: string[] = [];
  if (req.options.insecure) {
    if (target === "fetch" || target === "xhr" || target === "jquery") notes.push("-k (skip certificate checks) cannot be done from a browser. In Node.js set NODE_TLS_REJECT_UNAUTHORIZED=0, for testing only.");
  }
  if (req.options.compressed) {
    notes.push(
      target === "python-urllib" || target === "node-https"
        ? "--compressed has no equivalent here: this module neither asks for nor decodes gzip, so the response arrives uncompressed. Use fetch, axios or requests if you need it."
        : "--compressed is not needed here: the library asks for and decodes gzip/deflate/br on its own."
    );
  }
  if (req.options.proxy) notes.push(`The proxy (${req.options.proxy}) is not configured in this code.`);
  return notes;
}

/* ------------------------------------------------------------------- fetch */

function genFetch(req: HttpRequest, o: GenerateOptions, node = false): Generated {
  const notes = [...browserNotes(req), ...commonNotes(req, "fetch")];
  const method = req.method.toUpperCase();
  let headers = req.headers.map((h) => ({ ...h }));
  const opts: string[] = [];
  const pre: string[] = [];

  if (method !== "GET") opts.push(`method: ${jsString(method)}`);

  if (req.basicAuth && !hasHeader(headers, "authorization")) {
    headers.push({ name: "Authorization", value: `Basic ${base64(`${req.basicAuth.user}:${req.basicAuth.password}`)}` });
  }

  const b = req.body;
  let bodySrc: string | null = null;
  if (b.kind === "raw") {
    const json = bodyJson(req);
    bodySrc = json !== undefined ? `JSON.stringify(${jsLiteral(json, 0)})` : jsString(b.text);
  } else if (b.kind === "urlencoded") {
    const fields = b.fields;
    bodySrc = paramsSrc(fields);
    if (isFormMedia(mediaType(getHeader(headers, "content-type")))) headers = removeHeader(headers, "content-type");
  } else if (b.kind === "multipart") {
    pre.push("const form = new FormData();");
    if (node && b.fields.some((f) => f.file)) pre.unshift("const { readFile } = require('node:fs/promises');");
    for (const f of b.fields) {
      if (f.file && node) {
        const type = f.contentType ? `, { type: ${jsString(f.contentType)} }` : "";
        pre.push(`form.append(${jsString(f.name)}, new Blob([await readFile(${jsString(f.value)})]${type}), ${jsString(f.value.split(/[\\/]/).pop() || f.value)});`);
      } else if (f.file) pre.push(`form.append(${jsString(f.name)}, fileInput.files[0]); // ${f.value}${f.contentType ? ` (${f.contentType})` : ""}`);
      else pre.push(`form.append(${jsString(f.name)}, ${jsString(f.value)});`);
    }
    bodySrc = "form";
    headers = removeHeader(headers, "content-type");
    if (!node && b.fields.some((f) => f.file)) notes.push("File parts refer to an <input type=\"file\"> called fileInput. In Node.js use `new Blob([await fs.promises.readFile(path)])` instead.");
  } else if (b.kind === "file") {
    if (node) {
      pre.push("const { readFile } = require('node:fs/promises');");
      bodySrc = `await readFile(${jsString(b.path)})`;
    } else {
      bodySrc = "file";
      notes.push(`The body is read from ${b.path}. \`file\` stands for a File/Blob (from an <input type="file"> in a browser, or a Blob built from fs.readFile in Node.js).`);
    }
  }

  const headerSrc = jsHeaders(headers, notes, true);
  if (headerSrc) opts.push(`headers: ${headerSrc}`);
  if (bodySrc && !isBodyless(method)) opts.push(`body: ${bodySrc}`);
  else if (bodySrc) notes.push(`${method} requests cannot have a body in fetch. The body was left out.`);

  if (o.matchCurlRedirects && !req.options.followRedirects) opts.push("redirect: 'manual'");
  if (req.options.timeout) opts.push(`signal: AbortSignal.timeout(${Math.round(req.options.timeout * 1000)})`);

  const call = opts.length ? `fetch(${jsString(req.url)}, {\n${opts.map((l) => `  ${l.replace(/\n/g, "\n  ")}`).join(",\n")},\n})` : `fetch(${jsString(req.url)})`;
  const json = wantsJsonResponse(req, o.parse);
  const read = json ? "json" : "text";
  const errorHandling = o.errorHandling !== false || req.options.failOnError;
  const lines: string[] = [];

  if (o.fetchStyle === "then") {
    lines.push(...pre, `${call}`);
    lines.push(`  .then((response) => {`);
    if (errorHandling) lines.push(`    if (!response.ok) {`, `      throw new Error(\`Request failed with status \${response.status}\`);`, `    }`);
    lines.push(`    return response.${read}();`, `  })`, `  .then((data) => {`, `    console.log(data);`, `  })`, `  .catch((error) => {`, `    console.error(error);`, `  });`);
  } else {
    lines.push(...pre, `const response = await ${call};`);
    if (errorHandling) lines.push("", `if (!response.ok) {`, `  throw new Error(\`Request failed with status \${response.status}\`);`, `}`);
    lines.push("", `const data = await response.${read}();`, `console.log(data);`);
  }
  if (b.kind === "file" && !node) lines.unshift("// `file` is a File or Blob holding the request body");
  return { code: lines.join("\n"), notes };
}

/* --------------------------------------------------------------------- xhr */

function genXhr(req: HttpRequest, o: GenerateOptions): Generated {
  const notes = [...browserNotes(req), ...commonNotes(req, "xhr")];
  const method = req.method.toUpperCase();
  const headers = effectiveNonForm(req);
  const lines: string[] = ["const xhr = new XMLHttpRequest();", `xhr.open(${jsString(method)}, ${jsString(req.url)});`];
  for (const h of headers) lines.push(`xhr.setRequestHeader(${jsString(h.name)}, ${jsString(h.value)});`);
  if (req.options.timeout) lines.push(`xhr.timeout = ${Math.round(req.options.timeout * 1000)};`);
  lines.push("");
  const json = wantsJsonResponse(req, o.parse);
  lines.push("xhr.onload = () => {", "  if (xhr.status >= 200 && xhr.status < 300) {", json ? "    console.log(JSON.parse(xhr.responseText));" : "    console.log(xhr.responseText);", "  } else {", "    console.error(`Request failed with status ${xhr.status}`);", "  }", "};", "xhr.onerror = () => console.error('Network error');");
  if (req.options.timeout) lines.push("xhr.ontimeout = () => console.error('Request timed out');");
  lines.push("");
  const b = req.body;
  let send = "";
  const pre: string[] = [];
  if (b.kind === "raw") {
    const j = bodyJson(req);
    send = j !== undefined ? `JSON.stringify(${jsLiteral(j, 0)})` : jsString(b.text);
  } else if (b.kind === "urlencoded") {
    send = `new URLSearchParams(${hasDuplicateNames(b.fields) ? `[${b.fields.map((f) => `[${jsString(f.name)}, ${jsString(f.value)}]`).join(", ")}]` : jsLiteral(Object.fromEntries(b.fields.map((f) => [f.name, f.value])), 0)})`;
  } else if (b.kind === "multipart") {
    pre.push("const form = new FormData();");
    for (const f of b.fields) pre.push(f.file ? `form.append(${jsString(f.name)}, fileInput.files[0]); // ${f.value}` : `form.append(${jsString(f.name)}, ${jsString(f.value)});`);
    send = "form";
    if (b.fields.some((f) => f.file)) notes.push("File parts refer to an <input type=\"file\"> called fileInput.");
  } else if (b.kind === "file") {
    send = "file";
    notes.push(`The body is read from ${b.path}; \`file\` stands for a File or Blob.`);
  }
  lines.push(...pre, isBodyless(method) || !send ? "xhr.send();" : `xhr.send(${send});`);
  return { code: lines.join("\n"), notes };
}

/** Headers for libraries that set the multipart / urlencoded Content-Type themselves. */
function effectiveNonForm(req: HttpRequest): HeaderPair[] {
  let h = req.headers.map((x) => ({ ...x }));
  if (req.basicAuth && !hasHeader(h, "authorization")) h.push({ name: "Authorization", value: `Basic ${base64(`${req.basicAuth.user}:${req.basicAuth.password}`)}` });
  if (req.body.kind === "multipart") h = removeHeader(h, "content-type");
  if (req.body.kind === "urlencoded" && isFormMedia(mediaType(getHeader(h, "content-type")))) h = removeHeader(h, "content-type");
  return h;
}

/* -------------------------------------------------------------- node https */

function genNodeHttps(req: HttpRequest, o: GenerateOptions): Generated {
  const notes = commonNotes(req, "node-https");
  const method = req.method.toUpperCase();
  const u = urlParts(req.url);
  const lib = u.protocol === "http:" ? "http" : "https";
  const b = req.body;

  if (b.kind === "multipart" || b.kind === "file") {
    const g = genFetch(req, o, true);
    return {
      code: `// Node's built-in ${lib} module has no multipart or file-upload helper, so this uses\n// the fetch that ships with Node.js 18 and later.\n(async () => {\n${g.code.replace(/^(?=.)/gm, "  ")}\n})();`,
      notes: [...notes, "Multipart and file bodies are much simpler with fetch (Node 18+) or axios, so this output uses fetch."],
    };
  }

  let body: string | null = null;
  let headers = effectiveNonForm(req);
  if (b.kind === "raw") {
    const j = bodyJson(req);
    body = j !== undefined ? `JSON.stringify(${jsLiteral(j, 0)})` : jsString(b.text);
  } else if (b.kind === "urlencoded") {
    body = `${paramsSrc(b.fields)}.toString()`;
    if (!hasHeader(headers, "content-type")) headers = [...headers, { name: "Content-Type", value: "application/x-www-form-urlencoded" }];
  }
  const lines: string[] = [`const ${lib} = require('${lib}');`, ""];
  if (body) {
    lines.push(`const body = ${body};`, "");
    if (!hasHeader(headers, "content-length")) headers = [...headers, { name: "Content-Length", value: "%%LEN%%" }];
  }
  const optLines = [`hostname: ${jsString(u.hostname)}`];
  if (u.port) optLines.push(`port: ${u.port}`);
  optLines.push(`path: ${jsString(u.path)}`, `method: ${jsString(method)}`);
  const hsrc = jsHeaders(headers, notes);
  if (hsrc) optLines.push(`headers: ${hsrc.replace(/'%%LEN%%'/, "Buffer.byteLength(body)")}`);
  if (req.options.insecure && lib === "https") optLines.push("rejectUnauthorized: false");
  if (req.options.timeout) optLines.push(`timeout: ${Math.round(req.options.timeout * 1000)}`);
  lines.push(`const options = {\n${optLines.map((l) => `  ${l.replace(/\n/g, "\n  ")}`).join(",\n")},\n};`, "");
  lines.push(`const req = ${lib}.request(options, (res) => {`, "  const chunks = [];", "  res.on('data', (chunk) => chunks.push(chunk));", "  res.on('end', () => {", "    const text = Buffer.concat(chunks).toString('utf8');", "    console.log(res.statusCode);", wantsJsonResponse(req, o.parse) ? "    console.log(JSON.parse(text));" : "    console.log(text);", "  });", "});", "", "req.on('error', (error) => console.error(error));");
  if (req.options.timeout) lines.push("req.on('timeout', () => req.destroy(new Error('Request timed out')));");
  if (body) lines.push("req.write(body);");
  lines.push("req.end();");
  if (req.options.followRedirects) notes.push("Node's http/https modules do not follow redirects. -L needs the follow-redirects package, or use fetch or axios.");
  return { code: lines.join("\n"), notes };
}

/* ------------------------------------------------------------------ jquery */

function genJquery(req: HttpRequest, o: GenerateOptions): Generated {
  const notes = [...browserNotes(req), ...commonNotes(req, "jquery")];
  const method = req.method.toUpperCase();
  const b = req.body;
  let headers = effectiveNonForm(req);
  const contentType = getHeader(headers, "content-type");
  const opts: string[] = [`url: ${jsString(req.url)}`, `method: ${jsString(method)}`];
  const pre: string[] = [];
  if (b.kind === "raw") {
    const j = bodyJson(req);
    if (contentType) {
      opts.push(`contentType: ${jsString(contentType)}`);
      headers = removeHeader(headers, "content-type");
    }
    opts.push(`data: ${j !== undefined ? `JSON.stringify(${jsLiteral(j, 0)})` : jsString(b.text)}`);
    opts.push("processData: false");
  } else if (b.kind === "urlencoded") {
    opts.push(`data: ${hasDuplicateNames(b.fields) ? jsString(b.fields.map((f) => `${encodeURIComponent(f.name)}=${encodeURIComponent(f.value)}`).join("&")) : jsLiteral(Object.fromEntries(b.fields.map((f) => [f.name, f.value])), 0)}`);
  } else if (b.kind === "multipart") {
    pre.push("const form = new FormData();");
    for (const f of b.fields) pre.push(f.file ? `form.append(${jsString(f.name)}, fileInput.files[0]); // ${f.value}` : `form.append(${jsString(f.name)}, ${jsString(f.value)});`);
    opts.push("data: form", "processData: false", "contentType: false");
    if (b.fields.some((f) => f.file)) notes.push("File parts refer to an <input type=\"file\"> called fileInput.");
  } else if (b.kind === "file") {
    opts.push("data: file", "processData: false", "contentType: false");
    notes.push(`The body is read from ${b.path}; \`file\` stands for a File or Blob.`);
  }
  const hsrc = jsHeaders(headers, notes);
  if (hsrc) opts.splice(2, 0, `headers: ${hsrc}`);
  if (wantsJsonResponse(req, o.parse)) opts.push("dataType: 'json'");
  if (req.options.timeout) opts.push(`timeout: ${Math.round(req.options.timeout * 1000)}`);
  const lines = [...pre, "$.ajax({", ...opts.map((l) => `  ${l.replace(/\n/g, "\n  ")},`), "  success: (data, textStatus, jqXHR) => {", "    console.log(data);", "  },", "  error: (jqXHR, textStatus, errorThrown) => {", "    console.error(jqXHR.status, textStatus, errorThrown);", "  },", "});"];
  return { code: lines.join("\n"), notes };
}

/* ------------------------------------------------------------------- axios */

function genAxios(req: HttpRequest, o: GenerateOptions): Generated {
  const notes = commonNotes(req, "axios");
  const method = req.method.toUpperCase();
  const b = req.body;
  const cjs = o.modules === "cjs";
  let headers = req.headers.map((h) => ({ ...h }));
  const pre: string[] = [];
  const config: string[] = [];
  let data: string | null = null;

  if (b.kind === "raw") {
    const j = bodyJson(req);
    data = j !== undefined ? jsLiteral(j, 0) : jsString(b.text);
    if (j !== undefined && mediaType(getHeader(headers, "content-type")) === "application/json") headers = removeHeader(headers, "content-type");
  } else if (b.kind === "urlencoded") {
    data = `new URLSearchParams(${hasDuplicateNames(b.fields) ? `[${b.fields.map((f) => `[${jsString(f.name)}, ${jsString(f.value)}]`).join(", ")}]` : jsLiteral(Object.fromEntries(b.fields.map((f) => [f.name, f.value])), 0)})`;
    if (isFormMedia(mediaType(getHeader(headers, "content-type")))) headers = removeHeader(headers, "content-type");
  } else if (b.kind === "multipart") {
    pre.push("const form = new FormData();");
    for (const f of b.fields) pre.push(f.file ? `form.append(${jsString(f.name)}, fileInput.files[0]); // ${f.value}` : `form.append(${jsString(f.name)}, ${jsString(f.value)});`);
    data = "form";
    headers = removeHeader(headers, "content-type");
    if (b.fields.some((f) => f.file)) notes.push("File parts refer to an <input type=\"file\"> called fileInput. In Node.js append a Blob or a stream instead.");
  } else if (b.kind === "file") {
    data = "file";
    notes.push(`The body is read from ${b.path}; \`file\` stands for a File, Blob or a fs.createReadStream(...) stream.`);
  }

  const useShorthand = o.axiosStyle === "shorthand" && ["get", "delete", "head", "options", "post", "put", "patch"].includes(method.toLowerCase());
  const hsrc = jsHeaders(headers, notes);
  if (hsrc) config.push(`headers: ${hsrc}`);
  if (req.basicAuth && !hasHeader(headers, "authorization")) config.push(`auth: {\n  username: ${jsString(req.basicAuth.user)},\n  password: ${jsString(req.basicAuth.password)},\n}`);
  if (req.options.timeout) config.push(`timeout: ${Math.round(req.options.timeout * 1000)}`);
  if (o.matchCurlRedirects && !req.options.followRedirects) config.push("maxRedirects: 0");
  if (req.options.insecure) {
    config.push("httpsAgent: new https.Agent({ rejectUnauthorized: false })");
    notes.push("httpsAgent works in Node.js only. Skipping certificate checks is for local testing, never production.");
  }

  const importLines = cjs ? ["const axios = require('axios');"] : ["import axios from 'axios';"];
  if (req.options.insecure) importLines.push(cjs ? "const https = require('https');" : "import https from 'https';");

  const call: string[] = [];
  const indent2 = (text: string) => text.replace(/^/gm, "  ");
  const m = method.toLowerCase();
  if (useShorthand) {
    const args: string[] = [jsString(req.url)];
    const carriesBody = ["post", "put", "patch"].includes(m);
    if (m === "delete" && data !== null) config.unshift(`data: ${data}`);
    const cfg = config.length ? `{\n${config.map((l) => indent2(l)).join(",\n")},\n}` : null;
    if (carriesBody && data !== null) args.push(data);
    else if (carriesBody && cfg) args.push("undefined");
    if (cfg) args.push(cfg);
    call.push(args.length === 1 ? `axios.${m}(${args[0]})` : `axios.${m}(\n${args.map(indent2).join(",\n")},\n)`);
  } else {
    const cfg = [`method: ${jsString(m)}`, `url: ${jsString(req.url)}`, ...config];
    if (data !== null && !isBodyless(method)) cfg.push(`data: ${data}`);
    call.push(`axios({\n${cfg.map(indent2).join(",\n")},\n})`);
  }

  const bodyText = [...pre, `const response = await ${call.join("")};`, "console.log(response.status);", "console.log(response.data);"].join("\n");
  const indent = (text: string) => text.replace(/^(?=.)/gm, "  ");
  let out = o.errorHandling !== false
    ? [
        "try {",
        indent(bodyText),
        "} catch (error) {",
        "  if (axios.isAxiosError(error)) {",
        "    console.error(error.response?.status, error.response?.data ?? error.message);",
        "  } else {",
        "    throw error;",
        "  }",
        "}",
      ].join("\n")
    : bodyText;
  if (cjs) out = ["async function main() {", indent(out), "}", "", "main();"].join("\n");
  return { code: [...importLines, "", out].join("\n"), notes };
}

/* ------------------------------------------------------------------ python */

function pyHeaderDict(headers: HeaderPair[], allowPairs = false): string | null {
  if (!headers.length) return null;
  if (hasDuplicateHeaders(headers)) {
    if (allowPairs) return `[\n${headers.map((h) => `    (${pyString(h.name)}, ${pyString(h.value)}),`).join("\n")}\n]`;
    return pyHeaderDict(mergeHeaders(headers).headers);
  }
  return `{\n${headers.map((h) => `    ${pyString(h.name)}: ${pyString(h.value)},`).join("\n")}\n}`;
}

function pyFields(fields: FormField[]): string {
  return hasDuplicateNames(fields)
    ? `[\n${fields.map((f) => `    (${pyString(f.name)}, ${pyString(f.value)}),`).join("\n")}\n]`
    : `{\n${fields.map((f) => `    ${pyString(f.name)}: ${pyString(f.value)},`).join("\n")}\n}`;
}

function pyMultipart(fields: FormField[]): { data?: string; files?: string } {
  const text = fields.filter((f) => !f.file);
  const files = fields.filter((f) => f.file);
  return {
    data: text.length ? pyFields(text) : undefined,
    files: files.length
      ? `{\n${files.map((f) => `    ${pyString(f.name)}: (${pyString(f.value.split(/[\\/]/).pop() || f.value)}, open(${pyString(f.value)}, "rb")${f.contentType ? `, ${pyString(f.contentType)}` : ""}),`).join("\n")}\n}`
      : undefined,
  };
}

function genPythonRequests(req: HttpRequest, o: GenerateOptions, lib: "requests" | "httpx"): Generated {
  const notes = commonNotes(req, lib === "requests" ? "python-requests" : "python-httpx");
  const method = req.method.toUpperCase();
  const b = req.body;
  let headers = req.headers.map((h) => ({ ...h }));
  const lines: string[] = [`import ${lib}`, "", `url = ${pyString(req.url)}`];
  const kwargs: string[] = [];

  if (b.kind === "raw") {
    const j = bodyJson(req);
    if (j !== undefined) {
      lines.push(`payload = ${pyLiteral(j)}`);
      kwargs.push("json=payload");
      if (mediaType(getHeader(headers, "content-type")) === "application/json") headers = removeHeader(headers, "content-type");
    } else {
      lines.push(`payload = ${pyString(b.text)}`);
      kwargs.push("data=payload");
    }
  } else if (b.kind === "urlencoded") {
    lines.push(`payload = ${pyFields(b.fields)}`);
    kwargs.push("data=payload");
    if (isFormMedia(mediaType(getHeader(headers, "content-type")))) headers = removeHeader(headers, "content-type");
  } else if (b.kind === "multipart") {
    const m = pyMultipart(b.fields);
    if (m.data) {
      lines.push(`payload = ${m.data}`);
      kwargs.push("data=payload");
    }
    if (m.files) {
      lines.push(`files = ${m.files}`);
      kwargs.push("files=files");
    }
    headers = removeHeader(headers, "content-type");
  } else if (b.kind === "file") {
    lines.push(`with open(${pyString(b.path)}, "rb") as f:`, "    payload = f.read()");
    kwargs.push(lib === "httpx" ? "content=payload" : "data=payload");
  }

  if (lib === "requests" && hasDuplicateHeaders(headers)) notes.push(MERGE_NOTE);
  const hsrc = pyHeaderDict(headers, lib === "httpx");
  if (hsrc) {
    lines.splice(3, 0, `headers = ${hsrc}`);
    kwargs.unshift("headers=headers");
  }
  if (req.basicAuth) kwargs.push(`auth=(${pyString(req.basicAuth.user)}, ${pyString(req.basicAuth.password)})`);
  if (req.options.timeout) kwargs.push(`timeout=${req.options.timeout}`);

  if (lib === "requests") {
    if (req.options.followRedirects && method === "HEAD") kwargs.push("allow_redirects=True");
    else if (!req.options.followRedirects && o.matchCurlRedirects && method !== "HEAD") kwargs.push("allow_redirects=False");
    if (req.options.insecure) kwargs.push("verify=False");
    if (req.options.proxy) kwargs.push(`proxies={"http": ${pyString(req.options.proxy)}, "https": ${pyString(req.options.proxy)}}`);
  } else {
    if (req.options.followRedirects) kwargs.push("follow_redirects=True");
    if (req.options.insecure) kwargs.push("verify=False");
    if (req.options.proxy) kwargs.push(`proxy=${pyString(req.options.proxy)}`);
    if (!req.options.timeout) notes.push("httpx times out after 5 seconds by default; add timeout=None to wait longer.");
  }

  const verb = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method) ? method.toLowerCase() : null;
  const callArgs = [...(verb ? [] : [pyString(method)]), "url", ...kwargs];
  const call = `${lib}.${verb ?? "request"}(${callArgs.length === 1 ? "url" : `\n    ${callArgs.join(",\n    ")},\n`})`;
  lines.push("", `response = ${call}`);
  if (o.errorHandling !== false || req.options.failOnError) lines.push("response.raise_for_status()");
  lines.push("print(response.status_code)", wantsJsonResponse(req, o.parse) ? "print(response.json())" : "print(response.text)");
  if (lib === "requests" && !req.options.followRedirects && !o.matchCurlRedirects && method !== "HEAD") {
    notes.push("requests follows redirects by default; curl only does with -L. Turn on \"Match curl's redirect behaviour\" to reproduce curl exactly.");
  }
  if (lib === "httpx" && req.options.followRedirects === false) notes.push("httpx does not follow redirects by default, the same as curl without -L.");
  return { code: lines.join("\n"), notes };
}

function genPythonUrllib(req: HttpRequest, o: GenerateOptions): Generated {
  const notes = commonNotes(req, "python-urllib");
  const method = req.method.toUpperCase();
  const b = req.body;
  if (b.kind === "multipart") {
    const g = genPythonRequests(req, o, "requests");
    return {
      code: `# urllib has no multipart helper, so this uses the third-party requests package.\n${g.code}`,
      notes: [...notes, "urllib cannot build multipart/form-data bodies, so the output uses requests (pip install requests)."],
    };
  }
  const json = wantsJsonResponse(req, o.parse);
  const imports = new Set(["urllib.request"]);
  if (json) imports.add("json");
  const pre: string[] = [];
  let data: string | null = null;
  if (b.kind === "raw") {
    const j = bodyJson(req);
    if (j !== undefined) {
      imports.add("json");
      pre.push(`payload = ${pyLiteral(j)}`);
      data = 'json.dumps(payload).encode("utf-8")';
    } else data = `${pyString(b.text)}.encode("utf-8")`;
  } else if (b.kind === "urlencoded") {
    imports.add("urllib.parse");
    pre.push(`payload = ${pyFields(b.fields)}`);
    data = 'urllib.parse.urlencode(payload).encode("utf-8")';
  } else if (b.kind === "file") {
    pre.push(`with open(${pyString(b.path)}, "rb") as f:`, "    data = f.read()");
    data = "data";
  }

  // urllib keeps one value per header name (the last one).
  const merged = [...new Map(req.headers.map((h) => [h.name.toLowerCase(), h])).values()];
  if (merged.length !== req.headers.length) notes.push("urllib keeps one value per header name. Where a header was repeated only the last value is sent.");
  const headerLines = merged.map((h) => `    ${pyString(h.name)}: ${pyString(h.value)},`);
  if (req.basicAuth && !hasHeader(req.headers, "authorization")) {
    imports.add("base64");
    pre.unshift(`credentials = base64.b64encode(${pyString(`${req.basicAuth.user}:${req.basicAuth.password}`)}.encode("utf-8")).decode("ascii")`);
    headerLines.push('    "Authorization": f"Basic {credentials}",');
  }
  if (req.options.insecure) imports.add("ssl");

  const out: string[] = [...[...imports].sort().map((i) => `import ${i}`), "", `url = ${pyString(req.url)}`];
  out.push(...pre);
  if (headerLines.length) out.push(`headers = {\n${headerLines.join("\n")}\n}`);
  const args = ["url", ...(data ? [`data=${data}`] : []), ...(headerLines.length ? ["headers=headers"] : []), `method=${pyString(method)}`];
  out.push("", `request = urllib.request.Request(\n    ${args.join(",\n    ")},\n)`);
  if (req.options.insecure) out.push("context = ssl._create_unverified_context()");
  const openArgs = ["request", ...(req.options.timeout ? [`timeout=${req.options.timeout}`] : []), ...(req.options.insecure ? ["context=context"] : [])];
  out.push(`with urllib.request.urlopen(${openArgs.join(", ")}) as response:`, "    print(response.status)");
  out.push(json ? '    print(json.loads(response.read().decode("utf-8")))' : '    print(response.read().decode("utf-8"))');
  notes.push("urllib raises urllib.error.HTTPError for 4xx and 5xx responses and follows redirects by default.");
  return { code: out.join("\n"), notes };
}

/* ------------------------------------------------------------------ public */

export function generateCode(target: CodeTarget, req: HttpRequest, options: GenerateOptions = {}): Generated {
  switch (target) {
    case "fetch":
      return genFetch(req, options);
    case "xhr":
      return genXhr(req, options);
    case "node-https":
      return genNodeHttps(req, options);
    case "jquery":
      return genJquery(req, options);
    case "axios":
      return genAxios(req, options);
    case "python-requests":
      return genPythonRequests(req, options, "requests");
    case "python-httpx":
      return genPythonRequests(req, options, "httpx");
    case "python-urllib":
      return genPythonUrllib(req, options);
  }
}
