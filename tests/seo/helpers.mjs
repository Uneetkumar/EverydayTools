/**
 * Shared set-up for the SEO tests. Build-dependent suites audit `out/` once
 * per test file and assert that no issue with the given codes was found, so a
 * failure prints the exact pages and messages.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runAudit } from "../../scripts/seo/audit.mjs";
import { ROOT } from "../../scripts/seo/lib/site.mjs";

export const OUT = path.join(ROOT, "out");
export const hasBuild = fs.existsSync(path.join(OUT, "index.html"));
export const skip = hasBuild ? false : "no build in out/ — run `npm run build` first";

let cached;
export const audit = () => (cached ??= runAudit({ dir: OUT }));

/** Fails listing every issue whose code is in `codes` (any severity by default). */
export async function expectNone(codes, { severity } = {}) {
  const { issues } = await audit();
  const found = issues.filter((i) => codes.includes(i.code) && (!severity || i.severity === severity));
  assert.deepEqual(
    found.map((i) => `${i.code} · ${i.target} · ${i.message}`),
    [],
    `${found.length} issue(s) found`
  );
}
