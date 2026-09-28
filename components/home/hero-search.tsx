"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useSearch } from "@/components/search/search-provider";

/**
 * The homepage's primary action. It opens the same command palette as the
 * header (one search, one ranking, one set of results) rather than being a
 * second search implementation with its own dropdown.
 */
export function HeroSearch({ toolCount }: { toolCount: number }) {
  const { open } = useSearch();
  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label={`Search ${toolCount} tools`}
      className="group flex h-14 w-full items-center gap-3 rounded-2xl border bg-card px-4 text-left shadow-raised transition-colors hover:border-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-16 sm:px-5"
    >
      <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-base text-muted-foreground sm:text-lg">
        What do you need to do?
      </span>
      <span className="hidden items-center gap-1 sm:flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}
