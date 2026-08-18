"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { History, X, ArrowRight } from "lucide-react";
import { readRecent, clearRecent, RecentEntry } from "@/lib/history/recent";
import { getToolBySlug } from "@/lib/tools/registry";

type Variant = "panel" | "compact";

/**
 * Reads on mount rather than during render: the page is prerendered at build
 * time, so touching localStorage while rendering would produce a hydration
 * mismatch between the static HTML and the browser.
 */
export default function RecentTools({
  className = "",
  variant = "panel",
}: {
  className?: string;
  variant?: Variant;
}) {
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setRecent(readRecent()), 0);
    return () => clearTimeout(id);
  }, []);

  if (recent.length === 0) return null;

  // Names are resolved from the registry rather than from storage, so chips
  // show the short label and a renamed tool never shows a stale name.
  const labelFor = (entry: RecentEntry) =>
    getToolBySlug(entry.slug)?.shortName ?? entry.name;

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 text-xs ${className}`}
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Recent
        </span>
        {recent.map((entry) => (
          <Link
            key={entry.slug}
            href={`/tools/${entry.slug}`}
            title={entry.name}
            className="max-w-[190px] truncate rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            {labelFor(entry)}
          </Link>
        ))}
        <button
          onClick={() => {
            clearRecent();
            setRecent([]);
          }}
          aria-label="Clear recently used tools"
          className="rounded-lg p-1 text-slate-400 hover:text-red-500 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="recent-heading"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="recent-heading"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white"
        >
          <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Recently used
        </h2>
        <button
          onClick={() => {
            clearRecent();
            setRecent([]);
          }}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-red-500 transition"
          aria-label="Clear recently used tools"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <ul className="space-y-0.5">
        {recent.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/tools/${entry.slug}`}
              title={entry.name}
              className="flex items-center justify-between gap-2 py-1.5 px-2 -mx-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition group"
            >
              <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {labelFor(entry)}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
        Stored only in this browser.
      </p>
    </section>
  );
}
