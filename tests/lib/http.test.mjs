/**
 * The HTTP libraries behind the API tools: the curl parser, the code
 * generators, User-Agent parsing, URL and query handling, headers and MIME
 * detection. The generated code is also run against a local server and
 * compared with what real curl sends, so a converter cannot drift from curl.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { load } from "./helpers.mjs";

const { parseCurl, buildCurl, shellSplit } = await load("http/curl.ts");
const { generateCode } = await load("http/codegen.ts");
const ua = await load("http/ua.ts");
const url = await load("http/url.ts");
const headers = await load("http/headers.ts");
const mime = await load("http/mime.ts");
const status = await load("http/status.ts");
const methods = await load("http/methods.ts");
const gen = await load("http/header-gen.ts");

describe("curl parser", () => {
  it("tokenises quotes, $'…', continuations and caret-escaped cmd", () => {
    assert.deepEqual(shellSplit(`curl -H 'A: b c' "x y" $'it\\'s' \\\n  z`).tokens, ["curl", "-H", "A: b c", "x y", "it's", "z"]);
    const cmd = parseCurl('curl "https://x.test/" ^\n -H "accept: */*" ^\n --data-raw "^{^\\^"a^\\^":1^}"');
    assert.equal(cmd.request.body.text, '{"a":1}');
  });
  it("applies curl's rules for method, body and content type", () => {
    const post = parseCurl(`curl https://x.test -d 'a=1&b=2'`).request;
    assert.equal(post.method, "POST");
    assert.deepEqual(post.body, { kind: "urlencoded", fields: [{ name: "a", value: "1" }, { name: "b", value: "2" }] });
    assert.equal(parseCurl("curl -I https://x.test").request.method, "HEAD");
    assert.equal(parseCurl("curl -G https://x.test -d q=1").request.url, "https://x.test?q=1");
    const json = parseCurl(`curl --json '{"a":1}' https://x.test`).request;
    assert.equal(json.headers.find((h) => h.name === "Content-Type").value, "application/json");
    const up = parseCurl("curl -F 'f=@/tmp/a.png;type=image/png' https://x.test").request;
    assert.deepEqual(up.body.fields[0], { name: "f", value: "/tmp/a.png", file: true, contentType: "image/png" });
  });
  it("warns when JSON is sent without a Content-Type, as curl does", () => {
    const r = parseCurl(`curl -d '{"a":1}' https://x.test`);
    assert.ok(r.warnings.some((w) => /JSON/.test(w)));
  });
  it("round-trips through buildCurl", () => {
    const cmd = `curl -X PUT https://x.test/i -H 'Content-Type: application/json' -d '{"a":"it'\\''s"}' -u me:pw -L`;
    const a = parseCurl(cmd).request;
    const b = parseCurl(buildCurl(a, { multiline: true })).request;
    assert.deepEqual(b, a);
  });
  it("rejects a command without a URL", () => {
    assert.throws(() => parseCurl("curl -X POST"), /No URL/);
  });
});

