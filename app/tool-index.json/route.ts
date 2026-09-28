import {
  getAllTools,
  POPULAR_TOOL_SLUGS,
  TOOL_CATEGORIES,
} from "@/lib/tools/registry";
import { toIndexEntry, type ToolIndex } from "@/lib/tools/tool-index";

export const dynamic = "force-static";

/**
 * Slim, build-time copy of the registry for browser-side search, favorites
 * and recently used lists. See lib/tools/tool-index.ts.
 */
export async function GET() {
  const body: ToolIndex = {
    tools: getAllTools().map(toIndexEntry),
    categories: TOOL_CATEGORIES.map(({ id, name, shortName, icon }) => ({
      id,
      name,
      shortName,
      icon,
    })),
    popular: POPULAR_TOOL_SLUGS,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
