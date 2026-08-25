import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  getAllTools,
} from "@/lib/tools/registry";
import { constructPageMetadata, SITE_CONFIG } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ArrowRight } from "lucide-react";

const TOOL_COUNT = getAllTools().length;

/**
 * Hub for the nine category landing pages.
 *
 * Those pages already existed and were linked only from the header dropdown,
 * which left them without a crawlable parent — the category tier had no index
 * of its own. This is that index: a real page with its own copy, not a bare
 * link list.
 */
export const metadata: Metadata = constructPageMetadata({
  title: "Tool Categories",
  description: `Browse all ${TOOL_COUNT} TabBench tools by category — calculators, PDF and document tools, image utilities, developer helpers, and text tools.`,
  path: "/categories",
  keywords: [
    "online tool categories",
    "free calculator tools",
    "pdf tools list",
    "image tools list",
    "developer tools list",
  ],
});

export default function CategoriesIndexPage() {
  // Empty categories would be thin pages; they are excluded from the category
  // routes and from the sitemap, so they must not be linked here either.
  const categories = TOOL_CATEGORIES.filter(
    (cat) => getToolsByCategory(cat.id).length > 0
  );

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Categories", path: "/categories" },
  ]);

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "TabBench Tool Categories",
    description: `All ${TOOL_COUNT} TabBench tools, grouped into ${categories.length} categories.`,
    url: `${SITE_CONFIG.domain}/categories`,
    isPartOf: { "@id": `${SITE_CONFIG.domain}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: categories.length,
      itemListElement: categories.map((cat, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: cat.name,
        url: `${SITE_CONFIG.domain}/categories/${cat.id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs items={[{ name: "Categories" }]} />

        <header className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tool Categories
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            All {TOOL_COUNT} tools, grouped by the kind of job they do. Most run
            entirely in your browser, so the file you are working on never
            leaves your machine — the few that need the network say so on the
            tool itself. Pick a category to see everything in it, or go straight
            to the{" "}
            <Link
              href="/tools"
              className="font-semibold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
            >
              full tool directory
            </Link>
            .
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const tools = getToolsByCategory(cat.id);
            return (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.id}`}
                  className="group flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                >
                  <span className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {cat.name}
                    </h2>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {cat.description}
                  </p>
                  <span className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {tools.length} tool{tools.length === 1 ? "" : "s"}
                  </span>
                  {/* Deep links give crawlers a path to individual tools from
                      the hub instead of forcing another hop. */}
                  <span className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {tools.slice(0, 4).map((t, i) => (
                      <React.Fragment key={t.slug}>
                        {i > 0 && " · "}
                        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {t.shortName || t.name}
                        </span>
                      </React.Fragment>
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