/** Sends what a generated snippet sends to a local server, and what real curl sends, and compares them. */
describe("generated code matches real curl", { skip: spawnSync("curl", ["--version"]).status !== 0 && "curl is not installed" }, () => {
  const run = (cmd, args) =>
    new Promise((resolve) => {
      const c = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
      let err = "";
      c.stderr.on("data", (d) => (err += d));
      c.on("close", (code) => resolve({ code, err }));
    });
  const strip = (h) => {
    const o = { ...h };
    for (const k of ["host", "connection", "accept-encoding", "user-agent", "accept", "content-length", "transfer-encoding", "accept-language", "sec-fetch-mode"]) delete o[k];
    return o;
  };
  const norm = (r) => {
    const h = strip(r.headers);
    const ct = (h["content-type"] || "").replace(/;\s*charset=UTF-8/i, "").replace(/boundary=.*/, "boundary=X");
    if (ct) h["content-type"] = ct;
    let b = r.body.replace(/----[-\w]+/g, "BOUNDARY").replace(/\r\n/g, "\n");
    if (/json/.test(ct)) {
      try {
        b = JSON.stringify(JSON.parse(Buffer.from(r.body, "latin1").toString("utf8")));
      } catch {
        /* compare as text */
      }
    }
    return JSON.stringify({ m: r.method, u: r.url, h: Object.fromEntries(Object.entries(h).sort()), b });
  };

  it("fetch, Node https and urllib send what curl sends", async () => {
    let last = null;
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        last = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString("latin1") };
        res.setHeader("content-type", "application/json");
        res.end("{}");
      });
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tb-gen-"));
    const hasPython = spawnSync("python3", ["--version"]).status === 0;
    const cases = [
      `curl -X POST ${base}/v1 -H 'Content-Type: application/json' -H "Authorization: Bearer abc" -d '{"name":"Ada","tags":["a","b"],"n":{"x":1.5,"ok":true,"z":null}}'`,
      `curl '${base}/a?b=1&c=two%20words' -H 'X-Trace: 1'`,
      `curl ${base}/login -d "user=ada&pass=p%40ss+word" -u me:secret`,
      `curl -X PUT ${base}/i/1 -H 'Content-Type: text/plain' --data-raw 'line1\nline2 "q" it'"'"'s'`,
      `curl -X DELETE ${base}/i/9 -H 'X-Reason: cleanup'`,
      `curl -F 'name=Ada' -F 'note=hello' ${base}/up`,
    ];
    try {
      for (const cmd of cases) {
        await run("bash", ["-c", cmd]);
        const expected = norm(last);
        const { request } = parseCurl(cmd);
        for (const [target, opts, ext] of [["fetch", {}, "cjs"], ["fetch", { fetchStyle: "then" }, "cjs"], ["node-https", {}, "cjs"], ["python-urllib", {}, "py"]]) {
          if (ext === "py" && (!hasPython || /-F /.test(cmd))) continue; // multipart falls back to requests, which may not be installed
          const { code } = generateCode(target, request, opts);
          const file = path.join(dir, `${target}.${ext}`);
          fs.writeFileSync(file, target === "fetch" ? `(async () => {\n${code}\n})().catch((e) => { console.error(e.message); process.exit(1); });` : code);
          last = null;
          const r = await run(ext === "py" ? "python3" : "node", [file]);
          assert.equal(r.code, 0, `${target} failed for ${cmd}: ${r.err}`);
          assert.equal(norm(last), expected, `${target} differs from curl for ${cmd}`);
        }
      }
    } finally {
      server.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("every target produces syntactically valid code", () => {
    const { request } = parseCurl(`curl -X POST https://x.test/a -H 'Content-Type: application/json' -H 'X-Dup: 1' -H 'X-Dup: 2' -d '{"a":[1,2],"b":{"c":true}}' -u a:b -k -L -m 5`);
    const hasPython = spawnSync("python3", ["--version"]).status === 0;
    for (const target of ["fetch", "xhr", "node-https", "jquery", "axios", "python-requests", "python-httpx", "python-urllib"]) {
      const { code } = generateCode(target, request, { matchCurlRedirects: true });
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tb-syn-"));
      try {
        if (target.startsWith("python")) {
          if (!hasPython) continue;
          const f = path.join(dir, "a.py");
          fs.writeFileSync(f, code);
          assert.equal(spawnSync("python3", ["-m", "py_compile", f]).status, 0, target);
        } else {
          const f = path.join(dir, "a.mjs");
          fs.writeFileSync(f, `async function w(){\n${code.replace(/^import .*$/gm, "").replace(/^const \w+ = require\('\w+'\);$/gm, "")}\n}`);
          assert.equal(spawnSync("node", ["--check", f]).status, 0, target);
        }
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });
});

describe("User-Agent parser", () => {
  const cases = [
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36", "Chrome", "Blink", "Windows", "desktop"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.51", "Microsoft Edge", "Blink", "Windows", "desktop"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0", "Firefox", "Gecko", "Windows", "desktop"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15", "Safari", "WebKit", "macOS", "desktop"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1", "Chrome (iOS)", "WebKit", "iOS", "mobile"],
    ["Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36", "Samsung Internet", "Blink", "Android", "mobile"],
    ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Googlebot", "Unknown", "Unknown", "bot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot", "GPTBot", "WebKit", "Unknown", "bot"],
    ["curl/8.4.0", "curl", "Unknown", "Unknown", "library"],
    ["Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko", "Internet Explorer", "Trident", "Windows", "desktop"],
    ["Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", "Safari", "WebKit", "iPadOS", "tablet"],
  ];
  for (const [s, browser, engine, os, device] of cases) {
    it(`${browser} on ${os} (${device})`, () => {
      const p = ua.parseUserAgent(s);
      assert.deepEqual([p.browser.name, p.engine.name, p.os.name, p.device.type], [browser, engine, os, device]);
    });
  }
  it("reads the version of curl and of Chrome", () => {
    assert.equal(ua.parseUserAgent("curl/8.4.0").browser.version, "8.4.0");
    assert.equal(ua.parseUserAgent(cases[0][0]).browser.version, "124.0.0.0");
  });
});

describe("URL and query helpers", () => {
  it("parses a URL and flags problems", () => {
    const r = url.parseUrl("https://user:pw@Example.COM:8443/a//b/c%20d/?q=hello+world&tag=a&tag=b&api_key=abc&bad=%zz#sec");
    assert.ok(r.ok);
    assert.equal(r.url.hostname, "example.com");
    assert.equal(r.url.port, "8443");
    assert.deepEqual(r.url.query.map((p) => p.key), ["q", "tag", "tag", "api_key", "bad"]);
    const titles = r.url.issues.map((i) => i.title).join("|");
    assert.match(titles, /Credentials inside the URL/);
    assert.match(titles, /Possible secret/);
    assert.match(titles, /Repeated parameter/);
    assert.equal(url.parseUrl("not a url ::").ok, false);
    assert.equal(url.parseUrl("https://xn--bcher-kva.example/").url.unicodeHostname, "bücher.example");
  });
  it("builds nested objects from bracket syntax", () => {
    const o = url.queryToObject(url.parseQuery("?a=1&a=2&b[]=x&b[]=y&c[d]=1&c[e][f]=2&list[0]=p&list[1]=q&flag"));
    assert.deepEqual(o, { a: ["1", "2"], b: ["x", "y"], c: { d: "1", e: { f: "2" } }, list: ["p", "q"], flag: "" });
  });
  it("builds a query string in each array format", () => {
    const rows = [{ key: "tag", value: "a b" }, { key: "tag", value: "c&d" }, { key: "q", value: "x=y" }];
    assert.equal(url.buildQuery(rows, { arrayFormat: "repeat" }), "tag=a%20b&tag=c%26d&q=x%3Dy");
    assert.equal(url.buildQuery(rows, { arrayFormat: "brackets" }), "tag[]=a%20b&tag[]=c%26d&q=x%3Dy");
    assert.equal(url.buildQuery(rows, { arrayFormat: "indices", space: "plus" }), "tag[0]=a+b&tag[1]=c%26d&q=x%3Dy");
    assert.equal(url.buildQuery(rows, { arrayFormat: "comma" }), "tag=a%20b%2Cc%26d&q=x%3Dy");
  });
});

describe("Header analysis", () => {
  it("parses redirect chains and flags what is wrong", () => {
    const blocks = headers.parseHeaderBlocks("HTTP/1.1 301 Moved\nLocation: https://x.test/\nServer: nginx/1.18.0\n\nHTTP/2 200\ncontent-type: text/html\nstrict-transport-security: max-age=300\naccess-control-allow-origin: *\naccess-control-allow-credentials: true\nset-cookie: sid=1; Path=/\n");
    assert.equal(blocks.length, 2);
    const titles = headers.analyze(blocks[1]).findings.map((f) => f.title).join("|");
    assert.match(titles, /Allow-Origin: \* with Allow-Credentials/);
    assert.match(titles, /HSTS lasts only/);
    assert.match(titles, /not Secure/);
    assert.match(headers.analyze(blocks[0]).findings.map((f) => f.title).join("|"), /version number/);
  });
  it("reads Cache-Control", () => {
    const cc = headers.parseCacheControl("public, max-age=3600, s-maxage=600, immutable");
    assert.equal(cc.num("max-age"), 3600);
    assert.ok(cc.has("immutable"));
  });
});

describe("MIME and Content-Type", () => {
  it("looks up by extension and by type", () => {
    assert.equal(mime.lookupExtension(".PDF")[0].type, "application/pdf");
    assert.ok(mime.lookupType("image/jpeg").length >= 2);
    assert.ok(mime.isCompressible("image/svg+xml"));
    assert.ok(!mime.isCompressible("image/png"));
  });
  it("detects files by their first bytes", () => {
    assert.equal(mime.sniffBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])).type, "image/png");
    assert.equal(mime.sniffBytes(new TextEncoder().encode("%PDF-1.7\n")).type, "application/pdf");
    assert.equal(mime.sniffBytes(new TextEncoder().encode('{"a":1}')).type, "application/json");
    assert.equal(mime.sniffBytes(new TextEncoder().encode("<svg xmlns='x'></svg>")).type, "image/svg+xml");
  });
  it("finds mistakes in a Content-Type", () => {
    assert.equal(mime.parseContentType("multipart/form-data").ok, false);
    assert.ok(mime.parseContentType("application/javascript").issues.some((i) => /obsolete/.test(i.text)));
    assert.equal(mime.parseContentType("application/vnd.api+json").suffix, "json");
  });
});

