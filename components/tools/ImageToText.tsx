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
  const previewRef = useRef<string | null>(null);

  // Object URLs leak until revoked, and this tool churns through images.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      void disposeOcr();
    };
  }, []);

  const onFile = useCallback((next: File | undefined) => {
    if (!next) return;
    setError(null);
    setOutput(null);

    if (!next.type.startsWith("image/")) {
      setError("That is not an image. Upload a PNG, JPG, WebP or BMP.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(
        `That image is ${(next.size / 1024 / 1024).toFixed(1)}MB. Keep it under ${MAX_BYTES / 1024 / 1024}MB — larger images slow recognition down without reading any better.`
      );
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(next);
    previewRef.current = url;
    setPreview(url);
    setFile(next);
  }, []);

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
        if (!r.text)
          setError(
            "No text was recognised. If the image is a photo taken at an angle, or the text is handwritten, try the AI option — it handles both far better."
          );
      }
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
    setTimeout(() => setCopied(false), 1800);
  };

  const save = () => {
    if (!output?.text) return;
    downloadBlob(
      new Blob([output.text], { type: "text/plain;charset=utf-8" }),
      `${(file?.name ?? "extracted").replace(/\.[^.]+$/, "")}.txt`,
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

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-950/40">
        <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {file ? file.name : "Upload an image to read its text"}
        </p>
        <p className="text-xs text-slate-500">
          PNG, JPG, WebP or BMP · up to {MAX_BYTES / 1024 / 1024}MB · screenshots, scans and photos
        </p>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          aria-label="Choose an image"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
        />
      </div>

      {/* Engine choice */}
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
        <button
          onClick={() => setEngine("local")}
          aria-pressed={engine === "local"}
          className={`rounded-2xl border p-4 text-left transition ${
            engine === "local"
              ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-600 dark:bg-emerald-950/30"
              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            On-device
            <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Private
            </span>
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Runs entirely in your browser. The image is never uploaded. Best for
            clear, printed, left-to-right text. Downloads about 9MB the first
            time, then works offline.
          </span>
        </button>

        <button
          onClick={() => setEngine("ai")}
          aria-pressed={engine === "ai"}
          className={`rounded-2xl border p-4 text-left transition ${
            engine === "ai"
              ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 dark:border-blue-600 dark:bg-blue-950/30"
              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            AI (Gemini)
            <span className="ml-auto flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              <Globe className="h-3 w-3" /> Uploads
            </span>
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Far better at handwriting, tables, and non-English scripts.{" "}
            <strong>The image is sent to Google to be processed</strong> — do not
            use it for anything confidential.
          </span>
        </button>
      </div>

      {engine === "ai" && (
        <p className="flex gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <Globe className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Unlike every other tool here, this option leaves your browser. Your
            image is uploaded to Google&rsquo;s Gemini API and processed on their
            servers. Pick <strong>On-device</strong> for IDs, bank statements or
            anything else you would rather not send anywhere.
          </span>
        </p>
      )}

      {/* Preview + action */}
      {preview && (
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-[240px_1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Image queued for text extraction" className="h-auto w-full object-contain" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={run}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? "Reading…" : "Extract text"}
              </button>
              <button
                onClick={reset}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            </div>

            {busy && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500">
                  {engine === "local"
                    ? progress?.status ?? "Preparing the recogniser…"
                    : "Sending to Gemini…"}
                  {pct != null ? ` — ${pct}%` : ""}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-[width]"
                    style={{ width: pct != null ? `${pct}%` : "35%" }}
                  />
                </div>
                {engine === "local" && (
                  <p className="text-[11px] text-slate-400">
                    The first run downloads the recognition model. Later runs are much quicker.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {/* Result */}
      {output && output.text && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Extracted text
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                {output.engine === "local"
                  ? `on-device · ${output.confidence}% confidence · ${output.elapsedMs}ms`
                  : "Gemini"}
              </span>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" /> .txt
              </button>
            </div>
          </div>

          <textarea
            value={output.text}
            onChange={(e) => setOutput({ ...output, text: e.target.value })}
            rows={14}
            spellCheck={false}
            aria-label="Extracted text, editable"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />

          {output.engine === "local" && (output.confidence ?? 100) < 70 && (
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              Confidence is low, so expect mistakes. A straighter, better-lit or
              higher-resolution image usually helps more than anything else — and
              for handwriting the AI option is a different class of accurate.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
