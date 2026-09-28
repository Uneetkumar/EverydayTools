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
import { ToolVisual } from "@/components/tool/tool-visual";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;

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
    // This route ships its own opengraph-image.tsx.
    ogImage: null,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const tool = getToolBySlug(guide.toolSlug);
  // Same rotation as the currency corridors: a fixed slice left the last
  // guides in the registry with almost no inbound links.
  const restGuides = GUIDES.filter((g) => g.slug !== guide.slug);
  const guideStart =
    restGuides.length > 0
      ? GUIDES.findIndex((g) => g.slug === guide.slug) % restGuides.length
      : 0;
  const others = [
    ...restGuides.slice(guideStart),
    ...restGuides.slice(0, guideStart),
  ].slice(0, 5);
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

      <div className="page-container py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Guides", url: "/guides" }, { name: guide.title }]} />

        <div className="mt-6 grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0 max-w-3xl">
            <header>
              <h1 className="type-h1 text-foreground">{guide.title}</h1>
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-4 text-sm text-muted-foreground">
                <span>By TabBench</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" />
                  <time dateTime={guide.updated}>
                    Updated{" "}
                    {new Date(guide.updated).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </time>
                </span>
                <span aria-hidden="true">·</span>
                <Link href="/editorial-policy" className="text-link hover:underline">
                  How we check our guides
                </Link>
              </p>
              <div className="mt-6 space-y-4">
                {guide.intro.map((para, i) => (
                  <p key={i} className="type-body text-foreground/85">
                    {para}
                  </p>
                ))}
              </div>
            </header>

            {tool && (
              <div className="group relative mt-8 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-brand-subtle/60 p-5 transition-colors hover:border-primary/40 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
                <span className="flex min-w-0 items-center gap-3">
                  <ToolVisual slug={tool.slug} iconName={tool.iconName} category={tool.category} size="md" />
                  <span className="min-w-0">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="block font-medium text-foreground outline-none after:absolute after:inset-0 after:rounded-xl"
                    >
                      Open the {guide.toolLabel}
                    </Link>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {tool.privacy === "local"
                        ? "Free, no sign-up, and your file never leaves your browser."
                        : "Free and no sign-up."}
                    </span>
                  </span>
                </span>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-link transition-transform group-hover:translate-x-0.5" />
              </div>
            )}

            <section aria-labelledby="steps-heading" className="mt-12">
              <h2 id="steps-heading" className="flex items-center gap-2.5 type-h2 text-foreground">
                <ListOrdered className="size-5 text-muted-foreground" aria-hidden="true" />
                Step by step
              </h2>
              <ol className="mt-6 space-y-6">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="type-h4 text-foreground">{step.title}</h3>
                      <p className="mt-1.5 type-body text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="mt-12">
              <AdSlot placement="content-middle" />
            </div>

            <section aria-labelledby="notes-heading" className="mt-12">
              <h2 id="notes-heading" className="flex items-center gap-2.5 type-h2 text-foreground">
                <Lightbulb className="size-5 text-muted-foreground" aria-hidden="true" />
                Things worth knowing
              </h2>
              <ul className="mt-5 space-y-3">
                {guide.notes.map((note, i) => (
                  <li key={i} className="flex gap-3 type-body text-muted-foreground">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-warning" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-12">
              <FaqSection faqs={guide.faqs} />
            </div>
          </article>

          <aside aria-label="More guides" className="lg:sticky lg:top-24">
            <nav aria-labelledby="more-guides" className="rounded-xl border bg-card p-4 shadow-soft">
              <h2 id="more-guides" className="type-h4 text-foreground">More guides</h2>
              <ul className="mt-3 space-y-0.5">
                {others.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guides/${g.slug}`}
                      className="block rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/guides" className="mt-3 inline-flex items-center gap-1 px-2 text-sm text-link hover:underline">
                All guides <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
