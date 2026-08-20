"use client";

import React from "react";
import Link from "next/link";
import { Search, Trash2, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export type SupportedPlatform = "general" | "youtube" | "instagram" | "facebook" | "tiktok" | "twitter";

interface VideoUrlInputProps {
  url: string;
  setUrl: (val: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  isLoading: boolean;
  error?: string | null;
  platform?: SupportedPlatform;
}

const PLATFORM_TABS = [
  { id: "general", label: "All Video / Direct MP4", slug: "video-downloader" },
  { id: "youtube", label: "YouTube", slug: "youtube-video-downloader" },
  { id: "instagram", label: "Instagram", slug: "instagram-video-downloader" },
  { id: "facebook", label: "Facebook", slug: "facebook-video-downloader" },
  { id: "tiktok", label: "TikTok", slug: "tiktok-video-downloader" },
  { id: "twitter", label: "Twitter / X", slug: "twitter-video-downloader" },
];

const PLATFORM_INFO: Record<SupportedPlatform, { title: string; subtitle: string; placeholder: string }> = {
  general: {
    title: "Video Downloader & Media Inspector",
    subtitle: "Download and inspect video files from direct, authorized, or self-hosted media URLs.",
    placeholder: "Paste direct video URL (e.g. https://.../video.mp4)...",
  },
  youtube: {
    title: "YouTube Video Downloader & Stream Inspector",
    subtitle: "Inspect video resolution, codecs, and stream properties for your permitted YouTube uploads.",
    placeholder: "Paste YouTube link (e.g. https://youtu.be/...)...",
  },
  instagram: {
    title: "Instagram Video Downloader & Media Inspector",
    subtitle: "Inspect and download Reels, Stories, and permitted video streams you own or manage.",
    placeholder: "Paste Instagram Reel or video URL...",
  },
  facebook: {
    title: "Facebook Video Downloader & Stream Inspector",
    subtitle: "Inspect resolution, bitrate, and download authorized Facebook or public video streams.",
    placeholder: "Paste Facebook or direct video URL...",
  },
  tiktok: {
    title: "TikTok Video Downloader & Media Inspector",
    subtitle: "Inspect video specifications and download authorized TikTok creative assets in HD.",
    placeholder: "Paste TikTok video link...",
  },
  twitter: {
    title: "Twitter / X Video Downloader & Media Inspector",
    subtitle: "Inspect and download permitted Twitter / X videos, GIFs, and media streams.",
    placeholder: "Paste Twitter / X video or GIF link...",
  },
};

const SAMPLE_VIDEOS = [
  {
    name: "Big Buck Bunny",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    name: "Elephants Dream",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    name: "Tears of Steel",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
];

export default function VideoUrlInput({
  url,
  setUrl,
  onAnalyze,
  onClear,
  isLoading,
  error,
  platform = "general",
}: VideoUrlInputProps) {
  const currentInfo = PLATFORM_INFO[platform] || PLATFORM_INFO.general;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url.trim() && !isLoading) {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
      {/* Platform Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-100 dark:border-slate-800 -mx-1 px-1 no-scrollbar">
        {PLATFORM_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/tools/${tab.slug}`}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition shrink-0 ${
              platform === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {currentInfo.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Responsive Input Group */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 relative">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none shrink-0" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentInfo.placeholder}
              disabled={isLoading}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-32 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition"
            />

            {url && (
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading}
                title="Clear URL input"
                className="absolute right-2 sm:right-32 p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop inline action button */}
          <div className="hidden sm:block absolute right-2">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!url.trim() || isLoading}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Video</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile full-width action button */}
          <div className="block sm:hidden">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!url.trim() || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Stream...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-start space-x-2.5 text-xs text-rose-700 dark:text-rose-400 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Legal notice & Sample URLs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Only download media you own or have permission to access.</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-slate-400">Samples:</span>
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => setUrl(sample.url)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
