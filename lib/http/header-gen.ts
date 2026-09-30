/**
 * The HTTP Header Generator: recipes (security headers, CORS, caching, CSP,
 * downloads) that produce a header list, and renderers that write that list
 * as configuration for the common servers and hosts. Recipes only emit
 * values that are valid in current browsers; options that are risky or
 * pointless come with a warning rather than silently being accepted.
 */

export interface GeneratedHeader {
  name: string;
  value: string;
}

export interface Recipe {
  headers: GeneratedHeader[];
  warnings: string[];
}

/* --------------------------------------------------------------- security */

export interface SecurityOptions {
  hsts: boolean;
  hstsMaxAge: number;
  hstsSubdomains: boolean;
  hstsPreload: boolean;
  nosniff: boolean;
  frame: "DENY" | "SAMEORIGIN" | "off";
  referrer: string;
  /** Features to switch off in Permissions-Policy. */
  disabledFeatures: string[];
  coop: "off" | "same-origin" | "same-origin-allow-popups" | "unsafe-none";
  corp: "off" | "same-origin" | "same-site" | "cross-origin";
  coep: "off" | "require-corp" | "credentialless";
}

export const DEFAULT_SECURITY: SecurityOptions = {
  hsts: true,
  hstsMaxAge: 63072000,
  hstsSubdomains: true,
  hstsPreload: false,
  nosniff: true,
  frame: "SAMEORIGIN",
  referrer: "strict-origin-when-cross-origin",
  disabledFeatures: ["camera", "microphone", "geolocation", "payment", "usb"],
  coop: "same-origin",
  corp: "off",
  coep: "off",
};

export const REFERRER_POLICIES = [
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
];

export const PERMISSION_FEATURES = ["camera", "microphone", "geolocation", "payment", "usb", "accelerometer", "gyroscope", "magnetometer", "midi", "fullscreen", "browsing-topics", "display-capture", "clipboard-read", "bluetooth"];

export function securityRecipe(o: SecurityOptions): Recipe {
  const headers: GeneratedHeader[] = [];
  const warnings: string[] = [];
  if (o.hsts) {
    const parts = [`max-age=${Math.max(0, Math.floor(o.hstsMaxAge))}`];
    if (o.hstsSubdomains) parts.push("includeSubDomains");
    if (o.hstsPreload) parts.push("preload");
    headers.push({ name: "Strict-Transport-Security", value: parts.join("; ") });
    if (o.hstsPreload && (o.hstsMaxAge < 31536000 || !o.hstsSubdomains)) warnings.push("Preloading requires max-age of at least 31536000 (1 year) and includeSubDomains. Submitting a site to the preload list is hard to undo: test with a short max-age first.");
    if (o.hstsMaxAge > 0 && o.hstsMaxAge < 15768000) warnings.push("A max-age under 6 months gives little protection. Increase it once HTTPS works everywhere on the site.");
    if (o.hstsSubdomains) warnings.push("includeSubDomains forces HTTPS on every subdomain. Make sure none of them is HTTP-only before you enable it.");
  }
  if (o.nosniff) headers.push({ name: "X-Content-Type-Options", value: "nosniff" });
  if (o.frame !== "off") headers.push({ name: "X-Frame-Options", value: o.frame });
  if (o.referrer) headers.push({ name: "Referrer-Policy", value: o.referrer });
  if (o.disabledFeatures.length) headers.push({ name: "Permissions-Policy", value: o.disabledFeatures.map((f) => `${f}=()`).join(", ") });
  if (o.coop !== "off") headers.push({ name: "Cross-Origin-Opener-Policy", value: o.coop });
  if (o.corp !== "off") headers.push({ name: "Cross-Origin-Resource-Policy", value: o.corp });
  if (o.coep !== "off") {
    headers.push({ name: "Cross-Origin-Embedder-Policy", value: o.coep });
    warnings.push("Cross-Origin-Embedder-Policy blocks every cross-origin image, script and iframe that does not opt in (via CORS or CORP). Enable it only if you need cross-origin isolation, and test the whole site.");
  }
  if (o.coop === "same-origin") warnings.push("Cross-Origin-Opener-Policy: same-origin breaks popups that need window.opener, such as some OAuth and payment pop-up flows.");
  if (o.frame !== "off") warnings.push("X-Frame-Options is superseded by CSP frame-ancestors. Sending both is fine and covers older browsers.");
  return { headers, warnings };
}

/* --------------------------------------------------------------------- CORS */

