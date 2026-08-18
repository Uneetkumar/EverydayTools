import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDES, getGuideBySlug } from "@/lib/guides/content";
import { getToolBySlug } from "@/lib/tools/registry";
import { constructPageMetadata, SITE_CONFIG } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import FaqSection from "@/components/FaqSection";
import { ArrowRight, ListOrdered, Lightbulb, Clock } from "lucide-react";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide not found" };
  return constructPageMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const tool = getToolBySlug(guide.toolSlug);
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 5);
  const url = `${SITE_CONFIG.domain}/guides/${guide.slug}`;

  // Article carries the authorship and freshness signals a bare page does not.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.title,
    description: guide.metaDescription,
    url,
    datePublished: guide.updated,
    dateModified: guide.updated,
    inLanguage: "en",
    author: { "@id": `${SITE_CONFIG.domain}/#organization` },
    publisher: { "@id": `${SITE_CONFIG.domain}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Guides", path: "/guides" },
    { name: guide.title, path: `/guides/${guide.slug}` },
  ]);
  const faqSchema = generateFaqJsonLd(guide.faqs, url);

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Breadcrumbs items={[{ name: "Guides", url: "/guides" }, { name: guide.title }]} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <article className="lg:col-span-8 space-y-6">
            <header className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {guide.title}
              </h1>
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span>
                  Updated{" "}
                  <time dateTime={guide.updated}>
                    {new Date(guide.updated).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </time>
                </span>
              </p>
              {guide.intro.map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {para}
                </p>
              ))}
            </header>

            {tool && (
              <Link href={`/tools/${tool.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-5 transition hover:border-blue-400">
                <span>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    Open the {guide.toolLabel}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
                    Free, no signup, and the file never leaves your browser.
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 text-blue-600 transition group-hover:translate-x-0.5" />
              </Link>
            )}

            <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Step by step
                </h2>
              </div>
              <ol className="space-y-5">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="py-2">
              <AdSlot placement="toolInArticle" format="in-article" />
            </div>

            <section className="rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/15 p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Things worth knowing
                </h2>
              </div>
              <ul className="space-y-2.5">
                {guide.notes.map((note, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </section>

            <FaqSection faqs={guide.faqs} />
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                More guides
              </h2>
              <div className="space-y-1.5 pt-1">
                {others.map((g) => (
                  <Link key={g.slug} href={`/guides/${g.slug}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition group">
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {g.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
              <Link href="/guides" className="block pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                All guides →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
