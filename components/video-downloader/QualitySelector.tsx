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
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Available Download Formats &amp; Quality</span>
        </div>
        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          Direct Stream Retrieval
        </span>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {qualities.map((q) => {
          const isSelected = q.id === selectedQualityId;
          return (
            <button
              key={q.id}
              onClick={() => onSelectQuality(q.id)}
              disabled={isDownloading}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {q.isAudioOnly ? <Music className="w-4 h-4" /> : q.resolutionLabel.replace("p", "")}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {q.label}
                    </span>
                    {q.isHighestAvailable && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Highest Available</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {q.isAudioOnly
                      ? "Stereo Audio Track (AAC / M4A)"
                      : `${q.width} × ${q.height} • .${q.extension.toUpperCase()}`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatBytes(q.estimatedSizeBytes)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isSelected ? (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-end space-x-0.5">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </span>
                  ) : (
                    "Ready"
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Download Action Trigger */}
      <button
        onClick={onStartDownload}
        disabled={isDownloading}
        className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        <span>
          Download {selectedOption?.label} ({formatBytes(selectedOption?.estimatedSizeBytes)})
        </span>
      </button>
    </div>
  );
}
