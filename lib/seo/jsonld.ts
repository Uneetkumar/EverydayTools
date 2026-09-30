import type { ToolCategoryId, ToolDefinition } from "@/lib/tools/registry";
import type { ToolContent } from "@/lib/tools/content";
import type { Guide } from "@/lib/guides/content";
import { SEO_CONFIG, absoluteUrl } from "./config";
import { getLastmod, guidePath, toolPath } from "./routes";

/**
 * JSON-LD generators. Rules every generator here follows:
 *
 * - Describe only what is visibly on the page. FAQ markup mirrors the FAQ
 *   the page renders; breadcrumbs come from the visible trail
 *   (components/Breadcrumbs.tsx).
 * - No invented facts. No `aggregateRating`/`review` (there are no collected
 *   reviews — self-serving review markup is a manual-action risk), no made-up
 *   `softwareVersion`, and dates only where they are real: guide dates are
 *   editorial, `dateModified` comes from lib/seo/lastmod.json.
 * - Entities are linked by @id (#organization, #website) instead of repeating
 *   the publisher on every page.
 *
 * Tool pages use WebApplication. Google only shows software rich results
 * with ratings, so these will not produce a rich result — they are there so
 * the page is understood as a free, in-browser application.
 */

const ORG_ID = `${SEO_CONFIG.origin}/#organization`;
const WEBSITE_ID = `${SEO_CONFIG.origin}/#website`;

type JsonLdNode = Record<string, unknown>;

/**
 * JSON for a <script type="application/ld+json">. Escapes `<`, `>` and `&`
 * so no string in the data (a FAQ answer mentioning "</script>", say) can
 * close the tag early and inject markup.
 */
export function serializeJsonLd(data: unknown): string {
  // U+2028/U+2029 are valid in JSON but end a line in older JS parsers.
  const LS = String.fromCharCode(0x2028);
  const PS = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LS).join("\\u2028")
    .split(PS).join("\\u2029");
}

export function generateOrganizationJsonLd(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.origin,
    description: SEO_CONFIG.description,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SEO_CONFIG.logoPath),
      width: 512,
      height: 512,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
    },
    ...(SEO_CONFIG.sameAs.length ? { sameAs: [...SEO_CONFIG.sameAs] } : {}),
  };
}

export function generateWebsiteJsonLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.origin,
    description: SEO_CONFIG.description,
    inLanguage: SEO_CONFIG.language,
    publisher: { "@id": ORG_ID },
    // /tools reads ?q= and filters the directory (components/tool/tool-directory.tsx).
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SEO_CONFIG.origin}/tools?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** The site-wide graph, emitted once per page by the root layout. */
export function generateSiteGraph(): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": [generateOrganizationJsonLd(), generateWebsiteJsonLd()] };
}

/** schema.org applicationCategory values Google documents for software apps. */
const APP_CATEGORY: Record<ToolCategoryId, string> = {
  calculators: "UtilitiesApplication",
  business: "BusinessApplication",
  "date-time": "UtilitiesApplication",
  text: "UtilitiesApplication",
  developer: "DeveloperApplication",
  "image-media": "MultimediaApplication",
  "pdf-docs": "UtilitiesApplication",
  security: "SecurityApplication",
  "ai-tools": "UtilitiesApplication",
  "api-http": "DeveloperApplication",
  "random-fun": "UtilitiesApplication",
};

export function generateToolJsonLd(tool: ToolDefinition, content?: ToolContent) {
  const url = absoluteUrl(toolPath(tool.slug));
  const dateModified = getLastmod(toolPath(tool.slug));

  const webAppSchema: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: tool.name,
    url,
    description: tool.description,
    applicationCategory: APP_CATEGORY[tool.category] ?? "UtilitiesApplication",
    applicationSubCategory: tool.categoryName,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    image: absoluteUrl(`${toolPath(tool.slug)}/opengraph-image`),
    isAccessibleForFree: true,
    // Every tool is free with no paid tier; this is a statement of fact.
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: tool.features,
    inLanguage: SEO_CONFIG.language,
    ...(dateModified ? { dateModified } : {}),
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
  };

  // Registry FAQs plus the long-form ones — exactly what ToolShell renders.
  const faqSchema = generateFaqJsonLd([...tool.faqs, ...(content?.extraFaqs ?? [])], url);

  return { webAppSchema, faqSchema };
}

export function generateArticleJsonLd(guide: Guide): JsonLdNode {
  const path = guidePath(guide.slug);
  const url = absoluteUrl(path);
  // The sitemap date also moves when the guide text changes without a bumped
  // `updated`; use whichever is later so the two never disagree.
  const modified = [guide.updated, getLastmod(path)].filter((d): d is string => !!d).sort().at(-1);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.title,
    description: guide.metaDescription,
    url,
    image: absoluteUrl(`${path}/opengraph-image`),
    datePublished: guide.published,
    dateModified: modified,
    inLanguage: SEO_CONFIG.language,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
  };
}

/** Collection / listing schema for the tools hub and category pages. */
export function generateCollectionJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string;
  url: string;
  items: { name: string; path: string }[];
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    description,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}

export function generateFaqJsonLd(faqs: { question: string; answer: string }[], pageUrl: string): JsonLdNode | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/**
 * BreadcrumbList for a visible trail. Called by components/Breadcrumbs.tsx
 * with the same items it renders, so the two cannot drift apart. The last
 * crumb (the current page) may omit its URL, as Google's spec allows.
 */
export function generateBreadcrumbJsonLd(crumbs: { name: string; path?: string }[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path !== undefined ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  };
}
