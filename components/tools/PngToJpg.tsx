"use client";

import React, { useState, useRef } from "react";
import { Upload, Download, ArrowRightLeft, Image as ImageIcon } from "lucide-react";
import confetti from "canvas-confetti";

export default function PngToJpg() {
  const [mode, setMode] = useState<"png_to_jpg" | "jpg_to_png">("png_to_jpg");
  const [file, setFile] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [quality, setQuality] = useState<number>(0.92);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      convertFormat(f, mode, bgColor, quality);
    }
  };

  const convertFormat = (f: File, m: "png_to_jpg" | "jpg_to_png", bg: string, q: number) => {
    const img = new Image();
    img.src = URL.createObjectURL(f);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (m === "png_to_jpg") {
        // Fill background color for transparent pixels
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setConvertedUrl(URL.createObjectURL(blob));
              setConvertedSize(blob.size);
            }
          },
          "image/jpeg",
          q
        );
      } else {
        // JPG to PNG
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            setConvertedUrl(URL.createObjectURL(blob));
            setConvertedSize(blob.size);
          }
        }, "image/png");
      }
    };
  };

  const handleDownload = () => {
    if (!convertedUrl || !file) return;
    const ext = mode === "png_to_jpg" ? "jpg" : "png";
    const name = file.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = `${name}.${ext}`;
    link.click();
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            setMode("png_to_jpg");
            if (file) convertFormat(file, "png_to_jpg", bgColor, quality);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            mode === "png_to_jpg"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          PNG to JPG (with background fill)
        </button>
        <button
          onClick={() => {
            setMode("jpg_to_png");
            if (file) convertFormat(file, "jpg_to_png", bgColor, quality);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            mode === "jpg_to_png"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          JPG to PNG (Lossless)
        </button>
      </div>

      {/* Upload Box */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload {mode === "png_to_jpg" ? "PNG" : "JPG"} image to convert
        </div>
        <p className="text-xs text-slate-500">
          Instant format conversion with zero quality loss.
        </p>
        <input
          type="file"
          accept={mode === "png_to_jpg" ? "image/png" : "image/jpeg"}
          onChange={handleFile}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* Customization options */}
      {mode === "png_to_jpg" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Background Fill Color (for transparency):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value);
                  if (file) convertFormat(file, mode, e.target.value, quality);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs font-mono">{bgColor}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>JPG Quality:</span>
              <span className="text-blue-600">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.05}
              value={quality}
              onChange={(e) => {
                const q = parseFloat(e.target.value);
                setQuality(q);
                if (file) convertFormat(file, mode, bgColor, q);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Download Card */}
      {convertedUrl && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-white">Converted Image Ready!</div>
            <div className="text-slate-500 font-mono">{(convertedSize / 1024).toFixed(1)} KB</div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Download {mode === "png_to_jpg" ? "JPG" : "PNG"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
