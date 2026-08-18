"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Download, Eraser, Undo, RotateCcw, Columns2, Maximize2 } from "lucide-react";
import confetti from "canvas-confetti";

/** Boundary colours sampled around each dab. */
const RING_SAMPLES = 24;

export default function WatermarkRemover() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  /**
   * Brush radius in ON-SCREEN pixels, not image pixels.
   *
   * Defining it in image pixels made the tool unusable on real photos: a
   * 3099px-wide image displays at ~546px, so a 60px brush covered 3.5 screen
   * pixels while each watermark letter was over 100 image pixels tall. Sizing
   * by the view keeps the brush feeling identical at any resolution.
   */
  const [brushSize, setBrushSize] = useState<number>(24);
  const [imageRadius, setImageRadius] = useState<number>(24);
  const [isReady, setIsReady] = useState(false);
  const [historyDepth, setHistoryDepth] = useState(0);

  const [sideBySide, setSideBySide] = useState(true);
  /** Share of pixels changed since upload, so progress is measurable. */
  const [changedPct, setChangedPct] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const originalRef = useRef<ImageData | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const maxHistoryRef = useRef(8);

  /** Ratio of displayed size to intrinsic size, e.g. 0.176 for a 14MP photo. */
  const displayScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width) return 1;
    const rect = canvas.getBoundingClientRect();
    return rect.width > 0 ? rect.width / canvas.width : 1;
  }, []);

  const toImageRadius = useCallback(
    (screenRadius: number) => Math.max(1, Math.round(screenRadius / displayScale())),
    [displayScale]
  );

  const getCtx = () =>
    // willReadFrequently keeps getImageData on the CPU path; without it every
    // dab forces a GPU readback and the brush stutters badly.
    canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  // The canvas is rendered as soon as `imageSrc` is set — deliberately not
  // gated on `isReady` — because this effect resolves the ref. Gating the
  // element on state that only this effect can set means the ref is null when
  // it runs, the effect bails, and the image never appears at all.
  useEffect(() => {
    if (!imageSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      originalRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [];
      setHistoryDepth(0);
      // An undo snapshot is a full RGBA copy, so a 12MP photo costs ~48MB
      // each. Scale the depth to the image so large files cannot exhaust
      // memory while small ones still get a useful history.
      const bytes = canvas.width * canvas.height * 4;
      maxHistoryRef.current = Math.max(
        2,
        Math.min(12, Math.round(64_000_000 / bytes))
      );
      // Mirror the untouched bitmap into the comparison canvas.
      const orig = originalCanvasRef.current;
      if (orig) {
        orig.width = img.naturalWidth;
        orig.height = img.naturalHeight;
        orig.getContext("2d")?.drawImage(img, 0, 0);
      }
      setChangedPct(0);
      setIsReady(true);
    };
    img.src = imageSrc;
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  // Release the last object URL when the component goes away.
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  /**
   * Fills the brush circle by blending the colours found on a ring just
   * outside it, weighted by inverse-square distance, then feathers the rim so
   * there is no hard circular seam.
   *
   * The previous version sampled one pixel at a fixed offset and filled a flat
   * disc at 0.85 alpha, which left visible circular blobs with the watermark
   * still showing through.
   */
  const inpaintAt = useCallback((cx: number, cy: number, radius: number) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const ringR = radius + Math.max(4, radius * 0.4);
    const pad = Math.ceil(ringR) + 1;

    const bx0 = Math.max(0, Math.floor(cx - pad));
    const by0 = Math.max(0, Math.floor(cy - pad));
    const bx1 = Math.min(W, Math.ceil(cx + pad));
    const by1 = Math.min(H, Math.ceil(cy + pad));
    const bw = bx1 - bx0;
    const bh = by1 - by0;
    if (bw <= 0 || bh <= 0) return;

    // One read and one write per dab rather than per sampled pixel.
    const patch = ctx.getImageData(bx0, by0, bw, bh);
    const d = patch.data;
    const idx = (x: number, y: number) => ((y - by0) * bw + (x - bx0)) * 4;

    const samples: { x: number; y: number; r: number; g: number; b: number }[] =
      [];
    for (let i = 0; i < RING_SAMPLES; i++) {
      const a = (i / RING_SAMPLES) * Math.PI * 2;
      const sx = Math.round(cx + Math.cos(a) * ringR);
      const sy = Math.round(cy + Math.sin(a) * ringR);
      if (sx < bx0 || sy < by0 || sx >= bx1 || sy >= by1) continue;
      const p = idx(sx, sy);
      samples.push({ x: sx, y: sy, r: d[p], g: d[p + 1], b: d[p + 2] });
    }
    if (samples.length === 0) return;

    const r2 = radius * radius;
    for (let y = by0; y < by1; y++) {
      for (let x = bx0; x < bx1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > r2) continue;

        let wr = 0;
        let wg = 0;
        let wb = 0;
        let wsum = 0;
        for (let s = 0; s < samples.length; s++) {
          const sp = samples[s];
          const ddx = x - sp.x;
          const ddy = y - sp.y;
          const w = 1 / (ddx * ddx + ddy * ddy + 1);
          wr += sp.r * w;
          wg += sp.g * w;
          wb += sp.b * w;
          wsum += w;
        }
        if (wsum === 0) continue;

        // Feather the outer 25% of the radius so the patch melts into the
        // surrounding pixels instead of leaving a visible disc edge.
        const t = Math.sqrt(dist2) / radius;
        const alpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;

        const p = idx(x, y);
        d[p] = d[p] * (1 - alpha) + (wr / wsum) * alpha;
        d[p + 1] = d[p + 1] * (1 - alpha) + (wg / wsum) * alpha;
        d[p + 2] = d[p + 2] * (1 - alpha) + (wb / wsum) * alpha;
      }
    }

    ctx.putImageData(patch, bx0, by0);
  }, []);

  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    if (historyRef.current.length > maxHistoryRef.current) {
      historyRef.current.shift();
    }
    setHistoryDepth(historyRef.current.length);
  };

  useEffect(() => {
    if (!isReady) return;
    const id = setTimeout(() => setImageRadius(toImageRadius(brushSize)), 0);
    return () => clearTimeout(id);
  }, [brushSize, isReady, sideBySide, toImageRadius]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isReady) return;
    const pt = toCanvasPoint(e);
    if (!pt) return;
    // Capture keeps events coming to the canvas even if the pointer leaves it,
    // so releasing outside no longer strands the brush in the drawing state.
    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    drawingRef.current = true;
    lastPointRef.current = pt;
    inpaintAt(pt.x, pt.y, toImageRadius(brushSize));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pt = toCanvasPoint(e);
    if (!pt) return;
    const last = lastPointRef.current ?? pt;

    // Interpolate along the stroke. Dabbing only at raw pointer positions left
    // a dotted trail of circles whenever the pointer moved quickly.
    const radius = toImageRadius(brushSize);
    const dx = pt.x - last.x;
    const dy = pt.y - last.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, radius * 0.4);
    const steps = Math.floor(dist / step);
    for (let i = 1; i <= steps; i++) {
      inpaintAt(last.x + (dx * i) / steps, last.y + (dy * i) / steps, radius);
    }
    if (steps === 0) inpaintAt(pt.x, pt.y, radius);
    lastPointRef.current = pt;
  };

  /**
   * Compares the working canvas against the original. Run on stroke end, never
   * per dab — it walks every pixel, which would stall the brush.
   */
  const measureChange = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    const original = originalRef.current;
    if (!canvas || !ctx || !original) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const before = original.data;
    let changed = 0;
    // Step 4 bytes at a time (one pixel) and allow a small tolerance so
    // imperceptible rounding does not register as an edit.
    for (let i = 0; i < before.length; i += 4) {
      if (
        Math.abs(before[i] - current[i]) > 4 ||
        Math.abs(before[i + 1] - current[i + 1]) > 4 ||
        Math.abs(before[i + 2] - current[i + 2]) > 4
      ) {
        changed++;
      }
    }
    setChangedPct((changed / (before.length / 4)) * 100);
  }, []);

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingRef.current) measureChange();
    drawingRef.current = false;
    lastPointRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleUndo = () => {
    const ctx = getCtx();
    const prev = historyRef.current.pop();
    if (!ctx || !prev) return;
    ctx.putImageData(prev, 0, 0);
    setHistoryDepth(historyRef.current.length);
    measureChange();
  };

  const handleReset = () => {
    const ctx = getCtx();
    if (!ctx || !originalRef.current) return;
    ctx.putImageData(originalRef.current, 0, 0);
    historyRef.current = [];
    setHistoryDepth(0);
    setChangedPct(0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "clean-image.png";
    link.click();
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <Eraser className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload an image to erase a watermark or text stamp
        </div>
        <p className="text-xs text-slate-500">
          Brush over the watermark. Surrounding pixels are blended in to fill
          the area.
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
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <label
                htmlFor="wm-brush"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Brush size
              </label>
              <input
                id="wm-brush"
                type="range"
                min={5}
                max={90}
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="w-32 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-blue-600 tabular-nums">
                {brushSize}px
                {imageRadius !== brushSize && (
                  <span className="ml-1 font-normal text-slate-400">
                    ({imageRadius}px on the full-size image)
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSideBySide((v) => !v)}
                disabled={!isReady}
                aria-pressed={sideBySide}
                title={sideBySide ? "Show the editor at full width" : "Compare against the original"}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                {sideBySide ? <Maximize2 className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
                <span>{sideBySide ? "Full width" : "Compare"}</span>
              </button>
              <button
                onClick={handleUndo}
                disabled={!isReady || historyDepth === 0}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo className="w-4 h-4" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleReset}
                disabled={!isReady || historyDepth === 0}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!isReady}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Clean Image</span>
              </button>
            </div>
          </div>

          {/* Before/after. The original is a plain mirror of the uploaded
              bitmap; only the right pane accepts brush input. Keeping both on
              screen is the only way to judge whether the fill actually blends,
              which a download-only result cannot show. */}
          <div
            className={`grid gap-4 ${
              sideBySide ? "grid-cols-1 @3xl:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Rendered always, hidden with CSS when not comparing. Toggling
                this with {sideBySide && …} unmounted the canvas, and the
                remounted one came back blank — the image is only painted here
                on upload, so there was nothing to restore it. */}
            <figure className={sideBySide ? "space-y-2" : "hidden"}>
                <figcaption className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Original</span>
                  <span className="font-normal text-slate-400">unchanged</span>
                </figcaption>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-auto flex justify-center max-h-[560px]">
                  <canvas
                    ref={originalCanvasRef}
                    aria-label="The original image before any edits"
                    className="max-w-full h-auto rounded-lg shadow-sm border border-slate-300 dark:border-slate-800"
                  />
                </div>
            </figure>

            <figure className="space-y-2">
              <figcaption className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>{sideBySide ? "Edited" : "Brush over the watermark"}</span>
                <span
                  className={`font-normal tabular-nums ${
                    changedPct > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {changedPct > 0
                    ? `${changedPct.toFixed(1)}% of pixels retouched`
                    : "nothing erased yet"}
                </span>
              </figcaption>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-auto flex justify-center max-h-[560px]">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  // touch-none stops the browser scrolling the page while the
                  // user is brushing on a phone or tablet.
                  className="max-w-full h-auto cursor-crosshair rounded-lg shadow-sm border border-slate-300 dark:border-slate-800 touch-none"
                />
              </div>
            </figure>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Works best on watermarks sitting over fairly even backgrounds — sky,
            walls, paper. Over busy detail the filled area will look smudged,
            because the surrounding pixels are the only information available to
            reconstruct from.
          </p>
        </div>
      )}
    </div>
  );
}
