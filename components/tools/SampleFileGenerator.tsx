"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Download, RefreshCw, Copy, Check, Shuffle, AlertTriangle, Trash2,
  Loader2, XCircle, Film, Volume2, VolumeX, Sliders, HardDrive,
  Video, Play, FileCheck, FileText, Image as ImageIcon,
  FileSpreadsheet, Database, Code, FileCode, CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob } from "@/lib/utils/download";
import {
  SampleKind, SampleFile, generateImage, generatePdf, generateDocx,
  generateText, generateVideo, formatBytesShort, VideoProgressInfo, VideoFormatId,
  ImageFormatId, DataSchemaId,
} from "@/lib/samples/generate";

const SIZE_PRESETS = [
  { label: "10 KB", bytes: 10 * 1024 },
  { label: "50 KB", bytes: 50 * 1024 },
  { label: "100 KB", bytes: 100 * 1024 },
  { label: "500 KB", bytes: 500 * 1024 },
  { label: "1 MB", bytes: 1024 * 1024 },
  { label: "5 MB", bytes: 5 * 1024 * 1024 },
  { label: "10 MB", bytes: 10 * 1024 * 1024 },
  { label: "25 MB", bytes: 25 * 1024 * 1024 },
];

const KINDS: { id: SampleKind; label: string; icon: string }[] = [
  { id: "image", label: "Image", icon: "🖼️" },
  { id: "pdf", label: "PDF", icon: "📄" },
  { id: "docx", label: "Word", icon: "📝" },
  { id: "csv", label: "CSV", icon: "📊" },
  { id: "json", label: "JSON", icon: "⚙️" },
  { id: "text", label: "Text", icon: "📃" },
  { id: "video", label: "Video", icon: "🎬" },
];

const IMAGE_FORMATS: { id: ImageFormatId; label: string; desc: string; ext: string; popular?: boolean }[] = [
  { id: "image/jpeg", label: "JPG", desc: "Photo / Standard", ext: ".jpg", popular: true },
  { id: "image/png", label: "PNG", desc: "Lossless / Alpha", ext: ".png", popular: true },
  { id: "image/webp", label: "WebP", desc: "Modern Web", ext: ".webp", popular: true },
  { id: "image/svg+xml", label: "SVG", desc: "Scalable Vector", ext: ".svg" },
];

const IMAGE_RESOLUTIONS = [
  { id: "1080p", label: "1080p FHD (1920×1080)", w: 1920, h: 1080, aspect: "16:9", popular: true },
  { id: "720p", label: "720p HD (1280×720)", w: 1280, h: 720, aspect: "16:9" },
  { id: "4k", label: "4K UHD (3840×2160)", w: 3840, h: 2160, aspect: "16:9" },
  { id: "1:1", label: "1:1 Square (1080×1080)", w: 1080, h: 1080, aspect: "1:1", popular: true },
  { id: "9:16", label: "9:16 Story (1080×1920)", w: 1080, h: 1920, aspect: "9:16", popular: true },
  { id: "4:5", label: "4:5 Portrait (1080×1350)", w: 1080, h: 1350, aspect: "4:5" },
  { id: "custom", label: "Custom Dimensions", w: 1280, h: 720, aspect: "custom" },
];

const IMAGE_PATTERNS = [
  { id: "gradient" as const, label: "Gradient Mesh" },
  { id: "geometric" as const, label: "Geometric Art" },
  { id: "rings" as const, label: "Concentric Rings" },
  { id: "waves" as const, label: "Wave Field" },
  { id: "minimal" as const, label: "Minimal Center" },
];

const PDF_PAGE_PRESETS = [1, 2, 3, 5, 10, 20, 50];

const PDF_TEMPLATES = [
  { id: "standard" as const, label: "Standard Document", desc: "General multi-page layout" },
  { id: "business" as const, label: "Executive Report", desc: "Corporate headers & summary" },
  { id: "invoice" as const, label: "Invoice & Receipt", desc: "Billing statement mockup" },
  { id: "academic" as const, label: "Academic Research", desc: "Formal paper format" },
];

const DOCX_PARA_PRESETS = [5, 10, 25, 50, 100];

const DOCX_TEMPLATES = [
  { id: "standard" as const, label: "Standard Document", desc: "Formatted sections & lorem" },
  { id: "summary" as const, label: "Executive Summary", desc: "Bold headers & bullet points" },
  { id: "legal" as const, label: "Draft Agreement", desc: "Numbered clause sections" },
];

