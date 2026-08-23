"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import {
  Upload, Download, RotateCw, RotateCcw, Trash2, ArrowLeft, ArrowRight,
  RefreshCw, AlertTriangle, Undo, FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { loadPdfJs, pdfDocumentOptions } from "@/lib/pdf/loader";
import { downloadBlob } from "@/lib/utils/download";

interface PageState {
  /** Index in the ORIGINAL document — pdf-lib copies pages by original index. */
  sourceIndex: number;
  /** Rotation to apply on top of whatever the page already had. */
  rotation: number;
  thumbnail: string | null;
}

/**
 * Page-level PDF editor.
 *
 * Thumbnails are rendered with pdf.js; the output document is rebuilt with
 * pdf-lib by copying pages in the current order. Copying is lossless — text
 * stays vector, images keep their original encoding — so this never degrades
 * the file the way a re-render would.
 */
export default function PdfEditor() {
  const [fileName, setFileName] = useState<string>("");
  const [pages, setPages] = useState<PageState[]>([]);
  const [history, setHistory] = useState<PageState[][]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);

  const push = useCallback((next: PageState[]) => {
    setHistory((h) => [...h.slice(-19), pages]);
    setPages(next);
  }, [pages]);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      setPages(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus("Reading document…");
    setHistory([]);
    try {
      const buf = await file.arrayBuffer();
      // Keep a pristine copy: pdf-lib and pdf.js both detach ArrayBuffers they
      // are handed, so the original must be cloned before either touches it.
      bytesRef.current = buf.slice(0);

      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument(pdfDocumentOptions(buf.slice(0)));
      const doc = await task.promise;

      const next: PageState[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`Rendering page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvas, viewport, background: "#ffffff" }).promise;
        next.push({
          sourceIndex: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL("image/jpeg", 0.7),
        });
        page.cleanup();
      }
      await task.destroy();

      setFileName(file.name);
      setPages(next);
      setStatus(`${next.length} page${next.length === 1 ? "" : "s"} loaded.`);
    } catch (e) {
      console.error(e);
      setError(
        "Could not read that PDF. It may be password-protected or damaged — unlock it first if it has a password."
      );
      setPages([]);
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pages.length) return;
    const next = [...pages];
    [next[i], next[j]] = [next[j], next[i]];
    push(next);
  };

  const rotate = (i: number, delta: number) => {
    const next = pages.map((p, idx) =>
      idx === i ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
    );
    push(next);
  };

  const remove = (i: number) => push(pages.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!bytesRef.current || pages.length === 0) return;
    setBusy(true);
    setStatus("Building document…");
    try {
      const src = await PDFDocument.load(bytesRef.current.slice(0));
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, pages.map((p) => p.sourceIndex));
      copied.forEach((page, i) => {
        const extra = pages[i].rotation;
        if (extra) {
          // Additive, so a page that was already landscape stays correct.
          page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        }
        out.addPage(page);
      });
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${fileName.replace(/\.pdf$/i, "") || "document"}-edited.pdf`
      );
      setStatus(`Saved ${pages.length} page${pages.length === 1 ? "" : "s"}.`);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setError("Could not build the edited PDF.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => { bytesRef.current = null; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center transition hover:bg-blue-50/30">
        <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a PDF to reorder, rotate or delete pages
        </p>
        <p className="text-xs text-slate-500">
          Pages are copied losslessly — text stays sharp and nothing is uploaded.
        </p>
        <input
          type="file" accept="application/pdf,.pdf"
          onChange={(e) => onFile(e.target.files?.[0])}
          disabled={busy}
          aria-label="Choose a PDF"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
        />
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {status ?? "Working…"}
        </p>
      )}

      {error && (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {pages.length > 0 && !busy && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-semibold text-slate-900 dark:text-white">{fileName}</span>
              — {pages.length} page{pages.length === 1 ? "" : "s"}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={undo} disabled={!history.length}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Undo className="h-4 w-4" /> Undo
              </button>
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                <Download className="h-4 w-4" /> Save PDF
              </button>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-5">
            {pages.map((p, i) => (
              <li
                key={`${p.sourceIndex}-${i}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative grid aspect-[3/4] place-items-center overflow-hidden bg-slate-100 dark:bg-slate-950">
                  {p.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.thumbnail}
                      alt={`Page ${i + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full transition-transform duration-200"
                    />
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-0.5 p-1.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move page ${i + 1} left`}
                    className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 dark:hover:bg-slate-800">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => rotate(i, -90)} aria-label={`Rotate page ${i + 1} left`}
                    className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => rotate(i, 90)} aria-label={`Rotate page ${i + 1} right`}
                    className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800">
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(i)} aria-label={`Delete page ${i + 1}`}
                    className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === pages.length - 1} aria-label={`Move page ${i + 1} right`}
                    className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 dark:hover:bg-slate-800">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
