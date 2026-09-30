"use client";

import * as React from "react";
import { Search, Star, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Toggle } from "@/components/ui/toggle";
import AdSlot from "@/components/AdSlot";
import { searchTools, type SearchableTool } from "@/lib/tools/search";
import { useFavorites } from "@/lib/history/favorites";
import { track } from "@/lib/analytics";
import { ToolCard } from "./tool-card";
import { ToolEmptyState } from "./tool-states";
import type { ToolPrivacy } from "@/lib/tools/registry";

export interface ExplorerTool extends SearchableTool {
  tagline: string;
  iconName: string;
  privacy?: ToolPrivacy;
}

interface ToolExplorerProps {
  tools: ExplorerTool[];
  /** Slugs shown first, in order, under "Popular". */
  popular: string[];
  /** Lower-case noun for copy: "calculators", "PDF tools". */
  noun: string;
  allHeading: string;
  showAd?: boolean;
}

/**
 * A category as a product area: search within it, filter to favorites,
 * popular first, then everything. With no query the full list is in the
 * server-rendered HTML, so every tool link is crawlable.
 */
export function ToolExplorer({ tools, popular, noun, allHeading, showAd = false }: ToolExplorerProps) {
  const [query, setQuery] = React.useState("");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const favorites = useFavorites();

  const trimmed = query.trim();
  const filtering = trimmed.length > 0 || favoritesOnly;

  const results = React.useMemo(() => {
    let list = trimmed ? searchTools(tools, trimmed) : tools;
    if (favoritesOnly) list = list.filter((t) => favorites.includes(t.slug));
    return list;
  }, [tools, trimmed, favoritesOnly, favorites]);

  React.useEffect(() => {
    if (!trimmed) return;
    const id = setTimeout(
      () => track("search_used", { query_length: trimmed.length, results: results.length, source: "category" }),
      900
    );
    return () => clearTimeout(id);
  }, [trimmed, results.length]);

  const popularTools = popular
    .map((s) => tools.find((t) => t.slug === s))
    .filter((t): t is ExplorerTool => !!t);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="h-10 sm:max-w-md">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${noun}…`}
            aria-label={`Search ${noun}`}
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

      {filtering ? (
        <section aria-labelledby="explorer-results" className="mt-8">
          <h2 id="explorer-results" className="type-h3 text-foreground" aria-live="polite">
            {results.length === 0
              ? "No matches"
              : `${results.length} ${results.length === 1 ? "tool" : "tools"}${trimmed ? ` for “${trimmed}”` : ""}`}
          </h2>
          {results.length === 0 ? (
            <ToolEmptyState
              className="mt-4"
              icon={favoritesOnly ? <Star /> : <Search />}
              title={favoritesOnly && !trimmed ? "No favorites here yet" : "Nothing matches that search"}
              description={
                favoritesOnly && !trimmed
                  ? "Tap the star on a tool to keep it one click away."
                  : "Try a different word, or use the search in the header to look across every category."
              }
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
        <>
          {popularTools.length > 0 && tools.length > popularTools.length && (
            <section aria-labelledby="explorer-popular" className="mt-8">
              <h2 id="explorer-popular" className="type-h2 text-foreground">
                Popular
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {popularTools.map((t) => (
                  <li key={t.slug}>
                    <ToolCard tool={t} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showAd && <AdSlot placement="category-middle" className="mt-12" />}

          <section aria-labelledby="explorer-all" className="mt-12">
            <h2 id="explorer-all" className="type-h2 text-foreground">
              {allHeading}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...tools]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <li key={t.slug}>
                    <ToolCard tool={t} compact />
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
