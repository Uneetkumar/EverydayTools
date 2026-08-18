"use client";

import React, { useState } from "react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";
import mammoth from "mammoth";
import { Download, FileText, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { extractPdfText } from "@/lib/pdf/loader";
import { downloadBlob } from "@/lib/utils/download";

type Mode = "pdf2word" | "word2pdf";

export default function PdfToWord() {
  const [mode, setMode] = useState<Mode>("pdf2word");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const reset = () => {
    setResult(null);
    setWarning(null);
    setStatus(null);
  };

  /**
   * Reads the PDF's actual text layer via pdf.js and writes it into a .docx.
   *
   * The previous implementation ignored the uploaded file entirely and emitted
   * a fixed three-line placeholder document, so every conversion produced the
   * same output regardless of input.
   */
  const handlePdfToWord = async (file: File) => {
    setIsProcessing(true);
    reset();
    try {
      setStatus("Reading PDF text layer…");
      const pages = await extractPdfText(file);
      const totalChars = pages.join("").trim().length;

      if (totalChars === 0) {
        // A scan has no text layer to extract. Say so rather than handing back
        // an empty document that looks like a failed conversion.
        setWarning(
          "No text layer found. This PDF is almost certainly a scan — a photograph of a page rather than real text. Converting it needs OCR, which this tool does not perform."
        );
        setIsProcessing(false);
        return;
      }

      setStatus("Building Word document…");
      const children: Paragraph[] = [
        new Paragraph({
          text: file.name.replace(/\.pdf$/i, ""),
          heading: HeadingLevel.HEADING_1,
        }),
      ];

      pages.forEach((pageText, idx) => {
        if (idx > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `— Page ${idx + 1} —`,
                  italics: true,
                  color: "888888",
                }),
              ],
              spacing: { before: 240, after: 120 },
            })
          );
        }
        for (const line of pageText.split("\n")) {
          children.push(new Paragraph({ text: line }));
        }
      });

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      setResult({ blob, name: `${file.name.replace(/\.pdf$/i, "")}.docx` });
      setStatus(
        `Extracted ${totalChars.toLocaleString()} characters from ${pages.length} page${pages.length === 1 ? "" : "s"}.`
      );
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setWarning("Could not read this PDF. It may be password-protected or damaged.");
    } finally {
      setIsProcessing(false);
    }
  };

  /** Word → PDF via mammoth's text extraction, laid out with pdf-lib. */
  const handleWordToPdf = async (file: File) => {
    setIsProcessing(true);
    reset();
    try {
      setStatus("Reading document…");
      const buffer = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({ arrayBuffer: buffer });

      if (!text.trim()) {
        setWarning("No readable text found in this document.");
        setIsProcessing(false);
        return;
      }

      setStatus("Laying out PDF…");
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const lineHeight = fontSize * 1.45;
      const margin = 56;
      let page = pdfDoc.addPage();
      let { width, height } = page.getSize();
      let y = height - margin;
      const maxWidth = width - margin * 2;

      // Wrap on measured width; pdf-lib does no line breaking of its own.
      for (const rawLine of text.split(/\r?\n/)) {
        const words = rawLine.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
          y -= lineHeight;
          continue;
        }
        let line = "";
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && line) {
            if (y < margin) {
              page = pdfDoc.addPage();
              ({ width, height } = page.getSize());
              y = height - margin;
            }
            page.drawText(line, { x: margin, y, size: fontSize, font });
            y -= lineHeight;
            line = word;
          } else {
            line = candidate;
          }
        }
        if (line) {
          if (y < margin) {
            page = pdfDoc.addPage();
            ({ width, height } = page.getSize());
            y = height - margin;
          }
          page.drawText(line, { x: margin, y, size: fontSize, font });
          y -= lineHeight;
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResult({ blob, name: `${file.name.replace(/\.(docx?|DOCX?)$/, "")}.pdf` });
      setStatus(`Created a ${pdfDoc.getPageCount()}-page PDF.`);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setWarning("Could not read this document. Only .docx files are supported (not legacy .doc).");
    } finally {
      setIsProcessing(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (mode === "pdf2word") handlePdfToWord(f);
    else handleWordToPdf(f);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {([["pdf2word", "PDF → Word"], ["word2pdf", "Word → PDF"]] as const).map(
          ([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                reset();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                mode === id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {mode === "pdf2word"
            ? "Upload a PDF to convert to Word"
            : "Upload a .docx to convert to PDF"}
        </div>
        <p className="text-xs text-slate-500">
          Processed entirely in your browser — the file is never uploaded.
        </p>
        <input
          type="file"
          accept={mode === "pdf2word" ? "application/pdf,.pdf" : ".docx"}
          onChange={onFile}
          disabled={isProcessing}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
        />
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{status ?? "Working…"}</span>
        </div>
      )}

      {warning && !isProcessing && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            {warning}
          </p>
        </div>
      )}

      {result && !isProcessing && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{status}</span>
          </div>
          <button
            onClick={() => downloadBlob(result.blob, result.name)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Download {result.name}</span>
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Text transfers accurately. Complex layouts — multi-column pages,
            tables, and text wrapped around images — are approximate, because a
            PDF stores positioned glyphs rather than paragraphs.
          </p>
        </div>
      )}
    </div>
  );
}
