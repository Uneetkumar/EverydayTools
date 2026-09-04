"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Sparkles,
  ShieldCheck,
  Globe,
  Trash2,
  CheckCircle2,
  FileText,
  ImageIcon,
} from "lucide-react";
import { recognizeLocally, disposeOcr, type OcrProgress } from "@/lib/ocr/engine";
import { recognizeWithGemini, describeGeminiError } from "@/lib/ocr/gemini";
import { downloadBlob } from "@/lib/utils/download";

type Engine = "local" | "ai";

interface Output {
  text: string;
  engine: Engine;
  confidence?: number;
  elapsedMs?: number;
}

const MAX_BYTES = 12 * 1024 * 1024;

export default function ImageToText() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [engine, setEngine] = useState<Engine>("local");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const previewRef = useRef<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Object URLs leak until revoked
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      void disposeOcr();
    };
  }, []);


  const onFile = useCallback((next: File | undefined | null) => {
    if (!next) return;
    setError(null);
    setOutput(null);

    if (!next.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP, BMP).");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(
        `Image size is ${(next.size / 1024 / 1024).toFixed(1)}MB. Maximum recommended size is ${
          MAX_BYTES / 1024 / 1024
        }MB.`
      );
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(next);
    previewRef.current = url;
    setPreview(url);
    setFile(next);
  }, []);

  // Global Clipboard paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            onFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // onFile is a stable useCallback; listing it keeps the dependency
    // honest without re-subscribing on every render.
  }, [onFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setOutput(null);
    setProgress(null);

    try {
      if (engine === "ai") {
        const r = await recognizeWithGemini(file);
        setOutput({ text: r.text, engine: "ai" });
        if (!r.text) setError("The AI could not find any legible text in that image.");
      } else {
        const r = await recognizeLocally(file, setProgress);
        setOutput({
          text: r.text,
          engine: "local",
          confidence: r.confidence,
          elapsedMs: r.elapsedMs,
        });
        if (!r.text) {
          setError(
            "No text was recognized with on-device OCR. If the image is handwritten or low contrast, try the Gemini AI mode."
          );
        }
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch (e) {
      setError(
        engine === "ai"
          ? describeGeminiError(e)
          : `On-device recognition failed: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const copy = async () => {
    if (!output?.text) return;
    await navigator.clipboard.writeText(output.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = () => {
    if (!output?.text) return;
    downloadBlob(
      new Blob([output.text], { type: "text/plain;charset=utf-8" }),
      `${(file?.name ?? "extracted-text").replace(/\.[^.]+$/, "")}.txt`,
      "image-to-text"
    );
  };

  const reset = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    setFile(null);
    setOutput(null);
    setError(null);
  };

  const pct =
    progress?.progress != null ? Math.round(progress.progress * 100) : null;

  const wordCount = output?.text ? output.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = output?.text ? output.text.length : 0;

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            dragActive
              ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[0.99]"
              : "border-slate-300 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs mb-3">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Upload an image to extract text
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Drag & drop, browse files, or press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
              Ctrl+V
            </kbd>{" "}
            /{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
              ⌘V
            </kbd>{" "}
            to paste screenshots directly.
          </p>

          <div className="mt-5">
            <span className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition">
              Select Image File
            </span>
          </div>

          <input
            type="file"
            accept="image/*"
            disabled={busy}
            aria-label="Choose an image file"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
          />
        </div>
      ) : (
        /* Image Loaded View */
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Preview Card */}
            <div className="w-full lg:w-72 shrink-0 space-y-2">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[200px] max-h-[260px] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview!}
                  alt="Source for OCR"
                  className="w-full h-full object-contain max-h-[240px] rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
                <span className="font-medium truncate max-w-[180px]">
                  {file.name}
                </span>
                <span className="text-[11px] font-mono">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex-1 space-y-5 w-full">
              {/* Minimalist Segmented Engine Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Engine
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {engine === "local" ? "Runs locally in browser" : "Google Gemini Cloud AI"}
                  </span>
                </div>

                <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEngine("local")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      engine === "local"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Cpu className={`w-3.5 h-3.5 ${engine === "local" ? "text-emerald-500" : "text-slate-400"}`} />
                    <span>On-Device</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Private
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngine("ai")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      engine === "ai"
                        ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${engine === "ai" ? "text-purple-500" : "text-slate-400"}`} />
                    <span>Gemini AI</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      Smart
                    </span>
                  </button>
                </div>

                {/* Subtitle Information */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
                  {engine === "local" ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Zero server upload. Image remains 100% in local memory.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      Enhanced transcription for handwritten notes, receipts & tables.
                    </span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={run}
                  disabled={busy}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                >
                  {busy ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Text...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Change Image</span>
                </button>
              </div>

              {/* Progress Bar */}
              {busy && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>
                      {engine === "local"
                        ? progress?.status ?? "Initializing local recognizer..."
                        : "Processing with Gemini AI..."}
                    </span>
                    {pct != null && <span>{pct}%</span>}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: pct != null ? `${pct}%` : "45%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="text-xs leading-relaxed">{error}</div>
        </div>
      )}

      {/* Extracted Output Panel */}
      {output && (
        <div
          ref={resultRef}
          className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          {/* Top Result Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  Extracted Text
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {wordCount} words, {charCount} chars
                </span>
                {output.confidence != null && (
                  <>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {output.confidence}% confidence
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copy}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  copied
                    ? "bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>

              <button
                type="button"
                onClick={save}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                title="Download as .txt file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.txt</span>
              </button>
            </div>
          </div>

          {/* Editable Text Area */}
          <div className="p-4 sm:p-5">
            <textarea
              value={output.text}
              onChange={(e) => setOutput({ ...output, text: e.target.value })}
              rows={12}
              spellCheck={false}
              aria-label="Extracted editable text"
              className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 font-mono text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Extracted text will appear here..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
