"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Star, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AdSlot from "@/components/AdSlot";
import { searchTools } from "@/lib/tools/search";
import { useFavorites } from "@/lib/history/favorites";
import { track } from "@/lib/analytics";
import { ToolCard } from "./tool-card";
import { ToolEmptyState } from "./tool-states";
import type { ExplorerTool } from "./tool-explorer";

const subscribeNever = () => () => {};
const readQueryParam = () => (new URLSearchParams(window.location.search).get("q") ?? "").slice(0, 100);

interface DirectoryCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

/**
 * The full directory: every tool grouped by category (all links in the
 * static HTML), with search, a category filter and a favorites filter on top.
 */
export function ToolDirectory({
  tools,
  categories,
}: {
  tools: ExplorerTool[];
  categories: DirectoryCategory[];
}) {
  // `/tools?q=pdf` opens the directory already searched — the target of the
  // WebSite SearchAction in lib/seo/jsonld.ts. Read after hydration (the
  // server snapshot is ""), and only until the visitor types. The page's
  // canonical stays /tools, so ?q= URLs never compete with it.
  const urlQuery = React.useSyncExternalStore(subscribeNever, readQueryParam, () => "");
  const [typed, setQuery] = React.useState<string | null>(null);
  const query = typed ?? urlQuery;
  const [category, setCategory] = React.useState("all");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const favorites = useFavorites();

  const trimmed = query.trim();
  const filtering = trimmed.length > 0 || favoritesOnly || category !== "all";

  const results = React.useMemo(() => {
    let list = trimmed ? searchTools(tools, trimmed) : tools;
    if (category !== "all") list = list.filter((t) => t.category === category);
    if (favoritesOnly) list = list.filter((t) => favorites.includes(t.slug));
    return list;
  }, [tools, trimmed, category, favoritesOnly, favorites]);

  React.useEffect(() => {
    if (!trimmed) return;
    const id = setTimeout(
      () => track("search_used", { query_length: trimmed.length, results: results.length, source: "directory" }),
      900
    );
    return () => clearTimeout(id);
  }, [trimmed, results.length]);

  return (
    <div>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="h-10 sm:max-w-md">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tools.length} tools…`}
              aria-label="Search all tools"
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQuery("")}>
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <Toggle
            variant="outline"
            pressed={favoritesOnly}
            onPressedChange={setFavoritesOnly}
            aria-label="Show favorites only"
            className="h-10 w-fit px-3"
          >
            <Star className={favoritesOnly ? "fill-amber-400 text-amber-500" : ""} aria-hidden="true" />
            Favorites
          </Toggle>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(v) => setCategory(v || "all")}
            variant="outline"
            size="sm"
            spacing={2}
            aria-label="Filter by category"
            className="w-max"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            {categories.map((c) => (
              <ToggleGroupItem key={c.id} value={c.id}>
                {c.shortName}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {filtering ? (
        <section aria-labelledby="directory-results" className="mt-8">
          <h2 id="directory-results" className="type-h3 text-foreground" aria-live="polite">
            {results.length} {results.length === 1 ? "tool" : "tools"}
          </h2>
          {results.length === 0 ? (
            <ToolEmptyState
              className="mt-4"
              icon={<Search />}
              title="No tools match"
              description="Try a shorter word or a different category."
            />
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((t) => (
                <li key={t.slug}>
                  <ToolCard tool={t} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="mt-10 space-y-14">
          {categories.map((c, i) => {
            const inCat = tools.filter((t) => t.category === c.id);
            if (inCat.length === 0) return null;
            return (
              <React.Fragment key={c.id}>
                <section aria-labelledby={`cat-${c.id}`}>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 id={`cat-${c.id}`} className="type-h2 text-foreground">
                        <Link href={`/categories/${c.id}`} className="hover:underline hover:underline-offset-4">
                          {c.name}
                        </Link>
                      </h2>
                      <p className="mt-1 type-body-sm text-muted-foreground">{c.description}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{inCat.length} tools</span>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {inCat.map((t) => (
                      <li key={t.slug}>
                        <ToolCard tool={t} compact />
                      </li>
                    ))}
                  </ul>
                </section>
                {/* One ad partway down the listing, between groups — never
                    between cards within a group, where it would read as one. */}
                {i === 1 && <AdSlot placement="listing-middle" />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
