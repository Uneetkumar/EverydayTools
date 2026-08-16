import { ToolDefinition } from "@/lib/tools/registry";
import { ToolContent } from "@/lib/tools/content";
import { SITE_CONFIG } from "./metadata";

/**
 * NOTE ON RATINGS: we deliberately do not emit `aggregateRating`. Google's
 * structured data policy prohibits self-serving review markup that is not
 * backed by genuine, collected reviews, and fabricated ratings are a common
 * cause of manual actions. If real reviews are ever collected, this is where
 * the markup belongs.
 */

export function generateToolJsonLd(tool: ToolDefinition, content?: ToolContent) {
  const toolUrl = `${SITE_CONFIG.domain}/tools/${tool.slug}`;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${toolUrl}#app`,
    name: tool.name,
    url: toolUrl,
    description: tool.description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: tool.features,
    inLanguage: "en",
    publisher: {
      "@id": `${SITE_CONFIG.domain}/#organization`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_CONFIG.domain,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "All Tools",
        item: `${SITE_CONFIG.domain}/tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.categoryName,
        item: `${SITE_CONFIG.domain}/categories/${tool.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: toolUrl,
      },
    ],
  };

  // Registry FAQs plus the long-form ones, so the markup matches what is
  // actually rendered on the page — required for FAQ rich results.
  const allFaqs = [...tool.faqs, ...(content?.extraFaqs ?? [])];

  const faqSchema =
    allFaqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${toolUrl}#faq`,
          mainEntity: allFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return {
    webAppSchema,
    breadcrumbSchema,
    faqSchema,
  };
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_CONFIG.domain}/#organization`,
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.domain,
    description: SITE_CONFIG.description,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_CONFIG.domain}/icon.svg`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_CONFIG.domain}/contact`,
      availableLanguage: ["English"],
    },
  };
}

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_CONFIG.domain}/#website`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.domain,
    description: SITE_CONFIG.description,
    inLanguage: "en",
    publisher: {
      "@id": `${SITE_CONFIG.domain}/#organization`,
    },
  };
}

/** Collection / listing schema for the tools hub and category pages. */
export function generateCollectionJsonLd({
  name,
  description,
  url,
  tools,
}: {
  name: string;
  description: string;
  url: string;
  tools: ToolDefinition[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    isPartOf: { "@id": `${SITE_CONFIG.domain}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: `${SITE_CONFIG.domain}/tools/${tool.slug}`,
      })),
    },
  };
}

export function generateFaqJsonLd(
  faqs: { question: string; answer: string }[],
  pageUrl: string
) {
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

export function generateBreadcrumbJsonLd(
  crumbs: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_CONFIG.domain}${crumb.path}`,
    })),
  };
}
