/**
 * The audit must actually catch defects, not just pass. Plants one of each on
 * a copy of the build and checks every one is reported.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runAudit } from "../../scripts/seo/audit.mjs";
import { OUT, skip } from "./helpers.mjs";

const HEAVY = new Set(["ffmpeg", "tesseract", "vendor", "pdfjs", "models", "_next"]);
let dir;
let codes;

describe("SEO audit catches planted defects", { skip }, () => {
  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "tabbench-seo-"));
    fs.cpSync(OUT, dir, { recursive: true, filter: (src) => !HEAVY.has(path.basename(src)) || path.dirname(src) !== OUT });
    const edit = (file, fn) => fs.writeFileSync(path.join(dir, file), fn(fs.readFileSync(path.join(dir, file), "utf8")));
    edit("tools/json-formatter.html", (h) => h.replace(/<link rel="canonical"[^>]*>/, ""));
    edit("about.html", (h) => h.replace('<meta name="robots" content="index, follow"/>', '<meta name="robots" content="noindex, follow"/>'));
    const privacyTitle = fs.readFileSync(path.join(dir, "privacy.html"), "utf8").match(/<title>[\s\S]*?<\/title>/)[0];
    edit("terms.html", (h) => h.replace(/<title>[\s\S]*?<\/title>/, privacyTitle));
    edit("guides.html", (h) => h.replace("</main>", '<a href="/tools/does-not-exist">x</a><a href="/tools/simple-calculator">calc</a></main>'));
    edit("contact.html", (h) => h.replace(/<meta property="og:image" content="[^"]*"/, '<meta property="og:image" content="http://localhost:3000/x.png"'));
    edit("categories.html", (h) => h.replace('<script type="application/ld+json">{', '<script type="application/ld+json">{,'));
    edit("tools/age-calculator.html", (h) => h.replace("</head>", '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","aggregateRating":{"ratingValue":5}}</script></head>'));
    edit("sitemap-pages.xml", (h) => h.replace("</urlset>", "<url><loc>http://localhost:3000/x</loc></url><url><loc>https://tabbench.com/tools/simple-calculator</loc></url></urlset>"));
    edit("robots.txt", (t) => t + "\nDisallow: /_next/\n");
    ({ issues: codes } = await runAudit({ dir }));
    codes = new Set(codes.map((i) => i.code));
  });
  after(() => dir && fs.rmSync(dir, { recursive: true, force: true }));

  for (const code of [
    "canonical-missing",
    "accidental-noindex",
    "sitemap-noindex",
    "title-duplicate",
    "link-broken",
    "link-redirect",
    "forbidden-host",
    "jsonld-invalid",
    "jsonld-fake-rating",
    "sitemap-url-dev",
    "sitemap-url-http",
    "sitemap-redirect",
    "robots-blocks-resource",
  ]) {
    it(`reports ${code}`, () => assert.ok(codes.has(code), `${code} not reported`));
  }
});
