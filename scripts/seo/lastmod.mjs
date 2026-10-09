#!/usr/bin/env node
/**
 * Keeps lib/seo/lastmod.json — the per-URL <lastmod> the sitemaps publish —
 * honest.
 *
 * Every public URL gets a fingerprint of the things that make up THAT page:
 *   - its data: the tool's registry entry and long-form copy, the guide, the
 *     category's copy and tool list;
 *   - its own source: the tool component (plus the domain modules it imports
 *     directly, e.g. lib/regex for the Regex Tester), or the page file for
 *     static pages.
 * Shared templates (ToolShell, the layout, header, footer) are deliberately
 * NOT part of any fingerprint: a spacing tweak in the footer is not a content
 * change to 130 pages, and claiming it is teaches Google to ignore lastmod.
 *
 * A URL's date moves only when its fingerprint changes. Nothing is bumped just
 * because a build ran.
 *
 *   node scripts/seo/lastmod.mjs              update changed URLs to today (runs in prebuild)
 *   node scripts/seo/lastmod.mjs --check      exit 1 if the manifest is stale; writes nothing
 *   node scripts/seo/lastmod.mjs --bootstrap  rebuild every date from git history
 *   node scripts/seo/lastmod.mjs --accept [/path-prefix …]
 *        record new fingerprints but KEEP the dates — for refactors that
 *        changed code but not what the page says (all URLs, or those under
 *        the given prefixes)
 *
 * Fields that never render as page content (search keywords and aliases,
 * <title>/meta description, a guide's publish date) are left out of the
 * fingerprints: rewording a meta description is not a content change.
 *
 * SEO_TODAY=YYYY-MM-DD overrides "today" (reproducible builds).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, importFrom, loadSite } from "./lib/site.mjs";

const MANIFEST = path.join(ROOT, "lib/seo/lastmod.json");
const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const BOOTSTRAP = args.has("--bootstrap");
const ACCEPT = args.has("--accept");
const acceptPrefixes = process.argv.slice(2).filter((a) => a.startsWith("/"));
const accepts = (p) => ACCEPT && (!acceptPrefixes.length || acceptPrefixes.some((pre) => p === pre || p.startsWith(pre.replace(/\/$/, "") + "/")));
const today = process.env.SEO_TODAY || new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 }).trim();
const readFile = (rel) => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Source files that belong to one tool                                */
/* ------------------------------------------------------------------ */
const SHARED = [
  /^lib\/(utils|analytics|firebase|recaptcha|contact)(\.|\/)/,
  /^lib\/(hooks|history|tools|seo)\//,
  /^components\/(ui|tool|layout|search|home)\//,
  /^components\/[^/]+\.tsx$/, // top-level shared components (AdSlot, ToolShell, …)
];

function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = spec.slice(2);
  else if (spec.startsWith(".")) base = path.posix.join(path.posix.dirname(fromFile), spec);
  else return null;
  for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    if (fs.existsSync(path.join(ROOT, base + ext)) && fs.statSync(path.join(ROOT, base + ext)).isFile()) return base + ext;
  }
  return null;
}

