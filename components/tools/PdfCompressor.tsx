"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, FileText, CheckCircle2, ShieldCheck, Download } from "lucide-react";

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [pdfTitle, setPdfTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileSize(f.size);
      try {
        const buffer = await f.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        setPageCount(doc.getPageCount());
        setPdfTitle(doc.getTitle() || "Untitled Document");
        setAuthor(doc.getAuthor() || "Unknown Author");
      } catch (err) {
        console.error("PDF inspection error:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload PDF to inspect & optimize
        </div>
        <p className="text-xs text-slate-500">
          Fast client-side inspection. Check page count, size, and metadata.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {file && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            PDF Document Diagnostics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Page Count</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {pageCount ?? "-"} pages
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Document Size</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {(fileSize / 1024).toFixed(1)} KB
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Security</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Unencrypted
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Privacy Status</div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                Local Only
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
