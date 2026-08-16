"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, Crop as CropIcon, RotateCw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function CropImage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspect, setAspect] = useState<"free" | "1:1" | "16:9" | "4:3" | "9:16">("1:1");
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 50,
    y: 50,
    width: 250,
    height: 250,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setImageSrc(url);
    }
  };

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        imageObjRef.current = img;
        canvas.width = img.width;
        canvas.height = img.height;
        redrawCanvas();
      };
    }
  }, [imageSrc, cropBox]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObjRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObjRef.current, 0, 0);

    // Dim background outside crop
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear inside crop box
    ctx.clearRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    ctx.drawImage(
      imageObjRef.current,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height
    );

    // Draw crop border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
  };

  const handleAspectChange = (ratio: "free" | "1:1" | "16:9" | "4:3" | "9:16") => {
    setAspect(ratio);
    let w = cropBox.width;
    let h = cropBox.height;

    if (ratio === "1:1") h = w;
    else if (ratio === "16:9") h = Math.round(w * (9 / 16));
    else if (ratio === "4:3") h = Math.round(w * (3 / 4));
    else if (ratio === "9:16") h = Math.round(w * (16 / 9));

    setCropBox((prev) => ({ ...prev, width: w, height: h }));
  };

  const handleDownload = () => {
    if (!imageObjRef.current) return;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropBox.width;
    cropCanvas.height = cropBox.height;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      imageObjRef.current,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      0,
      0,
      cropBox.width,
      cropBox.height
    );

    const url = cropCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "cropped-image.png";
    link.click();
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <CropIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload image to crop & frame
        </div>
        <p className="text-xs text-slate-500">
          Crop to 1:1 square, 16:9 widescreen, or custom dimensions.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {imageSrc && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
                Aspect Ratio:
              </span>
              {[
                { id: "1:1", label: "1:1 Square" },
                { id: "16:9", label: "16:9 Landscape" },
                { id: "4:3", label: "4:3 Standard" },
                { id: "9:16", label: "9:16 Story" },
                { id: "free", label: "Freeform" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleAspectChange(r.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl border transition ${
                    aspect === r.id
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                      : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Cropped Image</span>
              </button>
            </div>
          </div>

          {/* Canvas Frame */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-center overflow-auto max-h-[600px]">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-lg shadow-lg border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
