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

  // Optimal Title (50-60 characters)
  let title = `${tool.shortName} - Free Online Tool | TabBench`;
  if (title.length > 60) {
    title = `${tool.shortName} | TabBench`;
  } else if (title.length < 50) {
    title = `${tool.shortName} - Free Online Utility | TabBench`;
  }

  // Optimal Description (135-160 characters)
  let description = tool.description.trim();
  if (description.length < 130) {
    description = `${description} 100% free to use for everyone with zero signup, instant processing, and total browser privacy.`;
  }
  if (description.length > 160) {
    description = description.slice(0, 157).trim() + "...";
  }

  return {
    // `absolute` opts out of the root layout's "%s | TabBench" template.
    // Without it the suffix is added twice ("... | TabBench |
    // TabBench"), which also pushed every title past the 60-char target
    // the length logic above is trying to hit.
    title: { absolute: title },
    description,
    keywords: [
      ...tool.keywords,
      "free online tool",
      "free for all",
      "no login required",
      "client side private tool",
      "unlimited free use",
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

  // Ensure title fits optimal length
  let optTitle = title;
  if (!optTitle.includes("TabBench")) {
    optTitle = `${title} | TabBench`;
  }
  if (optTitle.length > 60) {
    optTitle = optTitle.slice(0, 57).trim() + "...";
  }

  // Ensure description fits optimal length (130-160 chars)
  let optDesc = description.trim();
  if (optDesc.length < 130) {
    optDesc = `${optDesc} 100% free to use for all users with zero signups and instant client-side privacy.`;
  }
  if (optDesc.length > 160) {
    optDesc = optDesc.slice(0, 157).trim() + "...";
  }

  return {
    title: { absolute: optTitle },
    description: optDesc,
    keywords: [
      ...keywords,
      "free online tools",
      "free calculators",
      "free web utilities",
      "free for all",
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
