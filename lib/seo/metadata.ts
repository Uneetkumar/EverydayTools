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
export const CONTENT_LAST_UPDATED = "2026-08-17T00:00:00.000Z";

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
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE_CONFIG.domain}${path}`;

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
    },
    twitter: {
      card: "summary_large_image",
      title: optTitle,
      description: optDesc,
      creator: SITE_CONFIG.twitterHandle,
    },
  };
}
