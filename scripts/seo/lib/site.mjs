/**
 * Loads the site's TypeScript registries (tools, guides, categories, SEO
 * routes) into plain Node scripts, with the `@/` alias resolved.
 * Same approach as extension/scripts/build.mjs, so the scripts read exactly
 * the data the pages are built from instead of a hand-kept copy.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** Import a TS module from a source tree (the repo, or a git snapshot of it). */
export function importFrom(root, file) {
  const jiti = createJiti(path.join(root, "package.json"), {
    alias: { "@": root },
    moduleCache: false,
    fsCache: false,
    interopDefault: true,
  });
  return jiti.import(path.join(root, file));
}

/** The registries as they are in the working tree. */
export async function loadSite(root = ROOT) {
  // The /convert currency-pair pages (lib/currency/pairs.ts) were merged into
  // the currency converter in Oct 2026; firebase.json 301-redirects them.
  const [registry, content, categoryContent, guides, routes] = await Promise.all([
    importFrom(root, "lib/tools/registry.ts"),
    importFrom(root, "lib/tools/content.ts"),
    importFrom(root, "lib/tools/categoryContent.ts"),
    importFrom(root, "lib/guides/content.ts"),
    importFrom(root, "lib/seo/routes.ts"),
  ]);
  return { registry, content, categoryContent, guides, routes };
}
