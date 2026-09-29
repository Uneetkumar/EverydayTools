/**
 * Copies browser runtime files that npm packages ship but bundlers do not
 * pick up (WebAssembly engines) into public/, so the site serves them itself
 * instead of from a third-party CDN.
 *
 * Runs before `next dev` and `next build`. The output folder is versioned by
 * package version, so it can be cached for a long time, and is git-ignored.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendor = path.join(root, "public", "vendor");

// MediaPipe face detection (Online Camera). Only the loaders a page can use:
// the SIMD build and the fallback for browsers without WebAssembly SIMD.
const mp = path.join(root, "node_modules", "@mediapipe", "tasks-vision");
const version = JSON.parse(readFileSync(path.join(mp, "package.json"), "utf8")).version;
const out = path.join(vendor, "mediapipe", version);
const files = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

// Drop copies left over from older package versions.
const mpRoot = path.join(vendor, "mediapipe");
if (existsSync(mpRoot)) {
  for (const dir of readdirSync(mpRoot)) if (dir !== version) rmSync(path.join(mpRoot, dir), { recursive: true, force: true });
}

mkdirSync(out, { recursive: true });
for (const f of files) copyFileSync(path.join(mp, "wasm", f), path.join(out, f));
console.log(`vendor: @mediapipe/tasks-vision ${version} → public/vendor/mediapipe/${version}`);
