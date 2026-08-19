"use client";

import React from "react";
import { Download, Loader2, XCircle } from "lucide-react";
import { DownloadProgressInfo } from "@/lib/video/downloader";

interface DownloadProgressProps {
  progress: DownloadProgressInfo;
  onCancel: () => void;
}

export default function DownloadProgress({ progress, onCancel }: DownloadProgressProps) {
  const stages = [
    { id: "preparing", label: "Preparing" },
    { id: "downloading", label: "Downloading" },
    { id: "processing", label: "Processing" },
    { id: "finalizing", label: "Finalizing" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span>Retrieval &amp; Download In Progress</span>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center space-x-1 transition"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      </div>

      {/* 4-Stage Step Indicators */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {stages.map((stage) => {
          const isCurrent = progress.stage === stage.id;
          const isDone =
            progress.stage === "completed" ||
            (stage.id === "preparing" && progress.stage !== "preparing") ||
            (stage.id === "downloading" && ["processing", "finalizing"].includes(progress.stage)) ||
            (stage.id === "processing" && progress.stage === "finalizing");

          return (
            <div key={stage.id} className="text-center space-y-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500"
                    : isCurrent
                    ? "bg-blue-600 animate-pulse"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
              <div
                className={`text-[10px] font-semibold truncate ${
                  isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isCurrent
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-400"
                }`}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Large Progress Bar & Counters */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{progress.message}</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
            {progress.progressPercent}%
          </span>
        </div>

        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-200 rounded-full"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
          <div>
            {progress.speedMbps > 0 && <span>Speed: {progress.speedMbps} Mbps</span>}
          </div>
          <div>
            {progress.timeRemainingSeconds !== null && (
              <span>~{progress.timeRemainingSeconds}s remaining</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
