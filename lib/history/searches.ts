"use client";

import { createLocalStore, stringArray } from "./local-store";

/**
 * Recent searches in the command palette, kept in this browser only and
 * recorded only when a search actually led somewhere (a result was opened),
 * so half-typed queries never end up in the list.
 */
const MAX = 5;

export const searchesStore = createLocalStore<string[]>(
  "tb_recent_searches_v1",
  [],
  stringArray(MAX)
);

export function useRecentSearches(): string[] {
  return searchesStore.useValue();
}

export function pushRecentSearch(query: string): void {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 60);
  if (q.length < 2) return;
  searchesStore.update((prev) =>
    [q, ...prev.filter((p) => p.toLowerCase() !== q.toLowerCase())].slice(0, MAX)
  );
}
