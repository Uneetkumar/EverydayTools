"use client";

import React from "react";
import { ShieldCheck, Globe, Cpu, CheckCircle2 } from "lucide-react";
import { AIProviderType } from "@/lib/ai/types";

interface ModelStatusProps {
  provider: AIProviderType;
  modelUsed?: string;
  elapsedMs?: number;
}

export default function ModelStatus({
  provider,
  modelUsed,
  elapsedMs,
}: ModelStatusProps) {
  if (provider === "local") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="font-semibold">Processed on your device.</span>
        <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
          Zero data leaves your browser.
        </span>
        {elapsedMs != null && (
          <span className="text-[10px] font-mono text-emerald-600/70 dark:text-emerald-400/70 ml-auto">
            {elapsedMs}ms
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-500/20">
      <Globe className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
      <span className="font-semibold">Processed via Cloud AI.</span>
      <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80">
        Sent securely to Google Gemini 2.5 Flash.
      </span>
      {elapsedMs != null && (
        <span className="text-[10px] font-mono text-purple-600/70 dark:text-purple-400/70 ml-auto">
          {elapsedMs}ms
        </span>
      )}
    </div>
  );
}
