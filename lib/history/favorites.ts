"use client";

import { createLocalStore, stringArray } from "./local-store";

/**
 * Favorite tools, stored only in this browser. No account exists on the site
 * and adding one just to remember a handful of links would contradict the
 * site's premise that nothing about your activity leaves the device.
 */
const MAX = 50;

export const favoritesStore = createLocalStore<string[]>(
  "tb_favorites_v1",
  [],
  stringArray(MAX)
);

export function useFavorites(): string[] {
  return favoritesStore.useValue();
}

export function isFavorite(slug: string): boolean {
  return favoritesStore.get().includes(slug);
}

/** Returns the new state: true when the tool is now a favorite. */
export function toggleFavorite(slug: string): boolean {
  const current = favoritesStore.get();
  const adding = !current.includes(slug);
  favoritesStore.set(
    adding ? [slug, ...current].slice(0, MAX) : current.filter((s) => s !== slug)
  );
  return adding;
}
