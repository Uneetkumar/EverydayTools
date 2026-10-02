"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Notice } from "@/components/tool/kit";

/**
 * Shown when the service worker sent someone here because the page they asked
 * for is not saved on this device (/offline?from=/tools/…).
 */
export function OfflineFrom({ names }: { names: Record<string, string> }) {
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const value = new URLSearchParams(window.location.search).get("from");
      // Same-site paths only: this is a link the page renders.
      if (value && value.startsWith("/") && !value.startsWith("//")) setFrom(value);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!from) return null;
  const slug = from.match(/^\/tools\/([^/?#]+)/)?.[1];
  const what = slug && names[slug] ? names[slug] : "that page";
  return (
    <Notice tone="warning" className="mt-6">
      <span className="font-medium">You&apos;re offline, and {what} isn&apos;t saved on this device yet.</span> Save the tools below while you have a connection, so they open next time.{" "}
      <a href={from} className="inline-flex items-center gap-1 font-medium text-link underline-offset-4 hover:underline">
        <RotateCcw className="size-3.5" aria-hidden="true" /> Try again
      </a>
    </Notice>
  );
}
