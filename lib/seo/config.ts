/**
 * The one place site-wide SEO facts live. Metadata, canonicals, JSON-LD, the
 * sitemaps, robots.txt and the post-build checks all read from here, so a
 * change (a new official profile, say) is made once.
 *
 * Only put verifiable facts here. `sameAs` and `twitterHandle` are empty on
 * purpose: linking an account TabBench does not control — or one that
 * belongs to someone else with the same name — is a false identity claim,
 * and Google uses these fields to decide which entity the site is.
 */
export const SEO_CONFIG = {
  siteName: "TabBench",
  /**
   * The canonical origin. Deliberately a constant and not an environment
   * variable: a stray `.env` with a preview or localhost URL would otherwise
   * be baked into every canonical, og:url and sitemap entry at build time.
   */
  origin: "https://tabbench.com",
  language: "en",
  locale: "en_US",
  description:
    "Free online calculators, file converters, image compressors, PDF utilities, and developer tools. Fast, private in-browser tools with zero signups.",
  /** Brand suffix is appended only while the whole title fits in this many characters. */
  titleMaxLength: 60,
  descriptionMaxLength: 160,
  /** Official, TabBench-controlled profiles only (e.g. "https://x.com/<handle>"). */
  sameAs: [] as string[],
  /** Set to the "@handle" once TabBench owns it; emitted as twitter:site. */
  twitterHandle: undefined as string | undefined,
  /** Square PNG used as the Organization logo (Google wants a raster, ≥112px). */
  logoPath: "/icons/icon-512.png",
  defaultOgImagePath: "/opengraph-image",
  /**
   * Hosts Firebase serves this project on that must never be indexed. See
   * lib/seo/canonical-host.ts for how they are handled.
   */
  firebaseProjectId: "everydaytools-s",
} as const;

export const CANONICAL_ORIGIN = SEO_CONFIG.origin;

/** Absolute canonical URL for a site path ("/tools/x" → "https://tabbench.com/tools/x"). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = normalizePath(path);
  return clean === "/" ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${clean}`;
}

/** Absolute URL for a file (image, icon) — keeps its query string, unlike absoluteUrl. */
export function absoluteAssetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${CANONICAL_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The URL shape Firebase serves (`cleanUrls: true`, `trailingSlash: false`):
 * leading slash, no trailing slash, no query or fragment. Anything else is a
 * redirect or a duplicate.
 */
export function normalizePath(path: string): string {
  let p = (path || "/").split(/[?#]/)[0];
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}
