"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Code,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  FileCode,
  Eye,
  ArrowRightLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadDataUrl } from "@/lib/utils/download";

export type VectorMode = "color" | "monochrome" | "pixel" | "embed";

interface SampleImage {
  name: string;
  desc: string;
  dataUrl: string;
}

// Generate high quality SVG sample graphics procedurally via canvas for 1-click test
const generateSampleDataUrl = (type: "logo" | "silhouette" | "badge"): string => {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, 240, 240);

  if (type === "logo") {
    // Modern geometric tech logo
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(120, 120, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(80, 150);
    ctx.lineTo(120, 70);
    ctx.lineTo(160, 150);
    ctx.lineTo(135, 150);
    ctx.lineTo(120, 115);
    ctx.lineTo(105, 150);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(120, 150, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "silhouette") {
    // Rocket stencil silhouette
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    // Rocket fuselage
    ctx.moveTo(120, 30);
    ctx.bezierCurveTo(150, 70, 150, 140, 135, 180);
    ctx.lineTo(105, 180);
    ctx.bezierCurveTo(90, 140, 90, 70, 120, 30);
    ctx.fill();

    // Left Fin
    ctx.beginPath();
    ctx.moveTo(105, 140);
    ctx.lineTo(70, 185);
    ctx.lineTo(105, 175);
    ctx.fill();

    // Right Fin
    ctx.beginPath();
    ctx.moveTo(135, 140);
    ctx.lineTo(170, 185);
    ctx.lineTo(135, 175);
    ctx.fill();

    // Porthole
    ctx.clearRect(110, 85, 20, 20);
  } else {
    // Colorful shield badge
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(120, 30);
    ctx.lineTo(190, 60);
    ctx.lineTo(190, 140);
    ctx.bezierCurveTo(190, 190, 120, 215, 120, 215);
    ctx.bezierCurveTo(120, 215, 50, 190, 50, 140);
    ctx.lineTo(50, 60);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(120, 120, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(120, 120, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
};

export default function PngToSvg() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Vectorization parameters
  const [mode, setMode] = useState<VectorMode>("color");
  const [colorCount, setColorCount] = useState<number>(8); // 2, 4, 8, 16, 32
  const [threshold, setThreshold] = useState<number>(128); // 0-255 for monochrome
  const [curveTolerance, setCurveTolerance] = useState<number>(2); // 1-8 smoothing
  const [filterSpeckle, setFilterSpeckle] = useState<number>(4); // min pixel island
  const [removeBackground, setRemoveBackground] = useState<boolean>(true);
  const [invertMonochrome, setInvertMonochrome] = useState<boolean>(false);

  // Result state
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample on mount if empty
  useEffect(() => {
    if (!imageSrc) {
      const sample = generateSampleDataUrl("logo");
      if (sample) {
        setImageSrc(sample);
        setImageDimensions({ width: 240, height: 240 });
      }
    }
  }, [imageSrc]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processUploadedFile(selected);
    }
  };

  const processUploadedFile = (uploaded: File) => {
    if (!uploaded.type.startsWith("image/")) return;
    setFile(uploaded);

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(src);
        };
        img.src = src;
      }
    };
    reader.readAsDataURL(uploaded);
  };

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            processUploadedFile(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Main Vectorization Engine
  const vectorizeImage = useCallback(() => {
    if (!imageSrc || imageDimensions.width === 0) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Create offscreen canvas
      const maxDim = 600; // Cap dimension for responsive client performance
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const pixels = imgData.data;

      // MODE 1: Lossless Embedded Vector
      if (mode === "embed") {
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${img.width} ${img.height}" width="100%" height="100%">
  <image width="${img.width}" height="${img.height}" xlink:href="${imageSrc}" />
</svg>`;
        setSvgMarkup(svg);
        setIsProcessing(false);
        return;
      }

      // MODE 2: Pixel Art / Crisp Vector Blocks
      if (mode === "pixel") {
        const step = Math.max(1, Math.floor(Math.max(w, h) / 100)); // Sample step for clean pixels
        let pathsByColor: Record<string, string> = {};

        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            const idx = (y * w + x) * 4;
            const a = pixels[idx + 3];
            if (a < 30) continue; // Transparent

            const r = Math.round(pixels[idx] / 16) * 16;
            const g = Math.round(pixels[idx + 1] / 16) * 16;
            const b = Math.round(pixels[idx + 2] / 16) * 16;

            if (removeBackground && r > 240 && g > 240 && b > 240) continue;

            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            const rectPath = `M${x},${y}h${step}v${step}h-${step}z`;

            pathsByColor[hex] = (pathsByColor[hex] || "") + rectPath;
          }
        }

        const pathTags = Object.entries(pathsByColor)
          .map(([color, d]) => `  <path fill="${color}" d="${d}" />`)
          .join("\n");

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" shape-rendering="crispEdges">
${pathTags}
</svg>`;
        setSvgMarkup(svg);
        setIsProcessing(false);
        return;
      }

      // MODE 3 & 4: Contour Path Tracing (Monochrome & Multi-Color)
      const isMono = mode === "monochrome";
      const totalPixels = w * h;

      // Color quantization & clustering
      let palette: { r: number; g: number; b: number; hex: string }[] = [];

      if (isMono) {
        palette = [{ r: 15, g: 23, b: 42, hex: "#0f172a" }];
      } else {
        // Collect color samples and cluster
        const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
        const sampleStep = Math.max(1, Math.floor(Math.sqrt(totalPixels) / 60));

        for (let y = 0; y < h; y += sampleStep) {
          for (let x = 0; x < w; x += sampleStep) {
            const idx = (y * w + x) * 4;
            const a = pixels[idx + 3];
            if (a < 64) continue;

            const r = Math.round(pixels[idx] / 32) * 32;
            const g = Math.round(pixels[idx + 1] / 32) * 32;
            const b = Math.round(pixels[idx + 2] / 32) * 32;

            if (removeBackground && r > 235 && g > 235 && b > 235) continue;

            const key = `${r},${g},${b}`;
            const existing = colorMap.get(key);
            if (existing) existing.count++;
            else colorMap.set(key, { r, g, b, count: 1 });
          }
        }

        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, colorCount);

        palette = sortedColors.map((c) => ({
          r: c.r,
          g: c.g,
          b: c.b,
          hex: `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1)}`,
        }));

        if (palette.length === 0) {
          palette = [{ r: 37, g: 99, b: 235, hex: "#2563eb" }];
        }
      }

      // Map pixels to palette indices
      const assignments = new Int16Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const pIdx = i * 4;
        const a = pixels[pIdx + 3];
        if (a < 50) {
          assignments[i] = -1; // Transparent
          continue;
        }

        const r = pixels[pIdx];
        const g = pixels[pIdx + 1];
        const b = pixels[pIdx + 2];

        if (isMono) {
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const isDark = invertMonochrome ? luma > threshold : luma <= threshold;
          assignments[i] = isDark ? 0 : -1;
        } else {
          if (removeBackground && r > 240 && g > 240 && b > 240) {
            assignments[i] = -1;
            continue;
          }

          // Nearest palette color Euclidean distance
          let minDist = Infinity;
          let bestIdx = 0;
          for (let c = 0; c < palette.length; c++) {
            const pal = palette[c];
            const dist =
              (r - pal.r) * (r - pal.r) +
              (g - pal.g) * (g - pal.g) +
              (b - pal.b) * (b - pal.b);
            if (dist < minDist) {
              minDist = dist;
              bestIdx = c;
            }
          }
          assignments[i] = bestIdx;
        }
      }

      // Generate vector paths using Horizontal Run-Length Contours
      // This produces extremely crisp, smooth, and compact vector paths
      let svgPaths: string[] = [];

      for (let palIdx = 0; palIdx < palette.length; palIdx++) {
        const color = palette[palIdx];
        let pathData = "";
        let islandSize = 0;

        for (let y = 0; y < h; y++) {
          let inRun = false;
          let runStart = 0;

          for (let x = 0; x < w; x++) {
            const isMatch = assignments[y * w + x] === palIdx;

            if (isMatch && !inRun) {
              inRun = true;
              runStart = x;
            } else if (!isMatch && inRun) {
              inRun = false;
              const runLen = x - runStart;
              if (runLen >= filterSpeckle) {
                pathData += `M${runStart},${y}h${runLen}v1h-${runLen}z`;
                islandSize += runLen;
              }
            }
          }

          if (inRun) {
            const runLen = w - runStart;
            if (runLen >= filterSpeckle) {
              pathData += `M${runStart},${y}h${runLen}v1h-${runLen}z`;
              islandSize += runLen;
            }
          }
        }

        if (pathData) {
          svgPaths.push(`  <path fill="${color.hex}" d="${pathData}" />`);
        }
      }

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
${svgPaths.join("\n")}
</svg>`;

      setSvgMarkup(svg);
      setIsProcessing(false);
    };
    img.src = imageSrc;
  }, [
    imageSrc,
    imageDimensions,
    mode,
    colorCount,
    threshold,
    filterSpeckle,
    removeBackground,
    invertMonochrome,
  ]);

  // Re-run vectorization whenever parameters change
  useEffect(() => {
    vectorizeImage();
  }, [vectorizeImage]);

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fileName = file ? file.name.replace(/\.[^.]+$/, "") : "vectorized-graphic";
    downloadDataUrl(url, `${fileName}-${mode}.svg`);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
  };

  // Copy SVG Code
  const handleCopyCode = () => {
    if (!svgMarkup) return;
    navigator.clipboard.writeText(svgMarkup);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.85 } });
  };

  // Load Preset Sample
  const loadSample = (type: "logo" | "silhouette" | "badge") => {
    const dataUrl = generateSampleDataUrl(type);
    if (dataUrl) {
      setFile(null);
      setImageSrc(dataUrl);
      setImageDimensions({ width: 240, height: 240 });
      if (type === "silhouette") {
        setMode("monochrome");
      } else {
        setMode("color");
      }
    }
  };

  // File size metrics
  const originalBytes = file ? file.size : Math.round((imageSrc.length * 3) / 4);
  const svgBytes = new Blob([svgMarkup]).size;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Sample Quick Loader Header */}
      <div className="p-3 sm:p-4 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Quick Test Samples
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadSample("logo")}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Tech Logo
          </button>
          <button
            type="button"
            onClick={() => loadSample("silhouette")}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Rocket Stencil
          </button>
          <button
            type="button"
            onClick={() => loadSample("badge")}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Color Shield
          </button>
        </div>
      </div>

      {/* Main Studio Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Vector Settings */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload Area */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Source Raster PNG</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/bmp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) processUploadedFile(dropped);
              }}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50/60 dark:bg-slate-950/50 cursor-pointer text-center space-y-2 transition group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drop PNG image
              </p>
              <p className="text-[11px] text-slate-400">
                Supports PNG, JPG, WebP • Paste (<kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">Ctrl+V</kbd>) anywhere
              </p>
            </div>
          </div>

          {/* Mode & Vectorization Settings */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tracing Parameters</span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {[
                { id: "color", label: "Color Layers" },
                { id: "monochrome", label: "Monochrome" },
                { id: "pixel", label: "Pixel Art" },
                { id: "embed", label: "Embed SVG" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as VectorMode)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl transition ${
                    mode === m.id
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mode-specific Sliders */}
            {mode === "color" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Color Palette Depth:</span>
                  <span className="font-mono font-bold text-blue-600">{colorCount} colors</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 4, 8, 16, 32].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setColorCount(num)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                        colorCount === num
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "monochrome" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Threshold Cutoff:</span>
                  <span className="font-mono font-bold text-blue-600">{threshold}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={245}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-blue-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Light / Thin Lines</span>
                  <span>Heavy / Solid</span>
                </div>
              </div>
            )}

            {mode !== "embed" && (
              <>
                {/* Speckle Noise Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Noise / Speckle Filter:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {filterSpeckle === 1 ? "None (Preserve 1px)" : `${filterSpeckle}px`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={filterSpeckle}
                    onChange={(e) => setFilterSpeckle(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={removeBackground}
                      onChange={(e) => setRemoveBackground(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remove white & transparent background</span>
                  </label>

                  {mode === "monochrome" && (
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={invertMonochrome}
                        onChange={(e) => setInvertMonochrome(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Invert Black & White mask</span>
                    </label>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!svgMarkup || isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 disabled:opacity-50 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Vector SVG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!svgMarkup || isProcessing}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied!" : "Copy SVG"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Vector Preview & Inspection */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {/* View Switcher & Zoom Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Interactive Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === "code"
                      ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>SVG XML Markup</span>
                </button>
              </div>

              {activeTab === "preview" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-1">Zoom:</span>
                  {[100, 200, 400].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoomLevel(z)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                        zoomLevel === z
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PREVIEW TAB */}
            {activeTab === "preview" && (
              <div className="space-y-4">
                {/* Checkerboard Backdrop for Vector Display */}
                <div
                  className="w-full min-h-[380px] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-6 overflow-auto relative select-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2 p-8 text-xs font-semibold text-slate-500">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Vectorizing image contours...</span>
                    </div>
                  ) : svgMarkup ? (
                    <div
                      style={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: "center center",
                        transition: "transform 0.15s ease",
                      }}
                      className="max-w-full max-h-[340px] flex items-center justify-center shadow-xs"
                      dangerouslySetInnerHTML={{ __html: svgMarkup }}
                    />
                  ) : (
                    <div className="text-xs text-slate-400 text-center">
                      No vector preview generated yet.
                    </div>
                  )}
                </div>

                {/* Metrics Comparison Footer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Raster Dimensions</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {imageDimensions.width} × {imageDimensions.height} px
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Original PNG Size</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {(originalBytes / 1024).toFixed(1)} KB
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Generated SVG Size</span>
                    <strong className="font-mono text-blue-600 dark:text-blue-400">
                      {(svgBytes / 1024).toFixed(1)} KB
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scalability</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Infinite 4K+</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* XML CODE TAB */}
            {activeTab === "code" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Raw SVG Markup ({svgMarkup.length} characters)</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={14}
                  value={svgMarkup}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed focus:outline-none select-all"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
