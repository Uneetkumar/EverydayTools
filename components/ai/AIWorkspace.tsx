"use client";

import React from "react";
import AIProviderSelector from "./AIProviderSelector";
import AIError from "./AIError";
import { AIProviderType } from "@/lib/ai/types";
import { Sparkles, RefreshCw } from "lucide-react";
import { warmCloudAI } from "@/lib/ai/warm";

interface AIWorkspaceProps {
  provider: AIProviderType;
  onProviderChange: (p: AIProviderType) => void;
  busy: boolean;
  onRun: () => void;
  runLabel?: string;
  error?: string | null;
  onClearError?: () => void;
  disabled?: boolean;
  /**
   * Text as it streams in, before the final result lands. Rendered here rather
   * than in each tool so all five share one appearance and one set of rules.
   */
  streamingText?: string;
  children: React.ReactNode;
}

export default function AIWorkspace({
  provider,
  onProviderChange,
  busy,
  onRun,
  runLabel = "Run AI",
  error,
  onClearError,
  disabled,
  streamingText,
  children,
}: AIWorkspaceProps) {
  return (
    <div className="space-y-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm p-5 sm:p-7 shadow-xs">
      {/* Engine Switcher */}
      <AIProviderSelector
        provider={provider}
        onChange={(p) => {
          // Selecting the cloud engine starts loading the Firebase AI chunk and
          // the App Check token immediately, so that fixed setup cost overlaps
          // with the user typing rather than landing after they hit submit.
          if (p === "gemini") warmCloudAI();
          onProviderChange(p);
        }}
        disabled={busy}
      />

      {/* Inputs and custom controls */}
      {children}

      {/* Live stream. Shown only while running and only once text exists, so a
          request that fails before its first token does not flash an empty
          panel. It disappears when `busy` clears and the finished AIOutput —
          with its copy, download and regenerate actions — takes its place. */}
      {busy && streamingText && (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="space-y-2 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4"
        >
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Generating
          </span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {streamingText}
            {/* Caret: makes it obvious more is coming rather than that the
                model stopped mid-sentence. */}
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-blue-500" />
          </p>
        </div>
      )}

      {/* Error Alert if any */}
      {error && (
        <AIError
          error={error}
          onRetry={onRun}
          onSwitchToLocal={() => onProviderChange("local")}
        />
      )}

      {/* Main Trigger Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onRun}
          disabled={busy || disabled}
          className="w-full sm:w-auto min-w-[180px] flex items-center justify-center space-x-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {busy ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{runLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
