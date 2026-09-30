import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { audit, expectNone, skip } from "./helpers.mjs";

describe("Indexability", { skip }, () => {
  it("every route in lib/seo/routes.ts is built and indexable", () => expectNone(["route-missing", "accidental-noindex"]));
  it("nothing outside the route registry is indexable", () => expectNone(["unexpected-indexable"]));
  it("the 404 pages are noindex but still followed", async () => {
    const { pages } = await audit();
    for (const route of ["/404", "/_not-found"]) {
      const p = pages.find((x) => x.route === route);
      assert.ok(p, `${route} not built`);
      assert.match(p.robots.join(","), /noindex/);
      assert.doesNotMatch(p.robots.join(","), /nofollow/);
    }
  });
  it("Firebase duplicate hosts are noindexed and redirected; production is untouched", () =>
    expectNone(["host-guard", "host-guard-missing"]));
  it("RSC payloads are X-Robots-Tag: noindex (robots.txt and ads.txt are not); URLs are normalised", () =>
    expectNone(["rsc-indexable", "txt-noindex-broad", "url-normalisation"]));
});
