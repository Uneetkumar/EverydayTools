"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/history/recent";

/** Records the visit from a server-rendered tool page without making it client. */
export default function TrackToolVisit({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  useEffect(() => {
    const id = setTimeout(() => pushRecent({ slug, name }), 0);
    return () => clearTimeout(id);
  }, [slug, name]);

  return null;
}
