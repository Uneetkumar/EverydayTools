"use client";

import { ToolDefinition } from "@/lib/tools/registry";

/**
 * Recently used tools, stored locally.
 *
 * localStorage, not a server: the whole premise of this site is that nothing
 * about your activity leaves the device, and a "recent tools" list on a server
 * would be exactly the browsing history we promise not to collect. It also
 * means the list survives a refresh, which sessionStorage would not.
 */
const KEY = "et_recent_tools_v1";
const MAX = 4;

export interface RecentEntry {
  slug: string;
  name: string;
  /** Epoch ms of the most recent visit. */
  at: number;
}

export function readRecent(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is RecentEntry =>
          !!e && typeof e.slug === "string" && typeof e.name === "string"
      )
      .slice(0, MAX);
  } catch {
    // Corrupt or unavailable storage must never break the page.
    return [];
  }
}

/** Records a visit, moving an existing entry to the front rather than duplicating. */
export function pushRecent(tool: Pick<ToolDefinition, "slug" | "name">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecent().filter((e) => e.slug !== tool.slug);
    const next: RecentEntry[] = [
      { slug: tool.slug, name: tool.name, at: Date.now() },
      ...existing,
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing can throw on write; the feature is a convenience.
  }
}

export function clearRecent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
