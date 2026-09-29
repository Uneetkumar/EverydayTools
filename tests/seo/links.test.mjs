import { describe, it } from "node:test";
import { expectNone, skip } from "./helpers.mjs";

describe("Internal links", { skip }, () => {
  it("no broken internal links", () => expectNone(["link-broken"]));
  it("no relative, malformed, mixed-case or dev-host hrefs", () => expectNone(["link-relative", "link-case", "link-forbidden-host"]));
  it("no internal link goes through a redirect", () => expectNone(["link-redirect"]));
  it("no orphan pages", () => expectNone(["orphan"]));
  it("redirects in firebase.json have no chains or dead ends", () =>
    expectNone(["redirect-chain", "redirect-dead-end", "redirect-shadows-page"]));
});
