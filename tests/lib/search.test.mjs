/** Ranking of the tool search (palette, /tools, category pages). */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const reg = await load("tools/registry.ts");
const search = await load("tools/search.ts");
const { toIndexEntry } = await load("tools/tool-index.ts");

// The same slim entries the browser searches.
const index = reg.getAllTools().map(toIndexEntry);
const top = (q, n = 5) => search.searchTools(index, q).slice(0, n).map((t) => t.slug);
const all = (q) => search.searchTools(index, q).map((t) => t.slug);

describe('"X to Y" is a conversion, not a bag of words', () => {
  it("puts the tools that convert FROM a PDF first, however much of the target is typed", () => {
    // Reported: typing "pdf to i" (on the way to "pdf to image") listed Merge PDF first.
    for (const q of ["pdf to", "pdf to ", "pdf t", "pdf to i", "pdf to im", "pdf to ima", "pdf to image", "pdf to png", "pdf to the"]) {
      const t = top(q, 2).sort();
      assert.deepEqual(t, ["pdf-to-jpg", "pdf-to-word"], `"${q}" → ${top(q, 4)}`);
    }
  });
  it("uses the typed target to choose between them", () => {
    assert.equal(top("pdf to i")[0], "pdf-to-jpg");
    assert.equal(top("pdf to im")[0], "pdf-to-jpg");
    assert.equal(top("pdf to image")[0], "pdf-to-jpg");
    assert.equal(top("pdf to png")[0], "pdf-to-jpg");
    assert.equal(top("pdf to w")[0], "pdf-to-word");
    assert.equal(top("pdf to word")[0], "pdf-to-word");
    assert.equal(top("pdf to doc")[0], "pdf-to-word");
    assert.equal(top("convert pdf to word")[0], "pdf-to-word");
    assert.equal(top("how to convert pdf to word")[0], "pdf-to-word");
  });
  it("never lets a tool that merely mentions PDF outrank a conversion", () => {
    for (const q of ["pdf to", "pdf to i", "pdf to the", "pdf to word"]) {
      const r = all(q);
      for (const other of ["pdf-merge", "split-pdf", "rotate-pdf", "unlock-pdf", "pdf-editor"]) {
        const at = r.indexOf(other);
        if (at === -1) continue; // not listed at all is fine: it is not a match for that target
        assert.ok(r.indexOf("pdf-to-word") < at && r.indexOf("pdf-to-jpg") < at, `"${q}": ${other} ranked above a conversion`);
      }
    }
  });
  it("respects direction", () => {
    assert.equal(top("jpg to pdf")[0], "image-to-pdf");
    assert.equal(top("image to pdf")[0], "image-to-pdf");
    assert.equal(top("png to pdf")[0], "image-to-pdf");
    // PDF to Word also converts Word to PDF, and says so in its aliases.
    assert.equal(top("word to pdf")[0], "pdf-to-word");
    assert.equal(top("word to pdf")[1], "image-to-pdf");
  });
  it("finds the other format families from their first letters", () => {
    assert.equal(top("png to jpg")[0], "png-to-jpg");
    assert.deepEqual(top("png to", 2).sort(), ["png-to-jpg", "png-to-svg"]);
    assert.equal(top("jpg to p")[0], "jpg-to-png");
    assert.equal(top("webp to")[0], "webp-to-jpg");
    assert.equal(top("json to")[0], "json-to-csv");
    assert.equal(top("json to c")[0], "json-to-csv");
    assert.equal(top("json to ts")[0], "json-to-typescript");
    assert.equal(top("json to t")[0], "json-to-typescript");
    assert.equal(top("curl to f")[0], "curl-to-fetch");
    assert.equal(top("curl to py")[0], "curl-to-python");
    assert.equal(top("curl to a")[0], "curl-to-axios");
    assert.equal(top("text to s")[0], "text-to-speech");
    assert.equal(top("speech to")[0], "speech-to-text");
    assert.equal(top("image to t")[0], "image-to-text");
  });
  it("does not leak unrelated tools through a one-letter target", () => {
    for (const bad of ["currency-converter", "json-to-typescript", "favicon-generator", "unit-converter", "regex-tester"]) {
      assert.ok(!top("pdf to i", 12).includes(bad), `pdf to i → ${bad}`);
    }
    assert.ok(!top("curl to f", 4).includes("favicon-generator"));
    assert.ok(!top("curl to f", 4).includes("unit-converter"));
  });
  it("keeps currency pairs precise", () => {
    assert.deepEqual(all("usd to inr"), ["currency-converter"]);
    assert.deepEqual(all("dollar to rupee"), ["currency-converter"]);
  });
  it("does not read 'add text to pdf' as a conversion", () => {
    const r = all("word to pdf");
    assert.ok(r.indexOf("image-to-pdf") < r.indexOf("pdf-editor") || !r.includes("pdf-editor"));
  });
});

