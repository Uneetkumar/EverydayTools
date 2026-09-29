/**
 * Source-level checks on the registries that generate every page, the
 * sitemaps and the structured data. No build needed.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT, importFrom, loadSite } from "../../scripts/seo/lib/site.mjs";

const site = await loadSite();
const meta = await importFrom(ROOT, "lib/seo/metadata.ts");
const sitemapLib = await importFrom(ROOT, "lib/seo/sitemap.ts");
const { registry, guides, content, routes } = site;
const tools = registry.getAllTools();
const slugs = new Set(tools.map((t) => t.slug));

describe("Tool registry", () => {
  it("slugs are unique, lowercase and hyphenated", () => {
    assert.equal(slugs.size, tools.length);
    for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, s);
  });
  it("every related / next-step / curated slug points at a real tool", () => {
    const refs = [
      ...tools.flatMap((t) => [...t.relatedToolSlugs, ...t.nextSteps].map((s) => [t.slug, s])),
      ...registry.TOOL_CATEGORIES.flatMap((c) => c.popular.map((s) => [`category ${c.id}`, s])),
      ...[...registry.POPULAR_TOOL_SLUGS, ...registry.NEW_TOOL_SLUGS, ...registry.HIDDEN_GEM_SLUGS].map((s) => ["curated list", s]),
    ];
    assert.deepEqual(refs.filter(([, s]) => !slugs.has(s)).map(([from, s]) => `${from} → ${s}`), []);
  });
  it("every tool has long-form content", () => {
    assert.deepEqual(tools.filter((t) => !content.getToolContent(t.slug)).map((t) => t.slug), []);
  });
  it("titles fit in 60 characters without truncation and are unique", () => {
    const titles = tools.map((t) => meta.buildTitle(t.metaTitle || t.name));
    assert.deepEqual(titles.filter((t) => t.length > 60 || /\.\.\.|…/.test(t)), []);
    assert.equal(new Set(titles).size, titles.length, "duplicate tool titles");
  });
  it("meta descriptions are 70–160 characters", () => {
    const bad = tools.map((t) => [t.slug, (t.metaDescription || t.description).length]).filter(([, n]) => n < 70 || n > 160);
    assert.deepEqual(bad, []);
  });
});

describe("Guides", () => {
  it("each guide links to a real tool and has sane dates", () => {
    for (const g of guides.GUIDES) {
      assert.ok(slugs.has(g.toolSlug), `${g.slug} → ${g.toolSlug}`);
      assert.match(g.published, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(g.updated >= g.published, `${g.slug}: updated before published`);
    }
  });
});

describe("Route registry and sitemaps", () => {
  const list = routes.getPublicRoutes();
  it("routes are unique, normalised paths", () => {
    const paths = list.map((r) => r.path);
    assert.equal(new Set(paths).size, paths.length);
    for (const p of paths) assert.ok(p === "/" || (/^\/[a-z0-9/-]+$/.test(p) && !p.endsWith("/")), p);
  });
  it("every route has a lastmod, and the manifest is in sync with the content", () => {
    assert.deepEqual(list.filter((r) => !r.lastmod).map((r) => r.path), []);
    const run = spawnSync(process.execPath, [path.join(ROOT, "scripts/seo/lastmod.mjs"), "--check"], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr || run.stdout);
  });
  it("the rendered sitemaps list exactly the registry routes", () => {
    const files = sitemapLib.getSitemapFiles();
    const locs = files.flatMap((f) => [...sitemapLib.renderUrlset(f.file).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const expected = list.map((r) => (r.path === "/" ? "https://tabbench.com" : `https://tabbench.com${r.path}`));
    assert.deepEqual([...locs].sort(), [...expected].sort());
    assert.match(sitemapLib.renderSitemapIndex(), /<sitemapindex /);
  });
});
