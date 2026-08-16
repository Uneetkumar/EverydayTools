import type { Metadata } from "next";
import { ToolDefinition } from "@/lib/tools/registry";

export const SITE_CONFIG = {
  name: "EverydayTools",
  legalName: "EverydayTools Network",
  domain: "https://everydaytools.io",
  description: "Fast, privacy-focused online calculators, text formatters, and developer utilities.",
  twitterHandle: "@EverydayToolsHQ",
};

export function constructToolMetadata(tool: ToolDefinition): Metadata {
  const url = `${SITE_CONFIG.domain}/tools/${tool.slug}`;

  return {
    title: `${tool.metaTitle} | ${SITE_CONFIG.name}`,
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url: url,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.metaTitle,
      description: tool.metaDescription,
      creator: SITE_CONFIG.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
    keywords: [...keywords, "online tools", "free calculators", "web utilities"],
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
