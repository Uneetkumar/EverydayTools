import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CURRENCY_PAIRS, getPairBySlug } from "@/lib/currency/pairs";
import { CURRENCY_NAMES } from "@/lib/currency/rates";
import { constructPageMetadata, SITE_CONFIG } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import CurrencyConverter from "@/components/tools/CurrencyConverter";
import FaqSection from "@/components/FaqSection";
import { ArrowRight, Wifi } from "lucide-react";

interface PairPageProps {
  params: Promise<{ pair: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return CURRENCY_PAIRS.map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({ params }: PairPageProps): Promise<Metadata> {
  const { pair } = await params;
  const def = getPairBySlug(pair);
  if (!def) return { title: "Currency pair not found" };
  return constructPageMetadata({
    title: def.metaTitle,
    description: def.metaDescription,
    path: `/convert/${def.slug}`,
    keywords: def.keywords,
    // This route ships its own opengraph-image.tsx.
    ogImage: null,
  });
}

export default async function CurrencyPairPage({ params }: PairPageProps) {
  const { pair } = await params;
  const def = getPairBySlug(pair);
  if (!def) notFound();

  const fromName = CURRENCY_NAMES[def.from] ?? def.from;
  const toName = CURRENCY_NAMES[def.to] ?? def.to;
  const reverse = CURRENCY_PAIRS.find(
    (p) => p.from === def.to && p.to === def.from
  );
  // Rotated, not sliced from the top: a fixed `.slice(0, 8)` linked only the
  // first eight corridors in registry order, so the rest were reachable solely
  // from the currency-converter tool page and the sitemap. Rotating the window
  // by this pair's index guarantees every corridor is linked from somewhere.
  const restPairs = CURRENCY_PAIRS.filter((p) => p.slug !== def.slug);
  const pairStart =
    restPairs.length > 0
      ? CURRENCY_PAIRS.findIndex((p) => p.slug === def.slug) % restPairs.length
      : 0;
  const others = [
    ...restPairs.slice(pairStart),
    ...restPairs.slice(0, pairStart),
  ].slice(0, 8);

  const faqs = [
    {
      question: `What is the ${def.common.toLowerCase()} rate today?`,
      answer: `The live mid-market rate is shown in the converter above and refreshes daily. Mid-market is the midpoint of the interbank market — the rate banks quote each other — so it is the benchmark to compare offers against rather than the rate you will personally receive.`,
    },
    {
      question: `Why does my bank give a worse ${def.from} to ${def.to} rate?`,
      answer: `Retail providers add a margin to the mid-market rate, typically 1–4% for a bank transfer and 0.5–2% on a card, sometimes with a fixed fee on top. That spread is where most of their revenue on a conversion comes from, which is why a "zero fee" offer can still be the more expensive one.`,
    },
    {
      question: `How do I convert ${def.to} back to ${def.from}?`,
      answer: reverse
        ? `Use the swap button in the converter, or go to the dedicated ${reverse.common} page. The reverse rate is also shown directly beneath the result.`
        : `Press the swap button in the converter above. The reverse rate is shown beneath the result at all times.`,
    },
    {
      question: "How often is this rate updated?",
      answer:
        "The providers refresh roughly once a day, and the exact timestamp is shown under the converter. That is appropriate for budgeting and comparing offers, but it is not a live trading feed.",
    },
    // Corridor-specific questions come last so the shared, universally useful
    // ones stay at the top where a first-time visitor looks. Nothing above was
    // removed; these are additive, and they are what makes each corridor page
    // substantially different from its eleven siblings.
    ...def.extraFaqs,
  ];

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Currency Converter", path: "/tools/currency-converter" },
    { name: def.common, path: `/convert/${def.slug}` },
  ]);
  const faqSchema = generateFaqJsonLd(faqs, `${SITE_CONFIG.domain}/convert/${def.slug}`);

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="page-container py-5 md:py-8">
        <Breadcrumbs
          items={[
            { name: "Currency Converter", url: "/tools/currency-converter" },
            { name: def.common },
          ]}
        />

        <header className="mt-4 max-w-3xl md:mt-5">
          <h1 className="type-h1 text-foreground">
            {def.common} — {def.from} to {def.to}
          </h1>
          <p className="mt-2 type-body text-muted-foreground">
            Convert {fromName} ({def.from}) to {toName} ({def.to}) at today&rsquo;s
            live mid-market exchange rate. Enter any amount, or swap the
            direction to convert back.
          </p>
          <p className="mt-2.5 flex items-start gap-2 text-sm text-muted-foreground">
            <Wifi className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Fetches live exchange rates. The amounts you type are never sent.
          </p>
        </header>

        <div className="@container mt-6 rounded-2xl border bg-card p-4 text-card-foreground shadow-soft sm:p-6">
          <CurrencyConverter initialFrom={def.from} initialTo={def.to} />
        </div>

        <div className="mt-12 grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-12">
            <section aria-labelledby="about-rate">
              <h2 id="about-rate" className="type-h2 text-foreground">
                About the {def.common.toLowerCase()} rate
              </h2>
              <div className="mt-4 space-y-4">
                {def.body.map((para, i) => (
                  <p key={i} className="type-body text-muted-foreground">
                    {para}
                  </p>
                ))}
              </div>
            </section>

            {/* No ad on currency-pair pages: they share a template (about a
                third of their text is common to every pair), which is the
                pattern AdSense's low-value-content review penalises when
                monetised. The converter tool page carries the ads. */}

            <FaqSection faqs={faqs} />
          </div>

          <aside aria-label="Other currency pairs" className="lg:sticky lg:top-24">
            <nav aria-labelledby="other-pairs" className="rounded-xl border bg-card p-4 shadow-soft">
              <h2 id="other-pairs" className="type-h4 text-foreground">Other currency pairs</h2>
              <ul className="mt-3 space-y-0.5">
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/convert/${p.slug}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <span className="truncate">{p.common}</span>
                      <span className="shrink-0 text-xs tabular-nums">{p.from} → {p.to}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/tools/currency-converter" className="mt-3 inline-flex items-center gap-1 px-2 text-sm text-link hover:underline">
                Convert any currency <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
