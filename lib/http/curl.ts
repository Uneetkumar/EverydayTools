/**
 * cURL command ⇄ HttpRequest.
 *
 * The parser follows curl's own rules rather than a regex over the string:
 * it tokenises like a POSIX shell (single quotes, double quotes, $'…',
 * backslash continuation, and the caret-escaped form Chrome's "Copy as cURL
 * (cmd)" produces), then reads options the way curl does — clustered short
 * flags (`-sSL`, `-XPOST`), which options take an argument, how several -d
 * parts are joined with "&", what -G, -I, -T and --json imply, and that -d
 * without a Content-Type header makes curl send form data.
 */

import {
  type FormField,
  type HeaderPair,
  type HttpRequest,
  appendQuery,
  defaultOptions,
  formEncode,
  getHeader,
  hasHeader,
  isFormMedia,
  mediaType,
  parseUrlEncoded,
  removeHeader,
  serializeUrlEncoded,
  setHeader,
  tryParseJson,
} from "./request";

/* ------------------------------------------------------------------ tokens */

export interface Tokens {
  tokens: string[];
  /** Tokens that contain an unquoted-context shell variable such as $TOKEN. */
  variables: string[];
  /** More than one command was pasted; only the first was read. */
  extraCommands: boolean;
}

const ANSI_ESCAPES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  a: "\x07",
  b: "\b",
  f: "\f",
  v: "\v",
  e: "\x1b",
  E: "\x1b",
  "\\": "\\",
  "'": "'",
  '"': '"',
  "?": "?",
};

/** Undoes cmd.exe caret escaping (`^"`, `^{`, trailing `^` for line breaks). */
function unescapeCmd(input: string): string {
  return input.replace(/\^\r?\n/g, "").replace(/\^([\s\S])/g, "$1");
}

