/**
 * Builds the TabBench browser extension.
 *
 *   node extension/scripts/build.mjs            store build → extension/dist + release zip
 *   node extension/scripts/build.mjs --dev      points at http://localhost:3100 → extension/dist-dev
 *   node extension/scripts/build.mjs --preview  popup as a plain web page with a fake chrome API → extension/dist-preview
 *
 * The tool list, icons and search ranking come from the site's own source
 * (lib/tools/registry.ts, lib/tools/visuals.ts, components/tool/tool-icon.tsx,
 * lib/tools/search.ts), so the extension never drifts from the site.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import sharp from "sharp";
import { createJiti } from "jiti";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const VERSION = "1.0.0";

const here = path.dirname(fileURLToPath(import.meta.url));
const ext = path.resolve(here, "..");
const root = path.resolve(ext, "..");
const src = path.join(ext, "src");
const args = new Set(process.argv.slice(2));
const mode = args.has("--preview") ? "preview" : args.has("--dev") ? "dev" : "store";
const out = path.join(ext, mode === "store" ? "dist" : `dist-${mode}`);
const SITE_URL = process.env.EXT_SITE_URL || (mode === "store" ? "https://tabbench.com" : "http://localhost:3100");

const log = (msg) => console.log(`  ${msg}`);
console.log(`\nTabBench extension ${VERSION} · ${mode} build · site ${SITE_URL}`);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "icons"), { recursive: true });

/* ------------------------------------------------------------------ */
/* 1. Tool data and icons from the site's source                       */
/* ------------------------------------------------------------------ */

const jiti = createJiti(import.meta.url, { alias: { "@": root } });
const { getAllTools, TOOL_CATEGORIES, POPULAR_TOOL_SLUGS } = await jiti.import(path.join(root, "lib/tools/registry.ts"));
const { categoryTone, TOOL_BADGES } = await jiti.import(path.join(root, "lib/tools/visuals.ts"));
const { getToolIcon } = await jiti.import(path.join(root, "components/tool/tool-icon.tsx"));
const lucide = await import("lucide-react");

const tools = getAllTools().map((t) => {
  const tone = categoryTone(t.category);
  return {
    slug: t.slug,
    name: t.name,
    shortName: t.shortName,
    tagline: t.tagline,
    description: t.description,
    category: t.category,
    categoryName: t.categoryName,
    keywords: t.keywords,
    aliases: t.aliases ?? [],
    features: t.features ?? [],
    ...(t.isPopular ? { isPopular: true } : {}),
    iconName: t.iconName,
    tone: tone.tile,
    ...(TOOL_BADGES[t.slug] ? { badge: TOOL_BADGES[t.slug], badgeTone: tone.badge } : {}),
  };
});
const categories = TOOL_CATEGORIES.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, icon: c.icon, tone: categoryTone(c.id).tile }));

// Icons the popup's own controls use, by lucide name.
const UI_ICONS = [
  "Search", "Settings", "ExternalLink", "QrCode", "Link2", "Sparkles", "ArrowLeft", "ArrowRight", "ArrowUpRight", "Copy",
  "Download", "Check", "Globe", "ShieldCheck", "CornerDownLeft", "MousePointerClick", "Wrench",
];
const svgFor = (Icon) =>
  renderToStaticMarkup(createElement(Icon, { size: 24, "aria-hidden": "true" })).replace(/ class="[^"]*"/, "");
const icons = {};
for (const name of new Set([...tools.map((t) => t.iconName), ...categories.map((c) => c.icon)])) icons[name] = svgFor(getToolIcon(name));
for (const name of UI_ICONS) {
  if (!lucide[name]) throw new Error(`Unknown lucide icon: ${name}`);
  icons[name] = svgFor(lucide[name]);
}

const generated = path.join(src, "generated");
fs.mkdirSync(generated, { recursive: true });
fs.writeFileSync(path.join(generated, "tools.json"), JSON.stringify({ tools, categories, popular: POPULAR_TOOL_SLUGS }));
fs.writeFileSync(path.join(generated, "icons.json"), JSON.stringify(icons));
log(`${tools.length} tools, ${Object.keys(icons).length} icons`);

/* ------------------------------------------------------------------ */
/* 2. Scripts                                                          */
/* ------------------------------------------------------------------ */

