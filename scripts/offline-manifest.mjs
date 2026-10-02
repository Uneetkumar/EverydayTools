/**
 * Lists what a device needs to use TabBench offline, after `next build`.
 *
 * Writes out/offline-manifest.json, which the service worker and the "Use
 * offline" page read, and stamps the build's version into out/sw.js so each
 * deploy gets a fresh page cache.
 *
 *   core     the app's code and styles (every /_next/static file), icons and
 *            the tool index: what any page needs to start
 *   pages    the home page, hubs, categories and every tool page
 *   packs    the heavy engines a few tools load on demand (video, OCR, PDF
 *            rendering, camera). Each file carries a hash, so the service
 *            worker can drop a cached engine when the file changes.
 *
 * Nothing is downloaded because this file exists: a visitor's device saves
 * pages as they are opened, and saves everything only when asked to on /offline.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "out");
if (!existsSync(out)) {
  console.error("offline-manifest: out/ not found. Run `next build` first.");
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const url = (file) => "/" + path.relative(out, file).split(path.sep).join("/");
const size = (file) => statSync(file).size;
const hash = (file) => createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 12);

/** Engines that only some tools load, and which tools those are. */
const PACKS = [
  { id: "pdf", label: "PDF renderer", note: "Previews and converts PDF pages", paths: ["pdfjs", "pdf.worker.min.mjs"], tools: ["pdf-editor", "pdf-to-jpg", "pdf-to-word", "unlock-pdf"], suggested: true },
  { id: "ocr", label: "Text recognition", note: "Reads text in images (English)", paths: ["tesseract"], tools: ["image-to-text"], suggested: true },
  { id: "video", label: "Video engine", note: "Cuts video and removes audio", paths: ["ffmpeg"], tools: ["video-cutter", "audio-remover"], suggested: false },
  { id: "camera", label: "Camera face detection", note: "Face-aware exposure in the camera", paths: ["vendor/mediapipe", "models"], tools: ["online-camera"], suggested: false },
];

const filesUnder = (rel) => {
  const p = path.join(out, rel);
  if (!existsSync(p)) return [];
  return statSync(p).isDirectory() ? walk(p) : [p];
};

// ---- core
const staticFiles = filesUnder("_next/static").filter((f) => !f.endsWith(".map"));
const extras = ["tool-index.json", "manifest.webmanifest", "icon.svg", "favicon.ico", "apple-icon", "icons"].flatMap(filesUnder);
const core = [...staticFiles, ...extras].map((f) => ({ url: url(f), bytes: size(f) }));

// ---- pages: exported HTML, served by Firebase without the .html extension
const htmlUrl = (rel) => (rel === "index.html" ? "/" : "/" + rel.replace(/\.html$/, ""));
const pageFiles = [
  "index.html",
  "tools.html",
  "categories.html",
  "offline.html",
  ...readdirSync(path.join(out, "categories")).filter((f) => f.endsWith(".html")).map((f) => `categories/${f}`),
  ...readdirSync(path.join(out, "tools")).filter((f) => f.endsWith(".html")).map((f) => `tools/${f}`),
].filter((rel) => existsSync(path.join(out, rel)));
const pages = pageFiles.map((rel) => ({ url: htmlUrl(rel), bytes: size(path.join(out, rel)) }));

// ---- packs
const packs = PACKS.map((p) => {
  const files = p.paths.flatMap(filesUnder).map((f) => ({ url: url(f), bytes: size(f), hash: hash(f) }));
  return { id: p.id, label: p.label, note: p.note, tools: p.tools, suggested: p.suggested, bytes: files.reduce((s, f) => s + f.bytes, 0), files };
}).filter((p) => p.files.length > 0);

// The version changes whenever anything a device would cache changes.
const version = createHash("sha1")
  .update(JSON.stringify([core.map((c) => c.url), pages.map((p) => [p.url, p.bytes]), packs.map((p) => p.files.map((f) => f.hash))]))
  .digest("hex")
  .slice(0, 10);

const manifest = {
  version,
  builtAt: new Date().toISOString(),
  core,
  pages,
  packs,
  bytes: { core: core.reduce((s, f) => s + f.bytes, 0), pages: pages.reduce((s, f) => s + f.bytes, 0) },
};
writeFileSync(path.join(out, "offline-manifest.json"), JSON.stringify(manifest));

const sw = path.join(out, "sw.js");
const swSource = readFileSync(sw, "utf8");
if (!swSource.includes("__OFFLINE_VERSION__")) {
  console.error("offline-manifest: out/sw.js has no __OFFLINE_VERSION__ placeholder.");
  process.exit(1);
}
writeFileSync(sw, swSource.replaceAll("__OFFLINE_VERSION__", version));

const mb = (b) => `${(b / 1e6).toFixed(1)} MB`;
console.log(
  `offline: ${version} · ${pages.length} pages ${mb(manifest.bytes.pages)} · core ${core.length} files ${mb(manifest.bytes.core)} · ` +
    packs.map((p) => `${p.id} ${mb(p.bytes)}`).join(" · ")
);
