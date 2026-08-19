"use client";

import React from "react";
import { CheckCircle2, Download, RotateCcw, Share2, Sparkles } from "lucide-react";
import { VideoMetadata, VideoQualityOption, formatBytes } from "@/lib/video/metadata";

interface DownloadResultProps {
  metadata: VideoMetadata;
  quality: VideoQualityOption;
  onReset: () => void;
  onRedownload: () => void;
}

export default function DownloadResult({
  metadata,
  quality,
  onReset,
  onRedownload,
}: DownloadResultProps) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-md space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Media Stream Downloaded Successfully!
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          The file has been saved to your browser&apos;s download folder with verified integrity.
        </p>
      </div>

      {/* File Specs Pill */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400">File: </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{metadata.fileName}</span>
        </div>
        <div>
          <span className="text-slate-400">Quality: </span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{quality.label} ({quality.resolutionLabel})</span>
        </div>
        <div>
          <span className="text-slate-400">Size: </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(quality.estimatedSizeBytes || metadata.fileSizeBytes)}</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
        <button
          onClick={onRedownload}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Save File Again</span>
        </button>

        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Inspect Another Video</span>
        </button>
      </div>
    </div>
  );
}
