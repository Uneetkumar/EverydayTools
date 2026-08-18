"use client";

import React, { useState } from "react";
import JSZip from "jszip";
import { Download, Image as ImageIcon, RefreshCw, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { loadPdfJs, pdfDocumentOptions } from "@/lib/pdf/loader";
import { downloadBlob } from "@/lib/utils/download";

type Format = "jpeg" | "png";

export default function PdfToJpg() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<{ url: string; name: string; blob: Blob }[]>([]);
  const [format, setFormat] = useState<Format>("jpeg");
  const [scale, setScale] = useState(2);

  const convert = async (file: File) => {
    setBusy(true);
    setError(null);
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    setPages([]);
    try {
      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument(pdfDocumentOptions(await file.arrayBuffer()));
      const doc = await task.promise;
      const base = file.name.replace(/\.pdf$/i, "");
      const out: { url: string; name: string; blob: Blob }[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`Rendering page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        // `scale` maps PDF points to pixels: 2 gives ~144 DPI, which is a
        // reasonable default for screen use without producing huge files.
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        // pdf.js v6 takes `canvas` OR `canvasContext`, never both — passing
        // both leaves the render promise permanently pending. JPEG has no
        // alpha, so the white ground is requested via `background` rather than
        // pre-filling, because the renderer clears the canvas first.
        await page.render({
          canvas,
          viewport,
          background: format === "jpeg" ? "#ffffff" : undefined,
        }).promise;
        const blob: Blob = await new Promise((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error("encode failed"))),
            format === "jpeg" ? "image/jpeg" : "image/png",
            format === "jpeg" ? 0.92 : undefined
          )
        );
        out.push({
          blob,
          url: URL.createObjectURL(blob),
          name: `${base}-page-${String(i).padStart(2, "0")}.${format === "jpeg" ? "jpg" : "png"}`,
        });
        page.cleanup();
      }

      await task.destroy();
      setPages(out);
      setStatus(`Converted ${out.length} page${out.length === 1 ? "" : "s"}.`);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setError("Could not render this PDF. It may be password-protected or damaged.");
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (pages.length === 1) {
      downloadBlob(pages[0].blob, pages[0].name);
      return;
    }
    const zip = new JSZip();
    for (const p of pages) zip.file(p.name, p.blob);
    downloadBlob(await zip.generateAsync({ type: "blob" }), "pdf-pages.zip");
  };

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a PDF to convert each page to an image
        </div>
        <p className="text-xs text-slate-500">Rendered in your browser — the file is never uploaded.</p>
        <input type="file" accept="application/pdf,.pdf" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) convert(f); }}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" />
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format</span>
          {(["jpeg", "png"] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                format === f ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}>
              {f === "jpeg" ? "JPG" : "PNG"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="scale" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quality</label>
          <input id="scale" type="range" min={1} max={4} step={1} value={scale}
            onChange={(e) => setScale(parseInt(e.target.value, 10))}
            className="w-28 accent-blue-600 cursor-pointer" />
          <span className="text-xs font-mono font-bold text-blue-600">{scale}x (~{scale * 72} DPI)</span>
        </div>
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{status}</span>
        </div>
      )}

      {error && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {pages.length > 0 && !busy && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{status}</span>
            <button onClick={downloadAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
              <Download className="w-4 h-4" />
              <span>{pages.length === 1 ? "Download image" : `Download all (${pages.length}) as ZIP`}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 @md:grid-cols-3 @2xl:grid-cols-4 gap-3">
            {pages.map((p) => (
              <a key={p.name} href={p.url} download={p.name}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 hover:border-blue-400 transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="w-full h-auto block" />
                <span className="block px-2 py-1.5 text-[10px] font-mono text-slate-500 truncate">{p.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
