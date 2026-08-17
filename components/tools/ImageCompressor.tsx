"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Image as ImageIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob } from "@/lib/utils/download";

export default function ImageCompressor() {
  const [origFile, setOrigFile] = useState<File | null>(null);
  const [origSize, setOrigSize] = useState<number>(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [targetKb, setTargetKb] = useState<string>("50");
  const [format, setFormat] = useState<"image/jpeg" | "image/webp">("image/jpeg");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "warning" | "info"; text: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOrigFile(file);
      setOrigSize(file.size);
      compressToTargetKb(file, parseFloat(targetKb) || 50, format);
    }
  };

  const compressToTargetKb = async (file: File, targetSizeKb: number, outFmt: string) => {
    setIsCompressing(true);
    setStatusMessage(null);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const targetSizeBytes = targetSizeKb * 1024;
      let minQuality = 0.05;
      let maxQuality = 0.98;
      let bestBlob: Blob | null = null;
      let scale = 1.0;

      // Helper function to render blob at given scale and quality
      const getBlob = (s: number, q: number): Promise<Blob | null> => {
        return new Promise((resolve) => {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(30, Math.floor(img.width * s));
          canvas.height = Math.max(30, Math.floor(img.height * s));
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => resolve(b), outFmt, q);
        });
      };

      // 1. Binary search on quality
      for (let i = 0; i < 6; i++) {
        const midQ = (minQuality + maxQuality) / 2;
        const b = await getBlob(scale, midQ);
        if (!b) break;
        bestBlob = b;
        if (b.size > targetSizeBytes) {
          maxQuality = midQ;
        } else {
          minQuality = midQ;
        }
      }

      // 2. If still larger than target, iteratively reduce scale
      if (bestBlob && bestBlob.size > targetSizeBytes) {
        for (let j = 0; j < 5; j++) {
          scale *= 0.8;
          const b = await getBlob(scale, 0.65);
          if (!b) break;
          bestBlob = b;
          if (b.size <= targetSizeBytes) break;
        }
      }

      if (bestBlob) {
        setCompressedBlob(bestBlob);
        setCompressedSize(bestBlob.size);
        const url = URL.createObjectURL(bestBlob);
        setPreviewUrl(url);

        const actualKb = (bestBlob.size / 1024).toFixed(1);
        if (bestBlob.size <= targetSizeBytes * 1.05) {
          setStatusMessage({
            type: "success",
            text: `Success! Compressed to ${actualKb} KB (within your ${targetSizeKb} KB limit).`,
          });
        } else {
          setStatusMessage({
            type: "warning",
            text: `Compressed to ${actualKb} KB (minimum resolution reached for this image).`,
          });
        }
      }
      setIsCompressing(false);
    };
  };

  const handleTargetKbChange = (kb: string) => {
    setTargetKb(kb);
    const num = parseFloat(kb);
    if (origFile && !isNaN(num) && num > 0) {
      compressToTargetKb(origFile, num, format);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    const ext = format === "image/jpeg" ? "jpg" : "webp";
    downloadBlob(compressedBlob, `compressed-${targetKb}kb.${ext}`);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
  };

  const savingsPct =
    origSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((origSize - compressedSize) / origSize) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload image to compress (JPG, PNG, WebP)
        </div>
        <p className="text-xs text-slate-500">
          Compress to exact size limit for government forms, job portals, or email.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFile}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Target KB Settings Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 dark:text-white block">
              Set Exact Target Size (in KB):
            </label>
            <span className="text-xs text-slate-500">
              The engine will adapt quality and resolution to meet your limit.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-32">
              <input
                type="number"
                min="5"
                max="5000"
                value={targetKb}
                onChange={(e) => handleTargetKbChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KB</span>
            </div>

            <select
              value={format}
              onChange={(e) => {
                const f = e.target.value as "image/jpeg" | "image/webp";
                setFormat(f);
                if (origFile) compressToTargetKb(origFile, parseFloat(targetKb) || 50, f);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </div>

        {/* Quick KB Presets */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">
            Standard Limits:
          </span>
          {["20", "50", "100", "200", "500"].map((kb) => (
            <button
              key={kb}
              onClick={() => handleTargetKbChange(kb)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition ${
                targetKb === kb
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              }`}
            >
              Under {kb} KB
            </button>
          ))}
        </div>
      </div>

      {/* Live Compression Status & Alerts */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Before / After Result Card */}
      {origFile && compressedBlob && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Original File</span>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {(origSize / 1024).toFixed(1)} KB
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Compressed Output ({savingsPct}% smaller)
              </span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {(compressedSize / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500">
              Format: <strong className="text-slate-800 dark:text-slate-200 uppercase">{format.split("/")[1]}</strong> • Target: <strong>{targetKb} KB</strong>
            </div>

            <button
              onClick={handleDownload}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Download ({ (compressedSize / 1024).toFixed(1) } KB)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
