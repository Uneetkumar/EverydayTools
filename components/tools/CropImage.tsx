"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Download, FlipHorizontal, FlipVertical, Maximize2, Minimize2, RotateCcw, RotateCw } from "lucide-react";
import { toast } from "sonner";
import DropZone from "@/components/ui/DropZone";
import { Button } from "@/components/ui/button";
import { Field, Notice, Segmented, UnitInput } from "@/components/tool/kit";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { downloadBlob } from "@/lib/utils/download";

type AspectRatio = "free" | "1:1" | "4:3" | "3:2" | "16:9" | "9:16";
type HandleType = "tl" | "tr" | "bl" | "br" | "move" | null;
type OutFormat = "png" | "jpeg" | "webp" | "pdf";

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_SIZE = 16;
/** The on-screen canvas is drawn at most this many pixels wide or tall; the download always uses the full image. */
const PREVIEW_MAX = 1600;

const RATIOS: Record<AspectRatio, number | null> = {
  free: null,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

/** New crop box while dragging a corner (or the whole box), kept inside the image and on-ratio. */
function computeCropFromAnchor(
  handle: HandleType,
  pointerX: number,
  pointerY: number,
  startBox: CropBox,
  dragStart: { x: number; y: number },
  aspect: AspectRatio,
  maxW: number,
  maxH: number
): CropBox {
  if (handle === "move") {
    return {
      x: Math.max(0, Math.min(maxW - startBox.w, startBox.x + pointerX - dragStart.x)),
      y: Math.max(0, Math.min(maxH - startBox.h, startBox.y + pointerY - dragStart.y)),
      w: startBox.w,
      h: startBox.h,
    };
  }
  if (!handle) return startBox;

  // The corner opposite the dragged one stays put.
  const right = handle === "tr" || handle === "br";
  const bottom = handle === "bl" || handle === "br";
  const anchorX = right ? startBox.x : startBox.x + startBox.w;
  const anchorY = bottom ? startBox.y : startBox.y + startBox.h;
  const roomW = right ? maxW - anchorX : anchorX;
  const roomH = bottom ? maxH - anchorY : anchorY;

  let w = Math.max(MIN_SIZE, Math.min(roomW, right ? pointerX - anchorX : anchorX - pointerX));
  let h = Math.max(MIN_SIZE, Math.min(roomH, bottom ? pointerY - anchorY : anchorY - pointerY));

  const r = RATIOS[aspect];
  if (r) {
    // Follow whichever side the pointer pulled further, then shrink to fit.
    if (w / r > h) h = Math.round(w / r);
    else w = Math.round(h * r);
    if (w > roomW) {
      w = roomW;
      h = Math.round(w / r);
    }
    if (h > roomH) {
      h = roomH;
      w = Math.round(h * r);
    }
    w = Math.max(MIN_SIZE, w);
    h = Math.max(MIN_SIZE, h);
  }

  return { x: right ? anchorX : anchorX - w, y: bottom ? anchorY : anchorY - h, w, h };
}

/** Largest box of the given ratio (or `w`×`h` for free) that fits, centred on (cx, cy). */
function fitBox(w: number, h: number, cx: number, cy: number, aspect: AspectRatio, maxW: number, maxH: number): CropBox {
  const r = RATIOS[aspect];
  if (r) {
    h = Math.round(w / r);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * r);
    }
    if (w > maxW) {
      w = maxW;
      h = Math.round(w / r);
    }
  }
  w = Math.max(MIN_SIZE, Math.min(w, maxW));
  h = Math.max(MIN_SIZE, Math.min(h, maxH));
  return {
    x: Math.max(0, Math.min(maxW - w, Math.round(cx - w / 2))),
    y: Math.max(0, Math.min(maxH - h, Math.round(cy - h / 2))),
    w,
    h,
  };
}

