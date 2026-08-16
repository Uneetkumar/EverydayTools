import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getToolsByCategory,
  TOOL_CATEGORIES,
  getAllTools,
} from "@/lib/tools/registry";
import { getCategoryContent } from "@/lib/tools/categoryContent";
import { constructPageMetadata, SITE_CONFIG } from "@/lib/seo/metadata";
import {
  generateCollectionJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import FaqSection from "@/components/FaqSection";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

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
    return { title: "Category Not Found" };
  }

  return constructPageMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: `/categories/${category}`,
    keywords: content.keywords,
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

  const otherCategories = TOOL_CATEGORIES.filter(
    (c) => c.id !== category && getToolsByCategory(c.id).length > 0
  );

  const collectionSchema = generateCollectionJsonLd({
    name: content.heading,
    description: content.metaDescription,
    url: `${SITE_CONFIG.domain}/categories/${category}`,
    tools,
  });

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "All Tools", path: "/tools" },
    { name: meta.name, path: `/categories/${category}` },
  ]);

  const faqSchema = generateFaqJsonLd(
    content.faqs,
    `${SITE_CONFIG.domain}/categories/${category}`
  );

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs
          items={[{ name: "All Tools", url: "/tools" }, { name: meta.name }]}
        />

        <header className="space-y-4 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            {tools.length} tools · nothing leaves your browser
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {content.heading}
          </h1>

          {content.body.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-base leading-relaxed text-slate-600 dark:text-slate-400"
            >
              {paragraph}
            </p>
          ))}
        </header>

        <section aria-labelledby="tools-heading" className="space-y-4">
          <h2
            id="tools-heading"
            className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3"
          >
            {meta.name} tools
          </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                >
                  <span className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {tool.name}
                    </h3>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {tool.description}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {tool.features.slice(0, 2).map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-1.5 text-[11px] text-slate-400 dark:text-slate-500"
                      >
                        <span aria-hidden="true">·</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="py-2">
          <AdSlot placement="listingFooter" format="leaderboard" />
        </div>

        {content.faqs.length > 0 && <FaqSection faqs={content.faqs} />}

        <section aria-labelledby="other-cats" className="space-y-4">
          <h2
            id="other-cats"
            className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3"
          >
            Other tool categories
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherCategories.map((cat) => {
              const count = getAllTools().filter(
                (t) => t.category === cat.id
              ).length;
              return (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.id}`}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-blue-300 dark:hover:border-blue-700"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {cat.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {count} tools
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
