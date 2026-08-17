import React from "react";
import Link from "next/link";
import {
  ToolDefinition,
  getRelatedTools,
  getAllTools,
  TOOL_CATEGORIES,
} from "@/lib/tools/registry";
import { getToolContent } from "@/lib/tools/content";
import Breadcrumbs from "./Breadcrumbs";
import FormulaBox from "./FormulaBox";
import FaqSection from "./FaqSection";
import RelatedTools from "./RelatedTools";
import AdSlot from "./AdSlot";
import {
  ToolIntro,
  HowToSection,
  UseCasesSection,
  TipsSection,
} from "./ToolContentSections";
import {
  ShieldCheck,
  ArrowRight,
  Calculator,
  TrendingUp,
  Type,
  Code,
  Clock,
} from "lucide-react";

interface ToolShellProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

const ICON_MAP: Record<string, React.ElementType> = {
  calculators: Calculator,
  business: TrendingUp,
  text: Type,
  "data-dev": Code,
  "time-units": Clock,
};

export default function ToolShell({ tool, children }: ToolShellProps) {
  const relatedTools = getRelatedTools(tool);
  const allTools = getAllTools();
  const content = getToolContent(tool.slug);
  const sameCategoryTools = allTools.filter(
    (t) => t.category === tool.category && t.slug !== tool.slug
  );

  // Registry FAQ first, then the long-form ones. Must stay in sync with the
  // FAQPage JSON-LD built in lib/seo/jsonld.ts.
  const allFaqs = [...tool.faqs, ...(content?.extraFaqs ?? [])];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Breadcrumbs
        items={[
          { name: "All Tools", url: "/tools" },
          { name: tool.categoryName, url: `/categories/${tool.category}` },
          { name: tool.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Primary column */}
        <div className="lg:col-span-8 space-y-6">
          <header className="space-y-3 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/categories/${tool.category}`}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                {tool.categoryName}
              </Link>
              <span className="flex items-center text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/30">
                100% Free for All
              </span>
              <span className="flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Client-Side Private
              </span>
              <span className="flex items-center text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                Auto-saved (3 days)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tool.name}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {tool.longDescription}
            </p>
          </header>

          {/* The interactive tool itself stays directly below the H1 — no ad
              is placed between the heading and the tool, both because it is
              what users came for and because AdSense treats ads that crowd
              primary controls as an accidental-click risk. */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
            {children}
          </div>

          {content && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm">
              <ToolIntro intro={content.intro} />
            </div>
          )}

          {tool.formulas && tool.formulas.length > 0 && (
            <FormulaBox formulas={tool.formulas} />
          )}

          {content && (
            <HowToSection howTo={content.howTo} toolName={tool.name} />
          )}

          {/* In-article ad sits between content sections with generous margin
              on both sides, well clear of any interactive element. */}
          <div className="py-4">
            <AdSlot placement="toolInArticle" format="in-article" />
          </div>

          {content && <UseCasesSection useCases={content.useCases} />}

          {content && <TipsSection tips={content.tips} />}

          {allFaqs.length > 0 && <FaqSection faqs={allFaqs} />}

          {relatedTools.length > 0 && <RelatedTools tools={relatedTools} />}
        </div>

        {/* Sidebar rail */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span>More in {tool.categoryName}</span>
              <Link
                href={`/categories/${tool.category}`}
                className="text-[11px] font-normal text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            </h2>

            <div className="space-y-1.5 pt-1">
              {sameCategoryTools.length > 0 ? (
                sameCategoryTools.map((otherTool) => (
                  <Link
                    key={otherTool.slug}
                    href={`/tools/${otherTool.slug}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition group"
                  >
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {otherTool.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                  </Link>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-1">
                  You are viewing the flagship tool in this category.
                </div>
              )}
            </div>
          </div>

          {/* Sticky sidebar ad. `top-20` clears the sticky header; the sidebar
              scrolls with the article rather than overlaying content. */}
          <div className="lg:sticky lg:top-20 space-y-6">
            <AdSlot placement="toolSidebar" format="sidebar" />

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Browse All Categories
              </h2>

              <div className="space-y-1 pt-1">
                {TOOL_CATEGORIES.map((cat) => {
                  const CatIcon = ICON_MAP[cat.id] || Calculator;
                  const count = allTools.filter(
                    (t) => t.category === cat.id
                  ).length;
                  const isCurrent = cat.id === tool.category;

                  return (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                        isCurrent
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <CatIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