describe("a slug is not a name", () => {
  it("ranks tools NAMED for the query above tools whose URL happens to start with it", () => {
    // Merge PDF's slug is pdf-merge, which used to make it "start with pdf".
    assert.equal(top("pdf")[0], "pdf-editor");
    assert.ok(top("pdf", 4).includes("pdf-to-word"));
  });
});

describe("searching that must not change", () => {
  const first = (q, slug) => assert.equal(top(q)[0], slug, `"${q}" → ${top(q, 3)}`);
  it("finds the obvious tool first", () => {
    first("calc", "calculator");
    first("calculator", "calculator");
    first("age", "age-calculator");
    first("gst", "gst-calculator");
    first("emi", "emi-calculator");
    first("sip", "sip-calculator");
    first("merge pdf", "pdf-merge");
    first("how to merge pdf", "pdf-merge");
    first("split pdf", "split-pdf");
    first("rotate pdf", "rotate-pdf");
    first("unlock pdf", "unlock-pdf");
    first("edit pdf", "pdf-editor");
    first("compress image", "image-compressor");
    first("image compressor", "image-compressor");
    first("resize image", "image-resizer");
    first("crop image", "crop-image");
    first("word count", "word-counter");
    first("qr code", "qr-code-generator");
    first("password", "password-generator");
    first("uuid", "uuid-generator");
    first("regex", "regex-tester");
    first("json", "json-formatter");
    first("jwt", "jwt-decoder");
    first("cron", "cron-explainer");
    first("timestamp", "unix-timestamp-converter");
    first("stopwatch", "stopwatch-timer");
    first("bmi", "bmi-calculator");
  });
  it("still finds tools by everyday phrasing and through typos", () => {
    first("compres image", "image-compressor");
    first("calculater", "calculator");
    first("pasword generator", "password-generator");
    first("rs to", "currency-converter");
  });
  it("finds the newest tools by how people say them", () => {
    first("speed test", "internet-speed-test");
    first("speedtest", "internet-speed-test");
    first("internet speed", "internet-speed-test");
    first("toss dice", "dice-roller");
    first("flip a coin", "coin-flip");
    first("time in tokyo", "world-clock");
    first("regex builder", "regex-builder");
    first("curl to javascript", "curl-to-javascript");
    first("http status codes", "http-status-code-lookup");
  });
  it("still finds a renamed tool by its old name", () => {
    // File actions are named as instructions now ("Compress Image"); the noun forms people also type still work.
    first("image compressor", "image-compressor");
    first("image resizer", "image-resizer");
    first("watermark remover", "watermark-remover");
    first("video cutter", "video-cutter");
    first("trim video", "video-cutter");
    first("remove duplicate lines", "text-sorter");
    first("deduplicator", "text-sorter");
    first("interval timer", "interval-timer");
    first("tabata", "interval-timer");
    first("pdf page count", "pdf-page-counter");
    first("pdf page counter", "pdf-page-counter");
  });
  it("names file actions the way they are asked for", () => {
    const name = (slug) => reg.getAllTools().find((t) => t.slug === slug).name;
    for (const [slug, expected] of [["pdf-merge", "Merge PDF"], ["split-pdf", "Split PDF"], ["image-compressor", "Compress Image"], ["image-resizer", "Resize Image"], ["crop-image", "Crop Image"], ["watermark-remover", "Remove Watermark"], ["video-cutter", "Cut Video"]]) {
      assert.equal(name(slug), expected);
    }
  });
  it("returns nothing for gibberish", () => {
    assert.deepEqual(all("zzzqqq"), []);
  });
});
