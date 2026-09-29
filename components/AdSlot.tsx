"use client";

import React, { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  ADSENSE_CLIENT,
  AD_PLACEMENTS,
  AD_UNITS,
  AdPlacement,
  isValidSlotId,
} from "@/lib/ads/config";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  /** Named placement from lib/ads/config.ts — decides unit, format and size. */
  placement: AdPlacement;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * The only way an ad reaches a page.
 *
 * - Space is reserved from first paint (min-height per breakpoint), so an ad
 *   that fills does not push the page while someone is using a tool. CLS is a
 *   Core Web Vital.
 * - An unfilled unit collapses (CSS keyed on AdSense's own
 *   data-ad-status="unfilled"), instead of leaving an empty labelled box —
 *   which is what every visitor, and every AdSense reviewer, saw while the
 *   site awaited approval.
 * - Visually distinct from content: a small "Advertisement" caption, no card
 *   styling, no icons, never styled like a tool or a search result.
 * - Placements that only make sense on wide screens are not mounted at all on
 *   narrow ones (a hidden unit still requests an ad and logs an error).
 */
export default function AdSlot({ placement, className }: AdSlotProps) {
  const config = AD_PLACEMENTS[placement];
  const slotId = AD_UNITS[config.unit];
  const pushed = useRef(false);
  const minViewport = "minViewport" in config ? config.minViewport : undefined;
  const wideEnough = useMediaQuery(`(min-width: ${minViewport ?? 0}px)`);
  const allowed = minViewport === undefined || wideEnough;

  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!allowed || !isValidSlotId(slotId) || pushed.current) return;
    const ins = insRef.current;
    // The adsbygoogle array is a queue: pushing before the script loads is
    // the documented pattern, and the script drains it on arrival.
    const push = () => {
      if (pushed.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // A failed push must never break the page around it.
      }
    };
    // A unit pushed while it has no width (a hidden tab, a collapsed parent)
    // fails with "No slot size for availableWidth=0" and never retries, so
    // wait until the slot is actually laid out.
    if (!ins || ins.offsetWidth > 0) {
      push();
      return;
    }
    const ro = new ResizeObserver(() => {
      if (ins.offsetWidth > 0) {
        ro.disconnect();
        push();
      }
    });
    ro.observe(ins);
    return () => ro.disconnect();
  }, [allowed, slotId]);

  // No real slot ID configured: render nothing. AdSense prohibits
  // placeholders that imply an ad where none is served.
  if (!isValidSlotId(slotId) || !allowed) return null;

  const fluid = config.format === "fluid";

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn(
        "ad-slot mx-auto flex w-full flex-col items-center [contain:layout]",
        "has-[ins[data-ad-status=unfilled]]:hidden",
        className
      )}
      style={{ maxWidth: config.maxWidth }}
    >
      <span className="mb-1.5 text-[11px] tracking-wide text-muted-foreground/80 uppercase">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className={cn("adsbygoogle block w-full", config.heightClass)}
        style={{
          display: "block",
          ...(fluid ? { textAlign: "center" as const } : {}),
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={config.format}
        {...(fluid
          ? // A fluid in-article unit takes its layout from data-ad-layout.
            { "data-ad-layout": "in-article" }
          : { "data-full-width-responsive": "true" })}
      />
    </aside>
  );
}
