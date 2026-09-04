"use client";

import React from "react";
import ModelStatus from "./ModelStatus";
import CopyDownloadActions from "./CopyDownloadActions";
import { AIProviderType } from "@/lib/ai/types";

interface AIOutputProps {
  title?: string;
  result: string;
  provider: AIProviderType;
  modelUsed?: string;
  elapsedMs?: number;
  filename?: string;
  toolName?: string;
  onRegenerate?: () => void;
  isJson?: boolean;
}

export default function AIOutput({
  title = "AI Result",
  result,
  provider,
  modelUsed,
  elapsedMs,
  filename,
  toolName,
  onRegenerate,
  isJson = false,
}: AIOutputProps) {
  if (!result) return null;

  const wordCount = result.trim().split(/\s+/).filter(Boolean).length;
  const charCount = result.length;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {wordCount} words &bull; {charCount} characters
          </div>
        </div>

        <CopyDownloadActions
          content={result}
          filename={filename}
          toolName={toolName}
          onRegenerate={onRegenerate}
        />
      </div>

      {/* Result Display */}
      {isJson ? (
        <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          <code>{result}</code>
        </pre>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/80 text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-sans">
          {result}
        </div>
      )}

      {/* Status / Privacy Footer */}
      <div className="pt-2">
        <ModelStatus
          provider={provider}
          modelUsed={modelUsed}
          elapsedMs={elapsedMs}
        />
      </div>
    </div>
  );
}
