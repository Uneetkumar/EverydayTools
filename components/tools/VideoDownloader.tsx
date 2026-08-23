"use client";

import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { AlertTriangle } from "lucide-react";
import VideoUrlInput, { SupportedPlatform } from "@/components/video-downloader/VideoUrlInput";
import VideoPreview from "@/components/video-downloader/VideoPreview";
import VideoMetadataDisplay from "@/components/video-downloader/VideoMetadata";
import QualitySelector from "@/components/video-downloader/QualitySelector";
import DownloadProgress from "@/components/video-downloader/DownloadProgress";
import DownloadResult from "@/components/video-downloader/DownloadResult";
import { validateMediaUrlSecurity } from "@/lib/video/security";
import { inspectVideoMetadata, VideoMetadata, VideoQualityOption } from "@/lib/video/metadata";
import { downloadMediaStream, DownloadProgressInfo } from "@/lib/video/downloader";
import { resolveVideoUrl } from "@/lib/video/resolver";
import {
  fetchVideoInfo,
  buildDownloadUrl,
  detectPlatform,
  isBackendConfigured,
  VideoApiError,
  VIDEO_API,
} from "@/lib/video/backend";

interface VideoDownloaderProps {
  platform?: SupportedPlatform;
}

export default function VideoDownloader({ platform = "general" }: VideoDownloaderProps = {}) {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedQualityId, setSelectedQualityId] = useState<string>("native");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressInfo | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [blocked, setBlocked] = useState<{ reason: string; suggestion: string } | null>(null);
  const [, setBackendInfo] = useState<unknown>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError(null);
    setBlocked(null);
    setIsSuccess(false);
    setDownloadProgress(null);

    // 1. Security & Platform Validation
    const securityCheck = validateMediaUrlSecurity(url);
    if (!securityCheck.isValid) {
      setError(securityCheck.error || "Invalid or restricted media URL.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Resolve Multi-Platform Social Stream if applicable
      // Platform links (YouTube, Instagram, TikTok…) cannot be resolved in a
      // browser at all, so they go to the API service when one is configured.
      const detected = detectPlatform(securityCheck.sanitizedUrl || url);
      if (detected) {
        if (!isBackendConfigured()) {
          setBlocked({
            reason: `${detected} downloads need a server, and none is configured for this site. A browser cannot fetch ${detected} media directly — the streams are signed and cross-origin requests are refused.`,
            suggestion:
              "Paste a direct media link instead (one ending in .mp4, .webm or .mp3), which works without a server.",
          });
          setMetadata(null);
          setIsLoading(false);
          return;
        }

        try {
          const info = await fetchVideoInfo(securityCheck.sanitizedUrl || url);
          const best = info.formats.find((f) => !f.audioOnly) || info.formats[0];
          setBackendInfo(info);
          setMetadata({
            url: buildDownloadUrl(securityCheck.sanitizedUrl || url, {
              formatId: best?.id,
            }),
            fileName: `${(info.title || "video").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60)}.mp4`,
            durationSeconds: info.duration || 0,
            formattedDuration: info.duration
              ? `${Math.floor(info.duration / 60)}:${String(Math.floor(info.duration % 60)).padStart(2, "0")}`
              : "0:00",
            width: 0,
            height: best?.height || 0,
            resolutionTier: best?.label || "Best available",
            aspectRatio: "16:9",
            approxFps: best?.fps || 0,
            thumbnailUrl: info.thumbnail || undefined,
            availableQualities: info.formats.map((f) => ({
              id: f.id,
              label: f.label,
              resolutionLabel: f.height ? `${f.height}p` : "audio",
              width: 0,
              height: f.height,
              estimatedSizeBytes: f.filesize || undefined,
              isHighestAvailable: f.id === best?.id,
              isAudioOnly: f.audioOnly,
              mimeType: f.audioOnly ? "audio/mpeg" : "video/mp4",
              extension: f.ext,
              url: buildDownloadUrl(securityCheck.sanitizedUrl || url, {
                formatId: f.id,
                audioOnly: f.audioOnly,
              }),
            })),
          } as VideoMetadata);
          if (info.formats.length) setSelectedQualityId(best?.id || info.formats[0].id);
          setIsLoading(false);
          return;
        } catch (e) {
          const apiErr = e instanceof VideoApiError ? e : null;
          setBlocked({
            reason: apiErr?.unreachable
              ? "Unable to download — the download service is not responding. It may be offline or restarting."
              : apiErr?.message || "Unable to download this video.",
            suggestion: apiErr?.unreachable
              ? "Try again shortly. If it keeps failing, the service may need redeploying."
              : "Check the link is public and still available. Private, age-restricted, and region-locked videos cannot be fetched.",
          });
          setMetadata(null);
          setIsLoading(false);
          return;
        }
      }

      const resolved = await resolveVideoUrl(securityCheck.sanitizedUrl || url);

      if (resolved.unsupported) {
        setBlocked({
          reason: resolved.reason || "Unable to download this link.",
          suggestion: resolved.suggestion || "",
        });
        setMetadata(null);
        setIsLoading(false);
        return;
      }

      const targetStreamUrl = resolved.streamUrl;

      // 3. Metadata Inspection Probe on direct stream
      const data = await inspectVideoMetadata(targetStreamUrl);

      // Apply resolved metadata overrides
      if (resolved.title) data.fileName = `${resolved.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp4`;
      if (resolved.thumbnailUrl) data.thumbnailUrl = resolved.thumbnailUrl;
      if (resolved.duration) {
        data.durationSeconds = resolved.duration;
        data.formattedDuration = `${Math.floor(resolved.duration / 60)}:${(resolved.duration % 60).toString().padStart(2, "0")}`;
      }

      // If resolved returned specialized streams (e.g. TikTok / YouTube format tiers)
      if (resolved.availableStreams && resolved.availableStreams.length > 0) {
        data.availableQualities = resolved.availableStreams.map((s, idx) => ({
          id: `stream-${idx}`,
          label: s.label,
          resolutionLabel: s.resolution,
          width: s.isAudioOnly ? 0 : data.width,
          height: s.isAudioOnly ? 0 : data.height,
          isHighestAvailable: idx === 0,
          isAudioOnly: s.isAudioOnly || false,
          mimeType: s.isAudioOnly ? "audio/mpeg" : "video/mp4",
          extension: s.format || (s.isAudioOnly ? "mp3" : "mp4"),
          url: s.url,
        }));
      }

      setMetadata(data);
      if (data.availableQualities.length > 0) {
        setSelectedQualityId(data.availableQualities[0].id);
      }
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : "") ||
          "Unable to inspect media stream. Ensure the URL is valid and accessible."
      );
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setError(null);
    setBlocked(null);
    setMetadata(null);
    setIsLoading(false);
    setIsDownloading(false);
    setDownloadProgress(null);
    setIsSuccess(false);
  };

  const handleStartDownload = async () => {
    // A URL served by our own API already carries Content-Disposition, so hand
    // it to the browser directly rather than buffering it through fetch.
    const target = selectedQualityOption?.url || metadata?.url || "";
    const isBackendUrl = isBackendConfigured() && target.startsWith(VIDEO_API);
    if (isBackendUrl) {
      const a = document.createElement("a");
      a.href = target;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsSuccess(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      return;
    }

    if (!metadata) return;
    const selected = metadata.availableQualities.find((q) => q.id === selectedQualityId) || metadata.availableQualities[0];

    setIsDownloading(true);
    setIsSuccess(false);
    abortControllerRef.current = new AbortController();

    try {
      await downloadMediaStream({
        url: selected.url,
        fileName: selected.isAudioOnly
          ? `${metadata.fileName.replace(/\.[^/.]+$/, "")}-audio.m4a`
          : metadata.fileName,
        mimeType: selected.mimeType,
        signal: abortControllerRef.current.signal,
        onProgress: (info) => {
          setDownloadProgress(info);
          if (info.stage === "completed") {
            setIsDownloading(false);
            setIsSuccess(true);
            confetti({ particleCount: 50, spread: 65, origin: { y: 0.85 } });
          } else if (info.stage === "error") {
            setIsDownloading(false);
          }
        },
      });
    } catch (err: unknown) {
      setIsDownloading(false);
      console.warn(
        "Download interrupted:",
        err instanceof Error ? err.message : err
      );
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDownloading(false);
    setDownloadProgress(null);
  };

  const selectedQualityOption =
    metadata?.availableQualities.find((q) => q.id === selectedQualityId) ||
    metadata?.availableQualities[0] ||
    ({
      id: "native",
      label: "Full HD",
      resolutionLabel: "1080p",
      width: 1920,
      height: 1080,
      mimeType: "video/mp4",
      extension: "mp4",
      url: "",
    } as VideoQualityOption);

  return (
    <div className="space-y-6">
      {/* 1. URL Input Box */}
      <VideoUrlInput
        url={url}
        setUrl={setUrl}
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        isLoading={isLoading}
        error={error}
        platform={platform}
      />

      {/* Explains, specifically, why a given link cannot be served — instead of
          a spinner that ends in a generic failure. */}
      {blocked && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/25 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                This link can&rsquo;t be downloaded here
              </p>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                {blocked.reason}
              </p>
              {blocked.suggestion && (
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                  <strong>What works instead:</strong> {blocked.suggestion}
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80 border-t border-amber-200/70 dark:border-amber-900/40 pt-2.5">
            This tool works with <strong>direct media links</strong> — a URL
            ending in .mp4, .webm, .mov or .mp3. In most browsers you can
            right-click a playing video and choose &ldquo;Copy video
            address&rdquo;.
          </p>
        </div>
      )}

      {/* 2. Download Progress Bar (When Active) */}
      {isDownloading && downloadProgress && (
        <DownloadProgress
          progress={downloadProgress}
          onCancel={handleCancelDownload}
        />
      )}

      {/* 3. Download Success Result */}
      {isSuccess && metadata && (
        <DownloadResult
          metadata={metadata}
          quality={selectedQualityOption}
          onReset={handleClear}
          onRedownload={handleStartDownload}
        />
      )}

      {/* 4. Inspected Media Workspace */}
      {metadata && !isSuccess && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Video Preview & Player */}
            <div className="lg:col-span-7 space-y-5">
              <VideoPreview metadata={metadata} />
              <VideoMetadataDisplay metadata={metadata} />
            </div>

            {/* Right: Quality Selection & Download Trigger */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
              <QualitySelector
                qualities={metadata.availableQualities}
                selectedQualityId={selectedQualityId}
                onSelectQuality={setSelectedQualityId}
                onStartDownload={handleStartDownload}
                isDownloading={isDownloading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
