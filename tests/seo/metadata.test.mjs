import { describe, it } from "node:test";
import { expectNone, skip } from "./helpers.mjs";

describe("Page metadata", { skip }, () => {
  it("every indexable page has exactly one, untruncated title", () =>
    expectNone(["title-missing", "title-multiple", "title-truncated"]));
  it("titles are unique", () => expectNone(["title-duplicate"]));
  it("every indexable page has one meta description", () => expectNone(["description-missing", "description-multiple"]));
  it("no description is clipped to fit the snippet", () => expectNone(["description-long", "description-clipped"]));
  it("one H1 per page", () => expectNone(["h1-missing", "h1-multiple"]));
  it("a single self-referencing canonical on https://tabbench.com", () =>
    expectNone(["canonical-missing", "canonical-multiple", "canonical-host", "canonical-query", "canonical-not-self", "canonical-duplicate", "og-url-mismatch"]));
  it("complete Open Graph / X card with a built image", () =>
    expectNone(["og-title-missing", "og-description-missing", "og-image-missing", "og-image-host", "og-image-broken"]));
  it("no duplicate charset or viewport tags", () => expectNone(["head-duplicate-charset", "head-duplicate-viewport"]));
  it("no localhost, Firebase or http:// URLs in pages", () => expectNone(["forbidden-host", "insecure-url"]));
  it("every <img> has an alt attribute", () => expectNone(["img-alt-missing"]));
});
