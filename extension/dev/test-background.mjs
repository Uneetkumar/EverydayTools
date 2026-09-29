/*
 * Exercises the built background worker (extension/dist-dev/background.js)
 * against a stubbed chrome.* API: menu creation, every kind of right-click
 * hand-off, the content script's one-time collection, popup messages and the
 * address-bar keyword.
 *
 *   npm run ext:dev && node extension/dev/test-background.mjs
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const listeners = {};
const on = (name) => ({ addListener: (fn) => (listeners[name] = fn) });
const calls = [];
const session = new Map();
let executeResult = null;
let granted = false;

globalThis.chrome = {
  runtime: { onInstalled: on("installed"), onStartup: on("startup"), onMessage: on("message"), getURL: (p) => `chrome-extension://test/${p}` },
  storage: {
    onChanged: on("storageChanged"),
    sync: { get: async () => ({ settings: { openIn: "current-tab" } }), set: async () => {} },
    local: { get: async () => ({}), set: async (v) => calls.push(["local.set", v]), remove: async () => {} },
    session: {
      get: async (k) => (k === null ? Object.fromEntries(session) : session.has(k) ? { [k]: session.get(k) } : {}),
      set: async (o) => Object.entries(o).forEach(([k, v]) => session.set(k, v)),
      remove: async (k) => [].concat(k).forEach((x) => session.delete(x)),
    },
  },
  contextMenus: {
    removeAll: async () => calls.push(["menus.removeAll"]),
    create: (o) => calls.push(["menus.create", o]),
    onClicked: on("menuClick"),
  },
  tabs: {
    create: async (o) => calls.push(["tabs.create", o]),
    update: async (id, o) => calls.push(["tabs.update", id, o]),
    get: async (id) => ({ id, index: 3, url: "https://news.example.com/story" }),
  },
  scripting: { executeScript: async () => [{ result: executeResult }] },
  permissions: { contains: async () => granted },
  windows: { create: async (o) => calls.push(["windows.create", o]) },
  omnibox: { setDefaultSuggestion: () => {}, onInputChanged: on("omniChanged"), onInputEntered: on("omniEntered") },
};

await import(pathToFileURL(path.join(here, "../dist-dev/background.js")).href);
const tick = () => new Promise((r) => setTimeout(r, 30));
const last = (name) => [...calls].reverse().find((c) => c[0] === name);
const idFrom = (url) => url.match(/#tb-handoff=([a-f0-9]+)/)?.[1];
const tab = { id: 9, index: 2, url: "https://news.example.com/story?utm_source=x", title: "A story" };

// 1. Menus
listeners.installed();
await tick();
const menus = calls.filter((c) => c[0] === "menus.create");
assert.equal(menus.length, 19, "root + 18 items");
assert.ok(menus.every((m) => m[1].id === "tb" || m[1].parentId === "tb"));
console.log("✓ right-click menu: 18 actions under one TabBench entry");

// 2. Selected text keeps its line breaks (read from the page, not selectionText)
executeResult = "Line one\nLine two";
listeners.menuClick({ menuItemId: "tb:selection:word-counter", selectionText: "Line one Line two", frameId: 0 }, tab);
await tick();
let open = last("tabs.create")[1];
assert.match(open.url, /^http:\/\/localhost:3100\/tools\/word-counter\?utm_source=tabbench-extension&utm_medium=browser-extension#tb-handoff=[a-f0-9]{24}$/);
assert.equal(open.index, 3, "opens next to the current tab");
let id = idFrom(open.url);
assert.deepEqual(session.get(`handoff:${id}`).payload, { kind: "text", text: "Line one\nLine two" });
assert.ok(!open.url.includes("Line"), "content never goes in the URL");
console.log("✓ text → word counter, via session storage, not the URL");

// 3. Only a content script (a sender with a tab) can collect, and only once
let reply;
listeners.message({ type: "handoff:take", id }, {}, (r) => (reply = r));
assert.equal(reply, null, "extension pages cannot collect");
listeners.message({ type: "handoff:take", id }, { tab: { id: 1 } }, (r) => (reply = r));
await tick();
assert.equal(reply.slug, "word-counter");
listeners.message({ type: "handoff:take", id }, { tab: { id: 1 } }, (r) => (reply = r));
await tick();
assert.equal(reply, null, "single use");
console.log("✓ hand-off is collected once, by the site's content script only");

// 4. Link → QR
listeners.menuClick({ menuItemId: "tb:link:qr-code-generator", linkUrl: "https://example.org/a" }, tab);
await tick();
open = last("tabs.create")[1];
assert.deepEqual(session.get(`handoff:${idFrom(open.url)}`).payload, { kind: "url", url: "https://example.org/a" });
console.log("✓ link → QR code generator");

// 5. Summarise this page
executeResult = { title: "A story", text: "First paragraph.\n\nSecond paragraph." };
listeners.menuClick({ menuItemId: "tb:page:ai-text-summarizer" }, tab);
await tick();
open = last("tabs.create")[1];
assert.match(open.url, /\/tools\/ai-text-summarizer\?/);
assert.equal(session.get(`handoff:${idFrom(open.url)}`).payload.text, "A story\n\nFirst paragraph.\n\nSecond paragraph.");
console.log("✓ page → AI summarizer with the page's readable text");

// 6. Image from a data: URL (no permission needed)
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
listeners.menuClick({ menuItemId: "tb:image:image-resizer", srcUrl: `data:image/png;base64,${png}` }, tab);
await tick();
open = last("tabs.create")[1];
const file = session.get(`handoff:${idFrom(open.url)}`).payload;
assert.equal(file.kind, "file");
assert.equal(file.type, "image/png");
assert.equal(file.name, "image.png");
assert.equal(file.data, png);
console.log("✓ image → resizer, bytes handed over intact");

// 7. Image on another site without access → permission window, action kept pending
const realFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new TypeError("Failed to fetch");
};
listeners.menuClick({ menuItemId: "tb:image:image-compressor", srcUrl: "https://cdn.other.com/pic.jpg" }, tab);
await tick();
const win = last("windows.create")[1];
assert.match(win.url, /permission\.html\?id=[a-f0-9]+&origin=https%3A%2F%2Fcdn\.other\.com/);
const pendingId = new URL(win.url).searchParams.get("id");
assert.equal(session.get(`pending:${pendingId}`).srcUrl, "https://cdn.other.com/pic.jpg");
console.log("✓ image on another site → asks for access to that site only");

// …and after access is granted, retrying completes the hand-off
granted = true;
globalThis.fetch = async () => new Response(Buffer.from(png, "base64"), { headers: { "content-type": "image/jpeg" } });
listeners.message({ type: "pending:retry", id: pendingId }, {}, () => {});
await tick();
open = last("tabs.create")[1];
assert.match(open.url, /\/tools\/image-compressor\?/);
assert.equal(session.get(`handoff:${idFrom(open.url)}`).payload.name, "pic.jpg");
globalThis.fetch = realFetch;
console.log("✓ retry after permission sends the image on");

// 8. Popup: open a tool in the current tab (setting), no content
listeners.message({ type: "open-tool", slug: "gst-calculator", tabId: 5 }, {}, () => {});
await tick();
const upd = last("tabs.update");
assert.equal(upd[1], 5);
assert.match(upd[2].url, /\/tools\/gst-calculator\?utm_source/);
console.log("✓ popup opens tools in the current tab when set to");

// Unknown tools are ignored rather than opening a 404
const before = calls.length;
listeners.message({ type: "open-tool", slug: "not-a-tool" }, {}, () => {});
await tick();
assert.equal(calls.filter((c, i) => i >= before && (c[0] === "tabs.create" || c[0] === "tabs.update")).length, 0);
console.log("✓ unknown tool slugs are ignored");

// 9. Address bar
let suggestions;
listeners.omniChanged("calc", (s) => (suggestions = s));
assert.equal(suggestions[0].content, "tool:calculator");
assert.match(suggestions[0].description, /<match>Calculator<\/match>/);
listeners.omniChanged("<b>", (s) => (suggestions = s));
assert.ok(suggestions.every((s) => !s.description.includes("<b>")), "input is escaped");
listeners.omniEntered("age", "newForegroundTab");
await tick();
assert.match(last("tabs.create")[1].url, /\/tools\/age-calculator\?/);
console.log("✓ address bar: tb calc → Calculator, tb age → Age Calculator");

console.log("\nAll background checks passed.");
