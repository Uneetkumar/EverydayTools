import React from "react";
import Link from "next/link";
import { ToolDefinition, getRelatedTools, getAllTools, TOOL_CATEGORIES } from "@/lib/tools/registry";
import Breadcrumbs from "./Breadcrumbs";
import FormulaBox from "./FormulaBox";
import FaqSection from "./FaqSection";
import RelatedTools from "./RelatedTools";
import AdSlot from "./AdSlot";
import { ShieldCheck, Sparkles, ArrowRight, Calculator, TrendingUp, Type, Code, Clock } from "lucide-react";

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
  const sameCategoryTools = allTools.filter(
    (t) => t.category === tool.category && t.slug !== tool.slug
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { name: tool.categoryName, url: `/#${tool.category}` },
          { name: tool.name },
        ]}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Primary Column (8 of 12 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Area */}
          <div className="space-y-2 pb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {tool.categoryName}
              </span>
              <span className="flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 mr-1" />
                100% Client-Side Private
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tool.name}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {tool.longDescription}
            </p>
          </div>

          {/* Top Leaderboard Ad */}
          <AdSlot slotId="tool-top-banner" format="leaderboard" />

          {/* Main Interactive Tool Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
            {children}
          </div>

          {/* Step-by-step Formulas */}
          {tool.formulas && tool.formulas.length > 0 && (
            <FormulaBox formulas={tool.formulas} />
          )}

          {/* In-content non-intrusive AdSlot */}
          <AdSlot slotId="tool-mid-banner" format="in-article" />

          {/* FAQs */}
          {tool.faqs && tool.faqs.length > 0 && <FaqSection faqs={tool.faqs} />}

          {/* Related Tools */}
          {relatedTools.length > 0 && <RelatedTools tools={relatedTools} />}
        </div>

        {/* Right Sidebar Rail (4 of 12 cols on desktop) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Quick Tool Switcher in this Category */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span>More in {tool.categoryName}</span>
              <span className="text-[11px] font-normal text-slate-400">Quick jump</span>
            </h3>

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

          {/* All Tool Categories Navigation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Browse All Categories
            </h3>

            <div className="space-y-1 pt-1">
              {TOOL_CATEGORIES.map((cat) => {
                const CatIcon = ICON_MAP[cat.id] || Calculator;
                const count = allTools.filter((t) => t.category === cat.id).length;
                const isCurrent = cat.id === tool.category;

                return (
                  <Link
                    key={cat.id}
                    href={`/#${cat.id}`}
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
                    <span className="text-[11px] text-slate-400">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sidebar Ad Placement (Compliant with Mediavine/Raptive 300x250 or 300x600 rail) */}
          <AdSlot slotId="tool-sidebar-rail" format="rectangle" />
        </aside>
      </div>
    </div>
  );
}
