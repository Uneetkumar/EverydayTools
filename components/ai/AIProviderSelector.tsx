"use client";

import React from "react";
import { Cpu, Sparkles, ShieldCheck } from "lucide-react";
import { AIProviderType } from "@/lib/ai/types";

interface AIProviderSelectorProps {
  provider: AIProviderType;
  onChange: (provider: AIProviderType) => void;
  disabled?: boolean;
}

export default function AIProviderSelector({
  provider,
  onChange,
  disabled,
}: AIProviderSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          AI Engine
        </span>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("local")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
            provider === "local"
              ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Processes text 100% locally in your browser memory"
        >
          <Cpu className={`w-3.5 h-3.5 ${provider === "local" ? "text-emerald-500" : "text-slate-400"}`} />
          <span>On-Device</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Free & Private
          </span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("gemini")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
            provider === "gemini"
              ? "bg-white dark:bg-slate-850 text-purple-600 dark:text-purple-300 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="Uses Google Gemini cloud AI for extended synthesis"
        >
          <Sparkles className={`w-3.5 h-3.5 ${provider === "gemini" ? "text-purple-500" : "text-slate-400"}`} />
          <span>Advanced Cloud</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            Gemini
          </span>
        </button>
      </div>
    </div>
  );
}
