"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, History, LayoutGrid, Star, TrendingUp } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { searchTools } from "@/lib/tools/search";
import { pickTools, useToolIndex } from "@/lib/tools/use-tool-index";
import type { ToolIndexEntry } from "@/lib/tools/tool-index";
import { useFavorites } from "@/lib/history/favorites";
import { useRecentTools } from "@/lib/history/recent";
import { pushRecentSearch, useRecentSearches } from "@/lib/history/searches";
import { track } from "@/lib/analytics";
import { CategoryVisual, ToolVisual } from "@/components/tool/tool-visual";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

const RESULT_LIMIT = 12;

export default function CommandSearch({ open, onOpenChange, initialQuery = "" }: CommandSearchProps) {
  const router = useRouter();
  const index = useToolIndex();
  const favorites = useFavorites();
  const recent = useRecentTools();
  const recentSearches = useRecentSearches();
  const [query, setQuery] = React.useState(initialQuery);

  const trimmed = query.trim();

  const results = React.useMemo(
    () => (index && trimmed ? searchTools(index.tools, trimmed, RESULT_LIMIT) : []),
    [index, trimmed]
  );

  const categoryMatches = React.useMemo(() => {
    if (!index || !trimmed) return [];
    const q = trimmed.toLowerCase();
    return index.categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)
    );
  }, [index, trimmed]);

  // One analytics event per settled query, not per keystroke. Length and
  // result count only — the text itself is never sent.
  React.useEffect(() => {
    if (!trimmed || !index) return;
    const id = setTimeout(() => {
      track("search_used", {
        query_length: trimmed.length,
        results: results.length,
        source: "palette",
      });
    }, 900);
    return () => clearTimeout(id);
  }, [trimmed, results.length, index]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const openTool = (tool: ToolIndexEntry, position: number, group: string) => {
    if (trimmed) pushRecentSearch(trimmed);
    track("search_result_clicked", {
      tool: tool.slug,
      position,
      group,
      query_length: trimmed.length,
    });
    go(`/tools/${tool.slug}`);
  };

  const recentTools = pickTools(index, recent.map((r) => r.slug)).slice(0, 5);
  const favoriteTools = pickTools(index, favorites).slice(0, 6);
  const popularTools = pickTools(index, index?.popular ?? []).slice(0, 8);

  const renderTool = (tool: ToolIndexEntry, i: number, group: string) => (
    <CommandItem
      key={`${group}:${tool.slug}`}
      value={`${group}:${tool.slug}`}
      onSelect={() => openTool(tool, i, group)}
      className="gap-3 py-2"
    >
      <ToolVisual slug={tool.slug} iconName={tool.iconName} category={tool.category} size="xs" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{tool.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{tool.tagline}</span>
      </span>
      <span className="ml-2 hidden shrink-0 text-xs text-muted-foreground sm:block">
        {index?.categories.find((c) => c.id === tool.category)?.shortName}
      </span>
    </CommandItem>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search tools"
      description="Find a tool by its name or by what you want to do."
      className="top-[12vh] sm:max-w-xl"
    >
      <Command shouldFilter={false} loop className="rounded-xl">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="What do you need to do? Try “compress image”"
          aria-label="Search tools"
        />
        <CommandList className="max-h-[min(62vh,30rem)] px-1 pb-1">
          {!index && (
            <div className="space-y-2 p-3" aria-busy="true" aria-label="Loading tools">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {index && trimmed && (
            <>
              <CommandEmpty className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No tools match “{trimmed}”</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try one word, or describe the task — “resize”, “pdf”, “percent”.
                </p>
              </CommandEmpty>
              {results.length > 0 && (
                <CommandGroup heading="Tools">
                  {results.map((t, i) => renderTool(t, i, "results"))}
                </CommandGroup>
              )}
              {categoryMatches.length > 0 && (
                <CommandGroup heading="Categories">
                  {categoryMatches.map((c) => (
                    <CommandItem
                      key={`cat:${c.id}`}
                      value={`cat:${c.id}`}
                      onSelect={() => go(`/categories/${c.id}`)}
                    >
                      <LayoutGrid className="text-muted-foreground" />
                      <span>{c.name}</span>
                      <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {index && !trimmed && (
            <>
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent searches">
                  {recentSearches.map((s) => (
                    <CommandItem key={`q:${s}`} value={`q:${s}`} onSelect={() => setQuery(s)}>
                      <History className="text-muted-foreground" />
                      <span className="truncate">{s}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {recentTools.length > 0 && (
                <CommandGroup heading={<span className="inline-flex items-center gap-1.5"><Clock className="size-3" />Recently used</span>}>
                  {recentTools.map((t, i) => renderTool(t, i, "recent"))}
                </CommandGroup>
              )}
              {favoriteTools.length > 0 && (
                <CommandGroup heading={<span className="inline-flex items-center gap-1.5"><Star className="size-3" />Favorites</span>}>
                  {favoriteTools.map((t, i) => renderTool(t, i, "favorites"))}
                </CommandGroup>
              )}
              <CommandGroup heading={<span className="inline-flex items-center gap-1.5"><TrendingUp className="size-3" />Popular</span>}>
                {popularTools.map((t, i) => renderTool(t, i, "popular"))}
              </CommandGroup>
              <CommandSeparator className="my-1" />
              <CommandGroup heading="Browse by category">
                {index.categories.map((c) => (
                  <CommandItem
                    key={`cat:${c.id}`}
                    value={`cat:${c.id}`}
                    onSelect={() => go(`/categories/${c.id}`)}
                  >
                    <CategoryVisual category={c.id} iconName={c.icon} size="2xs" />
                    <span>{c.name}</span>
                    <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
        <div className="hidden items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground sm:flex">
          <span className="inline-flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
          <span className="inline-flex items-center gap-1.5"><Kbd>esc</Kbd> close</span>
          <span className="ml-auto">Describe the task — “merge pdf”, “50kb”</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
