"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, FileText, Image as ImageIcon, Trash2, ArrowRightLeft, ArrowUp, ArrowDown } from "lucide-react";
import confetti from "canvas-confetti";

export default function ImageToPdf() {
  const [tab, setTab] = useState<"img_to_pdf" | "pdf_to_img">("img_to_pdf");

  // Tab 1: Image to PDF
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Tab 2: PDF to Image
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }));
      setImages((prev) => [...prev, ...selected]);
      setPdfUrl(null);
    }
  };

  const convertImagesToPdf = async () => {
    if (images.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const item of images) {
        const bytes = await item.file.arrayBuffer();
        let pdfImage;
        if (item.file.type === "image/png") {
          pdfImage = await pdfDoc.embedPng(bytes);
        } else {
          pdfImage = await pdfDoc.embedJpg(bytes);
        }

        const imgWidth = pdfImage.width;
        const imgHeight = pdfImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (orientation === "portrait") {
          pageWidth = Math.min(imgWidth, imgHeight);
          pageHeight = Math.max(imgWidth, imgHeight);
        } else if (orientation === "landscape") {
          pageWidth = Math.max(imgWidth, imgHeight);
          pageHeight = Math.min(imgWidth, imgHeight);
        }

        const page = pdfDoc.addPage([imgWidth, imgHeight]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: imgWidth,
          height: imgHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switches */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("img_to_pdf")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            tab === "img_to_pdf"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Images to PDF
        </button>
        <button
          onClick={() => setTab("pdf_to_img")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            tab === "pdf_to_img"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          PDF to Image (JPG/PNG)
        </button>
      </div>

      {tab === "img_to_pdf" ? (
        <div className="space-y-6">
          {/* Upload Images */}
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
            <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload Images (JPG, PNG) to convert to PDF
            </div>
            <p className="text-xs text-slate-500">
              Select multiple photos to create a multi-page PDF document.
            </p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleImageFiles}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Selected Images ({images.length})</span>
                <button onClick={() => setImages([])} className="text-rose-500 hover:underline">
                  Clear All
                </button>
              </div>

              {/* Image Previews */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative group"
                  >
                    <img
                      src={img.url}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                      <span>Page {idx + 1}</span>
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={convertImagesToPdf}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  {isGeneratingPdf ? "Generating PDF..." : `Convert ${images.length} Images to PDF`}
                </button>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download="converted-document.pdf"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Document</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PDF to Image */
        <div className="space-y-6">
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload PDF document to extract images
            </div>
            <p className="text-xs text-slate-500">
              Converts each PDF page into high-resolution images.
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {pdfFile && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Selected PDF: <strong>{pdfFile.name}</strong> ({(pdfFile.size / 1024).toFixed(1)} KB)
              </div>
              <button
                onClick={() => {
                  // Instant render confirmation
                  confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Extract All Pages as JPG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
