#!/usr/bin/env node
/**
 * SEO regression guard.
 *
 * Runs against the exported `out/` directory rather than the source, because
 * that is what Firebase actually serves — a page can look correct in a page.tsx
 * and still ship without a canonical because a metadata object further up
 * replaced it. Everything here has been a real defect on this site at least
 * once: fabricated ratings, a doubled title suffix, a duplicated <h1>, and 36
 * pages that quietly lost their og:image because Next replaces `openGraph`
 * wholesale instead of merging it.
 *
 * ERRORS fail the build. WARNINGS print and pass.
 *
 * Usage: node scripts/seo-check.mjs [--dir out] [--warn-only]
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DIR = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : "out";
const WARN_ONLY = args.includes("--warn-only");
const DOMAIN = "https://tabbench.com";

const errors = [];
const warnings = [];
const err = (cat, target, msg) => errors.push({ cat, target, msg });
const warn = (cat, target, msg) => warnings.push({ cat, target, msg });

if (!fs.existsSync(DIR)) {
  console.error(`seo-check: "${DIR}" not found — run \`npm run build\` first.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Collect pages                                                       */
/* ------------------------------------------------------------------ */
const walk = (d, acc = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
};

const htmlFiles = walk(DIR);
const unescape = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

const grab = (re, h) => {
  const m = h.match(re);
  return m ? unescape(m[1]).trim() : null;
};

/** Route a built file maps to, given Firebase `cleanUrls: true`. */
const routeOf = (file) => {
  let r = "/" + path.relative(DIR, file).replace(/\\/g, "/");
  r = r.replace(/\/index\.html$/, "").replace(/\.html$/, "");
  return r === "" ? "/" : r;
};

const pages = htmlFiles.map((f) => {
  const h = fs.readFileSync(f, "utf8");
  return {
    file: path.relative(DIR, f),
    route: routeOf(f),
    html: h,
    title: grab(/<title>([\s\S]*?)<\/title>/i, h),
    desc: grab(/<meta name="description" content="([\s\S]*?)"/i, h),
    canonical: grab(/<link rel="canonical" href="([\s\S]*?)"/i, h),
    robots: grab(/<meta name="robots" content="([\s\S]*?)"/i, h),
    ogImage: grab(/<meta property="og:image" content="([\s\S]*?)"/i, h),
    ogTitle: grab(/<meta property="og:title" content="([\s\S]*?)"/i, h),
    twImage: grab(/<meta name="twitter:image" content="([\s\S]*?)"/i, h),
    h1s: (h.match(/<h1[\s>]/gi) || []).length,
    jsonLd: (h.match(/application\/ld\+json/g) || []).length,
  };
});

// The 404 pages are intentionally not indexable and are exempt from the
// uniqueness and canonical rules below.
const isErrorPage = (p) => /(^|\/)(404|_not-found)(\.html)?$/.test(p.file);
const indexable = pages.filter((p) => !isErrorPage(p));

/* ------------------------------------------------------------------ */
/* Per-page checks                                                     */
/* ------------------------------------------------------------------ */
for (const p of indexable) {
  if (!p.title) err("metadata", p.route, "missing <title>");
  else if (p.title.length > 60)
    warn("metadata", p.route, `title is ${p.title.length} chars (>60 may truncate in SERPs)`);

  if (!p.desc) err("metadata", p.route, "missing meta description");
  else if (p.desc.length < 70)
    warn("metadata", p.route, `description is ${p.desc.length} chars (<70 is thin)`);
  else if (p.desc.length > 160)
    warn("metadata", p.route, `description is ${p.desc.length} chars (>160 truncates)`);

  if (!p.canonical) err("canonical", p.route, "missing canonical");
  else {
    if (!p.canonical.startsWith(DOMAIN))
      err("canonical", p.route, `canonical is not on ${DOMAIN}: ${p.canonical}`);
    // A page canonicalising to the homepage tells Google it is a duplicate of
    // it — this deindexes the site. Only the homepage may point at the root.
    if (p.route !== "/" && p.canonical.replace(/\/$/, "") === DOMAIN)
      err("canonical", p.route, "canonical points at the homepage — this deindexes the page");
  }

  if (!p.ogImage) err("social", p.route, "missing og:image");
  if (!p.twImage) warn("social", p.route, "missing twitter:image");
  if (!p.ogTitle) err("social", p.route, "missing og:title");

  if (p.h1s === 0) err("headings", p.route, "no <h1>");
  else if (p.h1s > 1) err("headings", p.route, `${p.h1s} <h1> elements — exactly one expected`);

  if (p.jsonLd === 0) warn("structured-data", p.route, "no JSON-LD block");

  if (p.robots && /noindex/i.test(p.robots))
    err("indexing", p.route, `noindex on an indexable page: "${p.robots}"`);

  // Alt text is both an accessibility requirement and how image search reads
  // the page. A decorative image still needs alt="" to be explicitly silent.
  for (const tag of p.html.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\balt=/.test(tag))
      err("images", p.route, `<img> without alt: ${tag.slice(0, 70)}`);
  }

  // A skipped heading level (h1 straight to h3) breaks the document outline
  // screen readers and crawlers both rely on.
  const levels = [...p.html.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
  let prev = 0;
  for (const lv of levels) {
    if (prev && lv > prev + 1) {
      warn("headings", p.route, `heading level skips h${prev} -> h${lv}`);
      break;
    }
    prev = lv;
  }

  // Fabricated review markup caused a policy problem here before.
  if (/"aggregateRating"/.test(p.html))
    err("structured-data", p.route, "aggregateRating present — not backed by real reviews");

  for (const bad of ["localhost", "127.0.0.1", "everydaytools-s.web.app"]) {
    const re = new RegExp(`(?:href|content|src)="[^"]*${bad.replace(/\./g, "\\.")}`, "g");
    if (re.test(p.html))
      err("hosts", p.route, `references ${bad} in a URL attribute`);
  }
}