export function shellSplit(input: string): Tokens {
  let text = input.trim();
  // Chrome's "Copy as cURL (cmd)" and PowerShell continuations.
  if (/\^\r?\n/.test(text) || /\^"/.test(text)) text = unescapeCmd(text);
  text = text.replace(/`\r?\n/g, " ");

  const tokens: string[] = [];
  const variables: string[] = [];
  let cur = "";
  let started = false;
  let hasVar = false;
  let extraCommands = false;
  let skipNext = false;
  let stop = false;

  const push = () => {
    if (!started) return;
    if (skipNext) skipNext = false;
    else {
      tokens.push(cur);
      if (hasVar) variables.push(cur);
    }
    cur = "";
    started = false;
    hasVar = false;
  };

  let i = 0;
  while (i < text.length && !stop) {
    const c = text[i];
    if (c === "\\" && (text[i + 1] === "\n" || (text[i + 1] === "\r" && text[i + 2] === "\n"))) {
      i += text[i + 1] === "\r" ? 3 : 2;
      continue;
    }
    if (/\s/.test(c)) {
      push();
      i++;
      continue;
    }
    if (c === "\\") {
      cur += text[i + 1] ?? "";
      started = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      started = true;
      const end = text.indexOf("'", i + 1);
      const close = end === -1 ? text.length : end;
      cur += text.slice(i + 1, close);
      i = close + 1;
      continue;
    }
    if (c === "$" && text[i + 1] === "'") {
      started = true;
      i += 2;
      while (i < text.length && text[i] !== "'") {
        if (text[i] === "\\") {
          const n = text[i + 1];
          if (n === "x" && /^[0-9a-fA-F]{1,2}/.test(text.slice(i + 2, i + 4))) {
            const hex = /^[0-9a-fA-F]{1,2}/.exec(text.slice(i + 2, i + 4))![0];
            cur += String.fromCharCode(parseInt(hex, 16));
            i += 2 + hex.length;
          } else if (n === "u" && /^[0-9a-fA-F]{1,4}/.test(text.slice(i + 2, i + 6))) {
            const hex = /^[0-9a-fA-F]{1,4}/.exec(text.slice(i + 2, i + 6))![0];
            cur += String.fromCharCode(parseInt(hex, 16));
            i += 2 + hex.length;
          } else if (n === "U" && /^[0-9a-fA-F]{1,8}/.test(text.slice(i + 2, i + 10))) {
            const hex = /^[0-9a-fA-F]{1,8}/.exec(text.slice(i + 2, i + 10))![0];
            cur += String.fromCodePoint(parseInt(hex, 16));
            i += 2 + hex.length;
          } else if (n !== undefined && /[0-7]/.test(n)) {
            const oct = /^[0-7]{1,3}/.exec(text.slice(i + 1, i + 4))![0];
            cur += String.fromCharCode(parseInt(oct, 8));
            i += 1 + oct.length;
          } else if (n !== undefined && n in ANSI_ESCAPES) {
            cur += ANSI_ESCAPES[n];
            i += 2;
          } else {
            cur += "\\" + (n ?? "");
            i += 2;
          }
        } else {
          cur += text[i];
          i++;
        }
      }
      i++;
      continue;
    }
    if (c === '"') {
      started = true;
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\" && i + 1 < text.length) {
          const n = text[i + 1];
          if (n === '"' || n === "\\" || n === "$" || n === "`") {
            cur += n;
            i += 2;
            continue;
          }
          if (n === "\n") {
            i += 2;
            continue;
          }
        }
        if (text[i] === "$" && /[A-Za-z_{(]/.test(text[i + 1] ?? "")) hasVar = true;
        cur += text[i];
        i++;
      }
      i++;
      continue;
    }
    if (c === "$" && /[A-Za-z_{(]/.test(text[i + 1] ?? "")) hasVar = true;
    if (c === "|" || c === ";" || (c === "&" && text[i + 1] === "&")) {
      push();
      stop = true;
      extraCommands = /\bcurl\b/.test(text.slice(i + 1));
      break;
    }
    if (c === ">" || c === "<") {
      // A redirect such as `> out.json` or `2>&1`; the target is not an argument.
      if (started && /^\d+$/.test(cur)) {
        cur = "";
        started = false;
      } else push();
      if (text[i + 1] === "&") {
        i += 2;
        while (i < text.length && /\S/.test(text[i])) i++;
      } else {
        if (text[i + 1] === ">") i++;
        skipNext = true;
        i++;
      }
      continue;
    }
    cur += c;
    started = true;
    i++;
  }
  push();
  return { tokens, variables, extraCommands };
}

/* ----------------------------------------------------------------- options */

/** Options that consume the next argument. Long names without the dashes. */
const LONG_WITH_ARG = new Set([
  "request", "header", "data", "data-raw", "data-ascii", "data-binary", "data-urlencode", "form", "form-string", "user",
  "user-agent", "referer", "cookie", "cookie-jar", "output", "max-time", "connect-timeout", "proxy", "upload-file", "url",
  "write-out", "json", "oauth2-bearer", "retry", "retry-delay", "retry-max-time", "limit-rate", "cert", "key", "cacert",
  "capath", "resolve", "interface", "range", "max-redirs", "config", "proxy-user", "dns-servers", "connect-to", "cert-type",
  "pass", "pinnedpubkey", "proto", "request-target", "time-cond", "trace", "trace-ascii", "dump-header", "unix-socket",
  "expect100-timeout", "keepalive-time", "local-port", "speed-limit", "speed-time", "aws-sigv4", "variable", "mail-from",
  "mail-rcpt", "ciphers", "tls-max", "tlsv1", "noproxy", "proxy-header", "socks5", "stderr", "quote", "krb", "hsts",
]);

const SHORT_WITH_ARG = new Set(["X", "H", "d", "F", "u", "A", "e", "b", "c", "o", "m", "x", "T", "w", "K", "E", "r", "U", "z", "Q", "y", "Y", "C", "D", "t", "P", "h"]);

const SHORT_TO_LONG: Record<string, string> = {
  X: "request", H: "header", d: "data", F: "form", u: "user", A: "user-agent", e: "referer", b: "cookie", c: "cookie-jar",
  o: "output", m: "max-time", x: "proxy", T: "upload-file", w: "write-out", r: "range", U: "proxy-user", L: "location",
  k: "insecure", s: "silent", S: "show-error", v: "verbose", i: "include", I: "head", G: "get", f: "fail", O: "remote-name",
  g: "globoff", N: "no-buffer", "4": "ipv4", "6": "ipv6", J: "remote-header-name", j: "junk-session-cookies", n: "netrc",
  l: "list-only", B: "use-ascii", a: "append", p: "proxytunnel", q: "disable", Z: "parallel",
};

export interface ParseResult {
  request: HttpRequest;
  /** Things that will not behave exactly as curl does. */
  warnings: string[];
  /** Plain-language facts about what curl would do that the code does not show. */
  notes: string[];
}

interface DataPart {
  kind: "text" | "file" | "urlencoded";
  value: string;
  name?: string;
}

/** Parses a curl command line. Throws with a readable message when there is no URL to call. */
export function parseCurl(command: string): ParseResult {
  const { tokens, variables, extraCommands } = shellSplit(command);
  const warnings: string[] = [];
  const notes: string[] = [];
  const req: HttpRequest = { method: "GET", url: "", headers: [], body: { kind: "none" }, options: defaultOptions() };

  let explicitMethod: string | undefined;
  let head = false;
  let getMode = false;
  let uploadFile: string | undefined;
  let jsonBody = false;
  const dataParts: DataPart[] = [];
  const formFields: FormField[] = [];
  const urls: string[] = [];

  let start = 0;
  while (start < tokens.length && (tokens[start] === "$" || tokens[start] === "sudo")) start++;
  // A leading "curl" is optional: a bare list of options and a URL also works.
  if (tokens[start] && /^(?:.*[\\/])?curl(?:\.exe)?$/i.test(tokens[start])) start++;

  const addHeader = (raw: string) => {
    const colon = raw.indexOf(":");
    const semi = raw.indexOf(";");
    if (colon === -1 && semi === raw.length - 1 && semi > 0) {
      // "Name;" sends the header with an empty value.
      req.headers.push({ name: raw.slice(0, semi).trim(), value: "" });
      return;
    }
    if (colon === -1) {
      warnings.push(`Ignored header "${raw}" — curl needs "Name: value".`);
      return;
    }
    const name = raw.slice(0, colon).trim();
    const value = raw.slice(colon + 1).trim();
    if (value === "") {
      // "Name:" removes a header curl would otherwise add.
      req.headers = removeHeader(req.headers, name);
      notes.push(`-H "${name}:" tells curl not to send its own ${name} header.`);
      return;
    }
    req.headers.push({ name, value });
  };

  const apply = (opt: string, arg: string | undefined) => {
    switch (opt) {
      case "request":
        explicitMethod = (arg ?? "").toUpperCase();
        break;
      case "header":
        if (arg !== undefined) addHeader(arg);
        break;
      case "data":
      case "data-ascii":
        if (arg === undefined) break;
        if (arg.startsWith("@")) dataParts.push({ kind: "file", value: arg.slice(1) });
        else dataParts.push({ kind: "text", value: arg });
        break;
      case "data-raw":
        if (arg !== undefined) dataParts.push({ kind: "text", value: arg });
        break;
      case "data-binary":
        if (arg === undefined) break;
        if (arg.startsWith("@")) dataParts.push({ kind: "file", value: arg.slice(1) });
        else dataParts.push({ kind: "text", value: arg });
        break;
      case "data-urlencode": {
        if (arg === undefined) break;
        const eq = arg.indexOf("=");
        const at = arg.indexOf("@");
        if (eq !== -1 && (at === -1 || eq < at)) dataParts.push({ kind: "urlencoded", name: arg.slice(0, eq), value: arg.slice(eq + 1) });
        else if (at !== -1) dataParts.push({ kind: "file", name: arg.slice(0, at), value: arg.slice(at + 1) });
        else dataParts.push({ kind: "urlencoded", value: arg });
        break;
      }
      case "json":
        if (arg === undefined) break;
        jsonBody = true;
        if (arg.startsWith("@")) dataParts.push({ kind: "file", value: arg.slice(1) });
        else dataParts.push({ kind: "text", value: arg });
        break;
      case "form":
      case "form-string": {
        if (arg === undefined) break;
        const eq = arg.indexOf("=");
        if (eq === -1) {
          warnings.push(`Ignored form field "${arg}" — curl needs name=value.`);
          break;
        }
        const name = arg.slice(0, eq);
        let value = arg.slice(eq + 1);
        if (opt === "form-string") {
          formFields.push({ name, value });
          break;
        }
        let contentType: string | undefined;
        let filename: string | undefined;
        const isFile = value.startsWith("@");
        const isFileContent = value.startsWith("<");
        if (isFile || isFileContent) {
          const parts = value.slice(1).split(";");
          value = parts[0];
          for (const p of parts.slice(1)) {
            const m = /^\s*(type|filename)=(.*)$/i.exec(p);
            if (m && m[1].toLowerCase() === "type") contentType = m[2].replace(/^"|"$/g, "");
            else if (m) filename = m[2].replace(/^"|"$/g, "");
          }
          formFields.push({ name, value: filename ?? value, file: true, contentType });
          if (filename) notes.push(`Field "${name}" is uploaded under the file name "${filename}" (read from ${value}).`);
        } else {
          const parts = value.split(";");
          if (parts.length > 1) {
            const m = /^\s*type=(.*)$/i.exec(parts[parts.length - 1]);
            if (m) {
              contentType = m[1];
              value = parts.slice(0, -1).join(";");
            }
          }
          formFields.push({ name, value, contentType });
        }
        break;
      }
      case "user": {
        if (arg === undefined) break;
        const colon = arg.indexOf(":");
        if (colon === -1) {
          req.basicAuth = { user: arg, password: "" };
          warnings.push("-u without a password makes curl ask for it. The password is left empty.");
        } else req.basicAuth = { user: arg.slice(0, colon), password: arg.slice(colon + 1) };
        break;
      }
      case "oauth2-bearer":
        if (arg !== undefined) req.headers = setHeader(req.headers, "Authorization", `Bearer ${arg}`);
        break;
      case "user-agent":
        if (arg !== undefined) req.headers = setHeader(req.headers, "User-Agent", arg);
        break;
      case "referer":
        if (arg !== undefined) req.headers = setHeader(req.headers, "Referer", arg.replace(/;auto$/i, ""));
        break;
      case "range":
        if (arg !== undefined) req.headers = setHeader(req.headers, "Range", `bytes=${arg}`);
        break;
      case "cookie":
        if (arg === undefined) break;
        if (arg.includes("=")) req.headers = setHeader(req.headers, "Cookie", arg);
        else warnings.push(`-b ${arg} reads cookies from a file, which code cannot do. Add the cookie values by hand.`);
        break;
      case "max-time":
        if (arg !== undefined && Number.isFinite(Number(arg))) req.options.timeout = Number(arg);
        break;
      case "proxy":
        if (arg !== undefined) req.options.proxy = arg;
        break;
      case "upload-file":
        uploadFile = arg;
        break;
      case "url":
        if (arg !== undefined) urls.push(arg);
        break;
      case "location":
      case "location-trusted":
        req.options.followRedirects = true;
        break;
      case "insecure":
        req.options.insecure = true;
        break;
      case "compressed":
        req.options.compressed = true;
        break;
      case "fail":
        req.options.failOnError = true;
        break;
      case "include":
        req.options.includeHeaders = true;
        break;
      case "head":
        head = true;
        break;
      case "get":
        getMode = true;
        break;
      case "digest":
      case "ntlm":
      case "negotiate":
      case "anyauth":
        warnings.push(`--${opt} authentication is not translated. Only Basic auth is.`);
        break;
      case "cert":
      case "key":
      case "cacert":
        warnings.push(`--${opt} (client certificates and custom CAs) is not translated.`);
        break;
      case "retry":
        notes.push(`--retry ${arg} is a curl feature; the generated code does not retry.`);
        break;
      default:
        // Options that only change curl's own output, connection or logging.
        break;
    }
  };

  let i = start;
  let onlyPositional = false;
  while (i < tokens.length) {
    const tok = tokens[i++];
    if (onlyPositional || tok === "-" || !tok.startsWith("-")) {
      urls.push(tok);
      continue;
    }
    if (tok === "--") {
      onlyPositional = true;
      continue;
    }
    if (tok.startsWith("--")) {
      let name = tok.slice(2);
      let inline: string | undefined;
      const eq = name.indexOf("=");
      if (eq !== -1 && LONG_WITH_ARG.has(name.slice(0, eq))) {
        inline = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      if (name.startsWith("no-") && !LONG_WITH_ARG.has(name)) continue;
      if (LONG_WITH_ARG.has(name)) {
        const arg = inline ?? tokens[i++];
        apply(name, arg);
      } else if (["location", "location-trusted", "insecure", "compressed", "fail", "include", "head", "get", "digest", "ntlm", "negotiate", "anyauth"].includes(name)) apply(name, undefined);
      else if (!KNOWN_LONG_FLAGS.has(name)) warnings.push(`Ignored unrecognised option --${name}.`);
      continue;
    }
    // A cluster of short flags, e.g. -sSL, -XPOST, -H'Accept: */*'.
    for (let k = 1; k < tok.length; k++) {
      const ch = tok[k];
      if (SHORT_WITH_ARG.has(ch)) {
        const rest = tok.slice(k + 1);
        const arg = rest !== "" ? rest : tokens[i++];
        apply(SHORT_TO_LONG[ch] ?? ch, arg);
        break;
      }
      const long = SHORT_TO_LONG[ch];
      if (long) apply(long, undefined);
      else warnings.push(`Ignored unrecognised option -${ch}.`);
    }
  }

  // ---- URL
  const rawUrl = urls[0];
  if (!rawUrl) throw new Error("No URL found. A curl command needs one, such as curl https://api.example.com/items");
  if (urls.length > 1) warnings.push(`curl was given ${urls.length} URLs. Only the first is used: ${urls.slice(1).join(", ")}`);
  let url = rawUrl;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    url = `http://${url}`;
    notes.push(`No scheme was given, so curl would use http:// — added it to the URL.`);
  }
  req.url = url;
  if (variables.length) {
    warnings.push(`The command uses shell variables (${[...new Set(variables.flatMap((v) => v.match(/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/g) ?? []))].join(", ")}). Replace them with real values before you run the generated code.`);
  }
  if (extraCommands) warnings.push("The input has more than one command. Only the first curl command was converted.");

  // ---- Body
  const contentTypeHeader = getHeader(req.headers, "content-type");
  const isMultipart = formFields.length > 0;
  const hasData = dataParts.length > 0;

  if (isMultipart && hasData) warnings.push("The command mixes -F and -d, which curl does not allow. The -d data is ignored.");

  if (isMultipart) {
    req.body = { kind: "multipart", fields: formFields };
    if (contentTypeHeader && /^multipart\//i.test(contentTypeHeader) && !/boundary=/i.test(contentTypeHeader)) {
      req.headers = removeHeader(req.headers, "content-type");
      notes.push("The Content-Type header was removed: curl and HTTP libraries set multipart/form-data with the right boundary themselves.");
    }
  } else if (hasData) {
    const asQuery = getMode;
    const onlyFile = dataParts.length === 1 && dataParts[0].kind === "file" && !dataParts[0].name;
    const pieces = dataParts.map((p) => {
      if (p.kind === "text") return p.value;
      if (p.kind === "urlencoded") return p.name !== undefined ? `${p.name}=${formEncode(p.value)}` : formEncode(p.value);
      return `${p.name ? `${p.name}=` : ""}<contents of ${p.value}>`;
    });
    const text = pieces.join("&");

    if (asQuery) {
      req.url = appendQuery(req.url, text);
      notes.push("-G moved the -d data into the URL's query string and the request is a GET.");
    } else if (onlyFile) {
      req.body = { kind: "file", path: dataParts[0].value };
    } else {
      if (dataParts.some((p) => p.kind === "file")) warnings.push("Some data comes from a file; it appears as a <contents of …> placeholder.");
      const explicitType = contentTypeHeader;
      const type = mediaType(explicitType);
      if (jsonBody) {
        if (!hasHeader(req.headers, "content-type")) req.headers.push({ name: "Content-Type", value: "application/json" });
        if (!hasHeader(req.headers, "accept")) req.headers.push({ name: "Accept", value: "application/json" });
        req.body = { kind: "raw", text };
        notes.push("--json sets Content-Type and Accept to application/json and sends the data as-is.");
      } else if (!explicitType) {
        // curl's default for -d, even when the data is JSON.
        const asForm = looksLikeForm(text) ? parseUrlEncoded(text) : null;
        req.headers.push({ name: "Content-Type", value: "application/x-www-form-urlencoded" });
        req.body = asForm ? { kind: "urlencoded", fields: asForm } : { kind: "raw", text };
        notes.push("curl adds Content-Type: application/x-www-form-urlencoded whenever -d is used without a Content-Type header.");
        if (!asForm && tryParseJson(text)) {
          warnings.push("This body is JSON, but with no Content-Type header curl labels it as form data. Most JSON APIs need -H 'Content-Type: application/json'.");
        }
      } else if (isFormMedia(type) && looksLikeForm(text)) {
        req.body = { kind: "urlencoded", fields: parseUrlEncoded(text) };
      } else {
        req.body = { kind: "raw", text };
      }
    }
  } else if (uploadFile) {
    req.body = { kind: "file", path: uploadFile };
  }

  // ---- Method
  if (explicitMethod) req.method = explicitMethod;
  else if (head) req.method = "HEAD";
  else if (getMode) req.method = "GET";
  else if (uploadFile) req.method = "PUT";
  else if (req.body.kind !== "none") req.method = "POST";
  if (explicitMethod === "GET" && req.body.kind !== "none") notes.push("-X GET with a body: curl sends the body anyway; many servers and proxies ignore it.");

  if (req.options.compressed && !hasHeader(req.headers, "accept-encoding")) {
    notes.push("--compressed asks for gzip/deflate/br and decodes the response. Browsers and most HTTP libraries do this automatically.");
  }

  return { request: req, warnings, notes };
}

/** Options that are valid but change nothing about the request. */
const KNOWN_LONG_FLAGS = new Set([
  "silent", "show-error", "verbose", "remote-name", "remote-header-name", "globoff", "no-buffer", "ipv4", "ipv6", "http1.1", "http2",
  "http2-prior-knowledge", "http3", "tlsv1.2", "tlsv1.3", "tcp-nodelay", "path-as-is", "netrc", "progress-bar", "basic", "raw",
  "fail-with-body", "styled-output", "use-ascii", "append", "list-only", "proxytunnel", "parallel", "disable", "junk-session-cookies",
  "ssl-no-revoke", "tr-encoding", "tcp-fastopen", "suppress-connect-headers", "create-dirs", "remote-name-all", "xattr", "sessionid",
  "location", "location-trusted", "insecure", "compressed", "fail", "include", "head", "get", "digest", "ntlm", "negotiate", "anyauth",
  "http0.9", "ssl", "ssl-reqd", "false-start", "tlsv1", "tlsv1.0", "tlsv1.1", "sslv2", "sslv3", "compressed-ssh", "post301", "post302", "post303", "netrc-optional",
]);

function looksLikeForm(text: string): boolean {
  if (text === "") return true;
  const t = text.trim();
  if ((t.startsWith("{") || t.startsWith("[")) && tryParseJson(t)) return false;
  if (/^\s*</.test(t)) return false;
  // Only keep it as fields when re-encoding gives the same bytes back.
  return serializeUrlEncoded(parseUrlEncoded(text)) === text;
}

/* -------------------------------------------------------------- generation */

export type Shell = "bash" | "powershell" | "cmd";

export interface CurlBuildOptions {
  shell?: Shell;
  /** One flag per line with continuation characters. */
  multiline?: boolean;
  /** Use -H, -d … rather than --header, --data … */
  short?: boolean;
}

const SIMPLE = /^[A-Za-z0-9_@%+=:,./-]+$/;

export function quoteArg(value: string, shell: Shell = "bash"): string {
  if (shell === "bash") {
    if (value !== "" && SIMPLE.test(value)) return value;
    return `'${value.replace(/'/g, `'\\''`)}'`;
  }
  if (shell === "powershell") return `'${value.replace(/'/g, "''")}'`;
  // cmd.exe: double quotes, with quotes and percent signs doubled or escaped.
  return `"${value.replace(/"/g, '\\"').replace(/%/g, "%%")}"`;
}

