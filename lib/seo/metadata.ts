import type { Metadata } from "next";
import type { ToolDefinition } from "@/lib/tools/registry";
import { SEO_CONFIG, absoluteAssetUrl, absoluteUrl, normalizePath } from "./config";
import { toolPath } from "./routes";
import lastmodManifest from "./lastmod.json";

/** Kept for existing imports; new code should read SEO_CONFIG. */
export const SITE_CONFIG = {
  name: SEO_CONFIG.siteName,
  legalName: SEO_CONFIG.siteName,
  domain: SEO_CONFIG.origin,
  description: SEO_CONFIG.description,
};

const BRAND = SEO_CONFIG.siteName;
const BRAND_SUFFIX = new RegExp(`\\s*[|\\-–—]\\s*${BRAND}\\s*$`);

/** "JSON Formatter | TabBench" → "JSON Formatter". */
export function stripBrand(title: string): string {
  return title.replace(BRAND_SUFFIX, "").trim();
}

/**
 * `<title>`: the page title plus " | TabBench" when the whole thing fits in
 * ~60 characters, otherwise the page title alone. Never cut mid-word — the
 * old builder sliced at 57 characters and shipped titles ending "| TabB...".
 * Google shows the site name separately in results anyway, so dropping the
 * suffix from a long title costs nothing.
 */
export function buildTitle(title: string): string {
  const base = stripBrand(title);
  if (base.includes(BRAND)) return base; // "About TabBench", "TabBench – …"
  const branded = `${base} | ${BRAND}`;
  return branded.length <= SEO_CONFIG.titleMaxLength ? branded : base;
}

/** Meta description, trimmed on a word boundary only if a source string is over the limit. */
export function clampDescription(text: string, max: number = SEO_CONFIG.descriptionMaxLength): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–-]+$/, "")}…`;
}

const FINGERPRINTS = (lastmodManifest as { routes: Record<string, { fingerprint: string }> }).routes;

export interface SocialImage {
  /** Site path of the image, e.g. "/tools/json-formatter/opengraph-image". */
  path: string;
  /** Describes the card for people who cannot see it. */
  alt: string;
}

/**
 * The card for a route that ships an `opengraph-image.tsx`. Declared
 * explicitly (rather than left to the file convention) so it can carry a
 * real alt text instead of the static "TabBench" the convention allows. The
 * `v` parameter is the page's content fingerprint, so social networks
 * re-fetch the card when the page's text changes.
 */
export function routeSocialImage(pagePath: string, alt: string): SocialImage {
  const p = normalizePath(pagePath);
  const v = FINGERPRINTS[p]?.fingerprint?.slice(0, 8);
  return { path: `${p === "/" ? "" : p}/opengraph-image${v ? `?v=${v}` : ""}`, alt };
}

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  /** Defaults to the site-wide card. */
  socialImage?: SocialImage;
  /** "article" for guides; everything else is a website page. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** For utility pages that must stay out of the index (404 and similar). */
  noindex?: boolean;
}

/**
 * Metadata for any page. Every indexable page gets a self-referencing
 * absolute canonical on https://tabbench.com, matching og:url, a title that
 * fits, and a complete Open Graph / X card.
 *
 * No `keywords`: Google ignores the tag, and long keyword lists are
 * something Bing has said it treats as a spam signal. Keyword data in the
 * registry still powers on-site search.
 */
export function buildMetadata({
  title,
  description,
  path,
  socialImage,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = buildTitle(title);
  const shareTitle = stripBrand(title);
  const desc = clampDescription(description);
  const image = socialImage ?? {
    path: SEO_CONFIG.defaultOgImagePath,
    alt: `${BRAND} — free online tools that run in your browser`,
  };
  const images = [{ url: absoluteAssetUrl(image.path), width: 1200, height: 630, alt: image.alt, type: "image/png" }];

  return {
    // `absolute` opts out of the root layout's "%s | TabBench" template.
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: url },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: shareTitle,
      description: desc,
      url,
      siteName: BRAND,
      locale: SEO_CONFIG.locale,
      images,
      ...(type === "article"
        ? { type: "article", publishedTime, modifiedTime }
        : { type: "website" }),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: desc,
      images: images.map(({ url: u, alt }) => ({ url: u, alt })),
      ...(SEO_CONFIG.twitterHandle ? { site: SEO_CONFIG.twitterHandle } : {}),
    },
  };
}

/** Kept for existing callers. */
export function constructPageMetadata(input: PageMetadataInput): Metadata {
  return buildMetadata(input);
}

export function constructToolMetadata(tool: ToolDefinition): Metadata {
  const path = toolPath(tool.slug);
  return buildMetadata({
    title: tool.metaTitle?.trim() || tool.name,
    description: tool.metaDescription || tool.description,
    path,
    socialImage: routeSocialImage(path, `${tool.name} — ${tool.tagline}`),
  });
}
