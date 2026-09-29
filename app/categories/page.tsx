import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  getToolsBySlugs,
  getAllTools,
} from "@/lib/tools/registry";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/config";
import { generateCollectionJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CategoryCard } from "@/components/tool/category-card";

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
});

export default function CategoriesIndexPage() {
  // Empty categories would be thin pages; they are excluded from the category
  // routes and from the sitemap, so they must not be linked here either.
  const categories = TOOL_CATEGORIES.filter(
    (cat) => getToolsByCategory(cat.id).length > 0
  );

  const listSchema = generateCollectionJsonLd({
    name: "TabBench Tool Categories",
    description: `All ${TOOL_COUNT} TabBench tools, grouped into ${categories.length} categories.`,
    url: absoluteUrl("/categories"),
    items: categories.map((cat) => ({ name: cat.name, path: `/categories/${cat.id}` })),
  });

  return (
    <>
      <JsonLd data={listSchema} />

      <div className="page-container py-6 md:py-10">
        <Breadcrumbs items={[{ name: "Categories", url: "/categories" }]} />

        <header className="mt-5 max-w-3xl">
          <h1 className="type-h1 text-foreground">Tool categories</h1>
          <p className="mt-3 type-body text-muted-foreground">
            All {TOOL_COUNT} tools, grouped by the kind of job they do. Most run
            entirely in your browser, so the file you are working on never
            leaves your machine — the few that need the network say so on the
            tool itself. Pick a category to see everything in it, or go straight
            to the{" "}
            <Link href="/tools" className="font-medium text-link underline-offset-4 hover:underline">
              full tool directory
            </Link>
            .
          </p>
        </header>

        {/* Each card deep-links three tools, giving crawlers a path to
            individual tools from the hub instead of forcing another hop. */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryCard
                category={cat}
                toolCount={getToolsByCategory(cat.id).length}
                starters={getToolsBySlugs(cat.popular).slice(0, 4)}
                headingLevel="h2"
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
