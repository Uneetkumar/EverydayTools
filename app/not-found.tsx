import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPopularTools, TOOL_CATEGORIES, getToolsByCategory } from "@/lib/tools/registry";
import { ArrowRight, Compass } from "lucide-react";

/**
 * A 404 with real links, rather than a dead end.
 *
 * Previously this route fell through to the site default and shipped a title
 * identical to the homepage. Beyond looking broken, a 404 that offers no
 * onward links wastes the crawl and sends the visitor straight back out.
 */
export const metadata: Metadata = {
  title: { absolute: "Page Not Found (404) | EverydayTools" },
  description:
    "That page does not exist. Browse the full tool directory, or jump to one of the popular free tools below.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const popular = getPopularTools().slice(0, 6);
  const categories = TOOL_CATEGORIES.filter(
    (c) => getToolsByCategory(c.id).length > 0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <header className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500">
          <Compass className="w-3.5 h-3.5" />
          404
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          That page does not exist
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          The link may be outdated, or the address might have a typo. Everything
          on the site is reachable from the tool directory.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/tools"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            Browse all tools
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Go to homepage
          </Link>
        </div>
      </header>

      <section aria-labelledby="popular-404" className="space-y-4">
        <h2
          id="popular-404"
          className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2"
        >
          Popular tools
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popular.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:border-blue-300 dark:hover:border-blue-700"
              >
                <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {tool.name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cats-404" className="space-y-4">
        <h2
          id="cats-404"
          className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2"
        >
          Categories
        </h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/categories/${cat.id}`}
                className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
