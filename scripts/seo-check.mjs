#!/usr/bin/env node
/**
 * SEO regression guard — runs after every build (npm postbuild).
 *
 * The checks live in scripts/seo/audit.mjs and run against `out/`, the
 * static export Firebase actually serves. Everything they test has been a
 * real defect on this site at least once: fabricated ratings, a doubled or
 * truncated title, a duplicated <h1>, pages that lost their og:image, a
 * sitemap listing redirected URLs.
 *
 * ERRORS fail the build. WARNINGS print and pass.
 *
 *   node scripts/seo-check.mjs [--dir out] [--warn-only] [--report]
 *
 * --report also writes seo-report.json (scorecard + every issue) and
 * reports/route-inventory.json (one row per built route).
 */
import fs from "node:fs";
import path from "node:path";
import { runAudit } from "./seo/audit.mjs";
import { ROOT } from "./seo/lib/site.mjs";

const args = process.argv.slice(2);
const dir = path.resolve(ROOT, args.includes("--dir") ? args[args.indexOf("--dir") + 1] : "out");
const WARN_ONLY = args.includes("--warn-only");

let result;
try {
  result = await runAudit({ dir });
} catch (e) {
  console.error(`seo-check: ${e.message}`);
  process.exit(1);
}
const { issues, metrics, inventory } = result;

const print = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label} (${list.length})`);
  const byCode = new Map();
  for (const i of list) (byCode.get(i.code) ?? byCode.set(i.code, []).get(i.code)).push(i);
  for (const [code, items] of byCode) {
    console.log(`  ${code}`);
    for (const i of items.slice(0, 10)) console.log(`    - ${i.target}: ${i.message}`);
    if (items.length > 10) console.log(`    … and ${items.length - 10} more`);
  }
};

console.log(
  `\nSEO check — ${metrics.indexableRoutes} indexable of ${metrics.routesAudited} built pages · ` +
    `${metrics.sitemapUrls} URLs in ${metrics.sitemapFiles} sitemaps`
);
console.log(`schema: ${Object.entries(metrics.schemaTypes).map(([t, n]) => `${t} ${n}`).join(" · ")}`);
print("WARNINGS", issues.filter((i) => i.severity === "warning"));
print("ERRORS", issues.filter((i) => i.severity === "error"));
console.log(metrics.errors || metrics.warnings ? `\n${metrics.errors} error(s), ${metrics.warnings} warning(s).` : "\nNo issues found.");

if (args.includes("--report")) {
  // No timestamp: the files only change when the site does, so they diff cleanly.
  const report = { generatedFrom: path.relative(ROOT, dir) || ".", ...metrics, issues };
  fs.writeFileSync(path.join(ROOT, "seo-report.json"), JSON.stringify(report, null, 2) + "\n");
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports/route-inventory.json"), JSON.stringify(inventory, null, 2) + "\n");
  console.log("Wrote seo-report.json and reports/route-inventory.json.");
}

if (metrics.errors && !WARN_ONLY) {
  console.error("\nSEO check failed. Fix the errors above, or re-run with --warn-only.");
  process.exit(1);
}
