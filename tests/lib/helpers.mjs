/** Loads TypeScript modules from lib/ for the logic tests (same loader the SEO tests use). */
import path from "node:path";
import { ROOT, importFrom } from "../../scripts/seo/lib/site.mjs";

export const load = (file) => importFrom(ROOT, path.join("lib", file));
export { ROOT };
