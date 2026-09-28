"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, Trash2, ArrowUp, ArrowDown, FileText, CheckCircle2 } from "lucide-react";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { downloadDataUrl } from "@/lib/utils/download";

export default function PdfMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedPdfUrl, setMergedPdfUrlRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Replacing or clearing the result releases the previous file's memory.
  const setMergedPdfUrl = (url: string | null) =>
    setMergedPdfUrlRaw((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
      );
      setFiles((prev) => [...prev, ...selected]);
      setMergedPdfUrl(null);
      setError(null);
      if (selected.length < e.target.files.length) {
        setError("Only PDF files can be merged; the other files were skipped.");
      }
      // Allow choosing the same file again after removing it.
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setMergedPdfUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    setError(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        let pdf: PDFDocument;
        try {
          pdf = await PDFDocument.load(await file.arrayBuffer());
        } catch (err) {
          const encrypted = err instanceof Error && /encrypt/i.test(err.message);
          markToolError(encrypted ? "pdf_encrypted" : "invalid_pdf");
          setError(
            encrypted
              ? `“${file.name}” is password-protected. Remove the password with Unlock PDF, then merge again.`
              : `“${file.name}” couldn't be read as a PDF. It may be damaged — remove it and try again.`
          );
          return;
        }
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" });
      setMergedPdfUrl(URL.createObjectURL(blob));
      markToolCompleted();
    } catch (err) {
      console.error("PDF Merge error:", err);
      markToolError("merge_failed");
      setError("The merge failed. Your browser may have run out of memory — try merging fewer or smaller files.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="p-8 rounded-xl border-dashed text-center cursor-pointer flex flex-col items-center justify-center space-y-2 relative border-2 border-input bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/60">
        <Upload className="w-8 h-8 text-muted-foreground" />
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Upload 2 or more PDF documents to merge
        </div>
        <p className="text-xs text-slate-500">
          Put the files in order below. They are merged on your device.
        </p>
        <input aria-label="Choose PDF files"
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFiles}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span>Selected PDF Files ({files.length})</span>
            <button
              onClick={() => setFiles([])}
              className="text-rose-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-semibold text-xs">
                    {idx + 1}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === files.length - 1}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={mergePdfs}
              disabled={files.length < 2 || isMerging}
              className="w-full sm:w-auto px-6 py-3 rounded-lg disabled:opacity-50 text-xs transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {isMerging ? "Merging in Browser..." : `Merge ${files.length} PDFs into One`}
            </button>

            {mergedPdfUrl && (
              <button
                onClick={() => {
                  downloadDataUrl(mergedPdfUrl, "merged-document.pdf");
                  markToolCompleted();
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Merged PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