export interface CorsOptions {
  origin: string;
  methods: string[];
  allowHeaders: string;
  exposeHeaders: string;
  credentials: boolean;
  maxAge: number;
}

export const DEFAULT_CORS: CorsOptions = {
  origin: "https://app.example.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: "Content-Type, Authorization",
  exposeHeaders: "",
  credentials: false,
  maxAge: 600,
};

export function corsRecipe(o: CorsOptions): Recipe {
  const headers: GeneratedHeader[] = [];
  const warnings: string[] = [];
  const origin = o.origin.trim();
  if (origin) headers.push({ name: "Access-Control-Allow-Origin", value: origin });
  if (o.methods.length) headers.push({ name: "Access-Control-Allow-Methods", value: o.methods.join(", ") });
  if (o.allowHeaders.trim()) headers.push({ name: "Access-Control-Allow-Headers", value: o.allowHeaders.trim() });
  if (o.exposeHeaders.trim()) headers.push({ name: "Access-Control-Expose-Headers", value: o.exposeHeaders.trim() });
  if (o.credentials) headers.push({ name: "Access-Control-Allow-Credentials", value: "true" });
  if (o.maxAge > 0) headers.push({ name: "Access-Control-Max-Age", value: String(Math.floor(o.maxAge)) });
  if (origin && origin !== "*") headers.push({ name: "Vary", value: "Origin" });

  if (origin === "*" && o.credentials) warnings.push("Access-Control-Allow-Origin: * cannot be combined with credentials. Browsers reject the response. Name the exact origin instead.");
  if (origin === "*") warnings.push("* lets every website read these responses. That is right for public data, wrong for anything tied to a user.");
  if (origin && origin !== "*" && !/^https?:\/\/[^/\s]+$/.test(origin) && origin !== "null") warnings.push("An origin is scheme + host (+ port) with no path or trailing slash, such as https://app.example.com.");
  if (origin === "null") warnings.push("Allowing the null origin is almost as open as *: sandboxed iframes and local files send it.");
  if (/,/.test(origin)) warnings.push("Access-Control-Allow-Origin accepts a single origin, not a list. To support several, your server must check the Origin request header against an allow-list and echo back the match (with Vary: Origin).");
  if (o.allowHeaders.trim() === "*" && o.credentials) warnings.push("With credentials, * in Allow-Headers is treated as the literal header name \"*\". List the headers.");
  if (o.maxAge > 7200) warnings.push("Browsers cap the preflight cache: Chrome at 2 hours, Firefox at 24 hours. Larger values are reduced.");
  warnings.push("These headers must be sent on the actual response and on the answer to the OPTIONS preflight request (status 204 or 200, no redirect, no authentication).");
  return { headers, warnings };
}

/* ------------------------------------------------------------------ caching */

export interface CacheOptions {
  scope: "public" | "private" | "unset";
  maxAge: number | null;
  sMaxAge: number | null;
  noCache: boolean;
  noStore: boolean;
  mustRevalidate: boolean;
  immutable: boolean;
  staleWhileRevalidate: number | null;
  staleIfError: number | null;
}

export const CACHE_PRESETS: { id: string; label: string; description: string; options: CacheOptions }[] = [
  { id: "static", label: "Versioned static files", description: "JS, CSS and images whose file name changes when the content does (app.4f3a2.js).", options: { scope: "public", maxAge: 31536000, sMaxAge: null, noCache: false, noStore: false, mustRevalidate: false, immutable: true, staleWhileRevalidate: null, staleIfError: null } },
  { id: "html", label: "HTML pages", description: "Always check with the server, but reuse the stored copy when it has not changed (304).", options: { scope: "unset", maxAge: null, sMaxAge: null, noCache: true, noStore: false, mustRevalidate: false, immutable: false, staleWhileRevalidate: null, staleIfError: null } },
  { id: "cdn", label: "CDN-friendly content", description: "Short browser cache, longer CDN cache, serve stale while refreshing in the background.", options: { scope: "public", maxAge: 60, sMaxAge: 600, noCache: false, noStore: false, mustRevalidate: false, immutable: false, staleWhileRevalidate: 86400, staleIfError: 86400 } },
  { id: "private-api", label: "Private API response", description: "User-specific data: only the user's browser may keep it, and it must be rechecked.", options: { scope: "private", maxAge: null, sMaxAge: null, noCache: true, noStore: false, mustRevalidate: false, immutable: false, staleWhileRevalidate: null, staleIfError: null } },
  { id: "no-store", label: "Never store", description: "Sensitive pages: banking, tokens, personal data.", options: { scope: "unset", maxAge: null, sMaxAge: null, noCache: false, noStore: true, mustRevalidate: false, immutable: false, staleWhileRevalidate: null, staleIfError: null } },
  { id: "images", label: "Images and fonts", description: "Rarely change; a month with revalidation afterwards.", options: { scope: "public", maxAge: 2592000, sMaxAge: null, noCache: false, noStore: false, mustRevalidate: false, immutable: false, staleWhileRevalidate: null, staleIfError: null } },
];

