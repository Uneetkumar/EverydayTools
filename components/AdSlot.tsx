"use client";

import React, { useEffect, useRef } from "react";
import {
  ADSENSE_CLIENT,
  AD_SLOTS,
  AdPlacement,
  isValidSlotId,
} from "@/lib/ads/config";

type AdFormat = "in-article" | "rectangle" | "sidebar" | "leaderboard";

interface AdSlotProps {
  /** Named placement from lib/ads/config.ts */
  placement: AdPlacement;
  format?: AdFormat;
  className?: string;
}

/**
 * Reserved heights match the IAB unit each format requests, so the space is
 * held from first paint and the ad does not shift content when it fills.
 * Cumulative Layout Shift is a Core Web Vital and a ranking signal — an ad
 * that pushes the page down on load is one of the most common causes of a
 * failing CLS score.
 */
const FORMAT_STYLES: Record<
  AdFormat,
  { wrapper: string; minHeight: number; responsive: boolean }
> = {
  "in-article": {
    wrapper: "w-full max-w-[728px]",
    minHeight: 280,
    responsive: true,
  },
  rectangle: {
    wrapper: "w-full max-w-[336px]",
    minHeight: 280,
    responsive: false,
  },
  sidebar: {
    wrapper: "w-full max-w-[300px]",
    minHeight: 600,
    responsive: false,
  },
  leaderboard: {
    wrapper: "w-full max-w-[728px]",
    minHeight: 90,
    responsive: true,
  },
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({
  placement,
  format = "in-article",
  className = "",
}: AdSlotProps) {
  const slotId = AD_SLOTS[placement];
  const insRef = useRef<HTMLModElement | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!isValidSlotId(slotId) || pushed.current) return;

    // The adsbygoogle array is a queue: pushing before the script loads is the
    // documented pattern, and the script drains it on arrival. The previous
    // implementation skipped the push whenever window.adsbygoogle was still
    // undefined, which is the normal state on first paint — so the unit never
    // filled.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // A failed push must never break the page around it.
    }
  }, [slotId]);

  // No real slot ID configured: render nothing. An empty bordered box labelled
  // "Advertisement" is worse than no box — it wastes layout, and AdSense
  // prohibits placeholders that imply an ad where none is served.
  if (!isValidSlotId(slotId)) return null;

  const style = FORMAT_STYLES[format];

  return (
    <div
      className={`mx-auto flex flex-col items-center ${style.wrapper} ${className}`}
    >
      <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-600">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: style.minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={format === "in-article" ? "fluid" : "auto"}
        {...(format === "in-article"
          ? { "data-ad-layout": "in-article" }
          : {})}
        data-full-width-responsive={style.responsive ? "true" : "false"}
      />
    </div>
  );
}