const common = {
  bundle: true,
  target: "chrome116",
  minify: mode === "store",
  sourcemap: mode === "store" ? false : "inline",
  legalComments: "none",
  define: { __SITE_URL__: JSON.stringify(SITE_URL), __VERSION__: JSON.stringify(VERSION) },
  logLevel: "warning",
};
// Extension pages and the worker are ES modules; content and preload scripts must be classic.
await build({ ...common, format: "esm", entryPoints: ["background", "popup", "permission"].map((n) => path.join(src, `${n}.ts`)), outdir: out });
await build({ ...common, format: "iife", entryPoints: ["content", "theme-preload"].map((n) => path.join(src, `${n}.ts`)), outdir: out });
log("scripts bundled");

/* ------------------------------------------------------------------ */
/* 3. Styles, pages, fonts                                             */
/* ------------------------------------------------------------------ */

const cssIn = path.join(src, "styles.css");
const css = await postcss([tailwind({ base: src, optimize: mode === "store" ? { minify: true } : false })]).process(fs.readFileSync(cssIn, "utf8"), {
  from: cssIn,
  to: path.join(out, "styles.css"),
});
fs.writeFileSync(path.join(out, "styles.css"), css.css);
log(`styles ${(css.css.length / 1024).toFixed(1)} KB`);

fs.cpSync(path.join(src, "fonts"), path.join(out, "fonts"), { recursive: true });
for (const page of ["popup.html", "permission.html"]) {
  let html = fs.readFileSync(path.join(src, page), "utf8");
  if (mode === "preview") html = html.replace('<script src="theme-preload.js"></script>', '<script src="chrome-mock.js"></script>\n    <script src="theme-preload.js"></script>');
  fs.writeFileSync(path.join(out, page), html);
}
if (mode === "preview") fs.copyFileSync(path.join(ext, "dev/chrome-mock.js"), path.join(out, "chrome-mock.js"));

/* ------------------------------------------------------------------ */
/* 4. Icons: the site's logo mark (lib/brand/mark.ts)              */
/* ------------------------------------------------------------------ */

const { MARK, markSvgBody } = await jiti.import(path.join(root, "lib/brand/mark.ts"));
const mark = (size, pad) => {
  const s = (size - pad * 2) / MARK.size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g transform="translate(${pad} ${pad}) scale(${s})">${markSvgBody()}</g></svg>`;
};
// Toolbar sizes are full-bleed; the store icon keeps the recommended transparent margin.
for (const [size, pad] of [[16, 0], [32, 0], [48, 2], [128, 8]]) {
  await sharp(Buffer.from(mark(size, pad)), { density: 300 }).resize(size, size).png().toFile(path.join(out, "icons", `icon-${size}.png`));
}
log("icons rendered");

/* ------------------------------------------------------------------ */
/* 5. Manifest                                                         */
/* ------------------------------------------------------------------ */

const siteMatch = `${new URL(SITE_URL).origin}/*`;
const manifest = {
  manifest_version: 3,
  name: "TabBench – Free Online Tools",
  short_name: "TabBench",
  version: VERSION,
  description:
    "Search TabBench's free tools from any page, make QR codes, clean links, and send text or images straight to the right tool.",
  homepage_url: SITE_URL,
  minimum_chrome_version: "116",
  icons: { 16: "icons/icon-16.png", 32: "icons/icon-32.png", 48: "icons/icon-48.png", 128: "icons/icon-128.png" },
  action: {
    default_title: "TabBench tools",
    default_popup: "popup.html",
    default_icon: { 16: "icons/icon-16.png", 32: "icons/icon-32.png" },
  },
  background: { service_worker: "background.js", type: "module" },
  permissions: ["activeTab", "contextMenus", "scripting", "storage"],
  optional_host_permissions: ["https://*/*", "http://*/*"],
  content_scripts: [{ matches: [siteMatch], js: ["content.js"], run_at: "document_idle" }],
  omnibox: { keyword: "tb" },
  commands: {
    _execute_action: {
      suggested_key: { default: "Alt+Shift+K", mac: "Command+Shift+K" },
      description: "Open TabBench",
    },
  },
};
if (mode !== "preview") fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

/* ------------------------------------------------------------------ */
/* 6. Store package                                                    */
/* ------------------------------------------------------------------ */

if (mode === "store") {
  const release = path.join(ext, "release");
  fs.mkdirSync(release, { recursive: true });
  const zip = path.join(release, `tabbench-extension-${VERSION}.zip`);
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", zip, "."], { cwd: out });
  log(`package ${path.relative(root, zip)} (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)`);
}

console.log(`Done → ${path.relative(root, out)}\n`);