export function cacheRecipe(o: CacheOptions): Recipe {
  const d: string[] = [];
  const warnings: string[] = [];
  if (o.noStore) d.push("no-store");
  else {
    if (o.scope !== "unset") d.push(o.scope);
    if (o.noCache) d.push("no-cache");
    if (o.maxAge !== null && o.maxAge >= 0) d.push(`max-age=${Math.floor(o.maxAge)}`);
    if (o.sMaxAge !== null && o.sMaxAge >= 0) d.push(`s-maxage=${Math.floor(o.sMaxAge)}`);
    if (o.mustRevalidate) d.push("must-revalidate");
    if (o.immutable) d.push("immutable");
    if (o.staleWhileRevalidate !== null && o.staleWhileRevalidate > 0) d.push(`stale-while-revalidate=${Math.floor(o.staleWhileRevalidate)}`);
    if (o.staleIfError !== null && o.staleIfError > 0) d.push(`stale-if-error=${Math.floor(o.staleIfError)}`);
  }
  if (o.noStore && (o.maxAge || o.noCache || o.immutable)) warnings.push("no-store overrides everything else, so only no-store was written.");
  if (!o.noStore && o.noCache && o.maxAge) warnings.push("no-cache with max-age is contradictory: no-cache makes every reuse revalidate, so max-age has no effect. Remove one.");
  if (!o.noStore && o.immutable && (o.maxAge ?? 0) < 86400) warnings.push("immutable only helps with a long max-age. Use it only for files whose name changes with their content.");
  if (!o.noStore && o.scope === "private" && o.sMaxAge !== null) warnings.push("s-maxage is for shared caches, which private forbids. It is ignored.");
  if (!d.length) warnings.push("Choose at least one directive.");
  if (!o.noStore && o.maxAge !== null && o.maxAge > 31536000) warnings.push("Caches treat anything over one year as one year (RFC 9111).");
  return { headers: d.length ? [{ name: "Cache-Control", value: d.join(", ") }] : [], warnings };
}

/* ---------------------------------------------------------------------- CSP */

export const CSP_DIRECTIVES = [
  { name: "default-src", help: "Fallback for every fetch directive that is not set." },
  { name: "script-src", help: "JavaScript sources." },
  { name: "style-src", help: "Stylesheets." },
  { name: "img-src", help: "Images and favicons." },
  { name: "font-src", help: "Web fonts." },
  { name: "connect-src", help: "fetch, XHR, WebSocket and EventSource targets." },
  { name: "media-src", help: "Audio and video." },
  { name: "object-src", help: "Plugins such as <object> and <embed>. Set to 'none'." },
  { name: "frame-src", help: "What the page may embed in iframes." },
  { name: "frame-ancestors", help: "Who may embed this page (replaces X-Frame-Options)." },
  { name: "base-uri", help: "Allowed values of <base href>." },
  { name: "form-action", help: "Where forms may submit." },
  { name: "worker-src", help: "Web Workers and service workers." },
  { name: "manifest-src", help: "Web app manifests." },
] as const;

export type CspValues = Record<string, string>;

