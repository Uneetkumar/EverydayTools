import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ToolDefinition,
  getNextTools,
  getRelatedTools,
  getToolsByCategory,
} from "@/lib/tools/registry";
import { getToolContent } from "@/lib/tools/content";
import { CURRENCY_PAIRS } from "@/lib/currency/pairs";
import { getGuidesForTool } from "@/lib/guides/content";
import Breadcrumbs from "./Breadcrumbs";
import FormulaBox from "./FormulaBox";
import FaqSection from "./FaqSection";
import RelatedTools from "./RelatedTools";
import AdSlot from "./AdSlot";
import { ExtensionHandoff } from "@/components/tool/extension-handoff";
import {
  ContentSection,
  ToolIntro,
  HowToSection,
  UseCasesSection,
  TipsSection,
} from "./ToolContentSections";
import RecentResults from "./RecentResults";
import TrackToolVisit from "./TrackToolVisit";
import { FavoriteButton } from "./tool/favorite-button";
import { ShareButton } from "./tool/share-button";
import { PrivacyNote } from "./tool/privacy-note";
import { NextSteps } from "./tool/next-steps";
import { ToolWorkspace } from "./tool/tool-workspace";
import { cn } from "@/lib/utils";
import { ToolVisual } from "./tool/tool-visual";

interface ToolShellProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

/**
 * Tools that render a full workspace (two panes, or a canvas editor) rather
 * than a simple form. These use the full page width for the workspace,
 * because squeezing a nested two-column layout into ~700px leaves each inner
 * pane too narrow for its own controls. The article content and sidebar still
 * render underneath in the normal layout.
 */
const WIDE_LAYOUT_TOOLS = new Set([
  "qr-code-generator",
  "qr-code-scanner",
  "barcode-generator",
  "barcode-scanner",
  "crop-image",
  "watermark-remover",
  "image-compressor",
  "image-resizer",
  "favicon-generator",
  "pdf-to-jpg",
  "video-cutter",
  "audio-remover",
  "video-player",
  "pdf-editor",
  "json-to-csv",
  "regex-tester",
  "json-to-typescript",
  "markdown-table-generator",
  "unit-converter",
  "text-sorter",
  "png-to-svg",
  "calculator",
  "sample-file-generator",
  "online-camera",
]);

/**
 * Every tool page, in the order a visitor needs it:
 *
 *   breadcrumb → title + one-line description → THE TOOL → next steps
 *   → what it does / how to use / how it works → [ad] → use cases / tips
 *   → guides → FAQ → related tools
 *
 * The tool sits directly under the H1: no ad and no article text comes
 * between the heading and the controls, both because it is what people came
 * for and because AdSense treats ads crowding primary controls as an
 * accidental-click risk.
 */
