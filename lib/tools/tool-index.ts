import type { ToolCategoryId, ToolDefinition, ToolPrivacy } from "./registry";

/**
 * The slice of a tool that browser-side features need: search, favorites,
 * recently used, and the command palette.
 *
 * The full registry carries FAQs, formulas and long-form copy (~150 KB) that
 * only server-rendered pages use. Shipping it to the browser on every page
 * cost every visitor that download for a search box they may never open.
 * Instead the build emits this slim index as /tool-index.json, fetched once
 * when it is first needed and cached by the browser.
 */
export interface ToolIndexEntry {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: ToolCategoryId;
  categoryName: string;
  iconName: string;
  keywords: string[];
  aliases: string[];
  features: string[];
  privacy: ToolPrivacy;
  isPopular?: boolean;
}

export interface ToolIndex {
  tools: ToolIndexEntry[];
  categories: Array<{ id: ToolCategoryId; name: string; shortName: string; icon: string }>;
  popular: string[];
}

export function toIndexEntry(t: ToolDefinition): ToolIndexEntry {
  return {
    slug: t.slug,
    name: t.name,
    shortName: t.shortName,
    tagline: t.tagline,
    description: t.description,
    category: t.category,
    categoryName: t.categoryName,
    iconName: t.iconName,
    keywords: t.keywords,
    aliases: t.aliases,
    features: t.features,
    privacy: t.privacy,
    ...(t.isPopular ? { isPopular: true } : {}),
  };
}
