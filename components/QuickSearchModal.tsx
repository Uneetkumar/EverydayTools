"use client";

import React, { useState, useEffect } from "react";
import { searchTools } from "@/lib/tools/search";
import { useRouter } from "next/navigation";
import { getAllTools, ToolDefinition } from "@/lib/tools/registry";
import { Search, X, Command, ArrowRight, Percent, TrendingUp, Type, Code, Clock, Calculator } from "lucide-react";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Percent,
  TrendingUp,
  Type,
  Code,
  Clock,
  Calculator,
};

export default function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const tools = getAllTools();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // toggle handled externally or open
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTools = query.trim() === ""
    ? tools
    : searchTools(tools, query);

  const handleSelect = (slug: string) => {
    router.push(`/tools/${slug}`);
    // Reset the query so reopening the palette starts clean rather than
    // showing the previous search's results.
    setQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search calculators, text tools, formatters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-4 text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No matching tools found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Available Tools ({filteredTools.length})
              </div>
              {filteredTools.map((tool) => {
                const Icon = ICON_MAP[tool.iconName] || Calculator;
                return (
                  <button
                    key={tool.slug}
                    onClick={() => handleSelect(tool.slug)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {tool.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {tool.categoryName} • {tool.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">
              ESC
            </kbd>
            <span>to close</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Powered by client-side indexing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
