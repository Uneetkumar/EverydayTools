"use client";

import React from "react";

interface AdSlotProps {
  slotId: string;
  format?: "leaderboard" | "rectangle" | "in-article" | "sidebar";
  className?: string;
  showPlaceholder?: boolean;
}

export default function AdSlot({
  slotId,
  format = "in-article",
  className = "",
  showPlaceholder = false,
}: AdSlotProps) {
  // During development or before ad network approval, hide empty dashed boxes unless explicitly enabled
  if (!showPlaceholder) {
    return null;
  }

  const formatStyles = {
    leaderboard: "min-h-[90px] w-full max-w-[728px]",
    rectangle: "min-h-[250px] w-full max-w-[300px]",
    "in-article": "min-h-[120px] w-full max-w-[728px]",
    sidebar: "min-h-[600px] w-full max-w-[300px]",
  };

  return (
    <div
      data-ad-slot={slotId}
      className={`my-6 mx-auto flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-3 transition-all ${formatStyles[format]} ${className}`}
    >
      <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1">
        Sponsored
      </span>
      <div className="flex flex-col items-center justify-center text-xs text-slate-400/80 dark:text-slate-600">
        <span className="font-mono text-[11px]">{slotId}</span>
      </div>
    </div>
  );
}
