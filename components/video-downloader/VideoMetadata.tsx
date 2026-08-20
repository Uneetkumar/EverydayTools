"use client";

import React from "react";
import {
  FileVideo,
  Clock,
  HardDrive,
  Activity,
  Layers,
  Sparkles,
  Volume2,
  Tv,
  Maximize2,
} from "lucide-react";
import { VideoMetadata } from "@/lib/video/metadata";

interface VideoMetadataProps {
  metadata: VideoMetadata;
}

export default function VideoMetadataDisplay({ metadata }: VideoMetadataProps) {
  const specs = [
    {
      label: "Resolution",
      value: `${metadata.width} × ${metadata.height}`,
      subvalue: metadata.resolutionTier,
      icon: Tv,
    },
    {
      label: "Estimated Size",
      value: metadata.formattedSize,
      subvalue: metadata.fileSizeBytes ? `${(metadata.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : "Stream source",
      icon: HardDrive,
    },
    {
      label: "Duration",
      value: metadata.formattedDuration,
      subvalue: `${Math.round(metadata.durationSeconds)} seconds`,
      icon: Clock,
    },
    {
      label: "Bitrate",
      value: metadata.formattedBitrate.split(" (")[0],
      subvalue: metadata.bitrateKbps ? `${metadata.bitrateKbps} kbps` : "Adaptive",
      icon: Activity,
    },
    {
      label: "Aspect Ratio",
      value: metadata.aspectRatio.split(" (")[0],
      subvalue: metadata.aspectRatio.includes("(") ? metadata.aspectRatio.split("(")[1].replace(")", "") : "Standard",
      icon: Maximize2,
    },
    {
      label: "Video Codec",
      value: metadata.videoCodec.split(" (")[0],
      subvalue: metadata.containerFormat,
      icon: FileVideo,
    },
    {
      label: "Audio Track",
      value: metadata.audioCodec.split(" (")[0],
      subvalue: "Stereo 2.0",
      icon: Volume2,
    },
    {
      label: "FPS / Scan",
      value: `${metadata.approxFps} fps`,
      subvalue: "Progressive",
      icon: Layers,
    },
  ];

  return (
    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5 sm:space-x-2">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate">Stream Specifications</span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" title={metadata.fileName}>
          {metadata.fileName}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div
              key={spec.label}
              className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1 transition hover:border-blue-500/40"
            >
              <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] sm:text-[11px]">
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{spec.label}</span>
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight truncate">
                {spec.value}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
                {spec.subvalue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
