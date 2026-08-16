"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, Sparkles, Eraser, Type, Trash2, Undo } from "lucide-react";
import confetti from "canvas-confetti";

export default function WatermarkRemover() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(20);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
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
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        if (ctx) {
          historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
        }
      };
    }
  }, [imageSrc]);

  const applyInpaintingAtPoint = (x: number, y: number, radius: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smart neighbor inpainting
    const sampleOffset = radius + 6;
    const sx = Math.max(0, Math.min(canvas.width - 1, x + (x > canvas.width / 2 ? -sampleOffset : sampleOffset)));
    const sy = Math.max(0, Math.min(canvas.height - 1, y + (y > canvas.height / 2 ? -sampleOffset : sampleOffset)));

    const sample = ctx.getImageData(sx, sy, 1, 1).data;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${sample[0]}, ${sample[1]}, ${sample[2]}, 0.85)`;
    ctx.fill();
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    applyInpaintingAtPoint(x, y, brushSize);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    applyInpaintingAtPoint(x, y, brushSize);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "clean-image.png";
    link.click();
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <Eraser className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload image to erase watermark or text stamp
        </div>
        <p className="text-xs text-slate-500">
          Brush over any watermark or logo to remove it seamlessly.
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
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Eraser Size:
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="w-32 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-blue-600">{brushSize}px</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean Image</span>
              </button>
            </div>
          </div>

          {/* Interactive Inpainting Canvas */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-auto flex justify-center max-h-[600px]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-w-full h-auto cursor-crosshair rounded-lg shadow-sm border border-slate-300 dark:border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