const CONTINUATION: Record<Shell, string> = { bash: " \\", powershell: " `", cmd: " ^" };

/** Builds a curl command from a request. */
export function buildCurl(req: HttpRequest, options: CurlBuildOptions = {}): string {
  const shell = options.shell ?? "bash";
  const short = options.short ?? true;
  const q = (v: string) => quoteArg(v, shell);
  const flag = (s: string, l: string) => (short ? s : l);
  const parts: string[] = [];
  const bin = shell === "powershell" || shell === "cmd" ? "curl.exe" : "curl";

  const method = req.method.toUpperCase();
  const hasBody = req.body.kind !== "none";
  const implicit = (method === "GET" && !hasBody) || (method === "POST" && hasBody);
  if (method === "HEAD") parts.push(flag("-I", "--head"));
  else if (!implicit) parts.push(`${flag("-X", "--request")} ${q(method)}`);

  parts.push(q(req.url || "https://example.com"));

  if (req.options.followRedirects) parts.push(flag("-L", "--location"));
  if (req.options.insecure) parts.push(flag("-k", "--insecure"));
  if (req.options.compressed) parts.push("--compressed");
  if (req.options.failOnError) parts.push(flag("-f", "--fail"));
  if (req.options.includeHeaders) parts.push(flag("-i", "--include"));
  if (req.options.timeout) parts.push(`${flag("-m", "--max-time")} ${req.options.timeout}`);
  if (req.options.proxy) parts.push(`${flag("-x", "--proxy")} ${q(req.options.proxy)}`);

  for (const h of req.headers) {
    if (!h.name.trim()) continue;
    parts.push(`${flag("-H", "--header")} ${q(h.value === "" ? `${h.name};` : `${h.name}: ${h.value}`)}`);
  }
  if (req.basicAuth) parts.push(`${flag("-u", "--user")} ${q(`${req.basicAuth.user}:${req.basicAuth.password}`)}`);

  const b = req.body;
  if (b.kind === "raw") parts.push(`${b.text.startsWith("@") ? "--data-raw" : flag("-d", "--data")} ${q(b.text)}`);
  else if (b.kind === "file") parts.push(`--data-binary ${q(`@${b.path}`)}`);
  else if (b.kind === "urlencoded") {
    const fields = b.fields.filter((f) => f.name !== "" || f.value !== "");
    const plain = fields.every((f) => formEncode(f.name) === f.name && formEncode(f.value) === f.value);
    if (plain && fields.length) parts.push(`${flag("-d", "--data")} ${q(fields.map((f) => `${f.name}=${f.value}`).join("&"))}`);
    else for (const f of fields) parts.push(`--data-urlencode ${q(`${f.name}=${f.value}`)}`);
  } else if (b.kind === "multipart") {
    for (const f of b.fields) {
      if (f.file) parts.push(`${flag("-F", "--form")} ${q(`${f.name}=@${f.value}${f.contentType ? `;type=${f.contentType}` : ""}`)}`);
      else if (/^[@<]/.test(f.value) || f.value.includes(";")) parts.push(`--form-string ${q(`${f.name}=${f.value}`)}`);
      else parts.push(`${flag("-F", "--form")} ${q(`${f.name}=${f.value}${f.contentType ? `;type=${f.contentType}` : ""}`)}`);
    }
  }

  const head = `${bin} ${parts[0]}`;
  if (!options.multiline) return [bin, ...parts].join(" ");
  const rest = parts.slice(1);
  const nl = shell === "cmd" || shell === "powershell" ? "\n" : "\n";
  return [head, ...rest].join(`${CONTINUATION[shell]}${nl}  `);
}

/** A header list as "Name: value" lines, handy for previews. */
export function headersToLines(headers: HeaderPair[]): string {
  return headers.map((h) => `${h.name}: ${h.value}`).join("\n");
}
