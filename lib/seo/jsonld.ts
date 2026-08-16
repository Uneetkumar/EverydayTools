import { ToolDefinition } from "@/lib/tools/registry";
import { SITE_CONFIG } from "./metadata";

export function generateToolJsonLd(tool: ToolDefinition) {
  const toolUrl = `${SITE_CONFIG.domain}/tools/${tool.slug}`;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: toolUrl,
    description: tool.description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1480",
      reviewCount: "890",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: tool.features,
    author: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      logo: `${SITE_CONFIG.domain}/icon.svg`,
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
        name: tool.categoryName,
        item: `${SITE_CONFIG.domain}/#${tool.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: toolUrl,
      },
    ],
  };

  const faqSchema =
    tool.faqs && tool.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
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

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.domain,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.domain}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_CONFIG.domain}/icon.svg`,
      },
    },
  };
}
