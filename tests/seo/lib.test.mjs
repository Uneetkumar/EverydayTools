/** Unit tests for the central SEO helpers in lib/seo. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ROOT, importFrom } from "../../scripts/seo/lib/site.mjs";

const config = await importFrom(ROOT, "lib/seo/config.ts");
const meta = await importFrom(ROOT, "lib/seo/metadata.ts");
const jsonld = await importFrom(ROOT, "lib/seo/jsonld.ts");

describe("URLs", () => {
  it("absoluteUrl produces the canonical form", () => {
    assert.equal(config.absoluteUrl("/"), "https://tabbench.com");
    assert.equal(config.absoluteUrl("/tools/x/"), "https://tabbench.com/tools/x");
    assert.equal(config.absoluteUrl("tools/x?utm_source=a#b"), "https://tabbench.com/tools/x");
  });
  it("absoluteAssetUrl keeps the query string", () => {
    assert.equal(config.absoluteAssetUrl("/a/opengraph-image?v=1"), "https://tabbench.com/a/opengraph-image?v=1");
  });
  it("the canonical origin cannot be changed by the environment", () => {
    assert.equal(config.CANONICAL_ORIGIN, "https://tabbench.com");
  });
});

describe("Titles and descriptions", () => {
  it("appends the brand only when it fits, and never truncates", () => {
    assert.equal(meta.buildTitle("JSON Formatter"), "JSON Formatter | TabBench");
    assert.equal(meta.buildTitle("JSON Formatter | TabBench"), "JSON Formatter | TabBench");
    assert.equal(meta.buildTitle("About TabBench"), "About TabBench");
    const long = "Compress Image to 20KB - Signature & Photo Uploads";
    assert.equal(meta.buildTitle(long), long);
  });
  it("clamps long descriptions on a word boundary", () => {
    const d = meta.clampDescription("word ".repeat(60));
    assert.ok(d.length <= 160);
    assert.match(d, /word…$/);
  });
});

describe("JSON-LD", () => {
  it("cannot break out of its <script> tag", () => {
    const LS = String.fromCharCode(0x2028);
    const out = jsonld.serializeJsonLd({ text: `</script><script>alert(1)</script> & ${LS}` });
    assert.doesNotMatch(out, /<\/script/i);
    assert.ok(!/[<>&]/.test(out) && !out.includes(LS));
    assert.equal(JSON.parse(out).text, `</script><script>alert(1)</script> & ${LS}`);
  });
  it("never emits ratings, and only real profiles in sameAs", () => {
    const graph = JSON.stringify(jsonld.generateSiteGraph());
    assert.doesNotMatch(graph, /aggregateRating|review/);
    assert.equal(/sameAs/.test(graph), config.SEO_CONFIG.sameAs.length > 0);
  });
});
