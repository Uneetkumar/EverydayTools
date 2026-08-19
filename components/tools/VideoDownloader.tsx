"use client";

import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
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

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError(null);
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
      const resolved = await resolveVideoUrl(securityCheck.sanitizedUrl || url);
      const targetStreamUrl = resolved.streamUrl || securityCheck.sanitizedUrl || url;

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
    } catch (err: any) {
      setError(
        err.message ||
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
    setMetadata(null);
    setIsLoading(false);
    setIsDownloading(false);
    setDownloadProgress(null);
    setIsSuccess(false);
  };

  const handleStartDownload = async () => {
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
    } catch (err: any) {
      setIsDownloading(false);
      console.warn("Download interrupted:", err.message);
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