/* ------------------------------------------------------------------ */
/* Cross-page checks                                                   */
/* ------------------------------------------------------------------ */
const byTitle = new Map();
const byDesc = new Map();
const byCanonical = new Map();
for (const p of indexable) {
  if (p.title) (byTitle.get(p.title) ?? byTitle.set(p.title, []).get(p.title)).push(p.route);
  if (p.desc) (byDesc.get(p.desc) ?? byDesc.set(p.desc, []).get(p.desc)).push(p.route);
  if (p.canonical)
    (byCanonical.get(p.canonical) ?? byCanonical.set(p.canonical, []).get(p.canonical)).push(p.route);
}
for (const [t, routes] of byTitle) if (routes.length > 1) err("duplicates", routes.join(", "), `duplicate title: "${t}"`);
for (const [d, routes] of byDesc) if (routes.length > 1) warn("duplicates", routes.join(", "), `duplicate description: "${d.slice(0, 60)}…"`);
for (const [c, routes] of byCanonical) if (routes.length > 1) err("duplicates", routes.join(", "), `${routes.length} pages share canonical ${c}`);

/* ------------------------------------------------------------------ */
/* Sitemap                                                             */
/* ------------------------------------------------------------------ */
const sitemapPath = path.join(DIR, "sitemap.xml");
const builtRoutes = new Set(indexable.map((p) => p.route));
if (!fs.existsSync(sitemapPath)) {
  err("sitemap", "sitemap.xml", "not generated");
} else {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) err("sitemap", "sitemap.xml", "contains no URLs");

  const sitemapRoutes = new Set();
  for (const loc of locs) {
    if (!loc.startsWith(DOMAIN)) {
      err("sitemap", loc, `URL is not on ${DOMAIN}`);
      continue;
    }
    const r = loc.slice(DOMAIN.length).replace(/\/$/, "") || "/";
    sitemapRoutes.add(r);
    if (!builtRoutes.has(r)) err("sitemap", r, "listed in sitemap but no page was built");
  }
  for (const r of builtRoutes)
    if (!sitemapRoutes.has(r)) warn("sitemap", r, "page is built but absent from the sitemap (orphan)");
}

/* ------------------------------------------------------------------ */
/* Duplicate-host guard                                                */
/* ------------------------------------------------------------------ */
// Firebase serves the project on <project>.web.app AND
// <project>.firebaseapp.com and neither can be switched off, so every page has
// to carry the guard that deindexes and redirects those hosts.
//
// This does not grep for the source text — it extracts the emitted script and
// RUNS it against real hostnames. A guard that ships but never fires (an
// over-escaped regex, say) looks identical to a working one under grep.
{
  const guardless = [];
  for (const p of indexable) {
    const m = p.html.match(/<script id="canonical-host"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) guardless.push(p.route);
  }
  if (guardless.length)
    err("hosts", `${guardless.length} page(s)`, `canonical-host guard missing (e.g. ${guardless[0]})`);

  const sample = indexable.find((p) => /<script id="canonical-host"/.test(p.html));
  if (sample) {
    const js = sample.html.match(/<script id="canonical-host"[^>]*>([\s\S]*?)<\/script>/)[1];
    const run = (hostname) => {
      let redirected = null;
      let robots = null;
      const loc = { hostname, pathname: "/x", search: "", hash: "", replace: (u) => (redirected = u) };
      const doc = {
        querySelector: () => null,
        createElement: () => ({ setAttribute: (k, v) => { if (k === "content") robots = v; } }),
        head: { appendChild: () => {} },
      };
      try { new Function("location", "document", js)(loc, doc); }
      catch (e) { return { threw: e.message }; }
      return { redirected, robots };
    };

    for (const dup of ["everydaytools-s.web.app", "everydaytools-s.firebaseapp.com"]) {
      const r = run(dup);
      if (r.threw) err("hosts", dup, `guard threw: ${r.threw}`);
      else if (!r.redirected) err("hosts", dup, "guard does not redirect this duplicate host");
      else if (!/^https:\/\/tabbench\.com/.test(r.redirected))
        err("hosts", dup, `guard redirects to ${r.redirected}`);
      else if (!/noindex/.test(r.robots ?? "")) err("hosts", dup, "guard does not apply noindex");
    }
    // The critical direction: it must NEVER fire on production or local dev.
    for (const safe of ["tabbench.com", "www.tabbench.com", "localhost", "127.0.0.1"]) {
      const r = run(safe);
      if (r.redirected || r.robots)
        err("hosts", safe, `guard fires on a host it must leave alone (redirect=${r.redirected}, robots=${r.robots})`);
    }
  }
}