const DATA_SCHEMAS: { id: DataSchemaId; label: string; desc: string; cols: string }[] = [
  { id: "ecommerce", label: "E-Commerce Orders", desc: "Orders, customers, amounts, status", cols: "7 columns" },
  { id: "users", label: "User Accounts", desc: "User profiles, roles, emails, locations", cols: "7 columns" },
  { id: "finance", label: "Financial Transfers", desc: "Transactions, accounts, currencies", cols: "7 columns" },
];

const DATA_ROW_PRESETS = [10, 50, 100, 500, 1000, 5000, 10000];

const VIDEO_FORMATS: { id: VideoFormatId; label: string; ext: string; tag: string; popular?: boolean }[] = [
  { id: "video/mp4", label: "MP4", ext: ".mp4", tag: "H.264 / Universal", popular: true },
  { id: "video/webm", label: "WebM", ext: ".webm", tag: "VP9 / Web", popular: true },
  { id: "video/quicktime", label: "MOV", ext: ".mov", tag: "QuickTime / Apple", popular: true },
  { id: "video/x-matroska", label: "MKV", ext: ".mkv", tag: "Matroska / Open" },
  { id: "video/webm-av1", label: "AV1", ext: ".webm", tag: "AV1 / Next-Gen" },
  { id: "video/webm-vp8", label: "VP8", ext: ".webm", tag: "VP8 / Legacy" },
  { id: "video/x-msvideo", label: "AVI", ext: ".avi", tag: "AVI / Windows" },
  { id: "video/3gpp", label: "3GP", ext: ".3gp", tag: "3GP / Mobile" },
  { id: "video/ogg", label: "OGV", ext: ".ogv", tag: "Ogg Theora" },
];

const VIDEO_RESOLUTIONS = [
  { id: "360p", label: "360p SD", w: 640, h: 360, aspect: "16:9" },
  { id: "480p", label: "480p SD", w: 854, h: 480, aspect: "16:9" },
  { id: "720p", label: "720p HD", w: 1280, h: 720, aspect: "16:9", popular: true },
  { id: "1080p", label: "1080p FHD", w: 1920, h: 1080, aspect: "16:9", popular: true },
  { id: "1440p", label: "1440p 2K", w: 2560, h: 1440, aspect: "16:9" },
  { id: "4k", label: "4K UHD", w: 3840, h: 2160, aspect: "16:9" },
  { id: "1:1", label: "1:1 Square", w: 720, h: 720, aspect: "1:1" },
  { id: "1:1-hd", label: "1:1 HD", w: 1080, h: 1080, aspect: "1:1" },
  { id: "9:16", label: "9:16 Story", w: 720, h: 1280, aspect: "9:16", popular: true },
  { id: "9:16-hd", label: "9:16 Reel", w: 1080, h: 1920, aspect: "9:16" },
  { id: "4:5", label: "4:5 Portrait", w: 1080, h: 1350, aspect: "4:5" },
  { id: "21:9", label: "21:9 Cinema", w: 2560, h: 1080, aspect: "21:9" },
  { id: "custom", label: "Custom", w: 1280, h: 720, aspect: "custom" },
];

const VIDEO_DURATION_PRESETS = [1, 2, 3, 5, 10, 15, 30, 45, 60, 90, 120];

const VIDEO_BITRATE_PRESETS = [
  { id: "compact", label: "Compact", bps: 1_000_000, desc: "~1 Mbps" },
  { id: "standard", label: "Standard", bps: 2_500_000, desc: "~2.5 Mbps" },
  { id: "high", label: "High Quality", bps: 6_000_000, desc: "~6 Mbps" },
  { id: "ultra", label: "Ultra / 4K", bps: 15_000_000, desc: "~15 Mbps" },
];

const VIDEO_FPS_PRESETS = [24, 30, 60];

interface SampleFileGeneratorProps {
  allowedKinds?: SampleKind[];
}

export interface GeneratorProgressState {
  percent: number;
  currentSecond?: number;
  totalSeconds?: number;
  stage: "preparing" | "recording" | "processing" | "completed";
  message: string;
  detail?: string;
}

