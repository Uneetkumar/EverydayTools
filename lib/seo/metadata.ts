import type { Metadata } from "next";
import { ToolDefinition } from "@/lib/tools/registry";

export const SITE_CONFIG = {
  name: "EverydayTools",
  legalName: "EverydayTools Network",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://everydaytools-s.web.app",
  description: "Free, private, and instant browser calculators, PDF utilities, image converters, and developer tools.",
  twitterHandle: "@EverydayToolsHQ",
  ogImage: "https://everydaytools-s.web.app/og-image.svg",
};

export function constructToolMetadata(tool: ToolDefinition): Metadata {
  const url = `${SITE_CONFIG.domain}/tools/${tool.slug}`;

  return {
    title: `${tool.metaTitle} | ${SITE_CONFIG.name}`,
    description: tool.metaDescription,
    keywords: [
      ...tool.keywords,
      "free online tool",
      "instant calculator",
      "no login required",
      "private browser utility",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tool.metaTitle} - Fast & Free | ${SITE_CONFIG.name}`,
      description: tool.metaDescription,
      url: url,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${tool.name} - EverydayTools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tool.metaTitle,
      description: tool.metaDescription,
      creator: SITE_CONFIG.twitterHandle,
      images: [SITE_CONFIG.ogImage],
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
    keywords: [
      ...keywords,
      "online tools",
      "free calculators",
      "web utilities",
      "file converters",
      "developer utilities",
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
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - EverydayTools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: SITE_CONFIG.twitterHandle,
      images: [SITE_CONFIG.ogImage],
    },
  };
}
