/**
 * The tool list, generated at build time from the site's registry
 * (scripts/build.mjs), and the site's own search ranking, so results in the
 * extension are exactly the ones the site's search would give.
 */
import data from "../generated/tools.json";
import { searchTools, type SearchableTool } from "../../../lib/tools/search";

export interface ExtTool extends SearchableTool {
  tagline: string;
  iconName: string;
  /** Category tile classes, identical to the site's ToolVisual. */
  tone: string;
  /** Format label on the tile corner ("PDF", "JPG"), where the site shows one. */
  badge?: string;
  badgeTone?: string;
}

export interface ExtCategory {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  tone: string;
}

export const TOOLS = data.tools as ExtTool[];
export const CATEGORIES = data.categories as ExtCategory[];
export const POPULAR = data.popular as string[];

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));

export function getTool(slug: string): ExtTool | undefined {
  return bySlug.get(slug);
}

export function search(query: string, limit = 8): ExtTool[] {
  return searchTools(TOOLS, query, limit);
}
