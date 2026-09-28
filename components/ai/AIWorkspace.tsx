"use client";

import React from "react";
import AIProviderSelector from "./AIProviderSelector";
import AIError from "./AIError";
import { AIProviderType } from "@/lib/ai/types";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
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
   * than in each tool so they share one appearance and one set of rules.
   */
  streamingText?: string;
  /** What each engine does for this tool (shown in the engine choice). */
  localHint?: string;
  cloudHint?: string;
  children: React.ReactNode;
}

export default function AIWorkspace({
  provider,
  onProviderChange,
  busy,
  onRun,
  runLabel = "Run",
  error,
  disabled,
  streamingText,
  localHint,
  cloudHint,
  children,
}: AIWorkspaceProps) {
  // Ctrl/⌘ + Enter runs the tool from anywhere inside it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !busy && !disabled) {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div className="space-y-5" onKeyDown={onKeyDown}>
      <AIProviderSelector
        provider={provider}
        onChange={(p) => {
          // Selecting the cloud engine starts loading the Firebase AI chunk and
          // the App Check token immediately, so that fixed setup cost overlaps
          // with the user typing rather than landing after they press Run.
          if (p === "gemini") warmCloudAI();
          onProviderChange(p);
        }}
        disabled={busy}
        localHint={localHint}
        cloudHint={cloudHint}
      />

      {children}

      {/* Live stream. Shown only while running and only once text exists, so a
          request that fails before its first token does not flash an empty
          panel. The finished result replaces it. */}
      {busy && streamingText && (
        <div aria-live="polite" aria-atomic="false" className="space-y-2 rounded-lg border bg-muted/40 p-4">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            Writing…
          </span>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {streamingText}
            <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
          </p>
        </div>
      )}

      {error && <AIError error={error} onRetry={onRun} onSwitchToLocal={provider === "gemini" ? () => onProviderChange("local") : undefined} />}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" onClick={onRun} disabled={busy || disabled} className="w-full px-5 sm:w-auto sm:min-w-44">
          {busy ? (
            <>
              <Spinner />
              Working…
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" />
              {runLabel}
            </>
          )}
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
        </span>
      </div>
    </div>
  );
}
