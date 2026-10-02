/** What an offline copy downloads, keeps and frees (lib/offline/plan.ts). */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const plan = await load("offline/plan.ts");

const M = {
  version: "v2",
  builtAt: "2026-10-02T00:00:00Z",
  core: [
    { url: "/_next/static/chunks/a.js", bytes: 100 },
    { url: "/_next/static/chunks/b.js", bytes: 200 },
  ],
  pages: [
    { url: "/", bytes: 50 },
    { url: "/tools/json-formatter", bytes: 60 },
    { url: "/tools/video-cutter", bytes: 70 },
  ],
  packs: [
    { id: "pdf", label: "PDF", note: "", tools: ["pdf-editor"], suggested: true, bytes: 1000, files: [{ url: "/pdf.worker.min.mjs", bytes: 1000, hash: "p1" }] },
    { id: "video", label: "Video", note: "", tools: ["video-cutter"], suggested: false, bytes: 5000, files: [{ url: "/ffmpeg/ffmpeg-core.wasm", bytes: 5000, hash: "f1" }] },
  ],
  bytes: { core: 300, pages: 180 },
};
const have = (o = {}) => ({ pages: new Set(o.pages ?? []), static: new Set(o.static ?? []), engines: new Map(o.engines ?? []) });
const urls = (jobs) => jobs.map((j) => j.url).sort();

describe("saving everything", () => {
  it("fetches all code, pages and the chosen engines on a fresh device", () => {
    const jobs = plan.planDownload(M, ["pdf"], have(), null);
    assert.deepEqual(urls(jobs), ["/", "/_next/static/chunks/a.js", "/_next/static/chunks/b.js", "/pdf.worker.min.mjs", "/tools/json-formatter", "/tools/video-cutter"]);
    assert.equal(jobs.find((j) => j.url === "/pdf.worker.min.mjs").hash, "p1");
  });
  it("skips what is saved, and pages too when the build has not changed", () => {
    const jobs = plan.planDownload(M, ["pdf"], have({ pages: ["/", "/tools/json-formatter"], static: ["/_next/static/chunks/a.js"], engines: [["/pdf.worker.min.mjs", "p1"]] }), "v2");
    assert.deepEqual(urls(jobs), ["/_next/static/chunks/b.js", "/tools/video-cutter"]);
  });
  it("fetches every page again after a deploy, because new pages point at new code", () => {
    const jobs = plan.planDownload(M, [], have({ pages: ["/", "/tools/json-formatter", "/tools/video-cutter"], static: ["/_next/static/chunks/a.js", "/_next/static/chunks/b.js"] }), "v1");
    assert.deepEqual(urls(jobs), ["/", "/tools/json-formatter", "/tools/video-cutter"]);
  });
  it("replaces an engine that changed, but trusts one saved without a hash", () => {
    assert.deepEqual(urls(plan.planDownload(M, ["pdf"], have({ engines: [["/pdf.worker.min.mjs", "old"]] }), "v2").filter((j) => j.store === "engines")), ["/pdf.worker.min.mjs"]);
    assert.deepEqual(plan.planDownload(M, ["pdf"], have({ engines: [["/pdf.worker.min.mjs", undefined]] }), "v2").filter((j) => j.store === "engines"), []);
  });
  it("adds up the size of a choice", () => {
    assert.equal(plan.totalBytes(M, []), 480);
    assert.equal(plan.totalBytes(M, ["pdf", "video"]), 6480);
  });
});

describe("saving one tool", () => {
  it("needs its page, the app's code and its engine", () => {
    assert.deepEqual(urls(plan.planTool(M, "/tools/video-cutter", have())), ["/_next/static/chunks/a.js", "/_next/static/chunks/b.js", "/ffmpeg/ffmpeg-core.wasm", "/tools/video-cutter"]);
  });
  it("is ready when all of that is saved, and only then", () => {
    const code = ["/_next/static/chunks/a.js", "/_next/static/chunks/b.js"];
    assert.deepEqual(plan.planTool(M, "/tools/json-formatter", have({ pages: ["/tools/json-formatter"], static: code })), []);
    assert.deepEqual(urls(plan.planTool(M, "/tools/video-cutter", have({ pages: ["/tools/video-cutter"], static: code }))), ["/ffmpeg/ffmpeg-core.wasm"]);
  });
});

describe("freeing space", () => {
  it("keeps the current build's code and whatever a saved page still uses", () => {
    const old = '<script src="/_next/static/chunks/old.js"></script><link href="/_next/static/css/old.css">';
    const keep = plan.staticToKeep(M, [old]);
    assert.ok(keep.has("/_next/static/chunks/a.js"));
    assert.ok(keep.has("/_next/static/chunks/old.js"));
    assert.ok(keep.has("/_next/static/css/old.css"));
    assert.ok(!keep.has("/_next/static/chunks/gone.js"));
  });
  it("reads asset paths out of escaped RSC data too", () => {
    assert.deepEqual(plan.assetsIn('self.__next_f.push([1,"0:[\\"/_next/static/chunks/c.js\\"]"])'), ["/_next/static/chunks/c.js"]);
  });
  it("drops engines the site no longer ships or that changed", () => {
    const stale = plan.staleEngines(M, new Map([["/pdf.worker.min.mjs", "p1"], ["/ffmpeg/ffmpeg-core.wasm", "old"], ["/ffmpeg/removed.js", undefined]]));
    assert.deepEqual(stale.sort(), ["/ffmpeg/ffmpeg-core.wasm", "/ffmpeg/removed.js"]);
  });
  it("finds the engine a tool needs", () => {
    assert.equal(plan.packForTool(M, "video-cutter").id, "video");
    assert.equal(plan.packForTool(M, "json-formatter"), undefined);
  });
  it("writes sizes people read", () => {
    assert.equal(plan.formatMB(32_232_419), "32 MB");
    assert.equal(plan.formatMB(3_900_000), "3.9 MB");
    assert.equal(plan.formatMB(52_000), "52 KB");
  });
});