/** slug → [component file, plus the domain modules it imports directly]. */
function toolSourceFiles() {
  const loaders = readFile("components/tool/tool-loaders.tsx") ?? "";
  const fileOf = new Map(
    [...loaders.matchAll(/const (\w+) = dynamic\(\(\) => import\("@\/(components\/tools\/\w+)"\)/g)].map((m) => [m[1], m[2]])
  );
  const out = new Map();
  for (const m of loaders.matchAll(/case "([a-z0-9-]+)":\s*return <(\w+)/g)) {
    const comp = resolveImport(`@/${fileOf.get(m[2]) ?? ""}`, "x");
    if (!comp) continue;
    const files = new Set([comp]);
    const src = readFile(comp) ?? "";
    for (const im of src.matchAll(/from "([^"]+)"/g)) {
      const f = resolveImport(im[1], comp);
      if (f && !SHARED.some((re) => re.test(f))) files.add(f);
    }
    out.set(m[1], [...files].sort());
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Data fingerprints — works on the working tree and on git snapshots  */
/* ------------------------------------------------------------------ */
/** Drops fields that do not render as page content. */
const NOT_CONTENT = ["keywords", "aliases", "metaTitle", "metaDescription", "published", "isPopular"];
const visible = (o) => (o && typeof o === "object" ? Object.fromEntries(Object.entries(o).filter(([k]) => !NOT_CONTENT.includes(k))) : o);

/** path → JSON string of the data that page renders. Tolerates old data shapes. */
function dataParts({ registry, content, categoryContent, guides, pairs }) {
  const parts = new Map();
  const tools = Object.values(registry?.TOOLS_REGISTRY ?? {});
  const cats = registry?.TOOL_CATEGORIES ?? [];
  const guideList = guides?.GUIDES ?? [];
  const toolContent = content?.TOOL_CONTENT ?? {};
  const catContent = categoryContent?.CATEGORY_CONTENT ?? {};
  const brief = (t) => ({ slug: t.slug, name: t.name, tagline: t.tagline ?? t.description, category: t.category });

  for (const t of tools) {
    const entry = visible(t);
    const linkedGuides = guideList.filter((g) => g.toolSlug === t.slug).map((g) => [g.slug, g.title]);
    parts.set(`/tools/${t.slug}`, JSON.stringify({ entry, content: toolContent[t.slug] ?? null, linkedGuides }));
  }
  for (const c of cats) {
    const inCat = tools.filter((t) => t.category === c.id).map(brief);
    if (!inCat.length) continue;
    parts.set(`/categories/${c.id}`, JSON.stringify({ c, content: visible(catContent[c.id]) ?? null, tools: inCat }));
  }
  for (const g of guideList) parts.set(`/guides/${g.slug}`, JSON.stringify(visible(g)));
  // Retired /convert pages: only old git snapshots still have pairs.ts.
  for (const p of pairs?.CURRENCY_PAIRS ?? []) parts.set(`/convert/${p.slug}`, JSON.stringify(visible(p)));

  // Hub pages list other pages; their data is the list they render.
  parts.set("/", JSON.stringify({
    popular: registry?.POPULAR_TOOL_SLUGS, fresh: registry?.NEW_TOOL_SLUGS, gems: registry?.HIDDEN_GEM_SLUGS,
    cats: cats.map((c) => [c.id, c.name, c.description]), count: tools.length,
  }));
  parts.set("/tools", JSON.stringify({ tools: tools.map(brief), cats: cats.map((c) => [c.id, c.name]) }));
  parts.set("/categories", JSON.stringify(cats.map((c) => [c.id, c.name, c.description, c.popular])));
  parts.set("/guides", JSON.stringify(guideList.map((g) => [g.slug, g.title, g.metaDescription])));
  parts.set("/about", JSON.stringify(tools.map((t) => [t.slug, t.privacy])));
  return parts;
}

/* ------------------------------------------------------------------ */
/* Current fingerprints                                                */
/* ------------------------------------------------------------------ */
const site = await loadSite();
const routes = site.routes.getPublicRoutes();
const data = dataParts(site);
const toolFiles = toolSourceFiles();

const current = new Map();
for (const r of routes) {
  const files = r.sourceFiles ?? (r.path.startsWith("/tools/") ? toolFiles.get(r.path.slice(7)) ?? [] : []);
  const fileHashes = Object.fromEntries(files.map((f) => [f, sha(readFile(f) ?? "")]));
  current.set(r.path, {
    files,
    fingerprint: sha(JSON.stringify({ data: sha(data.get(r.path) ?? ""), files: fileHashes })),
  });
}

/* ------------------------------------------------------------------ */
/* Bootstrap: real dates from git history                              */
/* ------------------------------------------------------------------ */
async function datesFromHistory() {
  const DATA_FILES = [
    "lib/tools/registry.ts",
    "lib/tools/content.ts",
    "lib/tools/categoryContent.ts",
    "lib/guides/content.ts",
    "lib/currency/pairs.ts",
  ];
  const commits = git("log", "--reverse", "--format=%H %as", "--", ...DATA_FILES)
    .split("\n")
    .filter(Boolean)
    .map((l) => l.split(" "));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tabbench-lastmod-"));
  const lastDataChange = new Map();
  let prev = new Map();
  const load = async (dir, file) => (fs.existsSync(path.join(dir, file)) ? importFrom(dir, file).catch(() => null) : null);

  for (const [hash, date] of commits) {
    const dir = path.join(tmp, hash);
    fs.mkdirSync(dir, { recursive: true });
    const present = git("ls-tree", "-r", "--name-only", hash, "--", ...DATA_FILES).split("\n").filter(Boolean);
    if (!present.length) continue;
    execFileSync("sh", ["-c", `git archive ${hash} ${present.join(" ")} | tar -x -C "${dir}"`], { cwd: ROOT });
    fs.writeFileSync(path.join(dir, "package.json"), "{}");
    const snap = {
      registry: await load(dir, "lib/tools/registry.ts"),
      content: await load(dir, "lib/tools/content.ts"),
      categoryContent: await load(dir, "lib/tools/categoryContent.ts"),
      guides: await load(dir, "lib/guides/content.ts"),
      pairs: await load(dir, "lib/currency/pairs.ts"),
    };
    if (!snap.registry) continue; // unloadable snapshot: later commits decide
    const parts = new Map([...dataParts(snap)].map(([p, s]) => [p, sha(s)]));
    for (const [p, h] of parts) if (prev.get(p) !== h) lastDataChange.set(p, date);
    prev = parts;
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  // Uncommitted edits to the data are changes made today.
  for (const [p, s] of data) if (prev.get(p) !== sha(s)) lastDataChange.set(p, today);

  const dirty = new Set(
    git("status", "--porcelain", "--untracked-files=all").split("\n").filter(Boolean).map((l) => l.slice(3))
  );
  const fileDate = (f) => (dirty.has(f) ? today : git("log", "-1", "--format=%as", "--", f) || today);

  const dates = new Map();
  for (const [p, { files }] of current) {
    const candidates = [lastDataChange.get(p), ...files.map(fileDate)].filter(Boolean);
    dates.set(p, candidates.sort().at(-1) ?? today);
  }
  return dates;
}

/* ------------------------------------------------------------------ */
/* Merge and write                                                     */
/* ------------------------------------------------------------------ */
const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")).routes ?? {} : {};
const history = BOOTSTRAP ? await datesFromHistory() : null;

const next = {};
const changed = [];
for (const [p, { fingerprint }] of [...current].sort(([a], [b]) => a.localeCompare(b))) {
  const before = previous[p];
  let lastmod;
  if (history) lastmod = history.get(p);
  else if (before && (before.fingerprint === fingerprint || accepts(p))) lastmod = before.lastmod;
  else lastmod = today;
  if (!before || before.fingerprint !== fingerprint || before.lastmod !== lastmod) changed.push(`${p} → ${lastmod}`);
  next[p] = { lastmod, fingerprint };
}
const removed = Object.keys(previous).filter((p) => !current.has(p));

const body = JSON.stringify({ $comment: "Generated by scripts/seo/lastmod.mjs — commit it. Do not hand-edit.", version: 1, routes: next }, null, 2) + "\n";
const unchanged = fs.existsSync(MANIFEST) && fs.readFileSync(MANIFEST, "utf8") === body;

if (CHECK) {
  if (!unchanged) {
    console.error(`lastmod: manifest is stale (${changed.length} changed, ${removed.length} removed). Run: node scripts/seo/lastmod.mjs`);
    process.exit(1);
  }
  console.log(`lastmod: manifest up to date (${current.size} URLs).`);
} else if (unchanged) {
  console.log(`lastmod: no content changes (${current.size} URLs).`);
} else {
  fs.writeFileSync(MANIFEST, body);
  console.log(`lastmod: ${changed.length} URL(s) updated${removed.length ? `, ${removed.length} removed` : ""}.`);
  for (const c of changed.slice(0, 20)) console.log(`  ${c}`);
  if (changed.length > 20) console.log(`  … and ${changed.length - 20} more`);
}
