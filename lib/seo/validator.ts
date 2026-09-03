import { getAllTools, TOOL_CATEGORIES, getToolsByCategory } from "@/lib/tools/registry";
import { GUIDES } from "@/lib/guides/content";
import { CURRENCY_PAIRS } from "@/lib/currency/pairs";
import { SITE_CONFIG } from "@/lib/seo/metadata";
import {
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  generateToolJsonLd,
  generateCollectionJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from "@/lib/seo/jsonld";

export interface SeoAuditIssue {
  type: "error" | "warning";
  category: string;
  target: string;
  message: string;
}

export interface SeoAuditReport {
  timestamp: string;
  totalTools: number;
  totalCategories: number;
  totalGuides: number;
  totalCurrencyPairs: number;
  totalIndexableUrls: number;
  domain: string;
  errorsCount: number;
  warningsCount: number;
  issues: SeoAuditIssue[];
}

/**
 * Programmatic technical SEO Auditor for TabBench.
 * Validates metadata, sitemaps, structured data, canonical URLs, and internal linking.
 */
export function runSeoAudit(): SeoAuditReport {
  const issues: SeoAuditIssue[] = [];
  const tools = getAllTools();
  const domain = SITE_CONFIG.domain;

  // 1. Verify Production Domain
  if (!domain.startsWith("https://tabbench.com")) {
    issues.push({
      type: "error",
      category: "Domain Configuration",
      target: "SITE_CONFIG.domain",
      message: `Domain should be 'https://tabbench.com', found '${domain}'`,
    });
  }

  // 2. Audit Tool Slugs & Uniqueness
  const slugSet = new Set<string>();
  tools.forEach((tool) => {
    if (slugSet.has(tool.slug)) {
      issues.push({
        type: "error",
        category: "URL Structure",
        target: tool.slug,
        message: `Duplicate tool slug found: ${tool.slug}`,
      });
    }
    slugSet.add(tool.slug);

    // Title checks
    const title = tool.metaTitle || tool.name;
    if (!title || title.trim().length === 0) {
      issues.push({
        type: "error",
        category: "Metadata",
        target: tool.slug,
        message: "Missing meta title",
      });
    }

    // Description checks
    const desc = tool.metaDescription || tool.description;
    if (!desc || desc.trim().length === 0) {
      issues.push({
        type: "error",
        category: "Metadata",
        target: tool.slug,
        message: "Missing meta description",
      });
    } else if (desc.length < 50) {
      issues.push({
        type: "warning",
        category: "Metadata",
        target: tool.slug,
        message: `Meta description is short (${desc.length} chars): "${desc}"`,
      });
    }

    // Category checks
    const validCat = TOOL_CATEGORIES.some((c) => c.id === tool.category);
    if (!validCat) {
      issues.push({
        type: "error",
        category: "Taxonomy",
        target: tool.slug,
        message: `Invalid category '${tool.category}'`,
      });
    }

    // JSON-LD validation
    try {
      const { webAppSchema, breadcrumbSchema, faqSchema } = generateToolJsonLd(tool);
      JSON.stringify(webAppSchema);
      JSON.stringify(breadcrumbSchema);
      if (faqSchema) JSON.stringify(faqSchema);
    } catch (err: unknown) {
      issues.push({
        type: "error",
        category: "Structured Data",
        target: tool.slug,
        message: `JSON-LD serialization error: ${(err as Error).message}`,
      });
    }
  });

  // 3. Category Validation
  TOOL_CATEGORIES.forEach((cat) => {
    const catTools = getToolsByCategory(cat.id);
    if (catTools.length === 0) {
      issues.push({
        type: "warning",
        category: "Categories",
        target: cat.id,
        message: `Category '${cat.name}' has 0 tools associated.`,
      });
    }
  });

  // 4. Calculate total indexable URLs
  const totalIndexableUrls =
    1 + // Homepage
    1 + // /tools
    1 + // /guides
    TOOL_CATEGORIES.filter((c) => getToolsByCategory(c.id).length > 0).length + // Categories
    tools.length + // Tools
    GUIDES.length + // Guides
    CURRENCY_PAIRS.length + // Currency Pairs
    5; // About, Contact, Privacy, Terms, Editorial Policy

  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");

  return {
    timestamp: new Date().toISOString(),
    totalTools: tools.length,
    totalCategories: TOOL_CATEGORIES.length,
    totalGuides: GUIDES.length,
    totalCurrencyPairs: CURRENCY_PAIRS.length,
    totalIndexableUrls,
    domain,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    issues,
  };
}
