"use client";

import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { Download, Star } from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob } from "@/lib/utils/download";

/** Sizes browsers and platforms actually request. */
const SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512];

export default function FaviconGenerator() {
  const [src, setSrc] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ size: number; url: string }[]>([]);
  const [background, setBackground] = useState<string>("transparent");
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const render = (img: HTMLImageElement, size: number, bg: string): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }
    // Contain, centred — a non-square source must not be stretched, because a
    // distorted favicon is immediately obvious at 16px.
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas;
  };

  const rebuild = (img: HTMLImageElement, bg: string) => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    const next: { size: number; url: string }[] = [];
    for (const size of SIZES) {
      next.push({ size, url: render(img, size, bg).toDataURL("image/png") });
    }
    setPreviews(next);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setSrc(url);
      rebuild(img, background);
    };
    img.src = url;
  };

  const changeBg = (bg: string) => {
    setBackground(bg);
    if (imgRef.current) rebuild(imgRef.current, bg);
  };

  const downloadZip = async () => {
    const img = imgRef.current;
    if (!img) return;
    const zip = new JSZip();
    for (const size of SIZES) {
      const blob: Blob = await new Promise((res) =>
        render(img, size, background).toBlob((b) => res(b!), "image/png")
      );
      zip.file(`favicon-${size}x${size}.png`, blob);
    }
    zip.file(
      "site.webmanifest",
      JSON.stringify(
        {
          icons: [
            { src: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
          ],
        },
        null,
        2
      )
    );
    zip.file(
      "README.txt",
      [
        "Drop these PNGs at the root of your site, then add to <head>:",
        "",
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">',
        '<link rel="manifest" href="/site.webmanifest">',
      ].join("\n")
    );
    downloadBlob(await zip.generateAsync({ type: "blob" }), "favicons.zip");
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <Star className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a square logo to generate favicons
        </div>
        <p className="text-xs text-slate-500">
          A square PNG or SVG of at least 512×512 gives the best result.
        </p>
        <input type="file" accept="image/*" onChange={onFile}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>

      {src && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Background</span>
            {[["transparent", "Transparent"], ["#ffffff", "White"], ["#0f172a", "Dark"]].map(([v, l]) => (
              <button key={v} onClick={() => changeBg(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  background === v ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}>{l}</button>
            ))}
            <button onClick={downloadZip}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
              <Download className="w-4 h-4" />
              <span>Download all as ZIP</span>
            </button>
          </div>

          <div className="grid grid-cols-3 @md:grid-cols-5 @2xl:grid-cols-9 gap-3">
            {previews.map((p) => (
              <a key={p.size} href={p.url} download={`favicon-${p.size}x${p.size}.png`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`${p.size} by ${p.size} favicon preview`}
                  width={Math.min(p.size, 48)} height={Math.min(p.size, 48)}
                  style={{ imageRendering: p.size <= 32 ? "pixelated" : "auto" }} />
                <span className="text-[10px] font-mono text-slate-500">{p.size}px</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
