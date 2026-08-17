"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  Crop as CropIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Move,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob, downloadDataUrl } from "@/lib/utils/download";
import { usePersistentState } from "@/lib/hooks/usePersistentState";

type AspectRatio = "free" | "1:1" | "16:9" | "4:3" | "9:16" | "3:2";
type HandleType = "tl" | "tr" | "bl" | "br" | "move" | null;

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropHistoryItem {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  format: string;
  timestamp: number;
  fileName: string;
}

const MIN_SIZE = 30;

function calculateAspectDimensions(
  w: number,
  h: number,
  aspect: AspectRatio,
  anchor: "w" | "h" = "w"
): [number, number] {
  if (aspect === "free") return [w, h];
  if (anchor === "w") {
    switch (aspect) {
      case "1:1":
        return [w, w];
      case "16:9":
        return [w, Math.round((w * 9) / 16)];
      case "4:3":
        return [w, Math.round((w * 3) / 4)];
      case "9:16":
        return [w, Math.round((w * 16) / 9)];
      case "3:2":
        return [w, Math.round((w * 2) / 3)];
      default:
        return [w, h];
    }
  } else {
    switch (aspect) {
      case "1:1":
        return [h, h];
      case "16:9":
        return [Math.round((h * 16) / 9), h];
      case "4:3":
        return [Math.round((h * 4) / 3), h];
      case "9:16":
        return [Math.round((h * 9) / 16), h];
      case "3:2":
        return [Math.round((h * 3) / 2), h];
      default:
        return [w, h];
    }
  }
}