if (!fs.existsSync(path.join(DIR, "robots.txt"))) {
  err("robots", "robots.txt", "not generated");
} else {
  const txt = fs.readFileSync(path.join(DIR, "robots.txt"), "utf8");
  if (!txt.includes(`${DOMAIN}/sitemap.xml`)) err("robots", "robots.txt", "does not advertise the sitemap");
  if (/^Disallow:\s*\/\s*$/m.test(txt)) err("robots", "robots.txt", "disallows the whole site");
}

/* ------------------------------------------------------------------ */
/* Internal links                                                      */
/* ------------------------------------------------------------------ */
const assetExists = (r) => {
  const rel = r.replace(/^\//, "");
  return (
    builtRoutes.has(r) ||
    fs.existsSync(path.join(DIR, rel)) ||
    fs.existsSync(path.join(DIR, rel + ".html")) ||
    fs.existsSync(path.join(DIR, rel, "index.html"))
  );
};
const broken = new Map();
const inbound = new Map(indexable.map((p) => [p.route, new Set()]));
for (const p of pages) {
  for (const m of p.html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const target = m[1].replace(/\/$/, "") || "/";
    if (!assetExists(target)) {
      if (!broken.has(target)) broken.set(target, new Set());
      broken.get(target).add(p.route);
      continue;
    }
    // Self-links (a page's own canonical nav entry) are not inbound links.
    if (target !== p.route && inbound.has(target)) inbound.get(target).add(p.route);
  }
}
for (const [target, from] of broken)
  err("links", target, `linked from ${from.size} page(s) but no such route (e.g. ${[...from][0]})`);

// An orphan is reachable only from the sitemap. Crawlers discover and weight
// pages through links, so a page nothing links to is effectively invisible.
for (const [route, from] of inbound) {
  if (from.size === 0) err("orphans", route, "no inbound internal links — reachable only via the sitemap");
  else if (from.size <= 2) warn("orphans", route, `only ${from.size} inbound internal link(s)`);
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */
const group = (list) => {
  const m = new Map();
  for (const i of list) (m.get(i.cat) ?? m.set(i.cat, []).get(i.cat)).push(i);
  return m;
};
const print = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label} (${list.length})`);
  for (const [cat, items] of group(list)) {
    console.log(`  ${cat}`);
    for (const i of items.slice(0, 12)) console.log(`    - ${i.target}: ${i.msg}`);
    if (items.length > 12) console.log(`    … and ${items.length - 12} more`);
  }
};

// Coverage summary: not pass/fail, but the number that shows a regression at
// a glance when a page type silently loses its schema.
const schemaTypes = new Map();
for (const p of indexable) {
  for (const m of p.html.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)) {
    const t = m[1];
    if (!schemaTypes.has(t)) schemaTypes.set(t, new Set());
    schemaTypes.get(t).add(p.route);
  }
}

console.log(`\nSEO check — ${indexable.length} indexable pages in "${DIR}"`);
const cov = [...schemaTypes.entries()]
  .filter(([t]) => ["WebApplication", "Article", "CollectionPage", "FAQPage", "BreadcrumbList", "WebSite", "Organization"].includes(t))
  .sort((a, b) => b[1].size - a[1].size)
  .map(([t, s]) => `${t} ${s.size}`)
  .join(" · ");
if (cov) console.log(`schema coverage: ${cov}`);
print("WARNINGS", warnings);
print("ERRORS", errors);

if (!errors.length && !warnings.length) console.log("\nNo issues found.");
else console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length && !WARN_ONLY) {
  console.error("\nSEO check failed. Fix the errors above, or re-run with --warn-only.");
  process.exit(1);
}
