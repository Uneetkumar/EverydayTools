"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface AIErrorProps {
  error: string;
  onRetry?: () => void;
  onSwitchToLocal?: () => void;
}

export default function AIError({
  error,
  onRetry,
  onSwitchToLocal,
}: AIErrorProps) {
  if (!error) return null;

  return (
    <div className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 animate-in fade-in duration-150">
      {/* min-w-0 is what actually stops the overflow: a flex child defaults to
          min-width:auto, so a long unbroken string (an API error carrying a URL
          or a JSON blob) refuses to shrink and pushes the whole panel wider
          than the page. `break-words` then wraps inside that constrained box. */}
      <div className="flex min-w-0 flex-1 items-start space-x-2.5">
        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
        <div className="min-w-0 text-xs leading-relaxed">
          <p className="font-semibold mb-0.5">Processing Notice</p>
          {/* Capped height: a provider error can be hundreds of lines of JSON,
              and burying the action buttons under it is worse than scrolling. */}
          <p className="max-h-32 overflow-y-auto break-words whitespace-pre-wrap">
            {error}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {onSwitchToLocal && (
          <button
            type="button"
            onClick={onSwitchToLocal}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/50 transition cursor-pointer"
          >
            Use On-Device AI
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="p-1.5 rounded-xl hover:bg-rose-200/50 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 transition cursor-pointer"
            title="Retry"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
