import React from "react";
import Link from "next/link";
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
import AdSlot from "@/components/AdSlot";
import { ArrowRight, ShieldCheck, Zap, Wallet } from "lucide-react";

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs items={[{ name: "All Tools" }]} />

        <header className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            All free online tools
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Every tool on EverydayTools runs entirely inside your browser. Files
            you open are never uploaded, calculations never reach a server, and
            nothing requires an account. That makes these tools usable for
            documents you would not paste into an unknown website — scanned
            identity papers, contracts, API tokens, and unpublished drafts.
          </p>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            There are {allTools.length} tools across{" "}
            {populatedCategories.length} categories. Browse by category below,
            or jump straight to the one you need.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            {[
              { icon: ShieldCheck, label: "Nothing is uploaded" },
              { icon: Zap, label: "Instant, no page reloads" },
              { icon: Wallet, label: "Free with no account" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {label}
              </span>
            ))}
          </div>
        </header>

        <div className="space-y-10">
          {populatedCategories.map((cat, catIndex) => (
            <React.Fragment key={cat.id}>
              <section aria-labelledby={`cat-${cat.id}`} className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h2
                      id={`cat-${cat.id}`}
                      className="text-xl font-bold text-slate-900 dark:text-white"
                    >
                      <Link
                        href={`/categories/${cat.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {cat.description}
                    </p>
                  </div>
                  <Link
                    href={`/categories/${cat.id}`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    View category →
                  </Link>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="group flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {tool.name}
                          </h3>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                        </span>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {tool.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              {/* One in-feed ad partway down a long listing, never between
                  cards within a group. */}
              {catIndex === 1 && (
                <div className="py-2">
                  <AdSlot placement="listingFooter" format="leaderboard" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
