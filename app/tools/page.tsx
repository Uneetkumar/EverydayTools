import React from "react";
import type { Metadata } from "next";
import {
  CATEGORY_GROUPS,
  getAllTools,
  getToolsByCategory,
  TOOL_CATEGORIES,
} from "@/lib/tools/registry";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/config";
import { generateCollectionJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FileSpreadsheet } from "lucide-react";
import { ToolDirectory } from "@/components/tool/tool-directory";

export const metadata: Metadata = constructPageMetadata({
  title: "All Free Online Tools - Full Directory",
  description:
    `Browse all ${getAllTools().length} free online tools: PDF converters, image compressors, calculators and developer utilities. No signup, and most run entirely in your browser.`,
  path: "/tools",
});

/**
 * One-tap searches under the box. These are the things people look for by
 * name, so a tool that lives in a category they would not think to open (the
 * speed test sits under "API, HTTP & Network") is one tap away instead of
 * three screens down.
 */
const SUGGESTIONS = [
  { label: "Speed test", query: "speed test" },
  { label: "Merge PDFs", query: "merge pdf" },
  { label: "Compress image", query: "compress image" },
  { label: "Format JSON", query: "json" },
  { label: "GST calculator", query: "gst" },
  { label: "QR code", query: "qr code" },
  { label: "Roll dice", query: "dice" },
];

export default function ToolsIndexPage() {
  const allTools = getAllTools();

  const collectionSchema = generateCollectionJsonLd({
    name: "All Free Online Tools",
    description:
      "Complete directory of free browser-based calculators, converters, and developer utilities.",
    url: absoluteUrl("/tools"),
    items: allTools.map((t) => ({ name: t.name, path: `/tools/${t.slug}` })),
  });

  const populatedCategories = TOOL_CATEGORIES.map((cat) => ({
    ...cat,
    tools: getToolsByCategory(cat.id),
  })).filter((cat) => cat.tools.length > 0);

  return (
    <>
      <JsonLd data={collectionSchema} />

      <div className="page-container py-6 md:py-10">
        <Breadcrumbs items={[{ name: "All tools", url: "/tools" }]} />

        <header className="mt-5 max-w-2xl">
          <h1 className="type-h1 text-foreground">All free online tools</h1>
          <p className="mt-2 type-body text-muted-foreground">
            {allTools.length} tools in {populatedCategories.length} categories. Most run in your browser, so
            your files never leave your device. The few that need the internet are marked.
          </p>
        </header>

        <div className="mt-6 md:mt-8">
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
              privacy: t.privacy,
              searchRank: t.searchRank,
            }))}
            categories={populatedCategories.map((c) => ({
              id: c.id,
              group: c.group,
              name: c.name,
              shortName: c.shortName,
              description: c.description,
              icon: c.icon,
            }))}
            groups={CATEGORY_GROUPS}
            suggestions={SUGGESTIONS}
          />
        </div>

        <p className="mt-14 border-t pt-6 text-sm text-muted-foreground">
          Want this list in a spreadsheet?{" "}
          <a
            href="/tools.csv"
            download="tabbench-tools.csv"
            className="inline-flex items-center gap-1 font-medium text-link underline-offset-4 hover:underline"
          >
            <FileSpreadsheet aria-hidden="true" className="size-3.5" />
            Download it as CSV
          </a>
        </p>
      </div>
    </>
  );
}
