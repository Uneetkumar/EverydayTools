"use client";

import { Clock, Star } from "lucide-react";
import { ToolCard } from "@/components/tool/tool-card";
import { useFavorites } from "@/lib/history/favorites";
import { clearRecent, useRecentTools } from "@/lib/history/recent";
import { pickTools, useToolIndex } from "@/lib/tools/use-tool-index";
import { Button } from "@/components/ui/button";

/**
 * Returning visitors' own tools, first thing under the hero. Renders nothing
 * for a first visit (and in the static HTML), so it never costs a new visitor
 * any space. The index is only fetched when there is something to show.
 */
export function YourTools() {
  const favorites = useFavorites();
  const recent = useRecentTools();
  if (favorites.length === 0 && recent.length === 0) return null;
  return <YourToolsList favorites={favorites} recentSlugs={recent.map((r) => r.slug)} />;
}

function YourToolsList({ favorites, recentSlugs }: { favorites: string[]; recentSlugs: string[] }) {
  const index = useToolIndex();
  if (!index) return null;
  const favTools = pickTools(index, favorites).slice(0, 4);
  const recentTools = pickTools(index, recentSlugs.filter((s) => !favorites.includes(s))).slice(0, 4);

  return (
    <section aria-labelledby="your-tools" className="space-y-6">
      <h2 id="your-tools" className="sr-only">
        Your tools
      </h2>
      {favTools.length > 0 && (
        <div>
          <p className="type-label mb-3 flex items-center gap-2 text-muted-foreground">
            <Star aria-hidden="true" className="size-4" /> Favorites
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {favTools.map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} as="p" compact />
              </li>
            ))}
          </ul>
        </div>
      )}
      {recentTools.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="type-label flex items-center gap-2 text-muted-foreground">
              <Clock aria-hidden="true" className="size-4" /> Recently used
            </p>
            <Button variant="ghost" size="xs" onClick={() => clearRecent()} className="text-muted-foreground">
              Clear
            </Button>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentTools.map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} as="p" compact />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
