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
      // Revalidate every time (a 304 when nothing changed). This is also what
      // firebase.json sends in production. It used to be `max-age=3600`, which
      // the dev server passed through, so a browser that had loaded the site
      // before a batch of tools was added searched the old list for an hour.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
