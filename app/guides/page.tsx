import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { GUIDES } from "@/lib/guides/content";
import { constructPageMetadata, SITE_CONFIG } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = constructPageMetadata({
  title: "Guides - How to Compress, Convert & Resize",
  description:
    "Step-by-step guides for the file problems people actually hit: compressing photos to 50KB for forms, shrinking PDFs, and converting documents.",
  path: "/guides",
  keywords: ["how to compress image", "how to reduce pdf size", "file conversion guides"],
});

export default function GuidesIndexPage() {
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Guides", path: "/guides" },
  ]);
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "TabBench Guides",
    url: `${SITE_CONFIG.domain}/guides`,
    isPartOf: { "@id": `${SITE_CONFIG.domain}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: GUIDES.length,
      itemListElement: GUIDES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: `${SITE_CONFIG.domain}/guides/${g.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs items={[{ name: "Guides" }]} />

        <header className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Guides
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Walkthroughs for the file problems that actually come up — getting a
            photograph under a 50KB exam-portal limit, shrinking a scanned PDF
            for an upload cap, or converting a document without wrecking its
            layout. Each guide explains why the constraint exists and the order
            of operations that solves it, then points you at the tool.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`}
                className="group flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md">
                <span className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {g.title}
                  </h2>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </span>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {g.metaDescription}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
