/**
 * Build-time constants. `__SITE_URL__` is replaced by esbuild: the live site
 * for store builds, a local server for `--dev` builds.
 */
declare const __SITE_URL__: string;
declare const __VERSION__: string;

export const SITE_URL: string = __SITE_URL__;
export const VERSION: string = __VERSION__;

/**
 * Links opened by the extension carry these tags so the site's analytics can
 * tell extension visits apart. No user data is ever put in a URL.
 */
const UTM = "utm_source=tabbench-extension&utm_medium=browser-extension";

export function toolUrl(slug: string, handoffId?: string): string {
  const hash = handoffId ? `#tb-handoff=${handoffId}` : "";
  return `${SITE_URL}/tools/${slug}?${UTM}${hash}`;
}

export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path}${path.includes("?") ? "&" : "?"}${UTM}`;
}
