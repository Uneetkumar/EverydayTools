"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, RotateCcw } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { Button } from "@/components/ui/button";
import { ToolLoadingState } from "@/components/tool/tool-states";
import { ActionBar, Chips, Field, Notice, Segmented, Stat, StatGrid, ToolSection, UnitInput } from "@/components/tool/kit";
import { markToolCompleted } from "@/lib/analytics";
import { downloadBlob } from "@/lib/utils/download";

export default function ImageCompressor() {
  const [origFile, setOrigFile] = useState<File | null>(null);
  const [origSize, setOrigSize] = useState<number>(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [targetKb, setTargetKb] = useState<string>("50");
  const [format, setFormat] = useState<"image/jpeg" | "image/webp">("image/jpeg");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "warning" | "info"; text: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number; ow: number; oh: number } | null>(null);

  const handleFile = (file: File) => {
    setOrigFile(file);
    setOrigSize(file.size);
    compressToTargetKb(file, parseFloat(targetKb) || 50, format);
  };

  const reset = () => {
    runRef.current++;
    setOrigFile(null);
    setOrigSize(0);
    setCompressedBlob(null);
    setCompressedSize(0);
    setPreviewUrl(null);
    setDims(null);
    setStatusMessage(null);
    setIsCompressing(false);
  };

  // Each run gets a number; a slower earlier run (the user changed the target
  // mid-way) must not overwrite the result of a newer one.
  const runRef = useRef(0);

  // Object URLs pin the image data in memory until revoked.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const compressToTargetKb = async (file: File, targetSizeKb: number, outFmt: string) => {
    const run = ++runRef.current;
    setIsCompressing(true);
    setStatusMessage(null);
    const targetSizeBytes = targetSizeKb * 1024;
    const img = new Image();

    const finish = (blob: Blob, text: string, type: "success" | "warning" | "info", scale = 1) => {
      if (run !== runRef.current) return;
      setDims({
        w: Math.max(16, Math.round(img.naturalWidth * scale)),
        h: Math.max(16, Math.round(img.naturalHeight * scale)),
        ow: img.naturalWidth,
        oh: img.naturalHeight,
      });
      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      setPreviewUrl(URL.createObjectURL(blob));
      setStatusMessage({ type, text });
      setIsCompressing(false);
    };

    const srcUrl = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("decode"));
        img.src = srcUrl;
      });
    } catch {
      URL.revokeObjectURL(srcUrl);
      if (run !== runRef.current) return;
      setIsCompressing(false);
      // Don't leave the previous file's result on screen next to the error.
      setCompressedBlob(null);
      setCompressedSize(0);
      setPreviewUrl(null);
      setStatusMessage({
        type: "warning",
        text: "This image couldn't be opened. Use a JPG, PNG or WebP file — HEIC photos from iPhones need converting first.",
      });
      return;
    }

    // Already small enough and already in the requested format: re-encoding
    // could only lose quality (and sometimes makes the file bigger). Checked
    // only after the image decoded, so a damaged file is never passed through.
    if (file.size <= targetSizeBytes && file.type === outFmt) {
      URL.revokeObjectURL(srcUrl);
      finish(file, `This image is already ${(file.size / 1024).toFixed(1)} KB — under your ${targetSizeKb} KB limit, so it was left untouched.`, "info");
      return;
    }

    const encode = (scale: number, quality: number): Promise<Blob | null> =>
      new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(16, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(16, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        // JPEG has no transparency, so transparent areas become white rather
        // than black. WebP keeps its transparency.
        if (outFmt === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => resolve(b), outFmt, quality);
      });

    // Keep full resolution if any reasonable quality fits; only then step the
    // resolution down. At each size, binary-search the highest quality that
    // is still under the limit — the best-looking file that fits.
    let best: Blob | null = null;
    let bestScale = 1;
    let smallest: Blob | null = null;
    let smallestScale = 1;
    for (const scale of [1, 0.85, 0.7, 0.55, 0.42, 0.32, 0.24, 0.18]) {
      let lo = 0.3;
      let hi = 0.95;
      let fit: Blob | null = null;
      for (let i = 0; i < 7; i++) {
        const q = (lo + hi) / 2;
        const blob = await encode(scale, q);
        if (run !== runRef.current) {
          URL.revokeObjectURL(srcUrl);
          return;
        }
        if (!blob) break;
        if (!smallest || blob.size < smallest.size) {
          smallest = blob;
          smallestScale = scale;
        }
        if (blob.size <= targetSizeBytes) {
          fit = blob;
          lo = q;
        } else {
          hi = q;
        }
      }
      if (fit) {
        best = fit;
        bestScale = scale;
        break;
      }
    }
    URL.revokeObjectURL(srcUrl);

    if (best) {
      finish(best, `Done: ${(best.size / 1024).toFixed(1)} KB, within your ${targetSizeKb} KB limit.`, "success", bestScale);
    } else if (smallest) {
      finish(
        smallest,
        `The smallest this image goes is ${(smallest.size / 1024).toFixed(1)} KB, still above ${targetSizeKb} KB. Crop it or choose a larger limit.`,
        "warning",
        smallestScale
      );
    } else if (run === runRef.current) {
      setIsCompressing(false);
      setStatusMessage({ type: "warning", text: "Your browser couldn't encode this image. Try another format." });
    }
  };

  const handleTargetKbChange = (kb: string) => {
    setTargetKb(kb);
    const num = parseFloat(kb);
    if (origFile && !isNaN(num) && num > 0) {
      compressToTargetKb(origFile, num, format);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    const ext = format === "image/jpeg" ? "jpg" : "webp";
    const base = (origFile?.name ?? "image").replace(/\.[^.]+$/, "");
    const sameFile = compressedBlob === origFile;
    downloadBlob(compressedBlob, sameFile && origFile ? origFile.name : `${base}-${targetKb}kb.${ext}`);
    markToolCompleted();
  };

  const savingsPct =
    origSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((origSize - compressedSize) / origSize) * 100))
      : 0;

  const kb = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  const presets = ["20", "50", "100", "200", "500"];

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/jpeg,image/png,image/webp"
        maxSizeMB={50}
        title="Drop an image here or choose one"
        subtitle="Compressed in your browser to the size you set. Nothing is uploaded."
        supportedFormatsText="JPG, PNG or WebP"
        selectedFile={origFile}
        onFileSelect={handleFile}
        onClear={reset}
      />

      <ToolSection title="Target size" description="Quality is lowered first; resolution only if the limit needs it.">
        <div className="grid items-start gap-4 @lg:grid-cols-[12rem_auto]">
          <Field label="Maximum file size" htmlFor="ic-target">
            <UnitInput
              id="ic-target"
              unit="KB"
              type="number"
              inputMode="numeric"
              min={5}
              max={5000}
              value={targetKb}
              onChange={(e) => handleTargetKbChange(e.target.value)}
            />
          </Field>
          <Field label="Output format">
            <Segmented
              ariaLabel="Output format"
              value={format}
              onChange={(f) => {
                setFormat(f);
                if (origFile) compressToTargetKb(origFile, parseFloat(targetKb) || 50, f);
              }}
              options={[
                { value: "image/jpeg", label: "JPG" },
                { value: "image/webp", label: "WebP" },
              ]}
            />
          </Field>
        </div>
        <Chips
          ariaLabel="Common size limits"
          value={presets.includes(targetKb) ? targetKb : null}
          onChange={handleTargetKbChange}
          options={presets.map((p) => ({ value: p, label: `Under ${p} KB` }))}
        />
      </ToolSection>

      {isCompressing && <ToolLoadingState label="Compressing…" />}

      {!isCompressing && statusMessage && (
        <Notice tone={statusMessage.type === "success" ? "success" : statusMessage.type === "warning" ? "warning" : "info"}>
          {statusMessage.text}
        </Notice>
      )}

      {origFile && compressedBlob && !isCompressing && (
        <div className="grid gap-5 @2xl:grid-cols-2">
          {previewUrl && (
            <figure className="flex items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview of the compressed image" className="max-h-72 w-auto rounded object-contain" />
            </figure>
          )}
          <div className="space-y-4">
            <StatGrid className="@xl:grid-cols-2">
              <Stat label="Original" value={kb(origSize)} hint={dims ? `${dims.ow} × ${dims.oh} px` : undefined} />
              <Stat
                label="Compressed"
                value={kb(compressedSize)}
                hint={dims ? `${dims.w} × ${dims.h} px` : undefined}
                tone={compressedSize <= (parseFloat(targetKb) || 0) * 1024 ? "success" : "warning"}
              />
              <Stat label="Saved" value={`${savingsPct}%`} />
              <Stat label="Format" value={compressedBlob === origFile ? "Unchanged" : format === "image/jpeg" ? "JPG" : "WebP"} />
            </StatGrid>
            <ActionBar className="justify-start">
              <Button size="lg" onClick={handleDownload} className="px-4">
                <Download aria-hidden="true" />
                Download {kb(compressedSize)}
              </Button>
              <Button size="lg" variant="outline" onClick={reset}>
                <RotateCcw aria-hidden="true" />
                Compress another
              </Button>
            </ActionBar>
          </div>
        </div>
      )}
    </div>
  );
}
