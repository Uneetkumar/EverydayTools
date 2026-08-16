"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Crop as CropIcon, RotateCw, FlipHorizontal, Sparkles, Check } from "lucide-react";
import confetti from "canvas-confetti";

export default function CropImage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("cropped-image");
  const [aspect, setAspect] = useState<"free" | "1:1" | "16:9" | "4:3" | "9:16">("1:1");
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);

  // Crop Box coordinates (relative to original image pixels)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  });

  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; box: typeof cropBox } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name.replace(/\.[^/.]+$/, ""));
      const url = URL.createObjectURL(f);
      setImageSrc(url);
      setRotation(0);
      setFlipH(false);
    }
  };

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      // Default initial crop: centered square 70% of image size
      const minDim = Math.min(img.width, img.height);
      const initialSize = Math.round(minDim * 0.75);
      const initialX = Math.round((img.width - initialSize) / 2);
      const initialY = Math.round((img.height - initialSize) / 2);

      setCropBox({
        x: initialX,
        y: initialY,
        width: initialSize,
        height: initialSize,
      });
    };
  }, [imageSrc]);

  // Redraw canvas with crop overlay and handles
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save & apply rotation/flip
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Semi-transparent dark overlay outside crop box
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear and redraw inside crop box with original clarity
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    ctx.clip();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Draw crop box border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = Math.max(2, Math.round(img.width / 400));
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // vertical
    ctx.moveTo(cropBox.x + cropBox.width / 3, cropBox.y);
    ctx.lineTo(cropBox.x + cropBox.width / 3, cropBox.y + cropBox.height);
    ctx.moveTo(cropBox.x + (cropBox.width * 2) / 3, cropBox.y);
    ctx.lineTo(cropBox.x + (cropBox.width * 2) / 3, cropBox.y + cropBox.height);
    // horizontal
    ctx.moveTo(cropBox.x, cropBox.y + cropBox.height / 3);
    ctx.lineTo(cropBox.x + cropBox.width, cropBox.y + cropBox.height / 3);
    ctx.moveTo(cropBox.x, cropBox.y + (cropBox.height * 2) / 3);
    ctx.lineTo(cropBox.x + cropBox.width, cropBox.y + (cropBox.height * 2) / 3);
    ctx.stroke();

    // Draw 4 corner handles
    const handleSize = Math.max(10, Math.round(img.width / 80));
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;

    const corners = [
      { x: cropBox.x, y: cropBox.y },
      { x: cropBox.x + cropBox.width, y: cropBox.y },
      { x: cropBox.x, y: cropBox.y + cropBox.height },
      { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height },
    ];

    corners.forEach((c) => {
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });
  }, [cropBox, rotation, flipH]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleAspectChange = (ratio: "free" | "1:1" | "16:9" | "4:3" | "9:16") => {
    setAspect(ratio);
    if (!imgRef.current) return;

    let w = cropBox.width;
    let h = cropBox.height;

    if (ratio === "1:1") h = w;
    else if (ratio === "16:9") h = Math.round(w * (9 / 16));
    else if (ratio === "4:3") h = Math.round(w * (3 / 4));
    else if (ratio === "9:16") h = Math.round(w * (16 / 9));

    // Ensure it stays within bounds
    if (cropBox.y + h > imgRef.current.height) {
      h = imgRef.current.height - cropBox.y;
      if (ratio === "1:1") w = h;
      else if (ratio === "16:9") w = Math.round(h * (16 / 9));
      else if (ratio === "4:3") w = Math.round(h * (4 / 3));
      else if (ratio === "9:16") w = Math.round(h * (9 / 16));
    }

    setCropBox((prev) => ({ ...prev, width: Math.max(40, w), height: Math.max(40, h) }));
  };

  // Convert mouse event to image-space coordinates
  const getImageCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imgRef.current) return;
    const { x, y } = getImageCoords(e);
    const handleThreshold = Math.max(20, imgRef.current.width / 40);

    // Check corner handles
    const isTopLeft = Math.hypot(x - cropBox.x, y - cropBox.y) < handleThreshold;
    const isTopRight = Math.hypot(x - (cropBox.x + cropBox.width), y - cropBox.y) < handleThreshold;
    const isBottomLeft = Math.hypot(x - cropBox.x, y - (cropBox.y + cropBox.height)) < handleThreshold;
    const isBottomRight = Math.hypot(x - (cropBox.x + cropBox.width), y - (cropBox.y + cropBox.height)) < handleThreshold;

    let handle = null;
    if (isTopLeft) handle = "tl";
    else if (isTopRight) handle = "tr";
    else if (isBottomLeft) handle = "bl";
    else if (isBottomRight) handle = "br";
    else if (
      x >= cropBox.x &&
      x <= cropBox.x + cropBox.width &&
      y >= cropBox.y &&
      y <= cropBox.y + cropBox.height
    ) {
      handle = "move";
    }

    if (handle) {
      setActiveHandle(handle);
      setDragStart({ mouseX: x, mouseY: y, box: { ...cropBox } });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeHandle || !dragStart || !imgRef.current) return;
    const { x, y } = getImageCoords(e);
    const dx = x - dragStart.mouseX;
    const dy = y - dragStart.mouseY;
    const imgW = imgRef.current.width;
    const imgH = imgRef.current.height;

    setCropBox(() => {
      let newBox = { ...dragStart.box };

      if (activeHandle === "move") {
        newBox.x = Math.max(0, Math.min(imgW - newBox.width, dragStart.box.x + dx));
        newBox.y = Math.max(0, Math.min(imgH - newBox.height, dragStart.box.y + dy));
      } else if (activeHandle === "br") {
        let newW = Math.max(40, Math.min(imgW - dragStart.box.x, dragStart.box.width + dx));
        let newH = Math.max(40, Math.min(imgH - dragStart.box.y, dragStart.box.height + dy));

        if (aspect === "1:1") newH = newW;
        else if (aspect === "16:9") newH = Math.round(newW * (9 / 16));
        else if (aspect === "4:3") newH = Math.round(newW * (3 / 4));
        else if (aspect === "9:16") newH = Math.round(newW * (16 / 9));

        newBox.width = Math.min(newW, imgW - newBox.x);
        newBox.height = Math.min(newH, imgH - newBox.y);
      } else if (activeHandle === "tl") {
        let newX = Math.max(0, Math.min(dragStart.box.x + dragStart.box.width - 40, dragStart.box.x + dx));
        let newY = Math.max(0, Math.min(dragStart.box.y + dragStart.box.height - 40, dragStart.box.y + dy));
        newBox.width = dragStart.box.x + dragStart.box.width - newX;
        newBox.height = dragStart.box.y + dragStart.box.height - newY;
        newBox.x = newX;
        newBox.y = newY;
      }

      return newBox;
    });
  };

  const handleMouseUp = () => {
    setActiveHandle(null);
    setDragStart(null);
  };

  const handleDownload = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    // Create export canvas matching exact cropped dimensions
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.max(1, cropBox.width);
    exportCanvas.height = Math.max(1, cropBox.height);
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Draw full rotated/flipped image offset to crop coordinates
    ctx.save();
    ctx.translate(-cropBox.x + img.width / 2, -cropBox.y + img.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    const url = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}-cropped.png`;
    link.click();
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.85 } });
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
          Drag corners to resize, drag center to reposition. Supports 1:1, 16:9, 4:3, 9:16 and Freeform.
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
            {/* Aspect Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Aspect:
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                    aspect === r.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Transform Controls & Download */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setFlipH((prev) => !prev)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Flip horizontally"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download ({Math.round(cropBox.width)} × {Math.round(cropBox.height)} px)</span>
              </button>
            </div>
          </div>

          {/* Interactive Canvas Workspace */}
          <div
            ref={containerRef}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-auto max-h-[620px] select-none"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`max-w-full h-auto rounded-lg shadow-xl ${
                activeHandle === "move" ? "cursor-move" : activeHandle ? "cursor-nwse-resize" : "cursor-crosshair"
              }`}
            />
            <div className="mt-3 text-[11px] font-mono text-slate-400">
              Crop Box: {Math.round(cropBox.width)} × {Math.round(cropBox.height)} px (Drag corners to resize, drag inside to move)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
