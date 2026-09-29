import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { audit, expectNone, skip } from "./helpers.mjs";

describe("XML sitemaps", { skip }, () => {
  it("sitemap.xml is an index of per-type sitemaps, none of them empty", async () => {
    const { sitemap } = await audit();
    assert.equal(sitemap.index, true);
    assert.ok(sitemap.files.length >= 2);
    for (const f of sitemap.files) assert.ok(f.urls > 0, `${f.name} is empty`);
    await expectNone(["sitemap-missing", "sitemap-empty", "sitemap-xml", "sitemap-too-large"]);
  });
  it("1. every sitemap URL exists", () => expectNone(["sitemap-url-404"]));
  it("2. every sitemap URL is the page's canonical", () => expectNone(["sitemap-not-canonical"]));
  it("3. no sitemap URL redirects", () => expectNone(["sitemap-redirect", "sitemap-url-slash"]));
  it("4. no sitemap URL is noindex", () => expectNone(["sitemap-noindex"]));
  it("5. no duplicate URLs", () => expectNone(["sitemap-duplicate"]));
  it("6. no invalid URLs or query strings", () => expectNone(["sitemap-url-invalid", "sitemap-url-query"]));
  it("7–8, 10. no localhost, Firebase preview or development hosts", () => expectNone(["sitemap-url-dev", "sitemap-url-host"]));
  it("9. HTTPS only", () => expectNone(["sitemap-url-http"]));
  it("lastmod is a real, non-future W3C date", () => expectNone(["sitemap-lastmod-invalid", "sitemap-lastmod-future", "sitemap-lastmod-missing"]));
  it("every indexable page is in a sitemap", () => expectNone(["sitemap-omits-page"]));
});
