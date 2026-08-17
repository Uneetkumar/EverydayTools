import type { Metadata } from "next";
import { ToolDefinition } from "@/lib/tools/registry";

export const SITE_CONFIG = {
  name: "EverydayTools",
  legalName: "EverydayTools Network",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://everydaytools-s.web.app",
  description:
    "Free, private, and instant browser calculators, PDF utilities, image converters, and developer tools.",
  twitterHandle: "@EverydayToolsHQ",
};

/**
 * Stable timestamp for sitemap `lastmod`. Using `new Date()` at build time
 * makes every URL look modified on every deploy, which burns crawl budget and
 * teaches Google to distrust the field. Bump this only when content changes.
 */
export const CONTENT_LAST_UPDATED = "2026-08-17T00:00:00.000Z";

/**
 * Open Graph and Twitter images come from the `opengraph-image` file
 * convention (see app/opengraph-image.tsx and app/tools/[slug]/opengraph-image.tsx),
 * which emits real PNGs. Do not set `openGraph.images` here — an explicit value
 * overrides the convention, and the previous SVG was ignored by every social
 * platform and by Google.
 */

export function constructToolMetadata(tool: ToolDefinition): Metadata {
  const url = `${SITE_CONFIG.domain}/tools/${tool.slug}`;
  const title = `${tool.metaTitle} | 100% Free for All`;
  const description = `${tool.metaDescription} 100% free to use for everyone — zero signup, unlimited access, and complete browser privacy.`;

  return {
    title,
    description,
    keywords: [
      ...tool.keywords,
      "100% free online tool",
      "free for all",
      "free online utility",
      "no login required",
      "no signup free tool",
      "unlimited free use",
      "private browser utility",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: SITE_CONFIG.twitterHandle,
    },
  };
}

export function constructPageMetadata({
  title,
  description,
  path = "",
  keywords = [],
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE_CONFIG.domain}${path}`;

  return {
    title,
    description,
    keywords: [
      ...keywords,
      "online tools",
      "free calculators",
      "web utilities",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: SITE_CONFIG.twitterHandle,
    },
  };
}
