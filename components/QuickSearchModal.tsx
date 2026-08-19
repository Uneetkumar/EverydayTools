"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllTools } from "@/lib/tools/registry";
import { searchTools } from "@/lib/tools/search";
import { Search, X, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const tools = useMemo(() => getAllTools(), []);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(
    () => (query.trim() === "" ? tools.slice(0, 8) : searchTools(tools, query, 8)),
    [tools, query]
  );

  const select = (slug: string) => {
    router.push(`/tools/${slug}`);
    setQuery("");
    setActive(0);
    onClose();
  };

  // Escape closes; arrows move the highlight; Enter opens the highlighted row,
  // which defaults to the first result. Previously the palette had no key
  // handling at all, so Enter did nothing.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (results.length ? (i + 1) % results.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = results[active] ?? results[0];
        if (target) select(target.slug);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, results, active, onClose]);

  // Keep the highlighted row visible while arrowing.
  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search tools — try 'pdf', 'rs to dollar', 'compress'"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            autoFocus
            aria-label="Search tools"
            className="w-full py-4 text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul ref={listRef} className="max-h-[22rem] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Nothing matches &ldquo;{query}&rdquo;. Try a shorter word.
            </li>
          )}
          {results.map((tool, i) => (
            <li key={tool.slug}>
              <button
                onClick={() => select(tool.slug)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left cursor-pointer transition ${
                  i === active ? "bg-blue-50 dark:bg-blue-950/40" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                    {tool.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {tool.description}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-medium text-slate-400">
                  {tool.categoryName}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
            navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            open
          </span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