describe("Reference data", () => {
  it("status codes are unique and in range", () => {
    const codes = status.STATUS_CODES.map((s) => s.code);
    assert.equal(new Set(codes).size, codes.length);
    assert.ok(codes.every((c) => c >= 100 && c <= 599));
    assert.equal(status.getStatus(404).name, "Not Found");
    assert.equal(status.searchStatus("rate limit")[0].code, 429);
    assert.equal(status.searchStatus("payload too large")[0].code, 413);
  });
  it("method properties follow RFC 9110", () => {
    const m = Object.fromEntries(methods.HTTP_METHODS.map((x) => [x.name, x]));
    assert.ok(m.GET.safe && m.GET.idempotent);
    assert.ok(!m.POST.idempotent && !m.POST.safe);
    assert.ok(m.PUT.idempotent && !m.PUT.safe);
    assert.ok(m.DELETE.idempotent);
  });
  it("header generators write valid values", () => {
    const sec = gen.securityRecipe(gen.DEFAULT_SECURITY);
    assert.ok(sec.headers.some((h) => h.name === "Strict-Transport-Security" && /max-age=63072000/.test(h.value)));
    const cors = gen.corsRecipe({ ...gen.DEFAULT_CORS, origin: "*", credentials: true });
    assert.ok(cors.warnings.some((w) => /credentials/.test(w)));
    assert.equal(gen.contentDisposition("attachment", "café.pdf"), `attachment; filename="caf_.pdf"; filename*=UTF-8''caf%C3%A9.pdf`);
    assert.match(gen.renderHeaders(sec.headers, "nginx").code, /add_header X-Content-Type-Options "nosniff" always;/);
  });
});
