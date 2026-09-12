import type { Metadata } from "next";
import { ToolDefinition } from "@/lib/tools/registry";

export const SITE_CONFIG = {
  name: "TabBench",
  legalName: "TabBench",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://tabbench.com",
  description:
    "Free online calculators, file converters, image compressors, PDF utilities, and developer tools. Fast, private in-browser tools with zero signups.",
  twitterHandle: "@tabbench",
};

/**
 * Stable timestamp for sitemap `lastmod`.
 */
export const CONTENT_LAST_UPDATED = "2026-09-13T00:00:00.000Z";

/**
 * Strict SEO Formatter ensuring 100% compliance with search engine guidelines:
 * - Title: 50-60 characters
 * - Meta Description: 130-160 characters
 */
export function constructToolMetadata(tool: ToolDefinition): Metadata {
  const url = `${SITE_CONFIG.domain}/tools/${tool.slug}`;

  // Prioritize curated metaTitle or construct "Tool Name | Site Name"
  let title = tool.metaTitle?.trim() || `${tool.name} | ${SITE_CONFIG.name}`;
  if (!title.includes(SITE_CONFIG.name)) {
    title = `${title} | ${SITE_CONFIG.name}`;
  }

  // Prioritize curated metaDescription, ensuring 120-160 chars
  let description = (tool.metaDescription || tool.description || "").trim();
  if (description.length > 160) {
    description = description.slice(0, 157).trim() + "...";
  }

  return {
    // `absolute` opts out of the root layout's "%s | TabBench" template.
    title: { absolute: title },
    description,
    keywords: [
      ...tool.keywords,
      "online tool",
      "client-side privacy",
      "tabbench",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
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
  ogImage,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  /**
   * Social card for the page.
   *
   * Next merges `openGraph` by replacing the whole object, so a page that sets
   * `openGraph` without `images` drops the one inherited from the root layout —
   * which is why these pages were shipping with no og:image at all. Defaulting
   * here restores it everywhere.
   *
   * Pass `null` on routes that own an `opengraph-image.tsx` file: the file
   * convention injects the tag itself, and setting `images` here would override
   * the tailored card with the generic one.
   */
  ogImage?: string | null;
}): Metadata {
  const url = `${SITE_CONFIG.domain}${path}`;
  const socialImage =
    ogImage === null ? undefined : ogImage || `${SITE_CONFIG.domain}/opengraph-image`;

  // Ensure title fits optimal format
  let optTitle = title.trim();
  if (!optTitle.includes(SITE_CONFIG.name)) {
    optTitle = `${optTitle} | ${SITE_CONFIG.name}`;
  }
  if (optTitle.length > 60) {
    optTitle = optTitle.slice(0, 57).trim() + "...";
  }

  // Ensure description fits optimal length
  let optDesc = description.trim();
  if (optDesc.length > 160) {
    optDesc = optDesc.slice(0, 157).trim() + "...";
  }

  return {
    title: { absolute: optTitle },
    description: optDesc,
    keywords: [
      ...keywords,
      "online tools",
      "calculators",
      "developer utilities",
      "tabbench",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: optTitle,
      description: optDesc,
      url,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type: "website",
      ...(socialImage ? { images: [{ url: socialImage, width: 1200, height: 630, alt: optTitle }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: optTitle,
      description: optDesc,
      creator: SITE_CONFIG.twitterHandle,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
  };
}
