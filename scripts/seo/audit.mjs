/**
 * Technical SEO audit of the built site.
 *
 * Reads what Firebase actually serves — the static export in `out/` plus the
 * redirect and header rules in firebase.json — and compares it with what the
 * registries say should exist (lib/seo/routes.ts). A page can look right in
 * its page.tsx and still ship without a canonical because a metadata object
 * further up replaced it, so source-level checks are not enough.
 *
 * Every issue has a stable `code`, which the node:test suite in tests/seo/
 * asserts on, and a severity: errors fail the build, warnings print.
 *
 * Used by scripts/seo-check.mjs (postbuild) and tests/seo/*.test.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadSite } from "./lib/site.mjs";

export const ORIGIN = "https://tabbench.com";
const FORBIDDEN_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "everydaytools-s.web.app", "everydaytools-s.firebaseapp.com", "www.tabbench.com"];
const SKIP_DIRS = new Set(["_next", "vendor", "pdfjs", "tesseract", "ffmpeg", "models", "__test"]);
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

/* ------------------------------------------------------------------ */
/* HTML helpers (the export is well-formed Next output)                */
/* ------------------------------------------------------------------ */
// One pass, so text that literally shows an entity ("&amp;amp;" → "&amp;")
// is not decoded twice.
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1));
    return NAMED[e.toLowerCase()] ?? m;
  });
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const all = (re, s) => [...s.matchAll(re)];
const metaName = (head, name) => all(new RegExp(`<meta name="${name}" content="([^"]*)"`, "g"), head).map((m) => decode(m[1]));
const metaProp = (head, prop) => all(new RegExp(`<meta property="${prop}" content="([^"]*)"`, "g"), head).map((m) => decode(m[1]));

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), acc);
    } else if (e.name.endsWith(".html")) acc.push(path.join(dir, e.name));
  }
  return acc;
};

/** Route a built file is served at, given Firebase `cleanUrls: true`. */
const routeOf = (dir, file) => {
  const r = "/" + path.relative(dir, file).replace(/\\/g, "/").replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
  return r.length > 1 ? r.replace(/\/$/, "") : "/";
};

