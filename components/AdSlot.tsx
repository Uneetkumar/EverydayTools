"use client";

import React, { useEffect } from "react";

interface AdSlotProps {
  slotId: string;
  format?: "sidebar" | "rectangle" | "skyscraper" | "leaderboard" | "in-article";
  className?: string;
  adClient?: string;
}

export default function AdSlot({
  slotId,
  format = "rectangle",
  className = "",
  adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-5552044975820319",
}: AdSlotProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.debug("AdSense push:", e);
    }
  }, [slotId]);

  // Standard IAB display dimensions for Zero-CLS (Cumulative Layout Shift) compliance
  const formatDimensions: Record<string, { width: string; height: string; label: string }> = {
    sidebar: { width: "w-full max-w-[300px]", height: "min-h-[600px]", label: "300x600 Half-Page / Skyscraper" },
    rectangle: { width: "w-full max-w-[300px]", height: "min-h-[250px]", label: "300x250 Medium Rectangle" },
    skyscraper: { width: "w-[160px]", height: "min-h-[600px]", label: "160x600 Gutter Skyscraper" },
    leaderboard: { width: "w-full max-w-[728px]", height: "min-h-[90px]", label: "728x90 Leaderboard" },
    "in-article": { width: "w-full max-w-[728px]", height: "min-h-[120px]", label: "Responsive In-Article" },
  };

  const dim = formatDimensions[format] || formatDimensions.rectangle;

  return (
    <div
      data-ad-slot-id={slotId}
      className={`mx-auto my-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 overflow-hidden ${dim.width} ${dim.height} ${className}`}
    >
      <div className="text-center p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Advertisement
        </span>
        <div className="text-[11px] text-slate-400/80 dark:text-slate-600 font-mono">
          {dim.label}
        </div>
      </div>

      {/* Google AdSense live tag (active when adClient is configured) */}
      {adClient && (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adClient}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