function computeCropFromAnchor(
  handle: HandleType,
  pointerX: number,
  pointerY: number,
  startBox: CropBox,
  dragStartPointer: { x: number; y: number },
  aspect: AspectRatio,
  maxW: number,
  maxH: number
): CropBox {
  if (handle === "move") {
    const dx = pointerX - dragStartPointer.x;
    const dy = pointerY - dragStartPointer.y;
    return {
      x: Math.max(0, Math.min(maxW - startBox.w, startBox.x + dx)),
      y: Math.max(0, Math.min(maxH - startBox.h, startBox.y + dy)),
      w: startBox.w,
      h: startBox.h,
    };
  }

  // 1. Bottom-Right (Anchored at Top-Left)
  if (handle === "br") {
    const anchorX = startBox.x;
    const anchorY = startBox.y;
    let rawW = Math.max(MIN_SIZE, Math.min(maxW - anchorX, pointerX - anchorX));
    let rawH = Math.max(MIN_SIZE, Math.min(maxH - anchorY, pointerY - anchorY));

    if (aspect !== "free") {
      let [w, h] = calculateAspectDimensions(rawW, rawH, aspect, "w");
      if (anchorX + w > maxW || anchorY + h > maxH || h > rawH) {
        [w, h] = calculateAspectDimensions(rawH, rawH, aspect, "h");
      }
      if (anchorX + w > maxW) {
        [w, h] = calculateAspectDimensions(maxW - anchorX, maxW - anchorX, aspect, "w");
      }
      if (anchorY + h > maxH) {
        [w, h] = calculateAspectDimensions(maxH - anchorY, maxH - anchorY, aspect, "h");
      }
      rawW = Math.max(MIN_SIZE, w);
      rawH = Math.max(MIN_SIZE, h);
    }
    return { x: anchorX, y: anchorY, w: rawW, h: rawH };
  }

  // 2. Top-Right (Anchored at Bottom-Left)
  if (handle === "tr") {
    const anchorX = startBox.x;
    const anchorY = startBox.y + startBox.h;
    let rawW = Math.max(MIN_SIZE, Math.min(maxW - anchorX, pointerX - anchorX));
    let rawH = Math.max(MIN_SIZE, Math.min(anchorY, anchorY - pointerY));

    if (aspect !== "free") {
      let [w, h] = calculateAspectDimensions(rawW, rawH, aspect, "w");
      if (anchorX + w > maxW || h > anchorY || h > rawH) {
        [w, h] = calculateAspectDimensions(rawH, rawH, aspect, "h");
      }
      if (anchorX + w > maxW) {
        [w, h] = calculateAspectDimensions(maxW - anchorX, maxW - anchorX, aspect, "w");
      }
      if (h > anchorY) {
        [w, h] = calculateAspectDimensions(anchorY, anchorY, aspect, "h");
      }
      rawW = Math.max(MIN_SIZE, w);
      rawH = Math.max(MIN_SIZE, h);
    }
    return { x: anchorX, y: anchorY - rawH, w: rawW, h: rawH };
  }

  // 3. Top-Left (Anchored at Bottom-Right)
  if (handle === "tl") {
    const anchorX = startBox.x + startBox.w;
    const anchorY = startBox.y + startBox.h;
    let rawW = Math.max(MIN_SIZE, Math.min(anchorX, anchorX - pointerX));
    let rawH = Math.max(MIN_SIZE, Math.min(anchorY, anchorY - pointerY));

    if (aspect !== "free") {
      let [w, h] = calculateAspectDimensions(rawW, rawH, aspect, "w");
      if (w > anchorX || h > anchorY || h > rawH) {
        [w, h] = calculateAspectDimensions(rawH, rawH, aspect, "h");
      }
      if (w > anchorX) {
        [w, h] = calculateAspectDimensions(anchorX, anchorX, aspect, "w");
      }
      if (h > anchorY) {
        [w, h] = calculateAspectDimensions(anchorY, anchorY, aspect, "h");
      }
      rawW = Math.max(MIN_SIZE, w);
      rawH = Math.max(MIN_SIZE, h);
    }
    return { x: anchorX - rawW, y: anchorY - rawH, w: rawW, h: rawH };
  }

  // 4. Bottom-Left (Anchored at Top-Right)
  if (handle === "bl") {
    const anchorX = startBox.x + startBox.w;
    const anchorY = startBox.y;
    let rawW = Math.max(MIN_SIZE, Math.min(anchorX, anchorX - pointerX));
    let rawH = Math.max(MIN_SIZE, Math.min(maxH - anchorY, pointerY - anchorY));

    if (aspect !== "free") {
      let [w, h] = calculateAspectDimensions(rawW, rawH, aspect, "w");
      if (w > anchorX || anchorY + h > maxH || h > rawH) {
        [w, h] = calculateAspectDimensions(rawH, rawH, aspect, "h");
      }
      if (w > anchorX) {
        [w, h] = calculateAspectDimensions(anchorX, anchorX, aspect, "w");
      }
      if (anchorY + h > maxH) {
        [w, h] = calculateAspectDimensions(maxH - anchorY, maxH - anchorY, aspect, "h");
      }
      rawW = Math.max(MIN_SIZE, w);
      rawH = Math.max(MIN_SIZE, h);
    }
    return { x: anchorX - rawW, y: anchorY, w: rawW, h: rawH };
  }

  return startBox;
}

