import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getToolsByCategory,
  TOOL_CATEGORIES,
} from "@/lib/tools/registry";
import { getCategoryContent } from "@/lib/tools/categoryContent";
import { GUIDES } from "@/lib/guides/content";
import { constructPageMetadata, routeSocialImage } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/config";
import { generateCollectionJsonLd, generateFaqJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import Breadcrumbs from "@/components/Breadcrumbs";
import FaqSection from "@/components/FaqSection";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ToolExplorer, type ExplorerTool } from "@/components/tool/tool-explorer";
import { CategoryVisual } from "@/components/tool/tool-visual";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  // Only categories that actually contain tools — an empty category page is a
  // thin page with nothing on it.
  return TOOL_CATEGORIES.filter(
    (cat) => getToolsByCategory(cat.id).length > 0
  ).map((cat) => ({ category: cat.id }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const content = getCategoryContent(category);
  const meta = TOOL_CATEGORIES.find((c) => c.id === category);

  if (!content || !meta) {
    return { title: "Category not found", robots: { index: false } };
  }

  const path = `/categories/${category}`;
  return constructPageMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path,
    // This route ships its own opengraph-image.tsx.
    socialImage: routeSocialImage(path, `${content.heading} on TabBench`),
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = TOOL_CATEGORIES.find((c) => c.id === category);
  const content = getCategoryContent(category);
  const tools = getToolsByCategory(category);

  if (!meta || !content || tools.length === 0) {
    notFound();
  }

  const allLocal = tools.every((t) => t.privacy === "local");
  const explorerTools: ExplorerTool[] = tools.map((t) => ({
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
  }));

  const otherCategories = TOOL_CATEGORIES.filter(
    (c) => c.id !== category && getToolsByCategory(c.id).length > 0
  );

  // Guides whose tool lives in this category: the category → guide link of
  // the topic cluster (tools already link to their own guides).
  const categoryGuides = GUIDES.filter((g) => tools.some((t) => t.slug === g.toolSlug));
  const pageUrl = absoluteUrl(`/categories/${category}`);

  const collectionSchema = generateCollectionJsonLd({
    name: content.heading,
    description: content.metaDescription,
    url: pageUrl,
    items: tools.map((t) => ({ name: t.name, path: `/tools/${t.slug}` })),
  });
  const faqSchema = generateFaqJsonLd(content.faqs, pageUrl);

  return (
    <>
      <JsonLd data={[collectionSchema, faqSchema]} />

      <div className="page-container py-6 md:py-10">
        <Breadcrumbs
          items={[
            { name: "All tools", url: "/tools" },
            { name: meta.name, url: `/categories/${category}` },
          ]}
        />

        <header className="mt-5 flex items-start gap-4">
          <CategoryVisual category={meta.id} iconName={meta.icon} size="lg" className="mt-0.5 hidden sm:flex" />
          <div className="max-w-3xl">
            <h1 className="type-h1 text-foreground">{content.heading}</h1>
            <p className="mt-2 type-body text-muted-foreground md:text-lg">{meta.description}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-success" />
              {tools.length} tools ·{" "}
              {allLocal
                ? "everything runs in your browser"
                : "most run in your browser; the rest say what they send"}
            </p>
          </div>
        </header>

        <div className="mt-8">
          <ToolExplorer
            tools={explorerTools}
            popular={meta.popular}
            noun={`${meta.shortName.toLowerCase()} tools`}
            allHeading={`All ${meta.name} tools`}
            // A category holding only two or three tools is a thin page:
            // barely more than a link to the tool itself. Monetising those is
            // what AdSense calls low-value content, and it is assessed across
            // the whole site during review. The threshold is on tool count
            // because that is what actually makes these pages thin.
            showAd={tools.length >= 4}
          />
        </div>

        <section aria-labelledby="about-category" className="mt-16 max-w-3xl">
          <h2 id="about-category" className="type-h2 text-foreground">
            About these tools
          </h2>
          <div className="mt-4 space-y-4">
            {content.body.map((paragraph, idx) => (
              <p key={idx} className="type-body text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {categoryGuides.length > 0 && (
          <section aria-labelledby="category-guides" className="mt-14 max-w-3xl">
            <h2 id="category-guides" className="type-h2 text-foreground">
              Guides
            </h2>
            <p className="mt-2 type-body-sm text-muted-foreground">
              Step-by-step walkthroughs for jobs these tools handle.
            </p>
            <ul className="mt-4 divide-y rounded-xl border bg-card shadow-soft">
              {categoryGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="group flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/50"
                  >
                    <span>{g.title}</span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.faqs.length > 0 && (
          <div className="mt-14 max-w-3xl">
            <FaqSection faqs={content.faqs} />
          </div>
        )}

        <nav aria-labelledby="other-cats" className="mt-14">
          <h2 id="other-cats" className="type-h3 text-foreground">
            Other categories
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {otherCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.id}`}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-soft transition-colors hover:bg-accent"
                >
                  <CategoryVisual category={cat.id} iconName={cat.icon} size="2xs" />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
