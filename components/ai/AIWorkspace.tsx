"use client";

import React from "react";
import AIProviderSelector from "./AIProviderSelector";
import AIError from "./AIError";
import { AIProviderType } from "@/lib/ai/types";
import { Sparkles, RefreshCw } from "lucide-react";

interface AIWorkspaceProps {
  provider: AIProviderType;
  onProviderChange: (p: AIProviderType) => void;
  busy: boolean;
  onRun: () => void;
  runLabel?: string;
  error?: string | null;
  onClearError?: () => void;
  disabled?: boolean;
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
  children,
}: AIWorkspaceProps) {
  return (
    <div className="space-y-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm p-5 sm:p-7 shadow-xs">
      {/* Engine Switcher */}
      <AIProviderSelector
        provider={provider}
        onChange={onProviderChange}
        disabled={busy}
      />

      {/* Inputs and custom controls */}
      {children}

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