export default function SampleFileGenerator({
  allowedKinds,
}: SampleFileGeneratorProps = {}) {
  const kinds = useMemo(() => {
    return allowedKinds
      ? KINDS.filter((k) => allowedKinds.includes(k.id))
      : KINDS;
  }, [allowedKinds]);

  const [kind, setKind] = useState<SampleKind>(kinds[0]?.id ?? "image");
  const [bytes, setBytes] = useState(100 * 1024);
  const [customKb, setCustomKb] = useState("100");
  const [fileCount, setFileCount] = useState(4);

  // Image states
  const [imageFormat, setImageFormat] = useState<ImageFormatId>("image/jpeg");
  const [imageResolution, setImageResolution] = useState(IMAGE_RESOLUTIONS[0]);
  const [customImgWidth, setCustomImgWidth] = useState("1920");
  const [customImgHeight, setCustomImgHeight] = useState("1080");
  const [imagePattern, setImagePattern] = useState<"gradient" | "geometric" | "rings" | "minimal" | "waves">("gradient");

  // PDF states
  const [pdfPages, setPdfPages] = useState(3);
  const [customPdfPagesInput, setCustomPdfPagesInput] = useState("3");
  const [pdfTemplate, setPdfTemplate] = useState<"standard" | "business" | "invoice" | "academic">("standard");

  // Word states
  const [docxParas, setDocxParas] = useState(10);
  const [docxTemplate, setDocxTemplate] = useState<"standard" | "summary" | "legal">("standard");

  // Data states
  const [dataSchema, setDataSchema] = useState<DataSchemaId>("ecommerce");
  const [dataRows, setDataRows] = useState(100);
  const [customDataRowsInput, setCustomDataRowsInput] = useState("100");

  // Video states
  const [videoFormat, setVideoFormat] = useState<VideoFormatId>("video/mp4");
  const [videoResolution, setVideoResolution] = useState(VIDEO_RESOLUTIONS[2]);
  const [customWidth, setCustomWidth] = useState("1280");
  const [customHeight, setCustomHeight] = useState("720");
  const [videoSeconds, setVideoSeconds] = useState(5);
  const [customSecondsInput, setCustomSecondsInput] = useState("5");
  const [videoBitrate, setVideoBitrate] = useState(2_500_000);
  const [videoFps, setVideoFps] = useState(30);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [showAdvancedVideo, setShowAdvancedVideo] = useState(false);

  const [items, setItems] = useState<(SampleFile & { url: string; id: string })[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<GeneratorProgressState | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.url));
    };
  }, [items]);

  const cancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setBusy(false);
    setProgress(null);
    setStatus("Generation cancelled.");
  }, [abortController]);

  // Compute active image resolution
  const activeImageDimensions = useMemo(() => {
    if (imageResolution.id === "custom") {
      const w = Math.max(32, Math.min(4096, parseInt(customImgWidth, 10) || 1920));
      const h = Math.max(32, Math.min(4096, parseInt(customImgHeight, 10) || 1080));
      return { w, h, label: `${w}×${h} Custom` };
    }
    return { w: imageResolution.w, h: imageResolution.h, label: imageResolution.label };
  }, [imageResolution, customImgWidth, customImgHeight]);

  // Compute active video resolution
  const activeVideoResolution = useMemo(() => {
    if (videoResolution.id === "custom") {
      const w = Math.max(64, Math.min(3840, parseInt(customWidth, 10) || 1280));
      const h = Math.max(64, Math.min(2160, parseInt(customHeight, 10) || 720));
      return { w, h, label: `${w}×${h} Custom`, aspect: "custom" };
    }
    return { w: videoResolution.w, h: videoResolution.h, label: videoResolution.label, aspect: videoResolution.aspect };
  }, [videoResolution, customWidth, customHeight]);

  // Compute estimated video file size memoized
  const { estimatedVideoBytes, minEstimatedBytes, maxEstimatedBytes, totalFramesCount } = useMemo(() => {
    const audioBps = includeAudio ? 128_000 : 0;
    const totalBps = videoBitrate + audioBps;
    const est = Math.round((videoSeconds * totalBps) / 8);
    return {
      estimatedVideoBytes: est,
      minEstimatedBytes: Math.round(est * 0.88),
      maxEstimatedBytes: Math.round(est * 1.12),
      totalFramesCount: videoSeconds * videoFps,
    };
  }, [videoSeconds, videoBitrate, videoFps, includeAudio]);

  const generate = useCallback(async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setBusy(true);
    setStatus(null);
    const count = kind === "video" ? 1 : fileCount;

    setProgress({
      percent: 0,
      stage: "preparing",
      message: kind === "video" ? `Initializing ${videoSeconds}s video recording…` : `Preparing ${count} sample files…`,
      detail: kind === "video" ? `${activeVideoResolution.label} • ${videoFps}fps` : `${kind.toUpperCase()} • ${formatBytesShort(bytes)}`,
    });

    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);

    try {
      const made: SampleFile[] = [];
      if (kind === "video") {
        const videoRes = await generateVideo({
          seconds: videoSeconds,
          format: videoFormat,
          resolution: activeVideoResolution,
          bitrateBps: videoBitrate,
          fps: videoFps,
          includeAudio,
          signal: controller.signal,
          onProgress: (p: VideoProgressInfo) => {
            setProgress(p);
          },
        });
        made.push(videoRes);
      } else {
        for (let i = 0; i < count; i++) {
          if (controller.signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }
          const basePercent = Math.round((i / count) * 100);
          setProgress({
            percent: basePercent,
            stage: "recording",
            message: `Generating file ${i + 1} of ${count}…`,
            detail: `${kind.toUpperCase()} • ${formatBytesShort(bytes)}`,
          });

          if (kind === "image") {
            made.push(
              await generateImage({
                targetBytes: bytes,
                format: imageFormat,
                dimensions: { w: activeImageDimensions.w, h: activeImageDimensions.h },
                pattern: imagePattern,
                signal: controller.signal,
                onProgress: (p) => {
                  const subPercent = Math.round(basePercent + (p.percent / count));
                  setProgress({
                    percent: Math.min(99, subPercent),
                    stage: p.stage,
                    message: `File ${i + 1}/${count}: ${p.message}`,
                    detail: p.detail,
                  });
                },
              })
            );
          } else if (kind === "pdf") {
            made.push(
              await generatePdf({
                targetBytes: bytes,
                pageCount: pdfPages,
                template: pdfTemplate,
                signal: controller.signal,
                onProgress: (p) => {
                  const subPercent = Math.round(basePercent + (p.percent / count));
                  setProgress({
                    percent: Math.min(99, subPercent),
                    stage: p.stage,
                    message: `File ${i + 1}/${count}: ${p.message}`,
                    detail: p.detail,
                  });
                },
              })
            );
          } else if (kind === "docx") {
            made.push(
              await generateDocx({
                targetBytes: bytes,
                paras: docxParas,
                template: docxTemplate,
                signal: controller.signal,
                onProgress: (p) => {
                  const subPercent = Math.round(basePercent + (p.percent / count));
                  setProgress({
                    percent: Math.min(99, subPercent),
                    stage: p.stage,
                    message: `File ${i + 1}/${count}: ${p.message}`,
                    detail: p.detail,
                  });
                },
              })
            );
          } else {
            made.push(
              generateText({
                targetBytes: bytes,
                kind: kind as "text" | "csv" | "json",
                schema: dataSchema,
                rowCount: dataRows,
                signal: controller.signal,
                onProgress: (p) => {
                  const subPercent = Math.round(basePercent + (p.percent / count));
                  setProgress({
                    percent: Math.min(99, subPercent),
                    stage: p.stage,
                    message: `File ${i + 1}/${count}: ${p.message}`,
                    detail: p.detail,
                  });
                },
              })
            );
          }
        }

        setProgress({
          percent: 100,
          stage: "completed",
          message: "Files generated successfully!",
          detail: `${count} sample file${count === 1 ? "" : "s"} ready`,
        });
      }

      const seen = new Map<string, number>();
      setItems(
        made.map((m, index) => {
          const countSeen = (seen.get(m.filename) ?? 0) + 1;
          seen.set(m.filename, countSeen);
          const filename =
            countSeen === 1
              ? m.filename
              : m.filename.replace(/(\.[^.]+)$/, `-${countSeen}$1`);
          return {
            ...m,
            filename,
            id: `${Date.now()}-${index}`,
            url: URL.createObjectURL(m.blob),
          };
        })
      );
      setStatus(null);
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
        setStatus("Generation cancelled.");
      } else {
        console.error(e);
        setStatus("Generation failed. Try a smaller size or a different configuration.");
      }
    } finally {
      setBusy(false);
      setAbortController(null);
      setTimeout(() => {
        setProgress(null);
      }, 700);
    }
  }, [
    kind, bytes, fileCount, imageFormat, activeImageDimensions, imagePattern,
    pdfPages, pdfTemplate, docxParas, docxTemplate, dataSchema, dataRows,
    videoSeconds, videoFormat, activeVideoResolution, videoBitrate, videoFps,
    includeAudio, items,
  ]);

  const copyDataUrl = async (item: SampleFile & { url: string; id: string }) => {
    const reader = new FileReader();
    reader.onload = async () => {
      await navigator.clipboard.writeText(String(reader.result));
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    };
    reader.readAsDataURL(item.blob);
  };

  const applyCustom = (value: string) => {
    setCustomKb(value);
    const kb = parseFloat(value);
    if (!Number.isNaN(kb) && kb > 0) setBytes(Math.round(kb * 1024));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. File Type Selector */}
      {kinds.length > 1 && (
        <div className="space-y-1.5 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select File Type
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {kinds.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition text-center active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  kind === k.id
                    ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                    : "bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80"
                }`}
              >
                <span className="text-sm">{k.icon}</span>
                <span className="truncate">{k.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Image Module Controls */}
      {kind === "image" && (
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Image Generator Settings
                </h3>
                <p className="text-[10px] text-slate-400">
                  Configure format, resolution, art style &amp; target bytes
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60">
              {IMAGE_FORMATS.find((f) => f.id === imageFormat)?.label} • {activeImageDimensions.label}
            </span>
          </div>

          {/* Formats */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              1. Image Format
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IMAGE_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setImageFormat(f.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-95 cursor-pointer flex flex-col justify-between min-h-[48px] ${
                    imageFormat === f.id
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">{f.label}</span>
                    {f.popular && (
                      <span className={`text-[8px] font-bold px-1 rounded ${imageFormat === f.id ? "bg-blue-700 text-blue-100" : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"}`}>
                        POP
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] ${imageFormat === f.id ? "text-blue-100" : "text-slate-400"}`}>
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution & Dimensions */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                2. Resolution &amp; Dimensions
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeImageDimensions.w} × {activeImageDimensions.h} px
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {IMAGE_RESOLUTIONS.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setImageResolution(res)}
                  className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition text-center truncate active:scale-95 cursor-pointer ${
                    imageResolution.id === res.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>

            {imageResolution.id === "custom" && (
              <div className="flex items-center gap-2 pt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                <span className="text-xs text-slate-500 font-semibold">Custom:</span>
                <div className="flex items-center gap-1">
                  <label htmlFor="custom-img-w" className="text-[11px] text-slate-400">W:</label>
                  <input
                    id="custom-img-w"
                    type="number"
                    min={32}
                    max={4096}
                    value={customImgWidth}
                    onChange={(e) => setCustomImgWidth(e.target.value)}
                    className="w-20 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
                <span className="text-slate-400">×</span>
                <div className="flex items-center gap-1">
                  <label htmlFor="custom-img-h" className="text-[11px] text-slate-400">H:</label>
                  <input
                    id="custom-img-h"
                    type="number"
                    min={32}
                    max={4096}
                    value={customImgHeight}
                    onChange={(e) => setCustomImgHeight(e.target.value)}
                    className="w-20 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
            )}
          </div>

          {/* Pattern Style */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              3. Visual Art Pattern
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {IMAGE_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setImagePattern(p.id)}
                  className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-center active:scale-95 cursor-pointer truncate ${
                    imagePattern === p.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target File Size */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                4. Exact Target File Size
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {formatBytesShort(bytes)} ({bytes.toLocaleString()} bytes)
              </span>
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBytes(p.bytes); setCustomKb(String(Math.round(p.bytes / 1024))); }}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-center active:scale-95 cursor-pointer ${
                    bytes === p.bytes
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label htmlFor="custom-img-kb" className="text-xs text-slate-500 font-medium">Custom Size:</label>
              <input
                id="custom-img-kb"
                type="number"
                min={1}
                value={customKb}
                onChange={(e) => applyCustom(e.target.value)}
                className="w-24 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500">KB</span>
            </div>
          </div>

          {/* Live Specs & File Size Preview Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <HardDrive className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Exact Image Target Size
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatBytesShort(bytes)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({bytes.toLocaleString()} bytes)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {IMAGE_FORMATS.find((f) => f.id === imageFormat)?.label}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {activeImageDimensions.w}×{activeImageDimensions.h}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PDF Module Controls */}
      {kind === "pdf" && (
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  PDF Generator Settings
                </h3>
                <p className="text-[10px] text-slate-400">
                  Configure page count, layout template &amp; exact file size
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60">
              {pdfPages} Pages • {formatBytesShort(bytes)}
            </span>
          </div>

          {/* Page Count */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1. Page Count
              </span>
              <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                {pdfPages} {pdfPages === 1 ? "Page" : "Pages"}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {PDF_PAGE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPdfPages(p); setCustomPdfPagesInput(String(p)); }}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold font-mono transition text-center active:scale-95 cursor-pointer ${
                    pdfPages === p
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p} {p === 1 ? "page" : "pages"}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. Document Layout Style
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PDF_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPdfTemplate(t.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-95 cursor-pointer flex flex-col justify-between min-h-[48px] ${
                    pdfTemplate === t.id
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold text-xs truncate">{t.label}</span>
                  <span className={`text-[9px] truncate ${pdfTemplate === t.id ? "text-blue-100" : "text-slate-400"}`}>
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Target File Size */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                3. Exact Target File Size
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {formatBytesShort(bytes)}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBytes(p.bytes); setCustomKb(String(Math.round(p.bytes / 1024))); }}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-center active:scale-95 cursor-pointer ${
                    bytes === p.bytes
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label htmlFor="custom-pdf-kb" className="text-xs text-slate-500 font-medium">Custom Size:</label>
              <input
                id="custom-pdf-kb"
                type="number"
                min={1}
                value={customKb}
                onChange={(e) => applyCustom(e.target.value)}
                className="w-24 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500">KB</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Word (DOCX) Module Controls */}
      {kind === "docx" && (
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Word DOCX Settings
                </h3>
                <p className="text-[10px] text-slate-400">
                  Configure paragraphs, OpenXML structure &amp; file size
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60">
              {docxParas} Paras • {formatBytesShort(bytes)}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              1. Paragraph Count
            </span>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {DOCX_PARA_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setDocxParas(p)}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold font-mono transition text-center active:scale-95 cursor-pointer ${
                    docxParas === p
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p} paragraphs
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. Document Structure
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DOCX_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDocxTemplate(t.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-95 cursor-pointer flex flex-col justify-between min-h-[48px] ${
                    docxTemplate === t.id
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold text-xs truncate">{t.label}</span>
                  <span className={`text-[9px] truncate ${docxTemplate === t.id ? "text-blue-100" : "text-slate-400"}`}>
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                3. Exact Target File Size
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {formatBytesShort(bytes)}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBytes(p.bytes); setCustomKb(String(Math.round(p.bytes / 1024))); }}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-center active:scale-95 cursor-pointer ${
                    bytes === p.bytes
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Data (CSV / JSON / Text) Module Controls */}
      {(kind === "csv" || kind === "json" || kind === "text") && (
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                {kind === "csv" ? <FileSpreadsheet className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {kind.toUpperCase()} Data Generator Settings
                </h3>
                <p className="text-[10px] text-slate-400">
                  Configure data schema, realistic fields &amp; exact record size
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
              {dataSchema.toUpperCase()} • {formatBytesShort(bytes)}
            </span>
          </div>

          {/* Schema Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              1. Dataset Schema
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DATA_SCHEMAS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDataSchema(s.id)}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-95 cursor-pointer flex flex-col justify-between min-h-[50px] ${
                    dataSchema === s.id
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{s.label}</span>
                    <span className={`text-[9px] font-mono ${dataSchema === s.id ? "text-blue-100" : "text-slate-400"}`}>
                      {s.cols}
                    </span>
                  </div>
                  <span className={`text-[9px] truncate mt-1 ${dataSchema === s.id ? "text-blue-100" : "text-slate-400"}`}>
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Target File Size */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                2. Target Dataset File Size
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {formatBytesShort(bytes)}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBytes(p.bytes); setCustomKb(String(Math.round(p.bytes / 1024))); }}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-center active:scale-95 cursor-pointer ${
                    bytes === p.bytes
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <label htmlFor="custom-data-kb" className="text-xs text-slate-500 font-medium">Custom Size:</label>
              <input
                id="custom-data-kb"
                type="number"
                min={1}
                value={customKb}
                onChange={(e) => applyCustom(e.target.value)}
                className="w-24 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500">KB</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Video Generator Controls */}
      {kind === "video" && (
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Video Generator Settings
                </h3>
                <p className="text-[10px] text-slate-400">
                  Configure format, resolution, duration &amp; bitrates
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60">
              {VIDEO_FORMATS.find((f) => f.id === videoFormat)?.label} • {activeVideoResolution.label}
            </span>
          </div>

          {/* Video Format Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                1. Container &amp; Format
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {VIDEO_FORMATS.find((f) => f.id === videoFormat)?.tag}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {VIDEO_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setVideoFormat(f.id)}
                  className={`p-2 sm:p-2.5 rounded-xl text-xs font-semibold transition text-left active:scale-95 flex flex-col justify-between min-h-[50px] cursor-pointer ${
                    videoFormat === f.id
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs truncate">{f.label}</span>
                    {f.popular && (
                      <span className={`text-[8px] font-bold px-1 rounded ${videoFormat === f.id ? "bg-blue-700 text-blue-100" : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"}`}>
                        POP
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] truncate ${videoFormat === f.id ? "text-blue-100" : "text-slate-400"}`}>
                    {f.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Video Resolution / Aspect Ratio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                2. Resolution &amp; Ratio
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activeVideoResolution.w} × {activeVideoResolution.h} ({activeVideoResolution.aspect})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {VIDEO_RESOLUTIONS.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setVideoResolution(res)}
                  className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition text-center truncate active:scale-95 cursor-pointer ${
                    videoResolution.id === res.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>

            {videoResolution.id === "custom" && (
              <div className="flex items-center gap-2 pt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                <span className="text-xs text-slate-500 font-semibold">Custom:</span>
                <div className="flex items-center gap-1">
                  <label htmlFor="custom-w" className="text-[11px] text-slate-400">W:</label>
                  <input
                    id="custom-w"
                    type="number"
                    min={64}
                    max={3840}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-20 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
                <span className="text-slate-400">×</span>
                <div className="flex items-center gap-1">
                  <label htmlFor="custom-h" className="text-[11px] text-slate-400">H:</label>
                  <input
                    id="custom-h"
                    type="number"
                    min={64}
                    max={2160}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-20 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
            )}
          </div>

          {/* Video Duration / Time Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="vid-secs" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                3. Duration &amp; Time
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {videoSeconds}s ({videoSeconds < 60 ? `${videoSeconds} sec` : `${(videoSeconds / 60).toFixed(1)} min`})
              </span>
            </div>

            <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
              {VIDEO_DURATION_PRESETS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setVideoSeconds(sec);
                    setCustomSecondsInput(String(sec));
                  }}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-mono font-semibold transition text-center active:scale-95 cursor-pointer ${
                    videoSeconds === sec
                      ? "bg-blue-600 text-white"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                id="vid-secs"
                type="range"
                min={1}
                max={120}
                value={videoSeconds > 120 ? 120 : videoSeconds}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setVideoSeconds(val);
                  setCustomSecondsInput(String(val));
                }}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={customSecondsInput}
                  onChange={(e) => {
                    setCustomSecondsInput(e.target.value);
                    const sec = parseInt(e.target.value, 10);
                    if (!Number.isNaN(sec) && sec >= 1 && sec <= 300) setVideoSeconds(sec);
                  }}
                  className="w-16 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">sec</span>
              </div>
            </div>
          </div>

          {/* Target Bitrate & Quality */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                4. Quality &amp; Bitrate
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                Est. ~{formatBytesShort(estimatedVideoBytes)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {VIDEO_BITRATE_PRESETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setVideoBitrate(b.bps)}
                  className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-left active:scale-95 flex items-center justify-between cursor-pointer ${
                    videoBitrate === b.bps
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{b.label}</span>
                  <span className={`text-[10px] font-mono ml-1 ${videoBitrate === b.bps ? "text-blue-100" : "text-slate-400"}`}>
                    {b.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Video Settings Toggle (FPS & Audio) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedVideo(!showAdvancedVideo)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvancedVideo ? "Hide Advanced Options" : "Show Advanced Options (FPS & Audio Track)"}</span>
            </button>

            {showAdvancedVideo && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Frame Rate (FPS)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Higher FPS gives smoother motion
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {VIDEO_FPS_PRESETS.map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setVideoFps(fps)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                          videoFps === fps
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {fps} fps
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Audio Track
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Embeds 440Hz test audio tone with video
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeAudio(!includeAudio)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      includeAudio
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {includeAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{includeAudio ? "Audio Included" : "Silent Video"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Estimated Video File Size & Specs Preview Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <HardDrive className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Estimated Output File Size
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      ~{formatBytesShort(estimatedVideoBytes)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({formatBytesShort(minEstimatedBytes)} – {formatBytesShort(maxEstimatedBytes)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {activeVideoResolution.label}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {videoSeconds}s @ {videoFps}fps
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  {(videoBitrate / 1_000_000).toFixed(1)} Mbps
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] border-t border-emerald-500/15">
              <div>
                <span className="text-slate-400 block text-[10px]">Container &amp; Ext</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {VIDEO_FORMATS.find((f) => f.id === videoFormat)?.label} ({VIDEO_FORMATS.find((f) => f.id === videoFormat)?.ext})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Frames</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block font-mono">
                  {totalFramesCount} frames
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Audio Track</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {includeAudio ? "440Hz Tone (128k)" : "None (Silent)"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Profile</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                  {estimatedVideoBytes < 2 * 1024 * 1024
                    ? "Compact (< 2 MB)"
                    : estimatedVideoBytes < 15 * 1024 * 1024
                    ? "Standard (2–15 MB)"
                    : "High Bitrate (> 15 MB)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Quantity Selector (For Non-Video Types) */}
      {kind !== "video" && (
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Generate Multiple Files in Batch
            </span>
            <span className="text-[10px] text-slate-400 block">
              Select how many unique sample files to produce at once
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 4, 8].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFileCount(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  fileCount === c
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {c} {c === 1 ? "file" : "files"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 8. Live Generation Progress Card */}
      {busy && progress && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-lg shadow-blue-500/5 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-blue-600 relative" />
              </div>
              <div className="flex items-center gap-1.5 truncate">
                {kind === "video" ? (
                  <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                )}
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                  {kind === "video" ? "Recording & Encoding Video" : `Generating ${kind.toUpperCase()} Files`}
                </span>
              </div>
            </div>

            {abortController && (
              <button
                type="button"
                onClick={cancelGeneration}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition shrink-0 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-0.5">
            {[
              { id: "preparing", label: "Setup", fullLabel: "Setup & Init" },
              { id: "recording", label: "Build", fullLabel: kind === "video" ? "Record Stream" : "Build Content" },
              { id: "processing", label: "Encode", fullLabel: kind === "video" ? "Encode Container" : "Format & Pad" },
              { id: "completed", label: "Ready", fullLabel: "Ready" },
            ].map((s, idx) => {
              const stageOrder = ["preparing", "recording", "processing", "completed"];
              const currentIdx = stageOrder.indexOf(progress.stage);
              const isCurrent = progress.stage === s.id;
              const isDone = currentIdx > idx || progress.stage === "completed";

              return (
                <div key={s.id} className="text-center space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-blue-600 animate-pulse"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                  <span
                    className={`block text-[9px] sm:text-[10px] font-semibold truncate ${
                      isDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                        ? "text-blue-600 dark:text-blue-400 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    <span className="sm:hidden">{s.label}</span>
                    <span className="hidden sm:inline">{s.fullLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar & Percentage */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-xs font-mono gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-[11px] sm:text-xs">
                {progress.message}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm shrink-0">
                {progress.percent}%
              </span>
            </div>

            <div className="h-2.5 sm:h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-150 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-0.5 gap-1">
              <div className="truncate">
                {progress.currentSecond !== undefined && progress.totalSeconds !== undefined ? (
                  <span>
                    ⏱ {progress.currentSecond}s / {progress.totalSeconds}s completed
                  </span>
                ) : (
                  <span>Processing file stream…</span>
                )}
              </div>
              {progress.detail && (
                <div className="truncate text-right max-w-[55%] sm:max-w-[60%]">
                  <span>{progress.detail}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Action Button */}
      <button
        onClick={generate}
        disabled={busy}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white text-sm font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
      >
        {busy ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Shuffle className="w-4 h-4 shrink-0" />}
        <span className="truncate">
          {busy
            ? progress
              ? `Generating (${progress.percent}%)…`
              : "Generating…"
            : items.length
            ? kind === "video"
              ? `Regenerate ${videoSeconds}s Video (~${formatBytesShort(estimatedVideoBytes)})`
              : `Regenerate ${fileCount} ${kind.toUpperCase()} Files`
            : kind === "video"
            ? `Generate ${videoSeconds}s Video (~${formatBytesShort(estimatedVideoBytes)})`
            : `Generate ${fileCount} ${kind.toUpperCase()} Files (${formatBytesShort(bytes)})`}
        </span>
      </button>

      {/* Status or Error Banner */}
      {status && !busy && (
        <div className="flex gap-2.5 p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{status}</p>
        </div>
      )}

      {/* Output Results Section */}
      {items.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Generated {kind === "video" ? "Video Sample" : "Sample Files"} ({items.length})
              </h3>
            </div>
            <button
              onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]); }}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-xs hover:shadow-md transition duration-200"
              >
                <div className="aspect-video bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden relative group">
                  {item.kind === "image" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                  ) : item.kind === "video" ? (
                    <video src={item.url} controls playsInline className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold uppercase text-slate-300 dark:text-slate-700">
                      {item.filename.split(".").pop()}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono font-bold text-white uppercase">
                    {item.filename.split(".").pop()}
                  </span>
                </div>
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={item.filename}>
                      {item.filename}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {formatBytesShort(item.blob.size)} · {item.label}
                    </p>
                  </div>
                  <div className="flex gap-1.5 pt-1 mt-auto">
                    <button
                      onClick={() => downloadBlob(item.blob, item.filename)}
                      className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Download</span>
                    </button>
                    {item.blob.size <= 200 * 1024 && (
                      <button
                        onClick={() => copyDataUrl(item)}
                        title="Copy Data URL"
                        className="flex items-center justify-center px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
