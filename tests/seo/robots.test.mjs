import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { audit, expectNone, skip } from "./helpers.mjs";

describe("robots.txt", { skip }, () => {
  it("valid syntax", () => expectNone(["robots-missing", "robots-syntax"]));
  it("references the canonical sitemap index", async () => {
    const { robots } = await audit();
    assert.deepEqual(robots.sitemaps, ["https://tabbench.com/sitemap.xml"]);
    await expectNone(["robots-sitemap"]);
  });
  it("does not block the site or the resources pages need to render", () =>
    expectNone(["robots-blocks-site", "robots-blocks-resource"]));
});