/** A number field that only applies its value on Enter, blur or arrow keys, so typing isn't fought by clamping. */
function NumField({ id, label, value, onCommit }: { id: string; label: string; value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) {
      const n = parseInt(draft, 10);
      if (!Number.isNaN(n)) onCommit(n);
      setDraft(null);
    }
  };
  return (
    <Field label={label} htmlFor={id}>
      <UnitInput
        id={id}
        unit="px"
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setDraft(null);
            onCommit(value + (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1));
          }
        }}
      />
    </Field>
  );
}

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [fileName, setFileName] = useState<string>("image");
  const [aspect, setAspect] = useState<AspectRatio>("free");
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [format, setFormat] = useState<OutFormat>("png");
  const [busy, setBusy] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, w: 300, h: 300 });
  const [dragging, setDragging] = useState<HandleType>(null);
  const [hover, setHover] = useState<HandleType>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startBox: CropBox; handle: HandleType } | null>(null);

  // Crops used to be kept in localStorage as full data URLs, which could fill
  // the browser's quota. Downloads now go to the shared recent-files list.
  useEffect(() => {
    try {
      localStorage.removeItem("edt_persist_recent_crops_history");
    } catch {
      /* storage unavailable */
    }
  }, []);

  // The image's size after rotation — the coordinate space of the crop box.
  const base = useMemo(() => {
    if (!imgSize) return null;
    return rotation % 180 === 0 ? { w: imgSize.w, h: imgSize.h } : { w: imgSize.h, h: imgSize.w };
  }, [imgSize, rotation]);

  const loadFile = (f: File) => {
    setFile(f);
    setFileName(f.name.replace(/\.[^/.]+$/, "") || "image");
    setImgSize(null);
    setLoadError(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setImageSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  const reset = () => {
    setFile(null);
    setImgSize(null);
    setLoadError(false);
    imgRef.current = null;
    setImageSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  useEffect(() => () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Start with a generous centred selection.
      setCropBox(fitBox(Math.round(img.naturalWidth * 0.85), Math.round(img.naturalHeight * 0.85), img.naturalWidth / 2, img.naturalHeight / 2, "free", img.naturalWidth, img.naturalHeight));
      setAspect("free");
    };
    img.onerror = () => {
      if (cancelled) return;
      imgRef.current = null;
      setLoadError(true);
      markToolError("image_decode_failed");
    };
    img.src = imageSrc;
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const drawImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) => {
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !base) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = Math.min(1, PREVIEW_MAX / Math.max(base.w, base.h));
    canvas.width = Math.round(base.w * s);
    canvas.height = Math.round(base.h * s);
    const unit = Math.max(1, canvas.width / 700) / s; // one "screen pixel" in image units

    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.save();
    drawImage(ctx, img, base.w, base.h);
    ctx.restore();

    // Dim everything outside the selection.
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.rect(0, 0, base.w, base.h);
    ctx.rect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
    ctx.fill("evenodd");

    // Thirds grid and border.
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = unit;
    ctx.beginPath();
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(cropBox.x + (cropBox.w * i) / 3, cropBox.y);
      ctx.lineTo(cropBox.x + (cropBox.w * i) / 3, cropBox.y + cropBox.h);
      ctx.moveTo(cropBox.x, cropBox.y + (cropBox.h * i) / 3);
      ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + (cropBox.h * i) / 3);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = unit * 1.5;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Corner brackets.
    const len = Math.min(unit * 22, cropBox.w / 3, cropBox.h / 3);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = unit * 4;
    ctx.lineCap = "square";
    const corners: [number, number, number, number][] = [
      [cropBox.x, cropBox.y, 1, 1],
      [cropBox.x + cropBox.w, cropBox.y, -1, 1],
      [cropBox.x, cropBox.y + cropBox.h, 1, -1],
      [cropBox.x + cropBox.w, cropBox.y + cropBox.h, -1, -1],
    ];
    ctx.beginPath();
    for (const [cx, cy, dx, dy] of corners) {
      ctx.moveTo(cx, cy + dy * len);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * len, cy);
    }
    ctx.stroke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropBox, rotation, flipH, flipV, base]);

  useEffect(() => {
    render();
  }, [render]);

  // Pointer position in image (crop-box) coordinates.
  const toImageCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !base) return { x: 0, y: 0, perPx: 1 };
    const rect = canvas.getBoundingClientRect();
    const perPx = base.w / rect.width;
    return { x: (clientX - rect.left) * perPx, y: (clientY - rect.top) * (base.h / rect.height), perPx };
  };

  const detectHandle = (x: number, y: number, perPx: number): HandleType => {
    const hit = 22 * perPx; // 22 CSS pixels, generous enough for touch
    const { x: bx, y: by, w, h } = cropBox;
    if (Math.hypot(x - bx, y - by) < hit) return "tl";
    if (Math.hypot(x - (bx + w), y - by) < hit) return "tr";
    if (Math.hypot(x - bx, y - (by + h)) < hit) return "bl";
    if (Math.hypot(x - (bx + w), y - (by + h)) < hit) return "br";
    if (x >= bx && x <= bx + w && y >= by && y <= by + h) return "move";
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, perPx } = toImageCoords(e.clientX, e.clientY);
    const handle = detectHandle(x, y, perPx);
    if (!handle) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: x, startY: y, startBox: { ...cropBox }, handle };
    setDragging(handle);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, perPx } = toImageCoords(e.clientX, e.clientY);
    if (!dragRef.current) {
      setHover(detectHandle(x, y, perPx));
      return;
    }
    if (!base) return;
    const { startX, startY, startBox, handle } = dragRef.current;
    setCropBox(computeCropFromAnchor(handle, x, y, startBox, { x: startX, y: startY }, aspect, base.w, base.h));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
    dragRef.current = null;
    setDragging(null);
  };

  const cursor = (h: HandleType) =>
    h === "tl" || h === "br" ? "nwse-resize" : h === "tr" || h === "bl" ? "nesw-resize" : h === "move" ? (dragging ? "grabbing" : "grab") : "crosshair";

  const handleAspectChange = (ratio: AspectRatio) => {
    setAspect(ratio);
    if (!base) return;
    setCropBox((b) => fitBox(b.w, b.h, b.x + b.w / 2, b.y + b.h / 2, ratio, base.w, base.h));
  };

  const handleRotate = (dir: 90 | -90) => {
    if (!imgSize) return;
    const next = (rotation + dir + 360) % 360;
    const nw = next % 180 === 0 ? imgSize.w : imgSize.h;
    const nh = next % 180 === 0 ? imgSize.h : imgSize.w;
    setRotation(next);
    // Turn the selection with the image and keep it inside.
    setCropBox((b) => fitBox(aspect === "free" ? b.h : b.w, aspect === "free" ? b.w : b.h, nw / 2, nh / 2, aspect, nw, nh));
  };

  const centerCrop = () => {
    if (!base) return;
    setCropBox((b) => ({ ...b, x: Math.round((base.w - b.w) / 2), y: Math.round((base.h - b.h) / 2) }));
  };

  const maximizeCrop = () => {
    if (!base) return;
    setCropBox(fitBox(base.w, base.h, base.w / 2, base.h / 2, aspect, base.w, base.h));
  };

  const nudge = (dx: number, dy: number) => {
    if (!base) return;
    setCropBox((b) => ({
      ...b,
      x: Math.max(0, Math.min(base.w - b.w, b.x + dx)),
      y: Math.max(0, Math.min(base.h - b.h, b.y + dy)),
    }));
  };

  const setSize = (which: "w" | "h", n: number) => {
    if (!base) return;
    const r = RATIOS[aspect];
    setCropBox((b) => {
      let w = which === "w" ? n : b.w;
      let h = which === "h" ? n : b.h;
      if (r) {
        if (which === "w") h = Math.round(w / r);
        else w = Math.round(h * r);
      }
      w = Math.max(MIN_SIZE, Math.min(w, base.w - b.x));
      h = Math.max(MIN_SIZE, Math.min(h, base.h - b.y));
      if (r) {
        // Keep the ratio if clamping cut one side short.
        if (Math.round(w / r) > h) w = Math.round(h * r);
        else h = Math.round(w / r);
      }
      return { ...b, w, h };
    });
  };

  const setPos = (which: "x" | "y", n: number) => {
    if (!base) return;
    setCropBox((b) =>
      which === "x" ? { ...b, x: Math.max(0, Math.min(base.w - b.w, n)) } : { ...b, y: Math.max(0, Math.min(base.h - b.h, n)) }
    );
  };

  const handleDownload = async () => {
    const img = imgRef.current;
    if (!img || !base) return;
    setBusy(true);
    try {
      const out = document.createElement("canvas");
      out.width = Math.max(1, Math.round(cropBox.w));
      out.height = Math.max(1, Math.round(cropBox.h));
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("canvas");
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
      }
      ctx.translate(-cropBox.x, -cropBox.y);
      drawImage(ctx, img, base.w, base.h);

      const toBlob = (type: string, q?: number) =>
        new Promise<Blob>((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), type, q));

      if (format === "pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const pdfDoc = await PDFDocument.create();
        const png = await pdfDoc.embedPng(await (await toBlob("image/png")).arrayBuffer());
        pdfDoc.addPage([out.width, out.height]).drawImage(png, { x: 0, y: 0, width: out.width, height: out.height });
        const bytes = await pdfDoc.save();
        downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), `${fileName}-cropped.pdf`, "crop-image");
      } else {
        const type = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
        const ext = format === "jpeg" ? "jpg" : format;
        const blob = await toBlob(type, format === "jpeg" ? 0.95 : format === "webp" ? 0.92 : undefined);
        downloadBlob(blob, `${fileName}-cropped.${ext}`, "crop-image");
      }
      markToolCompleted();
    } catch (err) {
      console.error("Crop export error:", err);
      markToolError("export_failed");
      toast.error("Couldn't create the file", { description: "The crop may be too large for this browser. Try a smaller area or another format." });
    } finally {
      setBusy(false);
    }
  };

  const w = Math.round(cropBox.w);
  const h = Math.round(cropBox.h);
  const ready = !!imgSize && !!base && !loadError;

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        maxSizeMB={50}
        title="Drop an image here or choose one"
        subtitle="Cropped in your browser. Nothing is uploaded."
        supportedFormatsText="JPG, PNG, WebP, GIF or BMP"
        selectedFile={file}
        onClear={reset}
        onFileSelect={loadFile}
      />

      {loadError && <Notice tone="error">This image couldn&apos;t be opened. It may be damaged or in a format your browser can&apos;t read, such as HEIC — try a JPG or PNG.</Notice>}

      {ready && (
        <div className="space-y-5">
          {/* Ratio and transforms */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-full overflow-x-auto">
              <Segmented
                value={aspect}
                onChange={handleAspectChange}
                ariaLabel="Aspect ratio"
                size="sm"
                options={[
                  { value: "free", label: "Free" },
                  { value: "1:1", label: "1:1" },
                  { value: "4:3", label: "4:3" },
                  { value: "3:2", label: "3:2" },
                  { value: "16:9", label: "16:9" },
                  { value: "9:16", label: "9:16" },
                ]}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRotate(-90)} aria-label="Rotate left" title="Rotate left">
                <RotateCcw aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRotate(90)} aria-label="Rotate right" title="Rotate right">
                <RotateCw aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setFlipH((p) => !p)} aria-label="Flip horizontally" aria-pressed={flipH} title="Flip horizontally">
                <FlipHorizontal aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setFlipV((p) => !p)} aria-label="Flip vertically" aria-pressed={flipV} title="Flip vertically">
                <FlipVertical aria-hidden="true" />
              </Button>
              <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
              <Button type="button" variant="ghost" size="sm" onClick={centerCrop}>
                <Minimize2 aria-hidden="true" />
                Centre
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={maximizeCrop}>
                <Maximize2 aria-hidden="true" />
                Fit
              </Button>
            </div>
          </div>

          {/* Crop area */}
          <div
            tabIndex={0}
            role="group"
            aria-label={`Crop area, ${w} by ${h} pixels. Arrow keys move the selection by 10 pixels; hold Shift for 1 pixel.`}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 1 : 10;
              const moves: Record<string, [number, number]> = {
                ArrowUp: [0, -step],
                ArrowDown: [0, step],
                ArrowLeft: [-step, 0],
                ArrowRight: [step, 0],
              };
              const m = moves[e.key];
              if (m) {
                e.preventDefault();
                nudge(m[0], m[1]);
              }
            }}
            className="flex min-h-72 items-center justify-center rounded-xl border bg-muted/40 p-3 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-4"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={() => !dragRef.current && setHover(null)}
              className="h-auto max-h-[65vh] w-auto max-w-full touch-none rounded-md"
              style={{ cursor: cursor(dragging ?? hover) }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Drag the box to move it and its corners to resize. When the crop area is selected, arrow keys move it (Shift for 1 px).
          </p>

          {/* Exact size and export */}
          <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid grid-cols-2 gap-3 @md:grid-cols-4">
              <NumField id="crop-w" label="Width" value={w} onCommit={(n) => setSize("w", n)} />
              <NumField id="crop-h" label="Height" value={h} onCommit={(n) => setSize("h", n)} />
              <NumField id="crop-x" label="Left (X)" value={Math.round(cropBox.x)} onCommit={(n) => setPos("x", n)} />
              <NumField id="crop-y" label="Top (Y)" value={Math.round(cropBox.y)} onCommit={(n) => setPos("y", n)} />
            </div>
            <div className="flex flex-col gap-3 @3xl:w-80">
              <Field label="Format">
                <Segmented
                  value={format}
                  onChange={setFormat}
                  ariaLabel="Download format"
                  fill
                  options={[
                    { value: "png", label: "PNG" },
                    { value: "jpeg", label: "JPG" },
                    { value: "webp", label: "WebP" },
                    { value: "pdf", label: "PDF" },
                  ]}
                />
              </Field>
              <Button type="button" size="lg" className="h-10 w-full" onClick={handleDownload} disabled={busy}>
                <Download aria-hidden="true" />
                {busy ? "Preparing…" : `Download ${w} × ${h}`}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Original {imgSize.w} × {imgSize.h} px. The download is cut from the full-resolution image
            {format === "png" ? "; PNG keeps transparency." : format === "jpeg" ? "; transparent areas become white." : "."}
          </p>
        </div>
      )}
    </div>
  );
}
