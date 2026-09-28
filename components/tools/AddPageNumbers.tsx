"use client";

import React, { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Download, Hash, RefreshCw, AlertTriangle } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";
import { downloadBlob } from "@/lib/utils/download";

type Position = "bottom-center" | "bottom-right" | "top-right";

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startAt, setStartAt] = useState(1);
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

  const apply = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const size = 10;
      const margin = 28;

      doc.getPages().forEach((page, i) => {
        const label = String(i + startAt);
        const w = font.widthOfTextAtSize(label, size);
        const { width, height } = page.getSize();
        let x = width / 2 - w / 2;
        let y = margin;
        if (position === "bottom-right") x = width - margin - w;
        if (position === "top-right") {
          x = width - margin - w;
          y = height - margin;
        }
        page.drawText(label, { x, y, size, font, color: rgb(0.35, 0.35, 0.35) });
      });

      const bytes = await doc.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${file.name.replace(/\.pdf$/i, "")}-numbered.pdf`
      );
      markToolCompleted();
    } catch {
      setError("Could not add page numbers. The PDF may be corrupt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-xl border-dashed text-center cursor-pointer flex flex-col items-center justify-center space-y-2 relative border-2 border-input bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/60">
        <Hash className="w-8 h-8 text-muted-foreground" />
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Upload a PDF to add page numbers
        </div>
        <p className="text-xs text-slate-500">Stamped in your browser — the file is never uploaded.</p>
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

          <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-foreground">Position</span>
              <div className="flex flex-wrap gap-2">
                {([["bottom-center", "Bottom centre"], ["bottom-right", "Bottom right"], ["top-right", "Top right"]] as const).map(
                  ([id, label]) => (
                    <button key={id} onClick={() => setPosition(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        position === id ? "bg-brand-subtle text-brand-subtle-foreground ring-1 ring-inset ring-primary/30 font-medium" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>{label}</button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="startAt" className="block text-sm font-medium text-foreground">
                Start numbering at
              </label>
              <input id="startAt" type="number" min={0} value={startAt}
                onChange={(e) => setStartAt(parseInt(e.target.value || "1", 10))}
                className="w-28 font-mono px-3 py-2 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
          </div>

          <button onClick={apply} disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-40 text-xs transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Add numbers & download</span>
          </button>
        </div>
      )}
    </div>
  );
}