export const CSP_PRESETS: { id: string; label: string; description: string; values: CspValues; upgrade: boolean }[] = [
  { id: "strict-self", label: "Same origin only", description: "Everything comes from your own domain. The simplest strong policy.", upgrade: true, values: { "default-src": "'self'", "img-src": "'self' data:", "object-src": "'none'", "base-uri": "'self'", "form-action": "'self'", "frame-ancestors": "'self'" } },
  { id: "nonce", label: "Nonce-based scripts", description: "Only scripts carrying a per-response nonce run. Replace the nonce placeholder in your server.", upgrade: true, values: { "default-src": "'self'", "script-src": "'nonce-{RANDOM}' 'strict-dynamic'", "style-src": "'self' 'unsafe-inline'", "img-src": "'self' data: https:", "object-src": "'none'", "base-uri": "'none'", "frame-ancestors": "'self'", "form-action": "'self'" } },
  { id: "static-site", label: "Static site with analytics and fonts", description: "A typical marketing site using Google Fonts and Google Analytics.", upgrade: true, values: { "default-src": "'self'", "script-src": "'self' https://www.googletagmanager.com", "style-src": "'self' https://fonts.googleapis.com 'unsafe-inline'", "font-src": "'self' https://fonts.gstatic.com", "img-src": "'self' data: https://www.google-analytics.com", "connect-src": "'self' https://www.google-analytics.com", "object-src": "'none'", "base-uri": "'self'", "frame-ancestors": "'self'" } },
  { id: "api", label: "JSON API (no content)", description: "For endpoints that only return data: nothing may load or run.", upgrade: false, values: { "default-src": "'none'", "frame-ancestors": "'none'" } },
];