export default function CropImage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("cropped-image");
  const [aspect, setAspect] = useState<AspectRatio>("free");
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp" | "pdf">("png");

  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, w: 300, h: 300 });
  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const [showNudgeControls, setShowNudgeControls] = useState<boolean>(false);
  const [recentCrops, setRecentCrops] = usePersistentState<CropHistoryItem[]>("recent_crops_history", []);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startBox: CropBox;
    handle: HandleType;
  } | null>(null);

  // 1. File Upload
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setRotation(0);
    setFlipH(false);
  };

  // 2. Initialize Image & Default Crop
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      const initialSize = Math.round(Math.min(img.width, img.height) * 0.85);
      const x = Math.round((img.width - initialSize) / 2);
      const y = Math.round((img.height - initialSize) / 2);

      setCropBox({
        x: Math.max(0, x),
        y: Math.max(0, y),
        w: Math.max(MIN_SIZE, initialSize),
        h: Math.max(MIN_SIZE, initialSize),
      });
    };
  }, [imageSrc]);

  // 3. Render Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isSideways = rotation % 180 !== 0;
    const baseW = isSideways ? img.height : img.width;
    const baseH = isSideways ? img.width : img.height;

    canvas.width = baseW;
    canvas.height = baseH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Rotated & Flipped Image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Dark mask outside crop box
    ctx.fillStyle = "rgba(10, 15, 29, 0.68)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear and redraw bright crop area
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    ctx.clip();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Primary Border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Rule of Thirds Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(cropBox.x + (cropBox.w * i) / 3, cropBox.y);
      ctx.lineTo(cropBox.x + (cropBox.w * i) / 3, cropBox.y + cropBox.h);
      ctx.moveTo(cropBox.x, cropBox.y + (cropBox.h * i) / 3);
      ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h * i) / 3);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Big Tactile Touch Handles
    const handleRadius = Math.max(10, Math.round(canvas.width / 80));

    const cornerPoints = [
      { name: "tl", x: cropBox.x, y: cropBox.y },
      { name: "tr", x: cropBox.x + cropBox.w, y: cropBox.y },
      { name: "bl", x: cropBox.x, y: cropBox.y + cropBox.h },
      { name: "br", x: cropBox.x + cropBox.w, y: cropBox.y + cropBox.h },
    ];

    cornerPoints.forEach((p) => {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, handleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [cropBox, rotation, flipH]);

  useEffect(() => {
    render();
  }, [render]);

  // 4. Coordinates Converter
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // 5. Hit Testing for Corner Grab Handles
  const detectHandle = (x: number, y: number): HandleType => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const hitRadius = Math.max(40 * scaleX, canvas.width / 20);

    const { x: bx, y: by, w, h } = cropBox;

    if (Math.hypot(x - bx, y - by) < hitRadius) return "tl";
    if (Math.hypot(x - (bx + w), y - by) < hitRadius) return "tr";
    if (Math.hypot(x - bx, y - (by + h)) < hitRadius) return "bl";
    if (Math.hypot(x - (bx + w), y - (by + h)) < hitRadius) return "br";

    if (x >= bx && x <= bx + w && y >= by && y <= by + h) {
      return "move";
    }

    return null;
  };

  // 6. Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const handle = detectHandle(x, y);

    if (handle) {
      dragRef.current = {
        startX: x,
        startY: y,
        startBox: { ...cropBox },
        handle,
      };
      setActiveHandle(handle);
    }
  };

  // 7. Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !canvasRef.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const { startX, startY, startBox, handle } = dragRef.current;

    const maxW = canvasRef.current.width;
    const maxH = canvasRef.current.height;

    const updatedBox = computeCropFromAnchor(
      handle,
      x,
      y,
      startBox,
      { x: startX, y: startY },
      aspect,
      maxW,
      maxH
    );

    setCropBox(updatedBox);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    dragRef.current = null;
    setActiveHandle(null);
  };

  // 8. Aspect Ratio Changer
  const handleAspectChange = (ratio: AspectRatio) => {
    setAspect(ratio);
    if (!canvasRef.current) return;
    const maxW = canvasRef.current.width;
    const maxH = canvasRef.current.height;

    let [nw, nh] = calculateAspectDimensions(cropBox.w, cropBox.h, ratio, "w");
    if (cropBox.x + nw > maxW) nw = maxW - cropBox.x;
    if (cropBox.y + nh > maxH) nh = maxH - cropBox.y;

    if (ratio !== "free") {
      [nw, nh] = calculateAspectDimensions(Math.min(nw, nh), Math.min(nw, nh), ratio);
    }

    setCropBox((prev) => ({
      ...prev,
      w: Math.max(MIN_SIZE, Math.min(nw, maxW)),
      h: Math.max(MIN_SIZE, Math.min(nh, maxH)),
    }));
  };

  // 9. Quick Actions & Rotation
  const handleRotate = (dir: 90 | -90) => {
    setRotation((prevRot) => {
      const nextRot = (prevRot + dir + 360) % 360;
      if (imgRef.current) {
        const img = imgRef.current;
        const isSideways = nextRot % 180 !== 0;
        const newW = isSideways ? img.height : img.width;
        const newH = isSideways ? img.width : img.height;

        // Re-center crop box nicely in rotated canvas
        setCropBox((oldBox) => {
          const fittedW = Math.min(newW, oldBox.h);
          const fittedH = Math.min(newH, oldBox.w);
          const centerX = Math.max(0, Math.round((newW - fittedW) / 2));
          const centerY = Math.max(0, Math.round((newH - fittedH) / 2));
          return {
            x: centerX,
            y: centerY,
            w: Math.max(MIN_SIZE, fittedW),
            h: Math.max(MIN_SIZE, fittedH),
          };
        });
      }
      return nextRot;
    });
  };

  const centerCrop = () => {
    if (!canvasRef.current) return;
    const maxW = canvasRef.current.width;
    const maxH = canvasRef.current.height;
    setCropBox((prev) => ({
      ...prev,
      x: Math.max(0, Math.round((maxW - prev.w) / 2)),
      y: Math.max(0, Math.round((maxH - prev.h) / 2)),
    }));
  };

  const maximizeCrop = () => {
    if (!canvasRef.current) return;
    const maxW = canvasRef.current.width;
    const maxH = canvasRef.current.height;
    let [nw, nh] = calculateAspectDimensions(maxW, maxH, aspect, maxW < maxH ? "w" : "h");
    if (nw > maxW) [nw, nh] = calculateAspectDimensions(maxW, maxW, aspect, "w");
    if (nh > maxH) [nw, nh] = calculateAspectDimensions(maxH, maxH, aspect, "h");

    setCropBox({
      x: Math.max(0, Math.round((maxW - nw) / 2)),
      y: Math.max(0, Math.round((maxH - nh) / 2)),
      w: Math.max(MIN_SIZE, Math.min(nw, maxW)),
      h: Math.max(MIN_SIZE, Math.min(nh, maxH)),
    });
  };

  const nudge = (dx: number, dy: number) => {
    if (!canvasRef.current) return;
    const maxW = canvasRef.current.width;
    const maxH = canvasRef.current.height;
    setCropBox((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(maxW - prev.w, prev.x + dx)),
      y: Math.max(0, Math.min(maxH - prev.h, prev.y + dy)),
    }));
  };

  // 10. High-Quality Multi-Format Export Download
  const handleDownload = async () => {
    const img = imgRef.current;
    if (!img || !canvasRef.current) return;

    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(cropBox.w));
    out.height = Math.max(1, Math.round(cropBox.h));
    const ctx = out.getContext("2d");
    if (!ctx) return;

    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
    }

    ctx.save();
    ctx.translate(
      -cropBox.x + canvasRef.current.width / 2,
      -cropBox.y + canvasRef.current.height / 2
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    if (format === "pdf") {
      // Export as crisp single-page PDF document
      try {
        const { PDFDocument } = await import("pdf-lib");
        const pdfDoc = await PDFDocument.create();
        const pngDataUrl = out.toDataURL("image/png");
        const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());
        const pdfImage = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([out.width, out.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: out.width,
          height: out.height,
        });
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        downloadBlob(blob, `${fileName}-cropped.pdf`);
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.85 } });
        return;
      } catch (err) {
        console.error("PDF export error:", err);
      }
    }

    let mimeType = "image/png";
    let ext = "png";
    let quality: number | undefined = undefined;

    if (format === "jpeg") {
      mimeType = "image/jpeg";
      ext = "jpg";
      quality = 0.95;
    } else if (format === "webp") {
      mimeType = "image/webp";
      ext = "webp";
      quality = 0.92;
    }

    const url = out.toDataURL(mimeType, quality);

    // Save to recent crops history (keep last 3 items)
    const newCropItem: CropHistoryItem = {
      id: String(Date.now()),
      dataUrl: url,
      width: Math.round(cropBox.w),
      height: Math.round(cropBox.h),
      format: ext.toUpperCase(),
      timestamp: Date.now(),
      fileName: `${fileName}-cropped.${ext}`,
    };
    setRecentCrops((prev = []) => [newCropItem, ...prev.filter((c) => c.id !== newCropItem.id)].slice(0, 3));

    downloadDataUrl(url, `${fileName}-cropped.${ext}`);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="p-6 sm:p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 relative">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <CropIcon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Choose or Drop Image to Crop
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Freeform by default &bull; 1:1, 16:9, 4:3, 9:16 Story &bull; 100% Private in Browser
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {imageSrc && (
        <div className="space-y-4">
          {/* Top Controls Toolbar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            {/* Aspect Ratio Row */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 shrink-0">Ratio:</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: "free", label: "Freeform" },
                  { id: "1:1", label: "1:1 Square" },
                  { id: "16:9", label: "16:9 Landscape" },
                  { id: "4:3", label: "4:3 Standard" },
                  { id: "9:16", label: "9:16 Story" },
                  { id: "3:2", label: "3:2 Photo" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleAspectChange(r.id as AspectRatio)}
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
            </div>

            {/* Transform & Alignment Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleRotate(90)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1"
                  title="Rotate 90° clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rotate 90°</span>
                </button>
                <button
                  onClick={() => setFlipH((p) => !p)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1"
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip</span>
                </button>
                <button
                  onClick={centerCrop}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1"
                  title="Center Crop Box"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Center</span>
                </button>
                <button
                  onClick={maximizeCrop}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1"
                  title="Fit Maximum Image Area"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Maximize</span>
                </button>
              </div>

              {/* Format & Download */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpeg">JPG (Standard)</option>
                  <option value="webp">WebP (Compact)</option>
                  <option value="pdf">PDF (Document)</option>
                </select>

                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ({Math.round(cropBox.w)} × {Math.round(cropBox.h)})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Responsive Canvas Container with Viewport Fit */}
          <div
            ref={containerRef}
            className="p-3 sm:p-4 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center select-none relative min-h-[320px] max-h-[68vh] overflow-hidden"
            style={{ touchAction: "none" }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="max-w-full max-h-[55vh] w-auto h-auto rounded-xl shadow-2xl cursor-crosshair touch-none object-contain mx-auto"
              style={{ touchAction: "none" }}
            />

            {/* Live Dimensions and Nudge Toggle */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 w-full px-2 text-[11px] font-mono text-slate-400">
              <div>
                Dimensions: <span className="text-white font-bold">{Math.round(cropBox.w)} × {Math.round(cropBox.h)} px</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowNudgeControls((p) => !p)}
                  className="text-xs font-sans text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <Move className="w-3 h-3" />
                  <span>{showNudgeControls ? "Hide D-Pad" : "Fine Position D-Pad"}</span>
                </button>
              </div>
            </div>

            {/* Fine Position D-Pad */}
            {showNudgeControls && (
              <div className="mt-2 p-3 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col items-center space-y-1.5 animate-in fade-in zoom-in-95 z-20">
                <div className="text-[10px] text-slate-400 font-semibold mb-1">
                  10px Position Nudge:
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => nudge(0, -10)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => nudge(-10, 0)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={centerCrop}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold"
                  >
                    Center
                  </button>
                  <button
                    onClick={() => nudge(10, 0)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => nudge(0, 10)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Cropped Images History (Last 3) */}
      {recentCrops && recentCrops.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Cropped Images ({recentCrops.length}/3)
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Saved on device
              </span>
            </div>
            <button
              onClick={() => setRecentCrops([])}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline transition"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentCrops.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col space-y-3 group hover:border-blue-500/50 transition shadow-xs"
              >
                {/* Thumbnail */}
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <img
                    src={item.dataUrl}
                    alt={`Cropped ${item.width}x${item.height}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs font-mono">
                    {item.format}
                  </span>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {item.width} × {item.height} px
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      downloadDataUrl(item.dataUrl, item.fileName);
                      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
                    }}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => {
                      setImageSrc(item.dataUrl);
                      setFileName(item.fileName.replace(/\.[^/.]+$/, ""));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition"
                  >
                    <CropIcon className="w-3.5 h-3.5" />
                    <span>Re-Crop</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
