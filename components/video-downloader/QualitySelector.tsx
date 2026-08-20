"use client";

import React from "react";
import { Check, Download, Music, Sliders, Star } from "lucide-react";
import { VideoQualityOption, formatBytes } from "@/lib/video/metadata";

interface QualitySelectorProps {
  qualities: VideoQualityOption[];
  selectedQualityId: string;
  onSelectQuality: (id: string) => void;
  onStartDownload: () => void;
  isDownloading: boolean;
}

export default function QualitySelector({
  qualities,
  selectedQualityId,
  onSelectQuality,
  onStartDownload,
  isDownloading,
}: QualitySelectorProps) {
  const selectedOption = qualities.find((q) => q.id === selectedQualityId) || qualities[0];

  return (
    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5 sm:space-x-2">
          <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate">Download Quality</span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
          Direct Stream
        </span>
      </div>

      {/* Options List */}
      <div className="space-y-1.5 sm:space-y-2">
        {qualities.map((q) => {
          const isSelected = q.id === selectedQualityId;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuality(q.id)}
              disabled={isDownloading}
              className={`w-full p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left flex items-center justify-between transition cursor-pointer gap-2 ${
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {q.isAudioOnly ? <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : q.resolutionLabel.replace("p", "")}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {q.label}
                    </span>
                    {q.isHighestAvailable && (
                      <span className="flex items-center space-x-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span>Best</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                    {q.isAudioOnly
                      ? "Audio Track (.MP3/.M4A)"
                      : `${q.width}×${q.height} • .${q.extension.toUpperCase()}`}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatBytes(q.estimatedSizeBytes)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isSelected ? (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-end space-x-0.5">
                      <Check className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    "Available"
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Download Action Trigger */}
      <button
        type="button"
        onClick={onStartDownload}
        disabled={isDownloading}
        className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Download {selectedOption?.label} ({formatBytes(selectedOption?.estimatedSizeBytes)})
        </span>
      </button>
    </div>
  );
}
