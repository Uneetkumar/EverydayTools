"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Scissors, RefreshCw, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob } from "@/lib/utils/download";

/** Parses "1-3, 5, 8-10" into zero-based page indices, clamped to the document. */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const out = new Set<number>();
  for (const part of input.split(",")) {
    const chunk = part.trim();
    if (!chunk) continue;
    const range = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);
      const [lo, hi] = start <= end ? [start, end] : [end, start];
      for (let i = lo; i <= hi; i++) {
        if (i >= 1 && i <= pageCount) out.add(i - 1);
      }
    } else if (/^\d+$/.test(chunk)) {
      const n = parseInt(chunk, 10);
      if (n >= 1 && n <= pageCount) out.add(n - 1);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState("");
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
      setRanges(`1-${doc.getPageCount()}`);
    } catch {
      setError("Could not read this PDF. It may be password-protected or damaged.");
    }
  };

  const selected = pageCount ? parsePageRanges(ranges, pageCount) : [];

  const extract = async () => {
    if (!file || selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, selected);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${file.name.replace(/\.pdf$/i, "")}-pages.pdf`
      );
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch {
      setError("Extraction failed. The PDF may be corrupt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <Scissors className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a PDF to split or extract pages
        </div>
        <p className="text-xs text-slate-500">Nothing is uploaded — it is read in your browser.</p>
        <input type="file" accept="application/pdf,.pdf" onChange={onFile}
          className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>

      {error && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {file && pageCount > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">{file.name}</span>
            {" — "}{pageCount} page{pageCount === 1 ? "" : "s"}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ranges" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pages to extract
            </label>
            <input
              id="ranges"
              type="text"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3, 5, 8-10"
              className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500">
              Ranges and single pages, comma separated. {selected.length} page
              {selected.length === 1 ? "" : "s"} selected.
            </p>
          </div>

          <button
            onClick={extract}
            disabled={busy || selected.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold transition"
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Extract {selected.length} page{selected.length === 1 ? "" : "s"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
