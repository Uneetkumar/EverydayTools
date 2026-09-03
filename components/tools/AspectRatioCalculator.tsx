"use client";

import React, { useState, useMemo } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Lock, Unlock, Sparkles, Smartphone, Monitor } from "lucide-react";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const COMMON_PRESETS = [
  { label: "16:9 (HD / YouTube)", w: 16, h: 9 },
  { label: "4:3 (Standard Photo)", w: 4, h: 3 },
  { label: "1:1 (Square / Instagram)", w: 1, h: 1 },
  { label: "9:16 (Story / Reel / Shorts)", w: 9, h: 16 },
  { label: "21:9 (Ultrawide Cinema)", w: 21, h: 9 },
  { label: "3:2 (Classic 35mm DSLR)", w: 3, h: 2 },
  { label: "4:5 (Instagram Portrait)", w: 4, h: 5 },
];

const RESOLUTION_PRESETS = [
  { label: "1080p Full HD", w: 1920, h: 1080 },
  { label: "4K Ultra HD", w: 3840, h: 2160 },
  { label: "720p HD", w: 1280, h: 720 },
  { label: "Instagram Square", w: 1080, h: 1080 },
  { label: "TikTok / IG Story", w: 1080, h: 1920 },
  { label: "Twitter / OpenGraph", w: 1200, h: 630 },
];

export default function AspectRatioCalculator() {
  const [origWidth, setOrigWidth] = usePersistentState<string>("ar_orig_w", "1920");
  const [origHeight, setOrigHeight] = usePersistentState<string>("ar_orig_h", "1080");
  const [newWidth, setNewWidth] = useState<string>("1280");
  const [newHeight, setNewHeight] = useState<string>("720");

  const w1 = Math.max(1, parseFloat(origWidth) || 1);
  const h1 = Math.max(1, parseFloat(origHeight) || 1);

  // Calculate simplified ratio
  const divisor = gcd(Math.round(w1), Math.round(h1));
  const ratioW = Math.round(w1) / divisor;
  const ratioH = Math.round(h1) / divisor;
  const ratioDecimal = (w1 / h1).toFixed(3);

  // Recalculate new height when new width changes
  const handleNewWidthChange = (val: string) => {
    setNewWidth(val);
    const nw = parseFloat(val) || 0;
    if (nw > 0) {
      setNewHeight(String(Math.round((nw * h1) / w1)));
    }
  };

  // Recalculate new width when new height changes
  const handleNewHeightChange = (val: string) => {
    setNewHeight(val);
    const nh = parseFloat(val) || 0;
    if (nh > 0) {
      setNewWidth(String(Math.round((nh * w1) / h1)));
    }
  };

  const applyPresetRatio = (rw: number, rh: number) => {
    setOrigWidth(String(rw));
    setOrigHeight(String(rh));
    const nw = parseFloat(newWidth) || 1920;
    setNewHeight(String(Math.round((nw * rh) / rw)));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dimension Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Original Dimensions or Aspect Ratio
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ar-orig-w" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Original Width (W₁)
              </label>
              <div className="relative">
                <input
                  id="ar-orig-w"
                  type="number"
                  min="1"
                  value={origWidth}
                  onChange={(e) => setOrigWidth(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">px</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ar-orig-h" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Original Height (H₁)
              </label>
              <div className="relative">
                <input
                  id="ar-orig-h"
                  type="number"
                  min="1"
                  value={origHeight}
                  onChange={(e) => setOrigHeight(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">px</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Proportional Resize Calculator
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter any new width or height to automatically calculate the matching dimension.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="ar-new-w" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Width (W₂)
                </label>
                <div className="relative">
                  <input
                    id="ar-new-w"
                    type="number"
                    min="1"
                    value={newWidth}
                    onChange={(e) => handleNewWidthChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">px</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ar-new-h" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Height (H₂)
                </label>
                <div className="relative">
                  <input
                    id="ar-new-h"
                    type="number"
                    min="1"
                    value={newHeight}
                    onChange={(e) => handleNewHeightChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results & Visual Frame */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Exact Aspect Ratio"
            value={`${ratioW}:${ratioH}`}
            subtitle={`Decimal Ratio: ${ratioDecimal}:1 (${w1}px / ${h1}px)`}
            highlightColor="indigo"
          />

          {/* Visual Ratio Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[160px] space-y-2">
            <div
              className="border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center transition-all max-w-[240px] max-h-[120px]"
              style={{
                width: `${Math.min(220, Math.max(60, (ratioW / Math.max(ratioW, ratioH)) * 200))}px`,
                height: `${Math.min(120, Math.max(40, (ratioH / Math.max(ratioW, ratioH)) * 120))}px`,
              }}
            >
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {ratioW}:{ratioH}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Scaled preview ({newWidth}px × {newHeight}px)
            </span>
          </div>
        </div>
      </div>

      {/* Preset Badges Grid */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Standard Aspect Ratio & Dimension Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {COMMON_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPresetRatio(p.w, p.h)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-all"
            >
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                {p.label}
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                {p.w}:{p.h}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
