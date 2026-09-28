"use client";

import React, { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Download, RotateCw, RefreshCw, AlertTriangle } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";
import { downloadBlob } from "@/lib/utils/download";

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer());
      setFile(f);
      setPageCount(doc.getPageCount());
    } catch {
      setError("Could not read this PDF. It may be password-protected or damaged.");
    }
  };

  const rotate = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      for (const page of doc.getPages()) {
        // Rotation is additive: respect any rotation the page already carries
        // rather than overwriting it, or pages that were already landscape
        // come out wrong.
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      }
      const bytes = await doc.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`
      );
      markToolCompleted();
    } catch {
      setError("Rotation failed. The PDF may be corrupt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-xl border-dashed text-center cursor-pointer flex flex-col items-center justify-center space-y-2 relative border-2 border-input bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/60">
        <RotateCw className="w-8 h-8 text-muted-foreground" />
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Upload a PDF to rotate its pages
        </div>
        <p className="text-xs text-slate-500">Rotation is applied in your browser and never uploaded.</p>
        <input aria-label="Choose a PDF file" type="file" accept="application/pdf,.pdf" onChange={onFile}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>

      {error && (
        <div className="flex gap-2.5 p-4 rounded-xl border bg-muted/30">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      )}

      {file && (
        <div className="p-5 rounded-xl border space-y-4 bg-muted/30">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">{file.name}</span>
            {" — "}{pageCount} page{pageCount === 1 ? "" : "s"}
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-foreground">Rotate by</span>
            <div className="flex gap-2">
              {([90, 180, 270] as const).map((a) => (
                <button key={a} onClick={() => setAngle(a)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    angle === a ? "bg-brand-subtle text-brand-subtle-foreground ring-1 ring-inset ring-primary/30 font-medium"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                  {a}°
                </button>
              ))}
            </div>
          </div>

          <button onClick={rotate} disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-40 text-xs transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Rotate & download</span>
          </button>
        </div>
      )}
    </div>
  );
}
