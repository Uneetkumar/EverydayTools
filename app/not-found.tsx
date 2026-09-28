import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllTools, getPopularTools, TOOL_CATEGORIES, getToolsByCategory } from "@/lib/tools/registry";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/tool/tool-card";
import { HeroSearch } from "@/components/home/hero-search";

/**
 * A 404 with real links, rather than a dead end.
 *
 * Previously this route fell through to the site default and shipped a title
 * identical to the homepage. Beyond looking broken, a 404 that offers no
 * onward links wastes the crawl and sends the visitor straight back out.
 */
export const metadata: Metadata = {
  title: { absolute: "Page Not Found (404) | TabBench" },
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
    <div className="page-container py-12 md:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 type-overline text-muted-foreground">
          <Compass className="size-3.5" aria-hidden="true" />
          404
        </p>
        <h1 className="mt-4 type-h1 text-foreground">That page doesn&apos;t exist</h1>
        <p className="mt-3 type-body text-muted-foreground">
          The link may be out of date, or the address may have a typo. Search for the tool you need, or pick one
          below.
        </p>
        <div className="mx-auto mt-6 max-w-lg">
          <HeroSearch toolCount={getAllTools().length} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/tools">Browse all tools</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to the homepage</Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="popular-404" className="mx-auto mt-14 max-w-5xl">
        <h2 id="popular-404" className="type-h3 text-foreground">Popular tools</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} as="p" showFavorite={false} className="h-full" />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cats-404" className="mx-auto mt-12 max-w-5xl">
        <h2 id="cats-404" className="type-h3 text-foreground">Categories</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/categories/${cat.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
              >
                {cat.name}
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
