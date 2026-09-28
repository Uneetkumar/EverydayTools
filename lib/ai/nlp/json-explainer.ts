/**
 * On-device JSON structure analysis.
 *
 * Parses with the browser's JSON engine, then walks every value — all items
 * of an array, not just the first — so fields that only some records have
 * are reported as optional and mixed types are caught. Field meanings come
 * from the key split into words ("createdAt" → created, at) and from the
 * values themselves (an ISO date is a date whatever the key is called).
 */

export interface JsonFieldInfo {
  path: string;
  type: string;
  sampleValue: string;
  description: string;
  /** Detected value format: date-time, email, URL, UUID… */
  format?: string;
  isOptional?: boolean;
  /** Present in this many of the parent array's items. */
  presence?: { present: number; total: number };
  sensitive?: boolean;
  personal?: boolean;
}

export interface JsonExplanationResult {
  isValid: boolean;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
  rootType: "object" | "array" | "primitive";
  totalKeys: number;
  maxDepth: number;
  arrays: number;
  overview: string;
  fields: JsonFieldInfo[];
  insights: string[];
}

/* ------------------------------------------------------------------ */

function keyWords(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const FORMATS: [string, RegExp][] = [
  ["date-time", /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/],
  ["date", /^\d{4}-\d{2}-\d{2}$/],
  ["time", /^\d{2}:\d{2}(:\d{2})?$/],
  ["email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
  ["URL", /^https?:\/\/\S+$/i],
  ["UUID", /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i],
  ["JWT", /^eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+$/],
  ["IPv4 address", /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/],
  ["hex colour", /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i],
  ["phone number", /^\+?[\d\s().-]{8,}$/],
  ["number in a string", /^-?\d+(\.\d+)?$/],
];

function detectFormat(v: unknown): string | undefined {
  if (typeof v === "number") {
    // Seconds or milliseconds since 1970, within 2000–2100.
    if (Number.isInteger(v) && ((v > 946684800 && v < 4102444800) || (v > 946684800000 && v < 4102444800000))) {
      return v > 1e12 ? "Unix time (ms)?" : "Unix time (s)?";
    }
    return undefined;
  }
  if (typeof v !== "string" || !v) return undefined;
  for (const [name, re] of FORMATS) if (re.test(v)) return name;
  return undefined;
}

const SENSITIVE = new Set(["password", "passwd", "pwd", "secret", "token", "apikey", "credential", "credentials", "private", "ssn", "cvv", "cvc", "otp", "authorization", "bearer", "salt"]);
const PERSONAL = new Set(["email", "phone", "mobile", "address", "street", "zip", "postcode", "postal", "dob", "birthday", "birth", "ip", "passport", "surname", "firstname", "lastname", "fullname"]);

function classify(key: string, value: unknown, format: string | undefined): { description: string; sensitive: boolean; personal: boolean } {
  const w = keyWords(key);
  const has = (...xs: string[]) => xs.some((x) => w.includes(x));
  const last = w[w.length - 1];
  const joined = w.join("");
  // Only text can hold a secret: "private": true and "token_count": 12 are not credentials.
  const sensitive =
    typeof value === "string" &&
    (w.some((x) => SENSITIVE.has(x)) || /apikey|accesskey|secretkey|privatekey|refreshtoken|accesstoken|clientsecret/.test(joined) || format === "JWT");
  const personal =
    !sensitive &&
    (w.some((x) => PERSONAL.has(x)) ||
      (has("name") && has("first", "last", "full", "given", "family", "middle", "customer", "contact")) ||
      format === "email" ||
      format === "phone number" ||
      format === "IPv4 address");

  let description: string;
  if (sensitive) description = "Secret or credential";
  else if (format === "JWT") description = "Signed token (JWT)";
  else if (last === "id" || has("uuid", "guid") || format === "UUID") description = w.length > 1 ? `Identifier of the ${w.slice(0, -1).join(" ")}` : "Unique identifier";
  else if (format === "email" || has("email")) description = "Email address";
  else if (format === "date-time" || format === "date" || has("date", "time", "timestamp") || (last === "at" && w.length > 1) || (last === "on" && w.length > 1) || format?.startsWith("Unix")) {
    const what = w.filter((x) => !["at", "on", "date", "time", "timestamp"].includes(x)).join(" ");
    description = what ? `When it was ${what}` : "Date or time";
    if (/^(created|updated|deleted|modified|expires|expired|started|ended|published|last)/.test(what)) description = `Date and time: ${what}`;
  } else if (format === "URL" || has("url", "uri", "link", "href", "website", "endpoint", "src")) description = "Web address";
  else if (has("ip") || format === "IPv4 address") description = "IP address";
  else if (has("phone", "mobile", "tel") || format === "phone number") description = "Phone number";
  else if (has("lat", "latitude")) description = "Latitude";
  else if (has("lng", "lon", "longitude")) description = "Longitude";
  else if (typeof value === "boolean" || ["is", "has", "can", "should", "enabled", "active", "verified", "visible"].includes(w[0])) description = "Yes/no flag";
  else if (has("price", "cost", "amount", "fee", "balance", "total", "tax", "salary", "subtotal", "discount")) description = typeof value === "number" ? "Money amount" : "Amount";
  else if (has("count", "qty", "quantity", "size", "length", "number", "num", "seats", "limit")) description = "Count or quantity";
  else if (has("status", "state", "stage")) description = "Status";
  else if (has("type", "kind", "category", "role", "plan", "tier", "level")) description = "Category or type";
  else if (has("name", "title", "label")) description = "Name or title";
  else if (has("description", "summary", "bio", "text", "content", "message", "body", "comment", "note", "notes")) description = "Free text";
  else if (has("currency")) description = "Currency code";
  else if (has("country", "city", "region", "locale", "lang", "language", "timezone", "tz")) description = "Location or locale";
  else if (has("version")) description = "Version";
  else if (has("color", "colour") || format === "hex colour") description = "Colour";
  else if (Array.isArray(value)) description = `List of ${value.length} item${value.length === 1 ? "" : "s"}`;
  else if (value && typeof value === "object") description = "Group of related fields";
  else if (value === null) description = "Empty (null)";
  else description = typeof value === "number" ? "Number" : "Text";

  return { description, sensitive, personal };
}

const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

function sample(v: unknown): string {
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? "" : "s"}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).length} field${Object.keys(v).length === 1 ? "" : "s"}}`;
  const s = typeof v === "string" ? `"${v}"` : String(v);
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

/** Position of a JSON.parse error, from the message where the engine gives one. */
function errorPosition(raw: string, message: string): { line?: number; column?: number } {
  const lc = message.match(/line (\d+) column (\d+)/i);
  if (lc) return { line: Number(lc[1]), column: Number(lc[2]) };
  const pos = message.match(/position (\d+)/i);
  if (!pos) return {};
  const before = raw.slice(0, Number(pos[1]));
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

interface Acc {
  types: Set<string>;
  present: number;
  total: number;
  sample: unknown;
  key: string;
  depth: number;
  formats: Set<string>;
}

export function explainJsonLocally(rawJson: string): JsonExplanationResult {
  const base = { rootType: "primitive" as const, totalKeys: 0, maxDepth: 0, arrays: 0, overview: "", fields: [], insights: [] };
  const trimmed = rawJson.trim();
  if (!trimmed) return { ...base, isValid: false, error: "Paste some JSON to explain." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const { line, column } = errorPosition(trimmed, message);
    return {
      ...base,
      isValid: false,
      error: message,
      errorLine: line,
      errorColumn: column,
      overview: "This is not valid JSON.",
    };
  }

  // path → accumulated facts. Paths use [] for "every item of this array".
  const acc = new Map<string, Acc>();
  let maxDepth = 0;
  let arrays = 0;
  let nulls = 0;
  let emptyContainers = 0;
  let largestArray = 0;

  const visit = (value: unknown, path: string, key: string, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    if (Array.isArray(value)) {
      arrays++;
      largestArray = Math.max(largestArray, value.length);
      if (!value.length) emptyContainers++;
      const items = value.slice(0, 500);
      // Objects inside arrays: count in how many items each key appears.
      const objects = items.filter((v) => v && typeof v === "object" && !Array.isArray(v)) as Record<string, unknown>[];
      if (objects.length) {
        const keys = new Set(objects.flatMap((o) => Object.keys(o)));
        for (const k of keys) {
          const childPath = `${path}[].${k}`;
          const withKey = objects.filter((o) => k in o);
          const a = acc.get(childPath) ?? { types: new Set(), present: 0, total: 0, sample: undefined, key: k, depth: depth + 1, formats: new Set() };
          a.present += withKey.length;
          a.total += objects.length;
          acc.set(childPath, a);
          for (const o of withKey) record(o[k], childPath, k, depth + 1);
        }
      }
      for (const v of items) {
        if (!(v && typeof v === "object" && !Array.isArray(v))) record(v, `${path}[]`, key, depth + 1, true);
      }
      return;
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (!entries.length) emptyContainers++;
      for (const [k, v] of entries) {
        const childPath = path ? `${path}.${k}` : k;
        const a = acc.get(childPath) ?? { types: new Set(), present: 0, total: 0, sample: undefined, key: k, depth: depth + 1, formats: new Set() };
        acc.set(childPath, a);
        record(v, childPath, k, depth + 1);
      }
    }
  };

  const record = (value: unknown, path: string, key: string, depth: number, isItem = false) => {
    const a = acc.get(path) ?? { types: new Set(), present: 0, total: 0, sample: undefined, key, depth, formats: new Set() };
    a.types.add(typeOf(value));
    if (value === null) nulls++;
    const f = detectFormat(value);
    if (f) a.formats.add(f);
    if (a.sample === undefined || (a.sample === null && value !== null)) a.sample = value;
    if (isItem) {
      a.present++;
      a.total++;
    }
    acc.set(path, a);
    if (value && typeof value === "object") visit(value, path, key, depth);
  };

  const rootType = Array.isArray(parsed) ? "array" : parsed && typeof parsed === "object" ? "object" : "primitive";
  visit(parsed, "", "", 0);

  const fields: JsonFieldInfo[] = [];
  let totalKeys = 0;
  for (const [path, a] of acc) {
    totalKeys++;
    const types = [...a.types];
    const nonNull = types.filter((t) => t !== "null");
    const type = types.length ? types.sort((x, y) => (x === "null" ? 1 : y === "null" ? -1 : 0)).join(" | ") : "unknown";
    const format = a.formats.size === 1 ? [...a.formats][0] : undefined;
    const { description, sensitive, personal } = classify(a.key, a.sample, format);
    const optional = a.total > 0 && a.present < a.total;
    fields.push({
      path,
      type: nonNull.length ? type : "null",
      sampleValue: sample(a.sample),
      description,
      format,
      isOptional: optional,
      presence: a.total > 1 ? { present: a.present, total: a.total } : undefined,
      sensitive,
      personal,
    });
  }

  // Insights, most important first.
  const insights: string[] = [];
  const secrets = fields.filter((f) => f.sensitive);
  if (secrets.length) {
    insights.push(
      `${secrets.length} field${secrets.length === 1 ? " looks" : "s look"} like a secret or credential (${secrets
        .slice(0, 4)
        .map((f) => f.path)
        .join(", ")}). Remove ${secrets.length === 1 ? "it" : "them"} before sharing this JSON or logging it.`
    );
  }
  const personal = fields.filter((f) => f.personal);
  if (personal.length) {
    insights.push(
      `Contains personal data (${personal
        .slice(0, 4)
        .map((f) => f.path)
        .join(", ")}). Under GDPR and India's DPDP Act this needs a lawful reason to store and should be masked in logs.`
    );
  }
  const mixed = fields.filter((f) => f.type.replace(/ \| null$/, "").includes("|"));
  if (mixed.length) insights.push(`Mixed types: ${mixed.slice(0, 3).map((f) => `${f.path} is ${f.type}`).join("; ")}. Code reading these fields has to handle every type.`);
  const optional = fields.filter((f) => f.isOptional);
  if (optional.length) insights.push(`${optional.length} field${optional.length === 1 ? " is" : "s are"} missing from some array items (${optional.slice(0, 3).map((f) => f.path).join(", ")}). Treat ${optional.length === 1 ? "it" : "them"} as optional.`);
  const numericStrings = fields.filter((f) => f.format === "number in a string");
  if (numericStrings.length) insights.push(`Numbers stored as text: ${numericStrings.slice(0, 3).map((f) => f.path).join(", ")}. Convert before doing arithmetic, or "10" + "5" gives "105".`);
  if (nulls) insights.push(`${nulls} null value${nulls === 1 ? "" : "s"}: decide whether null means "unknown" or "none" and handle it explicitly.`);
  if (maxDepth > 5) insights.push(`Nested ${maxDepth} levels deep. Deep nesting makes the data harder to query; flattening may help.`);
  if (emptyContainers) insights.push(`${emptyContainers} empty object${emptyContainers === 1 ? "" : "s"} or array${emptyContainers === 1 ? "" : "s"}.`);

  const kb = (new Blob([trimmed]).size / 1024).toFixed(1);
  let overview: string;
  if (rootType === "array") {
    const arr = parsed as unknown[];
    const itemTypes = [...new Set(arr.map(typeOf))];
    overview = `A list of ${arr.length} item${arr.length === 1 ? "" : "s"} (${itemTypes.join(", ") || "empty"}), ${kb} KB. ${totalKeys} distinct field path${totalKeys === 1 ? "" : "s"}, nested up to ${maxDepth} level${maxDepth === 1 ? "" : "s"} deep.`;
  } else if (rootType === "object") {
    const top = Object.keys(parsed as object);
    overview = `An object with ${top.length} top-level field${top.length === 1 ? "" : "s"} (${top.slice(0, 6).join(", ")}${top.length > 6 ? ", …" : ""}), ${kb} KB. ${totalKeys} field path${totalKeys === 1 ? "" : "s"} in total, nested up to ${maxDepth} level${maxDepth === 1 ? "" : "s"} deep.`;
  } else {
    overview = `A single ${typeOf(parsed)} value: ${sample(parsed)}.`;
  }
  if (largestArray > 500) insights.push(`The largest array has ${largestArray.toLocaleString()} items; the first 500 were analysed.`);

  return {
    isValid: true,
    rootType,
    totalKeys,
    maxDepth,
    arrays,
    overview,
    fields: fields.slice(0, 300),
    insights,
  };
}

/** A Markdown table of the analysis, for copying and saving. */
export function jsonExplanationToMarkdown(r: JsonExplanationResult): string {
  if (!r.isValid) return `Invalid JSON: ${r.error ?? ""}`;
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  return [
    "## Overview",
    r.overview,
    "",
    "## Fields",
    "| Path | Type | Meaning | Example |",
    "| --- | --- | --- | --- |",
    ...r.fields.map(
      (f) =>
        `| ${esc(f.path)}${f.isOptional ? " (optional)" : ""} | ${esc(f.type)}${f.format ? ` (${f.format})` : ""} | ${esc(f.description)} | ${esc(f.sampleValue)} |`
    ),
    ...(r.insights.length ? ["", "## Notes", ...r.insights.map((i) => `- ${i}`)] : []),
  ].join("\n");
}
