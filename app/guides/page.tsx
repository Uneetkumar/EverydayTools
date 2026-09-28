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

      <div className="page-container py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Guides" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="type-h1 text-foreground">Guides</h1>
          <p className="mt-4 type-body text-muted-foreground md:text-lg">
            Walkthroughs for the file problems that actually come up — getting a photograph under a 50KB
            exam-portal limit, shrinking a scanned PDF for an upload cap, or converting a document without
            wrecking its layout. Each guide explains why the constraint exists and the order of operations that
            solves it, then points you at the tool.
          </p>
        </header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <li
              key={g.slug}
              className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-soft transition-colors hover:border-foreground/15 hover:bg-accent/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring"
            >
              <h2 className="flex items-start justify-between gap-2 type-h4 text-foreground">
                <Link
                  href={`/guides/${g.slug}`}
                  className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                >
                  {g.title}
                </Link>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{g.metaDescription}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
