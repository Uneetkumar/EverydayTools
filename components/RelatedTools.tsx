import React from "react";
import Link from "next/link";
import { ToolDefinition } from "@/lib/tools/registry";
import { ArrowRight, Sparkles, Percent, TrendingUp, Type, Code, Clock, Calculator } from "lucide-react";

interface RelatedToolsProps {
  tools: ToolDefinition[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Percent,
  TrendingUp,
  Type,
  Code,
  Clock,
  Calculator,
};

export default function RelatedTools({ tools }: RelatedToolsProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Related Everyday Utilities
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = ICON_MAP[tool.iconName] || Calculator;
          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {tool.categoryName}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>

              <div className="flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-4 group-hover:translate-x-1 transition-transform">
                <span>Use tool</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
