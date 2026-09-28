"use client";

import { createLocalStore } from "./local-store";

/**
 * Recently used tools, stored locally.
 *
 * localStorage, not a server: the whole premise of this site is that nothing
 * about your activity leaves the device, and a "recent tools" list on a server
 * would be exactly the browsing history we promise not to collect. It also
 * means the list survives a refresh, which sessionStorage would not.
 *
 * The storage key is unchanged from the original implementation so existing
 * visitors keep their history.
 */
const KEY = "et_recent_tools_v1";
const MAX = 8;

export interface RecentEntry {
  slug: string;
  name: string;
  /** Epoch ms of the most recent visit. */
  at: number;
}

const EMPTY: RecentEntry[] = [];

export const recentStore = createLocalStore<RecentEntry[]>(KEY, EMPTY, (raw) =>
  Array.isArray(raw)
    ? raw
        .filter(
          (e): e is RecentEntry =>
            !!e && typeof e.slug === "string" && typeof e.name === "string"
        )
        .slice(0, MAX)
    : EMPTY
);

export function useRecentTools(): RecentEntry[] {
  return recentStore.useValue();
}

export function readRecent(): RecentEntry[] {
  return recentStore.get();
}

/** Records a visit, moving an existing entry to the front rather than duplicating. */
export function pushRecent(tool: { slug: string; name: string }): void {
  if (typeof window === "undefined") return;
  recentStore.update((prev) =>
    [
      { slug: tool.slug, name: tool.name, at: Date.now() },
      ...prev.filter((e) => e.slug !== tool.slug),
    ].slice(0, MAX)
  );
}

export function clearRecent(): void {
  if (typeof window === "undefined") return;
  recentStore.clear();
}
