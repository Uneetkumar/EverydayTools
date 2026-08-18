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
import AdSlot from "@/components/AdSlot";
import FaqSection from "@/components/FaqSection";
import { ArrowRight, Wifi } from "lucide-react";

interface PairPageProps {
  params: Promise<{ pair: string }>;
}

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
  const others = CURRENCY_PAIRS.filter((p) => p.slug !== def.slug).slice(0, 8);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { name: "Currency Converter", url: "/tools/currency-converter" },
            { name: def.common },
          ]}
        />

        <header className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
            <Wifi className="w-3 h-3" />
            Live data · needs internet
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {def.common} — {def.from} to {def.to}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Convert {fromName} ({def.from}) to {toName} ({def.to}) at today&rsquo;s
            live mid-market exchange rate. Enter any amount, or swap the
            direction to convert back.
          </p>
        </header>

        <div className="@container rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs">
          <CurrencyConverter initialFrom={def.from} initialTo={def.to} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                About the {def.common.toLowerCase()} rate
              </h2>
              {def.body.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {para}
                </p>
              ))}
            </section>

            <div className="py-2">
              <AdSlot placement="toolInArticle" format="in-article" />
            </div>

            <FaqSection faqs={faqs} />
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Other currency pairs
              </h2>
              <div className="space-y-1.5 pt-1">
                {others.map((p) => (
                  <Link key={p.slug} href={`/convert/${p.slug}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition group">
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {p.common}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
              <Link href="/tools/currency-converter"
                className="block pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Convert any currency →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
