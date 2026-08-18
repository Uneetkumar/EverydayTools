"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, Scaling, Link2, Unlink } from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob } from "@/lib/utils/download";

export default function ImageResizer() {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [name, setName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setName(f.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setSrc(url);
    };
    img.src = url;
  };

  const ratio = natural.w && natural.h ? natural.w / natural.h : 1;

  const changeWidth = (w: number) => {
    setWidth(w);
    if (lockRatio && ratio) setHeight(Math.max(1, Math.round(w / ratio)));
  };
  const changeHeight = (h: number) => {
    setHeight(h);
    if (lockRatio && ratio) setWidth(Math.max(1, Math.round(h * ratio)));
  };
  const applyScale = (pct: number) => {
    setWidth(Math.max(1, Math.round(natural.w * pct)));
    setHeight(Math.max(1, Math.round(natural.h * pct)));
  };

  const download = () => {
    const img = imgRef.current;
    if (!img || width < 1 || height < 1) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Best-available resampling; without this, downscaling aliases badly.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (format === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const ext = format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
        downloadBlob(blob, `${name}-${width}x${height}.${ext}`);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      },
      format,
      format === "image/png" ? undefined : quality
    );
  };

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <Scaling className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload an image to resize
        </div>
        <p className="text-xs text-slate-500">Resized on a canvas in your browser — never uploaded.</p>
        <input type="file" accept="image/*" onChange={onFile}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>

      {src && (
        <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-xs text-slate-500">
              Original: <span className="font-mono font-semibold text-slate-900 dark:text-white">{natural.w} × {natural.h}</span>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="w" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Width (px)</label>
                <input id="w" type="number" min={1} value={width}
                  onChange={(e) => changeWidth(parseInt(e.target.value || "1", 10))}
                  className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white" />
              </div>
              <button onClick={() => setLockRatio(!lockRatio)}
                title={lockRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                aria-pressed={lockRatio}
                className={`mb-1 p-2 rounded-xl transition ${lockRatio ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {lockRatio ? <Link2 className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
              </button>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="h" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Height (px)</label>
                <input id="h" type="number" min={1} value={height}
                  onChange={(e) => changeHeight(parseInt(e.target.value || "1", 10))}
                  className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Quick scale</span>
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75, 1].map((p) => (
                  <button key={p} onClick={() => applyScale(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    {p * 100}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Output format</span>
              <div className="flex flex-wrap gap-2">
                {([["image/jpeg", "JPG"], ["image/png", "PNG"], ["image/webp", "WebP"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setFormat(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      format === v ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>{l}</button>
                ))}
              </div>
            </div>

            {format !== "image/png" && (
              <div className="flex items-center gap-3">
                <label htmlFor="q" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quality</label>
                <input id="q" type="range" min={0.3} max={1} step={0.05} value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-32 accent-blue-600 cursor-pointer" />
                <span className="text-xs font-mono font-bold text-blue-600">{Math.round(quality * 100)}</span>
              </div>
            )}

            <button onClick={download}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
              <Download className="w-4 h-4" />
              <span>Download {width} × {height}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Preview of the image being resized"
              className="max-w-full max-h-[420px] h-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
