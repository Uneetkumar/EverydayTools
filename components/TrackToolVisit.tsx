"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/history/recent";
import { beginToolVisit, track } from "@/lib/analytics";

/**
 * Records the visit (recently used list + tool_view) and reports clicks on
 * related / next-step links, from a server-rendered tool page without making
 * the page itself a client component. Links opt in with data-track-related.
 */
export default function TrackToolVisit({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category?: string;
}) {
  useEffect(() => {
    beginToolVisit();
    const id = setTimeout(() => {
      pushRecent({ slug, name });
      track("tool_view", { tool: slug, category });
    }, 0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[data-track-related]");
      if (!a) return;
      track("related_tool_clicked", {
        from: a.getAttribute("data-from") ?? slug,
        to: a.getAttribute("data-to") ?? undefined,
        placement: a.getAttribute("data-track-related") ?? undefined,
      });
    };
    document.addEventListener("click", onClick);

    return () => {
      clearTimeout(id);
      document.removeEventListener("click", onClick);
    };
  }, [slug, name, category]);

  return null;
}
