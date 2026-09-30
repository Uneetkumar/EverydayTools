"use client";

import { useSyncExternalStore } from "react";
import type { ToolIndex, ToolIndexEntry } from "./tool-index";

/**
 * Loads /tool-index.json once per page session and shares it between every
 * component that needs tool data in the browser. Nothing is fetched until a
 * component asks for it (or `prefetchToolIndex` is called on idle).
 */
let cache: ToolIndex | null = null;
let inflight: Promise<ToolIndex | null> | null = null;
const listeners = new Set<() => void>();

export function loadToolIndex(): Promise<ToolIndex | null> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    // `no-cache` = revalidate with the server even if the browser holds a copy
    // it still considers fresh, so a newly added tool is searchable at once.
    inflight = fetch("/tool-index.json", { cache: "no-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<ToolIndex>) : null))
      .then((data) => {
        if (data) {
          cache = data;
          for (const l of listeners) l();
        } else {
          inflight = null;
        }
        return data;
      })
      .catch(() => {
        // Offline or blocked: allow a retry next time something asks.
        inflight = null;
        return null;
      });
  }
  return inflight;
}

export function prefetchToolIndex(): void {
  if (typeof window === "undefined" || cache) return;
  const run = () => void loadToolIndex();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run);
  } else {
    setTimeout(run, 1500);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadToolIndex();
  return () => listeners.delete(listener);
}

/** The index, or null until it has loaded. */
export function useToolIndex(): ToolIndex | null {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => null
  );
}

/** Resolve slugs to entries, dropping any that no longer exist. */
export function pickTools(index: ToolIndex | null, slugs: string[]): ToolIndexEntry[] {
  if (!index) return [];
  const bySlug = new Map(index.tools.map((t) => [t.slug, t]));
  return slugs.map((s) => bySlug.get(s)).filter((t): t is ToolIndexEntry => !!t);
}