export function cspRecipe(values: CspValues, opts: { upgrade: boolean; reportOnly: boolean; reportUri: string }): Recipe {
  const parts: string[] = [];
  const warnings: string[] = [];
  for (const d of CSP_DIRECTIVES) {
    const v = (values[d.name] ?? "").trim().replace(/\s+/g, " ");
    if (v) parts.push(`${d.name} ${v}`);
  }
  if (opts.upgrade) parts.push("upgrade-insecure-requests");
  if (opts.reportUri.trim()) parts.push(`report-uri ${opts.reportUri.trim()}`);
  const script = values["script-src"] || values["default-src"] || "";
  if (/'unsafe-inline'/.test(script) && !/'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(script)) warnings.push("'unsafe-inline' in script-src allows injected inline scripts, which defeats most of a CSP's XSS protection. Prefer nonces or hashes.");
  if (/'unsafe-eval'/.test(script)) warnings.push("'unsafe-eval' allows eval(), new Function() and similar. Avoid it if you can.");
  if (/(^|\s)\*(\s|$)/.test(script) || /(^|\s)(https?:|data:)(\s|$)/.test(script)) warnings.push("A wildcard or bare scheme in script-src lets script load from anywhere. List the hosts you need.");
  if (!values["default-src"]?.trim() && !values["script-src"]?.trim()) warnings.push("Without default-src or script-src, scripts are not restricted at all.");
  if (!values["object-src"]?.trim() && !/'none'/.test(values["default-src"] ?? "")) warnings.push("Set object-src 'none' to block legacy plugins.");
  if (!values["frame-ancestors"]?.trim()) warnings.push("Add frame-ancestors to control who can embed the page. It is not covered by default-src.");
  if (/\{RANDOM\}/.test(Object.values(values).join(" "))) warnings.push("Replace {RANDOM} with a fresh, unguessable value on every response (at least 128 bits, Base64), and put the same value in each inline <script nonce=\"…\">.");
  if (opts.reportOnly) warnings.push("Report-only mode reports violations without blocking anything. Switch to Content-Security-Policy when the reports are clean.");
  if (!parts.length) return { headers: [], warnings: ["Add at least one directive."] };
  return { headers: [{ name: opts.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: parts.join("; ") }], warnings };
}

/* ---------------------------------------------------------------- download */

export interface DownloadOptions {
  disposition: "inline" | "attachment";
  filename: string;
  contentType: string;
  nosniff: boolean;
}

/** Content-Disposition with both an ASCII fallback filename and an RFC 8187 UTF-8 filename*. */
export function contentDisposition(type: "inline" | "attachment", filename: string): string {
  if (!filename) return type;
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const needsStar = /[^\x20-\x7e]/.test(filename) || /["\\]/.test(filename);
  const star = encodeURIComponent(filename).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  return `${type}; filename="${ascii}"${needsStar ? `; filename*=UTF-8''${star}` : ""}`;
}

export function downloadRecipe(o: DownloadOptions): Recipe {
  const headers: GeneratedHeader[] = [];
  const warnings: string[] = [];
  if (o.contentType.trim()) headers.push({ name: "Content-Type", value: o.contentType.trim() });
  headers.push({ name: "Content-Disposition", value: contentDisposition(o.disposition, o.filename.trim()) });
  if (o.nosniff) headers.push({ name: "X-Content-Type-Options", value: "nosniff" });
  if (/[/\\]/.test(o.filename)) warnings.push("File names with / or \\ are stripped to the last segment by browsers. Keep it a plain name.");
  if (o.disposition === "inline" && /^text\/html/i.test(o.contentType)) warnings.push("Serving user-uploaded HTML inline on your own domain is an XSS risk. Use attachment or a separate domain for uploads.");
  if (/[^\x20-\x7e]/.test(o.filename)) warnings.push("The name has non-ASCII characters, so both filename= (ASCII fallback) and filename*= (UTF-8, RFC 8187) are written.");
  return { headers, warnings };
}

/* ----------------------------------------------------------------- render */

export type Target = "raw" | "nginx" | "apache" | "caddy" | "express" | "nextjs" | "netlify" | "vercel" | "firebase" | "iis";

export const TARGETS: { id: Target; label: string; file: string }[] = [
  { id: "raw", label: "Raw headers", file: "" },
  { id: "nginx", label: "Nginx", file: "nginx.conf (server or location block)" },
  { id: "apache", label: "Apache", file: ".htaccess or httpd.conf (needs mod_headers)" },
  { id: "caddy", label: "Caddy", file: "Caddyfile" },
  { id: "express", label: "Express / Node.js", file: "app.js" },
  { id: "nextjs", label: "Next.js", file: "next.config.js" },
  { id: "netlify", label: "Netlify / Cloudflare Pages", file: "_headers" },
  { id: "vercel", label: "Vercel", file: "vercel.json" },
  { id: "firebase", label: "Firebase Hosting", file: "firebase.json" },
  { id: "iis", label: "IIS", file: "web.config" },
];

const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export function renderHeaders(headers: GeneratedHeader[], target: Target): { code: string; notes: string[] } {
  const notes: string[] = [];
  if (!headers.length) return { code: "", notes };
  switch (target) {
    case "raw":
      return { code: headers.map((h) => `${h.name}: ${h.value}`).join("\n"), notes };
    case "nginx":
      notes.push('"always" adds the header to error responses (4xx, 5xx) too. Nginx drops add_header lines from outer blocks when an inner block defines its own, so repeat them there.');
      return { code: headers.map((h) => `add_header ${h.name} ${q(h.value)} always;`).join("\n"), notes };
    case "apache":
      notes.push("Uses mod_headers: enable it with a2enmod headers (Debian/Ubuntu). \"always\" also covers error responses.");
      return { code: `<IfModule mod_headers.c>\n${headers.map((h) => `  Header always set ${h.name} ${q(h.value)}`).join("\n")}\n</IfModule>`, notes };
    case "caddy":
      return { code: `header {\n${headers.map((h) => `  ${h.name} ${q(h.value)}`).join("\n")}\n}`, notes };
    case "express":
      notes.push("Place it before your routes so every response gets the headers. The helmet package sets many security headers with sensible defaults if you'd rather not write them by hand.");
      return { code: `app.use((req, res, next) => {\n${headers.map((h) => `  res.setHeader(${jsq(h.name)}, ${jsq(h.value)});`).join("\n")}\n  next();\n});`, notes };
    case "nextjs":
      notes.push("headers() is applied by the Next.js server. It is ignored when the site is exported as static HTML (output: 'export'); set the headers on your host instead.");
      return {
        code: `module.exports = {\n  async headers() {\n    return [\n      {\n        source: '/(.*)',\n        headers: [\n${headers.map((h) => `          { key: ${jsq(h.name)}, value: ${jsq(h.value)} },`).join("\n")}\n        ],\n      },\n    ];\n  },\n};`,
        notes,
      };
    case "netlify":
      return { code: `/*\n${headers.map((h) => `  ${h.name}: ${h.value}`).join("\n")}`, notes };
    case "vercel":
      return { code: JSON.stringify({ headers: [{ source: "/(.*)", headers: headers.map((h) => ({ key: h.name, value: h.value })) }] }, null, 2), notes };
    case "firebase":
      notes.push("Goes inside the hosting object of firebase.json. Deploy with firebase deploy --only hosting.");
      return { code: JSON.stringify({ hosting: { headers: [{ source: "**", headers: headers.map((h) => ({ key: h.name, value: h.value })) }] } }, null, 2), notes };
    case "iis":
      return {
        code: `<configuration>\n  <system.webServer>\n    <httpProtocol>\n      <customHeaders>\n${headers.map((h) => `        <add name="${xml(h.name)}" value="${xml(h.value)}" />`).join("\n")}\n      </customHeaders>\n    </httpProtocol>\n  </system.webServer>\n</configuration>`,
        notes,
      };
  }
}

const jsq = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
