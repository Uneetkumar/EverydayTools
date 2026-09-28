import React from "react";
import type { Metadata } from "next";
import {
  getAllTools,
  getToolsByCategory,
  TOOL_CATEGORIES,
} from "@/lib/tools/registry";
import { constructPageMetadata, SITE_CONFIG } from "@/lib/seo/metadata";
import {
  generateCollectionJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FileSpreadsheet } from "lucide-react";
import { ToolDirectory } from "@/components/tool/tool-directory";

export const metadata: Metadata = constructPageMetadata({
  title: "All Free Online Tools - Full Directory",
  description:
    `Browse all ${getAllTools().length} free online tools: PDF converters, image compressors, calculators, and developer utilities. Every tool runs in your browser with no signup and no upload.`,
  path: "/tools",
  keywords: [
    "all online tools",
    "free tools directory",
    "online utilities list",
    "browser tools",
    "free pdf tools",
    "free image tools",
  ],
});

export default function ToolsIndexPage() {
  const allTools = getAllTools();

  const collectionSchema = generateCollectionJsonLd({
    name: "All Free Online Tools",
    description:
      "Complete directory of free browser-based calculators, converters, and developer utilities.",
    url: `${SITE_CONFIG.domain}/tools`,
    tools: allTools,
  });

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "All Tools", path: "/tools" },
  ]);

  const populatedCategories = TOOL_CATEGORIES.map((cat) => ({
    ...cat,
    tools: getToolsByCategory(cat.id),
  })).filter((cat) => cat.tools.length > 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="page-container py-6 md:py-10">
        <Breadcrumbs items={[{ name: "All tools" }]} />

        <header className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="type-h1 text-foreground">All free online tools</h1>
            <p className="mt-3 type-body text-muted-foreground">
              {allTools.length} tools across {populatedCategories.length} categories.
              Most run entirely inside your browser: files you open are not
              uploaded, calculations never reach a server, and nothing requires
              an account. Tools that need the internet — live exchange rates,
              speech recognition, the optional cloud AI mode — say so on the page.
            </p>
          </div>
          <a
            href="/tools.csv"
            download="tabbench-tools.csv"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-soft transition-colors hover:bg-accent"
          >
            <FileSpreadsheet aria-hidden="true" className="size-4 text-muted-foreground" />
            Download the list (CSV)
          </a>
        </header>

        <div className="mt-8">
          <ToolDirectory
            tools={allTools.map((t) => ({
              slug: t.slug,
              name: t.name,
              shortName: t.shortName,
              tagline: t.tagline,
              description: t.description,
              category: t.category,
              categoryName: t.categoryName,
              keywords: t.keywords,
              aliases: t.aliases,
              iconName: t.iconName,
              isPopular: t.isPopular,
            }))}
            categories={populatedCategories.map((c) => ({
              id: c.id,
              name: c.name,
              shortName: c.shortName,
              description: c.description,
            }))}
          />
        </div>
      </div>
    </>
  );
}
