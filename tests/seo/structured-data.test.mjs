import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { audit, expectNone, skip } from "./helpers.mjs";

describe("Structured data", { skip }, () => {
  it("every JSON-LD block parses and uses https://schema.org", () => expectNone(["jsonld-invalid", "jsonld-context", "jsonld-host"]));
  it("no fabricated ratings or reviews", () => expectNone(["jsonld-fake-rating"]));
  it("BreadcrumbList matches the visible breadcrumb", () =>
    expectNone(["breadcrumb-jsonld-missing", "breadcrumb-mismatch", "breadcrumb-position", "breadcrumb-url"]));
  it("FAQPage questions and answers are visible on the page", () => expectNone(["faq-not-visible"]));
  it("Article markup is complete with consistent dates", () => expectNone(["article-field", "article-dates"]));
  it("site-wide Organization and WebSite on every indexable page; tools are WebApplications", async () => {
    const { metrics } = await audit();
    assert.equal(metrics.schemaTypes.Organization, metrics.indexableRoutes);
    assert.equal(metrics.schemaTypes.WebSite, metrics.indexableRoutes);
    const tools = (await audit()).inventory.filter((r) => r.path.startsWith("/tools/")).length;
    assert.equal(metrics.schemaTypes.WebApplication, tools);
  });
});