export default function ToolShell({ tool, children }: ToolShellProps) {
  const content = getToolContent(tool.slug);
  const isWide = WIDE_LAYOUT_TOOLS.has(tool.slug);

  // Registry FAQ first, then the long-form ones. Must stay in sync with the
  // FAQPage JSON-LD built in lib/seo/jsonld.ts.
  const allFaqs = [...tool.faqs, ...(content?.extraFaqs ?? [])];
  const relatedGuides = getGuidesForTool(tool.slug);

  const nextTools = getNextTools(tool, 4);
  const shown = new Set([tool.slug, ...nextTools.map((t) => t.slug)]);
  const sameCategory = getToolsByCategory(tool.category).filter((t) => t.slug !== tool.slug);
  // Related tools at the foot of the page must add something the next-steps
  // row did not already offer; top up from the same category.
  const related = [...getRelatedTools(tool), ...sameCategory]
    .filter((t, i, arr) => !shown.has(t.slug) && arr.findIndex((x) => x.slug === t.slug) === i)
    .slice(0, 4);

  const workspace = <ToolWorkspace name={tool.name}>{children}</ToolWorkspace>;

  return (
    <div className="page-container py-5 md:py-8">
      <TrackToolVisit slug={tool.slug} name={tool.name} category={tool.category} />
      <ExtensionHandoff />

      <Breadcrumbs
        items={[
          { name: "All tools", url: "/tools" },
          { name: tool.categoryName, url: `/categories/${tool.category}` },
          { name: tool.name },
        ]}
      />

      <header className="mt-4 flex items-start gap-4 md:mt-5">
        <ToolVisual
          slug={tool.slug}
          iconName={tool.iconName}
          category={tool.category}
          size="lg"
          className="mt-0.5 hidden sm:inline-flex"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="type-h1 text-foreground">{tool.name}</h1>
            <div className="flex shrink-0 gap-1.5 md:gap-2">
              <FavoriteButton slug={tool.slug} name={tool.name} withLabel />
              <ShareButton title={tool.name} path={`/tools/${tool.slug}`} />
            </div>
          </div>
          <p className="mt-2 max-w-3xl type-body text-muted-foreground">{tool.description}</p>
          <PrivacyNote tool={tool} className="mt-2.5" />
        </div>
      </header>

      {isWide && (
        <div className="mt-6">
          {workspace}
          <NextSteps from={tool.slug} tools={nextTools} />
        </div>
      )}

      {/*
        Desktop grid. Row 1 is the tool (left) beside the recent-files and
        same-category lists (right); row 2 is the article beside the sidebar
        ad. The ad therefore starts below the tool and, being sticky only
        within its own cell, can never sit beside a tool's buttons or
        downloads. On mobile everything stacks in source order: tool,
        article, lists, ad.
      */}
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_300px]",
          isWide ? "mt-12" : "mt-6"
        )}
      >
        {!isWide && (
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            {workspace}
            <NextSteps from={tool.slug} tools={nextTools} />
          </div>
        )}

        <div className={cn("min-w-0 lg:col-start-1", isWide ? "lg:row-span-2 lg:row-start-1" : "mt-4 lg:row-start-2")}>
          <div className="space-y-12">
            {content && <ToolIntro intro={content.intro} toolName={tool.name} />}

            {content && (
              <HowToSection
                howTo={content.howTo}
                toolName={tool.name}
                privacy={tool.privacy}
                privacyNote={tool.privacyNote}
              />
            )}

            {tool.formulas && tool.formulas.length > 0 && <FormulaBox formulas={tool.formulas} />}

            {/* The one main-column ad: after the how-to, well clear of any
                control and never between the heading and the tool. */}
            <AdSlot placement="tool-in-content" />

            {content && <UseCasesSection useCases={content.useCases} />}

            {content && <TipsSection tips={content.tips} />}

            {relatedGuides.length > 0 && (
              <ContentSection id="guides-heading" title="Guides that use this tool">
                <ul className="divide-y rounded-xl border bg-card shadow-soft">
                  {relatedGuides.map((g) => (
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
              </ContentSection>
            )}

            {allFaqs.length > 0 && <FaqSection faqs={allFaqs} />}

            {tool.slug === "currency-converter" && (
              <ContentSection id="pairs-heading" title="Popular currency conversions">
                <p className="mb-4 type-body-sm text-muted-foreground">
                  Each pair has its own page with the live rate and context on that corridor.
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {CURRENCY_PAIRS.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/convert/${p.slug}`}
                        className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-accent/50"
                      >
                        <span className="truncate">
                          {p.common}
                          <span className="text-muted-foreground"> · {p.from} → {p.to}</span>
                        </span>
                        <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </ContentSection>
            )}

            <RelatedTools tools={related} from={tool.slug} />
          </div>
        </div>

        <aside
          aria-label="More from TabBench"
          className="flex flex-col gap-8 lg:col-start-2 lg:row-start-1"
        >
          <RecentResults toolSlug={tool.slug} />
          {sameCategory.length > 0 && (
            <nav aria-labelledby="more-in-category">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="more-in-category" className="type-h4 text-foreground">
                  More in {tool.categoryName}
                </h2>
                <Link href={`/categories/${tool.category}`} className="text-sm text-link hover:underline">
                  View all
                </Link>
              </div>
              <ul className="mt-3 space-y-0.5">
                {sameCategory.slice(0, 8).map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/tools/${t.slug}`}
                      data-track-related="sidebar"
                      data-from={tool.slug}
                      data-to={t.slug}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <ToolVisual slug={t.slug} iconName={t.iconName} category={t.category} size="2xs" />
                      <span className="truncate">{t.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        {/* self-stretch lets the sticky unit travel the article's height. */}
        <div className="self-stretch lg:col-start-2 lg:row-start-2">
          <div className="lg:sticky lg:top-24">
            <AdSlot placement="tool-sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
