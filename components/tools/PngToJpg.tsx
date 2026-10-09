"use client";

import React, { useState } from "react";
import {
  Upload,
  Download,
  ArrowRightLeft,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Sparkles,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { markToolCompleted } from "@/lib/analytics";
import { downloadDataUrl } from "@/lib/utils/download";

type ConversionMode =
  | "png_to_jpg"
  | "jpg_to_png"
  | "img_to_webp"
  | "webp_to_jpg";

export default function PngToJpg({
  initialMode = "png_to_jpg",
}: {
  initialMode?: ConversionMode;
}) {
  const [mode, setMode] = useState<ConversionMode>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [quality, setQuality] = useState<number>(0.92);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setOriginalSize(f.size);
      convertFormat(f, mode, bgColor, quality);
    }
  };

  const convertFormat = (
    f: File,
    m: ConversionMode,
    bg: string,
    q: number
  ) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = URL.createObjectURL(f);
    // A format the browser cannot decode (HEIC outside Safari, a broken or
    // renamed file) fires onerror, not onload; without this the page waited
    // forever.
    img.onerror = () => {
      setIsProcessing(false);
      setConvertedUrl(null);
      toast.error("This browser can't open that image. Try a JPG, PNG or WebP file.");
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      if (m === "png_to_jpg" || m === "webp_to_jpg") {
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
            setIsProcessing(false);
          },
          "image/jpeg",
          q
        );
      } else if (m === "img_to_webp") {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            // Safari decodes WebP but cannot encode it: toBlob quietly
            // returns a PNG instead, which would be saved as ".webp".
            if (blob && blob.type !== "image/webp") {
              setConvertedUrl(null);
              toast.error("This browser can't create WebP files (Safari can only display them). Try Chrome, Edge or Firefox.");
            } else if (blob) {
              setConvertedUrl(URL.createObjectURL(blob));
              setConvertedSize(blob.size);
            }
            setIsProcessing(false);
          },
          "image/webp",
          q
        );
      } else {
        // JPG to PNG
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setConvertedUrl(URL.createObjectURL(blob));
              setConvertedSize(blob.size);
            }
            setIsProcessing(false);
          },
          "image/png"
        );
      }
    };
  };

  const handleDownload = () => {
    if (!convertedUrl || !file) return;
    let ext = "jpg";
    if (mode === "jpg_to_png") ext = "png";
    else if (mode === "img_to_webp") ext = "webp";

    const name = file.name.replace(/\.[^/.]+$/, "");
    downloadDataUrl(convertedUrl, `${name}.${ext}`);
    markToolCompleted();
  };

  return (
    <div className="space-y-6">
      {/* Mode Switches */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 border rounded-lg bg-muted/60">
        {[
          { id: "png_to_jpg", label: "PNG to JPG" },
          { id: "jpg_to_png", label: "JPG to PNG" },
          { id: "img_to_webp", label: "Image to WebP" },
          { id: "webp_to_jpg", label: "WebP to JPG" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const newMode = tab.id as ConversionMode;
              setMode(newMode);
              if (file) convertFormat(file, newMode, bgColor, quality);
            }}
            className={`py-2 text-xs font-semibold rounded-xl transition ${
              mode === tab.id
                ? "bg-background text-foreground shadow-xs dark:bg-input/50"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Box */}
      <div className="p-8 rounded-xl border-dashed text-center cursor-pointer flex flex-col items-center justify-center space-y-2.5 relative border-2 border-input bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/60">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Upload image to convert to{" "}
            {mode === "png_to_jpg" || mode === "webp_to_jpg"
              ? "JPG"
              : mode === "img_to_webp"
              ? "WebP"
              : "PNG"}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Converted on your device. Nothing is uploaded.
          </p>
        </div>
        <input aria-label="Choose an image"
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* Conversion Settings */}
      {(mode === "png_to_jpg" || mode === "webp_to_jpg" || mode === "img_to_webp") && (
        <div className="p-5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30">
          {(mode === "png_to_jpg" || mode === "webp_to_jpg") && (
            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Background Fill Color (for transparency):
              </label>
              <div className="flex items-center space-x-2">
                <input aria-label="Background colour for transparent areas"
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    if (file) convertFormat(file, mode, e.target.value, quality);
                  }}
                  className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold">{bgColor}</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium text-foreground">
              <span>Compression quality</span>
              <span className="text-blue-600 font-semibold">{Math.round(quality * 100)}%</span>
            </div>
            <input aria-label="Compression quality"
              type="range"
              min={0.4}
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

      {/* Download Card with File Size Comparison */}
      {convertedUrl && (
        <div className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
          <div className="space-y-1 text-left w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Conversion Complete!
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center space-x-2">
              <span>Original: {(originalSize / 1024).toFixed(1)} KB</span>
              <span>&bull;</span>
              <span className="text-emerald-600 font-semibold">
                Converted: {(convertedSize / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-xs transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>
              Download{" "}
              {mode === "png_to_jpg" || mode === "webp_to_jpg"
                ? "JPG"
                : mode === "img_to_webp"
                ? "WebP"
                : "PNG"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