function parsePage(dir, file) {
  const html = fs.readFileSync(file, "utf8");
  const [head = "", body = ""] = html.split("</head>");
  const main = (body.match(/<main\b[^>]*>([\s\S]*)<\/main>/) ?? [, body])[1];
  const jsonLdRaw = all(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, html).map((m) => m[1]);
  const jsonLd = jsonLdRaw.map((raw) => {
    try {
      return { ok: true, data: JSON.parse(raw) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  const nodes = jsonLd.filter((j) => j.ok).flatMap((j) => (j.data["@graph"] ? j.data["@graph"] : [j.data]));
  const crumbs = all(/<li data-slot="breadcrumb-item"[^>]*>([\s\S]*?)<\/li>/g, body).map((m) => text(m[1]));
  const route = routeOf(dir, file);
  return {
    file: path.relative(dir, file),
    route,
    html,
    head,
    body,
    title: (head.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1] ? decode(head.match(/<title>([\s\S]*?)<\/title>/)[1]).trim() : null,
    titles: all(/<title>/g, head).length,
    descriptions: metaName(head, "description"),
    robots: metaName(head, "robots"),
    canonicals: all(/<link rel="canonical" href="([^"]*)"/g, head).map((m) => decode(m[1])),
    charsets: all(/<meta charSet=/gi, head).length,
    viewports: metaName(head, "viewport").length,
    ogTitle: metaProp(head, "og:title")[0] ?? null,
    ogDesc: metaProp(head, "og:description")[0] ?? null,
    ogUrl: metaProp(head, "og:url")[0] ?? null,
    ogImage: metaProp(head, "og:image")[0] ?? null,
    ogImageAlt: metaProp(head, "og:image:alt")[0] ?? null,
    twCard: metaName(head, "twitter:card")[0] ?? null,
    twImage: metaName(head, "twitter:image")[0] ?? null,
    h1s: all(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g, body).map((m) => text(m[1])),
    headingLevels: all(/<h([1-6])\b/g, body).map((m) => +m[1]),
    imgs: all(/<img\b[^>]*>/g, body).map((m) => m[0]),
    links: all(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, body).map((m) => ({ href: decode(m[1]), label: text(m[2]) })),
    mainLinks: all(/<a\b[^>]*\bhref="([^"]*)"/g, main).map((m) => decode(m[1])),
    mainWords: text(main).split(" ").filter(Boolean).length,
    visibleText: text(body),
    jsonLd,
    nodes,
    crumbs,
  };
}

/* ------------------------------------------------------------------ */
/* The audit                                                           */
/* ------------------------------------------------------------------ */
export async function runAudit({ dir = path.join(ROOT, "out"), firebaseFile = path.join(ROOT, "firebase.json") } = {}) {
  if (!fs.existsSync(dir)) throw new Error(`"${dir}" not found — run \`npm run build\` first.`);
  const issues = [];
  const add = (severity, code, target, message) => issues.push({ severity, code, target, message });
  const err = (code, target, message) => add("error", code, target, message);
  const warn = (code, target, message) => add("warning", code, target, message);

  const site = await loadSite();
  const expected = site.routes.getPublicRoutes();
  const expectedByPath = new Map(expected.map((r) => [r.path, r]));
  const firebase = JSON.parse(fs.readFileSync(firebaseFile, "utf8")).hosting;
  const redirects = new Map((firebase.redirects ?? []).map((r) => [r.source, r.destination]));

  const pages = walk(dir).map((f) => parsePage(dir, f));
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  const isNoindex = (p) => p.robots.some((r) => /noindex/i.test(r));
  const indexable = pages.filter((p) => !isNoindex(p));
  const builtRoutes = new Set(pages.map((p) => p.route));

  const fileExists = (urlPath) => {
    const rel = decodeURI(urlPath.split(/[?#]/)[0]).replace(/^\//, "");
    if (!rel) return true;
    return (
      builtRoutes.has("/" + rel.replace(/\/$/, "")) ||
      fs.existsSync(path.join(dir, rel)) ||
      fs.existsSync(path.join(dir, rel + ".html")) ||
      fs.existsSync(path.join(dir, rel, "index.html"))
    );
  };

  /* ---------------- Indexability: built vs intended ---------------- */
  for (const r of expected) {
    const p = byRoute.get(r.path);
    if (!p) err("route-missing", r.path, "in the route registry but no page was built");
    else if (isNoindex(p)) err("accidental-noindex", r.path, `meant to be indexed but ships robots "${p.robots.join(", ")}"`);
  }
  for (const p of indexable) {
    if (!expectedByPath.has(p.route)) err("unexpected-indexable", p.route, "indexable page that is not in lib/seo/routes.ts (add it there, or noindex it)");
  }
  for (const p of pages.filter(isNoindex)) {
    if (/nofollow/i.test(p.robots.join(","))) warn("nofollow", p.route, "noindex page is also nofollow — links from it are not followed");
  }

  /* ---------------- Per-page metadata ---------------- */
  for (const p of indexable) {
    const self = p.route === "/" ? ORIGIN : ORIGIN + p.route;
    if (!p.title) err("title-missing", p.route, "no <title>");
    else {
      if (p.title.length > TITLE_MAX) warn("title-long", p.route, `title is ${p.title.length} chars (>${TITLE_MAX} may be cut in results)`);
      if (p.title.length < 15) warn("title-short", p.route, `title is only ${p.title.length} chars`);
      if (/\.\.\.$|…$|\| TabB\.\.\./.test(p.title)) err("title-truncated", p.route, `title is cut off: "${p.title}"`);
      if (/\|.*\|.*\|/.test(p.title)) warn("title-pipes", p.route, `title has three separators: "${p.title}"`);
    }
    if (p.titles > 1) err("title-multiple", p.route, `${p.titles} <title> elements`);

    if (!p.descriptions.length) err("description-missing", p.route, "no meta description");
    else {
      const d = p.descriptions[0];
      if (d.length < DESC_MIN) warn("description-short", p.route, `description is ${d.length} chars (<${DESC_MIN})`);
      if (d.length > DESC_MAX) warn("description-long", p.route, `description is ${d.length} chars (>${DESC_MAX} is cut off)`);
      // clampDescription() is a safety net; a clipped sentence should be rewritten at the source.
      if (/(\.\.\.|…)$/.test(d)) warn("description-clipped", p.route, "description was clipped to fit — shorten it at the source");
    }
    if (p.descriptions.length > 1) err("description-multiple", p.route, `${p.descriptions.length} meta descriptions`);

    if (!p.canonicals.length) err("canonical-missing", p.route, "no canonical");
    else {
      if (p.canonicals.length > 1) err("canonical-multiple", p.route, `${p.canonicals.length} canonical tags`);
      const c = p.canonicals[0];
      if (!c.startsWith(ORIGIN)) err("canonical-host", p.route, `canonical is not on ${ORIGIN}: ${c}`);
      if (/[?#]/.test(c)) err("canonical-query", p.route, `canonical carries a query or fragment: ${c}`);
      if (c !== self) err("canonical-not-self", p.route, `canonical ${c} is not the page's own URL ${self}`);
      if (p.ogUrl && p.ogUrl !== c) err("og-url-mismatch", p.route, `og:url ${p.ogUrl} differs from canonical ${c}`);
    }

    if (p.charsets > 1) err("head-duplicate-charset", p.route, `${p.charsets} <meta charset> tags`);
    if (p.viewports > 1) err("head-duplicate-viewport", p.route, `${p.viewports} viewport tags`);
    if (/<meta name="keywords"/.test(p.head)) warn("meta-keywords", p.route, "meta keywords tag (ignored by Google; stuffing risk)");

    if (!p.ogTitle) err("og-title-missing", p.route, "no og:title");
    if (!p.ogDesc) err("og-description-missing", p.route, "no og:description");
    if (!p.ogImage) err("og-image-missing", p.route, "no og:image");
    else {
      if (!p.ogImage.startsWith(ORIGIN + "/")) err("og-image-host", p.route, `og:image is not on ${ORIGIN}: ${p.ogImage}`);
      else if (!fileExists(p.ogImage.slice(ORIGIN.length))) err("og-image-broken", p.route, `og:image file not built: ${p.ogImage}`);
      if (!p.ogImageAlt) warn("og-image-alt", p.route, "og:image has no alt text");
    }
    if (p.twCard !== "summary_large_image") warn("twitter-card", p.route, `twitter:card is "${p.twCard}"`);
    if (!p.twImage) warn("twitter-image-missing", p.route, "no twitter:image");

    if (p.h1s.length === 0) err("h1-missing", p.route, "no <h1>");
    else if (p.h1s.length > 1) err("h1-multiple", p.route, `${p.h1s.length} <h1> elements`);
    let prev = 0;
    for (const lv of p.headingLevels) {
      if (prev && lv > prev + 1) {
        warn("heading-skip", p.route, `heading level jumps h${prev} → h${lv}`);
        break;
      }
      prev = lv;
    }

    for (const tag of p.imgs) if (!/\balt=/.test(tag)) err("img-alt-missing", p.route, `<img> without alt: ${tag.slice(0, 80)}`);

    const kind = expectedByPath.get(p.route)?.kind;
    const minWords = kind === "legal" || kind === "informational" ? 250 : 300;
    if (p.mainWords < minWords) warn("thin-content", p.route, `only ${p.mainWords} words of static HTML in <main>`);

    for (const bad of FORBIDDEN_HOSTS) {
      const re = new RegExp(`(?:href|src|content)="[^"]*//${bad.replace(/\./g, "\\.")}`, "g");
      if (re.test(p.html)) err("forbidden-host", p.route, `references ${bad} in a URL attribute`);
    }
    if (/(?:href|src|content)="http:\/\/(?!www\.w3\.org)/.test(p.head)) err("insecure-url", p.route, "an http:// URL in <head>");
  }

  /* ---------------- Structured data ---------------- */
  for (const p of indexable) {
    if (!p.jsonLd.length) warn("jsonld-missing", p.route, "no JSON-LD");
    for (const j of p.jsonLd) if (!j.ok) err("jsonld-invalid", p.route, `JSON-LD does not parse: ${j.error}`);
    if (/"(aggregateRating|review|reviewRating)"\s*:/.test(p.html)) err("jsonld-fake-rating", p.route, "rating/review markup without collected reviews");
    for (const n of p.nodes) {
      const ctx = n["@context"];
      if (ctx && ctx !== "https://schema.org") err("jsonld-context", p.route, `@context is ${ctx}`);
      const walkUrls = (v) => {
        if (typeof v === "string" && /^https?:\/\//.test(v) && FORBIDDEN_HOSTS.some((h) => v.includes(`//${h}`))) err("jsonld-host", p.route, `JSON-LD URL on a forbidden host: ${v}`);
        else if (v && typeof v === "object") Object.values(v).forEach(walkUrls);
      };
      walkUrls(n);
    }
    // Breadcrumb markup must mirror the visible trail.
    const bc = p.nodes.find((n) => n["@type"] === "BreadcrumbList");
    if (p.crumbs.length && !bc) err("breadcrumb-jsonld-missing", p.route, "visible breadcrumb without BreadcrumbList");
    if (bc) {
      const names = bc.itemListElement.map((i) => i.name);
      if (JSON.stringify(names) !== JSON.stringify(p.crumbs)) err("breadcrumb-mismatch", p.route, `JSON-LD ${JSON.stringify(names)} ≠ visible ${JSON.stringify(p.crumbs)}`);
      bc.itemListElement.forEach((it, i) => {
        if (it.position !== i + 1) err("breadcrumb-position", p.route, `position ${it.position} at index ${i}`);
        if (it.item && !String(it.item).startsWith(ORIGIN)) err("breadcrumb-url", p.route, `crumb URL off-site: ${it.item}`);
        if (it.item && !fileExists(String(it.item).slice(ORIGIN.length) || "/")) err("breadcrumb-url", p.route, `crumb URL not built: ${it.item}`);
      });
    }
    // FAQ markup must describe FAQs that are on the page.
    for (const faq of p.nodes.filter((n) => n["@type"] === "FAQPage")) {
      for (const q of faq.mainEntity ?? []) {
        if (!p.visibleText.includes(q.name.replace(/\s+/g, " ").trim())) err("faq-not-visible", p.route, `FAQ question not on the page: "${q.name}"`);
        const a = String(q.acceptedAnswer?.text ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
        if (a && !p.visibleText.includes(a)) err("faq-not-visible", p.route, `FAQ answer not on the page: "${a}…"`);
      }
    }
    const app = p.nodes.find((n) => n["@type"] === "WebApplication");
    if (app && p.h1s[0] && app.name !== p.h1s[0]) warn("app-name-h1", p.route, `WebApplication name "${app.name}" ≠ H1 "${p.h1s[0]}"`);
    const article = p.nodes.find((n) => n["@type"] === "Article");
    if (article) {
      for (const f of ["headline", "datePublished", "dateModified", "author", "image"]) if (!article[f]) err("article-field", p.route, `Article missing ${f}`);
      if (article.datePublished && article.dateModified && article.dateModified < article.datePublished) err("article-dates", p.route, "dateModified before datePublished");
    }
  }

  /* ---------------- Duplicates across pages ---------------- */
  const group = (key) => {
    const m = new Map();
    for (const p of indexable) {
      const k = key(p);
      if (k) (m.get(k) ?? m.set(k, []).get(k)).push(p.route);
    }
    return [...m].filter(([, r]) => r.length > 1);
  };
  for (const [t, r] of group((p) => p.title)) err("title-duplicate", r.join(", "), `duplicate title "${t}"`);
  for (const [d, r] of group((p) => p.descriptions[0])) warn("description-duplicate", r.join(", "), `duplicate description "${d.slice(0, 60)}…"`);
  for (const [h, r] of group((p) => p.h1s[0])) warn("h1-duplicate", r.join(", "), `duplicate H1 "${h}"`);
  for (const [c, r] of group((p) => p.canonicals[0])) err("canonical-duplicate", r.join(", "), `${r.length} pages share canonical ${c}`);

  /* ---------------- Sitemaps ---------------- */
  const sitemap = { index: null, files: [], urls: [] };
  const readXml = (name) => {
    const f = path.join(dir, name);
    if (!fs.existsSync(f)) return null;
    const xml = fs.readFileSync(f, "utf8");
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) err("sitemap-xml", name, "missing XML declaration");
    // Well-formedness where it matters: every & is an entity, tags balance.
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml.replace(/<\?[\s\S]*?\?>/g, ""))) err("sitemap-xml", name, "unescaped & in XML");
    for (const tag of ["urlset", "sitemapindex", "url", "sitemap", "loc", "lastmod"]) {
      const open = (xml.match(new RegExp(`<${tag}[\\s>]`, "g")) ?? []).length;
      const close = (xml.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
      if (open !== close) err("sitemap-xml", name, `<${tag}> opened ${open}× but closed ${close}×`);
    }
    return xml;
  };
  const indexXml = readXml("sitemap.xml");
  if (!indexXml) err("sitemap-missing", "sitemap.xml", "not generated");
  else {
    const isIndex = /<sitemapindex\b/.test(indexXml);
    sitemap.index = isIndex;
    const children = isIndex ? all(/<sitemap><loc>([^<]+)<\/loc>/g, indexXml).map((m) => m[1]) : [`${ORIGIN}/sitemap.xml`];
    if (isIndex && !children.length) err("sitemap-empty", "sitemap.xml", "index lists no sitemaps");
    for (const loc of children) {
      if (!loc.startsWith(ORIGIN + "/")) {
        err("sitemap-url-host", loc, "child sitemap not on the canonical origin");
        continue;
      }
      const name = loc.slice(ORIGIN.length + 1);
      const xml = isIndex ? readXml(name) : indexXml;
      if (!xml) {
        err("sitemap-missing", name, "listed in the index but not generated");
        continue;
      }
      const urls = all(/<url>([\s\S]*?)<\/url>/g, xml).map((m) => ({
        loc: decode((m[1].match(/<loc>([^<]*)<\/loc>/) ?? [])[1] ?? ""),
        lastmod: (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) ?? [])[1] ?? null,
        file: name,
      }));
      if (!urls.length) err("sitemap-empty", name, "sitemap has no URLs (empty sitemaps should not exist)");
      if (urls.length > 50000) err("sitemap-too-large", name, `${urls.length} URLs (limit 50,000)`);
      if (Buffer.byteLength(xml) > 50 * 1024 * 1024) err("sitemap-too-large", name, "over 50 MB");
      sitemap.files.push({ name, urls: urls.length });
      sitemap.urls.push(...urls);
    }
  }
  const seen = new Set();
  for (const u of sitemap.urls) {
    if (seen.has(u.loc)) err("sitemap-duplicate", u.loc, "listed more than once");
    seen.add(u.loc);
    let url;
    try {
      url = new URL(u.loc);
    } catch {
      err("sitemap-url-invalid", u.loc, "not a valid absolute URL");
      continue;
    }
    if (url.protocol !== "https:") err("sitemap-url-http", u.loc, "not HTTPS");
    if (url.origin !== ORIGIN) err("sitemap-url-host", u.loc, `not on ${ORIGIN}`);
    if (FORBIDDEN_HOSTS.includes(url.hostname)) err("sitemap-url-dev", u.loc, "development / preview host");
    if (url.search || url.hash) err("sitemap-url-query", u.loc, "carries a query or fragment");
    if (url.pathname !== "/" && url.pathname.endsWith("/")) err("sitemap-url-slash", u.loc, "trailing slash (Firebase redirects it)");
    const route = url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
    if (redirects.has(route)) err("sitemap-redirect", u.loc, `redirects to ${redirects.get(route)} (firebase.json)`);
    const p = byRoute.get(route);
    if (!p) err("sitemap-url-404", u.loc, "no page is built at this URL");
    else {
      if (isNoindex(p)) err("sitemap-noindex", u.loc, "page is noindex");
      if (p.canonicals[0] && p.canonicals[0] !== u.loc) err("sitemap-not-canonical", u.loc, `page canonicalises to ${p.canonicals[0]}`);
    }
    if (!u.lastmod) warn("sitemap-lastmod-missing", u.loc, "no lastmod");
    // W3C Datetime: a date, or a date and time with a timezone designator.
    else if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/.test(u.lastmod) || Number.isNaN(Date.parse(u.lastmod))) err("sitemap-lastmod-invalid", u.loc, `lastmod "${u.lastmod}" is not a W3C date`);
    else if (u.lastmod.slice(0, 10) > new Date(Date.now() + 36e5 * 36).toISOString().slice(0, 10)) err("sitemap-lastmod-future", u.loc, `lastmod ${u.lastmod} is in the future`);
  }
  for (const p of indexable) {
    const loc = p.route === "/" ? ORIGIN : ORIGIN + p.route;
    if (!seen.has(loc)) err("sitemap-omits-page", p.route, "indexable page missing from the sitemaps");
  }

  /* ---------------- robots.txt ---------------- */
  const robotsPath = path.join(dir, "robots.txt");
  const robots = { rules: [], sitemaps: [] };
  if (!fs.existsSync(robotsPath)) err("robots-missing", "robots.txt", "not generated");
  else {
    const lines = fs.readFileSync(robotsPath, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      const l = line.trim();
      if (!l || l.startsWith("#")) return;
      const m = l.match(/^(user-agent|allow|disallow|sitemap|crawl-delay)\s*:\s*(.*)$/i);
      if (!m) return err("robots-syntax", `robots.txt:${i + 1}`, `unrecognised line "${l}"`);
      const [, key, value] = m;
      if (/^sitemap$/i.test(key)) robots.sitemaps.push(value);
      else robots.rules.push({ key: key.toLowerCase(), value });
    });
    if (!robots.sitemaps.includes(`${ORIGIN}/sitemap.xml`)) err("robots-sitemap", "robots.txt", `does not reference ${ORIGIN}/sitemap.xml`);
    for (const s of robots.sitemaps) if (!s.startsWith(ORIGIN + "/")) err("robots-sitemap", "robots.txt", `sitemap URL is not absolute on ${ORIGIN}: ${s}`);
    for (const { key, value } of robots.rules) {
      if (key !== "disallow" || !value) continue;
      if (value === "/") err("robots-blocks-site", "robots.txt", "Disallow: / blocks the whole site");
      for (const needed of ["/_next/", "/icons/", "/opengraph-image", "/tools/", "/guides/", "/categories/"]) {
        if (needed.startsWith(value.replace(/\*$/, ""))) err("robots-blocks-resource", "robots.txt", `Disallow: ${value} blocks ${needed}`);
      }
    }
  }

  /* ---------------- firebase.json: redirects & headers ---------------- */
  for (const [source, dest] of redirects) {
    if (builtRoutes.has(source)) err("redirect-shadows-page", source, "a redirect source that is also a built page");
    if (redirects.has(dest)) err("redirect-chain", source, `redirects to ${dest}, which redirects again`);
    if (!builtRoutes.has(dest)) err("redirect-dead-end", source, `redirects to ${dest}, which is not built`);
  }
  const headerFor = (src) => (firebase.headers ?? []).find((h) => h.source === src)?.headers ?? [];
  if (!headerFor("**/*.txt").some((h) => h.key === "X-Robots-Tag" && /noindex/.test(h.value)))
    err("rsc-indexable", "firebase.json", "RSC .txt payloads are served without X-Robots-Tag: noindex");
  if (firebase.trailingSlash !== false || firebase.cleanUrls !== true)
    err("url-normalisation", "firebase.json", "expected cleanUrls: true and trailingSlash: false");

  /* ---------------- Internal links ---------------- */
  const inbound = new Map(indexable.map((p) => [p.route, new Set()]));
  const broken = new Map();
  const viaRedirect = new Map();
  for (const p of pages) {
    for (const { href } of p.links) {
      if (/^(mailto|tel|javascript):/i.test(href) || href.startsWith("#")) continue;
      let target;
      if (href.startsWith("/")) target = href;
      else if (href.startsWith(ORIGIN)) target = href.slice(ORIGIN.length) || "/";
      else if (/^https?:\/\//.test(href)) {
        if (FORBIDDEN_HOSTS.some((h) => href.includes(`//${h}`))) err("link-forbidden-host", p.route, `links to ${href}`);
        continue;
      } else {
        err("link-relative", p.route, `relative or malformed href "${href}"`);
        continue;
      }
      const clean = target.split(/[?#]/)[0].replace(/\/$/, "") || "/";
      if (clean !== clean.toLowerCase() && !fileExists(clean)) err("link-case", p.route, `mixed-case link ${clean}`);
      if (redirects.has(clean)) (viaRedirect.get(clean) ?? viaRedirect.set(clean, new Set()).get(clean)).add(p.route);
      else if (!fileExists(clean)) (broken.get(clean) ?? broken.set(clean, new Set()).get(clean)).add(p.route);
      else if (clean !== p.route && inbound.has(clean) && !isNoindex(p)) inbound.get(clean).add(p.route);
    }
  }
  for (const [t, from] of broken) err("link-broken", t, `linked from ${from.size} page(s) but nothing is built there (e.g. ${[...from][0]})`);
  for (const [t, from] of viaRedirect) warn("link-redirect", t, `linked from ${from.size} page(s) but redirects to ${redirects.get(t)}`);
  for (const [route, from] of inbound) {
    if (route === "/") continue;
    if (from.size === 0) err("orphan", route, "no internal links from other indexable pages — reachable only via the sitemap");
    else if (from.size <= 2) warn("weak-linking", route, `only ${from.size} inbound internal link(s)`);
  }

  /* ---------------- Duplicate-host guard ---------------- */
  const guardless = indexable.filter((p) => !/<script id="canonical-host"/.test(p.html));
  if (guardless.length) err("host-guard-missing", `${guardless.length} page(s)`, `canonical-host guard missing (e.g. ${guardless[0].route})`);
  const sample = indexable.find((p) => /<script id="canonical-host"/.test(p.html));
  if (sample) {
    const js = sample.html.match(/<script id="canonical-host"[^>]*>([\s\S]*?)<\/script>/)[1];
    const run = (hostname) => {
      let redirected = null;
      let robotsSet = null;
      const loc = { hostname, pathname: "/x", search: "", hash: "", replace: (u) => (redirected = u) };
      const doc = {
        querySelector: () => null,
        createElement: () => ({ setAttribute: (k, v) => { if (k === "content") robotsSet = v; } }),
        head: { appendChild: () => {} },
      };
      try {
        new Function("location", "document", js)(loc, doc);
      } catch (e) {
        return { threw: e.message };
      }
      return { redirected, robots: robotsSet };
    };
    for (const dup of ["everydaytools-s.web.app", "everydaytools-s.firebaseapp.com"]) {
      const r = run(dup);
      if (r.threw) err("host-guard", dup, `guard threw: ${r.threw}`);
      else if (!r.redirected?.startsWith(ORIGIN)) err("host-guard", dup, `guard does not redirect to ${ORIGIN}`);
      else if (!/noindex/.test(r.robots ?? "")) err("host-guard", dup, "guard does not apply noindex");
    }
    for (const safe of ["tabbench.com", "localhost", "127.0.0.1"]) {
      const r = run(safe);
      if (r.redirected || r.robots) err("host-guard", safe, "guard fires on a host it must leave alone");
    }
  }

  /* ---------------- Inventory & metrics ---------------- */
  const issuesFor = (route) => issues.filter((i) => i.target === route || i.target.split(", ").includes(route));
  const inventory = pages
    .map((p) => {
      const meta = expectedByPath.get(p.route);
      const loc = p.route === "/" ? ORIGIN : ORIGIN + p.route;
      const own = issuesFor(p.route);
      return {
        url: loc,
        path: p.route,
        pageType: meta?.kind ?? (isNoindex(p) ? "utility" : "unknown"),
        title: p.title,
        h1: p.h1s[0] ?? null,
        metaDescription: p.descriptions[0] ?? null,
        canonical: p.canonicals[0] ?? null,
        robots: p.robots[0] ?? "index, follow (default)",
        indexable: !isNoindex(p),
        inSitemap: seen.has(loc),
        sitemapFile: sitemap.urls.find((u) => u.loc === loc)?.file ?? null,
        lastmod: sitemap.urls.find((u) => u.loc === loc)?.lastmod ?? null,
        schema: [...new Set(p.nodes.map((n) => n["@type"]))],
        breadcrumb: p.crumbs,
        wordsInMain: p.mainWords,
        images: p.imgs.length,
        internalLinksOut: new Set(p.mainLinks.filter((h) => h.startsWith("/"))).size,
        internalLinksIn: inbound.get(p.route)?.size ?? 0,
        relatedToolLinks: new Set(p.mainLinks.filter((h) => h.startsWith("/tools/") && h !== p.route)).size,
        contentQuality: p.mainWords >= 600 ? "substantial" : p.mainWords >= 300 ? "adequate" : "thin",
        seoStatus: own.some((i) => i.severity === "error") ? "error" : own.length ? "warning" : "ok",
        issues: own.map((i) => `${i.severity}: ${i.code} — ${i.message}`),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const count = (codes) => issues.filter((i) => codes.includes(i.code)).length;
  const metrics = {
    routesAudited: pages.length,
    indexableRoutes: indexable.length,
    noindexRoutes: pages.length - indexable.length,
    uniqueTitles: new Set(indexable.map((p) => p.title).filter(Boolean)).size,
    missingTitles: count(["title-missing"]),
    duplicateTitles: count(["title-duplicate"]),
    missingDescriptions: count(["description-missing"]),
    duplicateDescriptions: count(["description-duplicate"]),
    missingH1: count(["h1-missing"]),
    multipleH1: count(["h1-multiple"]),
    duplicateH1: count(["h1-duplicate"]),
    missingCanonical: count(["canonical-missing"]),
    canonicalConflicts: count(["canonical-not-self", "canonical-duplicate", "canonical-multiple", "canonical-host", "og-url-mismatch", "sitemap-not-canonical"]),
    orphanPages: count(["orphan"]),
    weaklyLinkedPages: count(["weak-linking"]),
    brokenInternalLinks: count(["link-broken"]),
    linksThroughRedirects: count(["link-redirect"]),
    sitemapFiles: sitemap.files.length,
    sitemapUrls: sitemap.urls.length,
    sitemapErrors: issues.filter((i) => i.code.startsWith("sitemap") && i.severity === "error").length,
    robotsErrors: issues.filter((i) => i.code.startsWith("robots") && i.severity === "error").length,
    schemaErrors: issues.filter((i) => /^(jsonld|breadcrumb|faq|article)/.test(i.code) && i.severity === "error").length,
    schemaTypes: Object.fromEntries(
      [...new Set(indexable.flatMap((p) => p.nodes.map((n) => n["@type"])))]
        .sort()
        .map((t) => [t, indexable.filter((p) => p.nodes.some((n) => n["@type"] === t)).length])
    ),
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
  };

  return { issues, metrics, inventory, sitemap, robots, pages };
}
