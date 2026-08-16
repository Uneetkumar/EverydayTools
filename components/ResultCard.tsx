"use client";

import React, { useState } from "react";
import { Copy, Check, Share2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface ResultCardProps {
  title?: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  details?: { label: string; value: string | number }[];
  highlightColor?: "indigo" | "emerald" | "amber" | "rose";
  showConfetti?: boolean;
}

export default function ResultCard({
  title = "Calculation Result",
  value,
  unit = "",
  subtitle,
  details = [],
  highlightColor = "indigo",
  showConfetti = false,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `${value}${unit ? " " + unit : ""}${
      details.length > 0
        ? "\n" + details.map((d) => `${d.label}: ${d.value}`).join("\n")
        : ""
    }`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (showConfetti) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "EverydayTools Result",
          text: `Check out this calculation: ${value} ${unit}`,
          url: window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {
        console.error(e);
      }
    } else {
      handleCopy();
    }
  };

  const colorStyles = {
    indigo: {
      bg: "bg-indigo-50/70 dark:bg-indigo-950/40",
      border: "border-indigo-200 dark:border-indigo-800/80",
      text: "text-indigo-600 dark:text-indigo-400",
      pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    },
    emerald: {
      bg: "bg-emerald-50/70 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800/80",
      text: "text-emerald-600 dark:text-emerald-400",
      pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    },
    amber: {
      bg: "bg-amber-50/70 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800/80",
      text: "text-amber-600 dark:text-amber-400",
      pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    },
    rose: {
      bg: "bg-rose-50/70 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-800/80",
      text: "text-rose-600 dark:text-rose-400",
      pill: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
    },
  };

  const currentTheme = colorStyles[highlightColor];

  return (
    <div
      className={`rounded-2xl border ${currentTheme.border} ${currentTheme.bg} p-6 shadow-sm relative overflow-hidden transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className={`w-3.5 h-3.5 ${currentTheme.text}`} />
          {title}
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition shadow-xs"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition shadow-xs"
            title="Share result"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{shared ? "Shared!" : "Share"}</span>
          </button>
        </div>
      </div>

      <div className="my-3">
        <div className="flex items-baseline space-x-2 flex-wrap">
          <span className={`text-4xl sm:text-5xl font-black tracking-tight ${currentTheme.text}`}>
            {value}
          </span>
          {unit && (
            <span className="text-lg sm:text-xl font-bold text-slate-600 dark:text-slate-300">
              {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            {subtitle}
          </p>
        )}
      </div>

      {details.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {details.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-white/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50"
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
