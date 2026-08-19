"use client";

import React, { useState, useCallback } from "react";
import {
  Download, RefreshCw, Copy, Check, Shuffle, AlertTriangle, Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadBlob } from "@/lib/utils/download";
import {
  SampleKind, SampleFile, generateImage, generatePdf, generateDocx,
  generateText, generateVideo, formatBytesShort,
} from "@/lib/samples/generate";

const SIZE_PRESETS = [
  { label: "10 KB", bytes: 10 * 1024 },
  { label: "50 KB", bytes: 50 * 1024 },
  { label: "100 KB", bytes: 100 * 1024 },
  { label: "500 KB", bytes: 500 * 1024 },
  { label: "1 MB", bytes: 1024 * 1024 },
  { label: "5 MB", bytes: 5 * 1024 * 1024 },
  { label: "10 MB", bytes: 10 * 1024 * 1024 },
];

const KINDS: { id: SampleKind; label: string }[] = [
  { id: "image", label: "Image" },
  { id: "pdf", label: "PDF" },
  { id: "docx", label: "Word" },
  { id: "csv", label: "CSV" },
  { id: "json", label: "JSON" },
  { id: "text", label: "Text" },
  { id: "video", label: "Video" },
];

const IMAGE_FORMATS = [
  { id: "image/jpeg" as const, label: "JPG" },
  { id: "image/png" as const, label: "PNG" },
  { id: "image/webp" as const, label: "WebP" },
];

const HOW_MANY = 4;

interface SampleFileGeneratorProps {
  /**
   * Restricts which file types this instance offers. The dedicated pages
   * (/tools/sample-image-generator and friends) pass a single kind so each has
   * a focused view; the general tool passes nothing and offers everything.
   */
  allowedKinds?: SampleKind[];
}

export default function SampleFileGenerator({
  allowedKinds,
}: SampleFileGeneratorProps = {}) {
  const kinds = allowedKinds
    ? KINDS.filter((k) => allowedKinds.includes(k.id))
    : KINDS;
  const [kind, setKind] = useState<SampleKind>(kinds[0]?.id ?? "image");
  const [bytes, setBytes] = useState(100 * 1024);
  const [customKb, setCustomKb] = useState("100");
  const [imageFormat, setImageFormat] =
    useState<(typeof IMAGE_FORMATS)[number]["id"]>("image/jpeg");
  const [videoSeconds, setVideoSeconds] = useState(3);
  const [items, setItems] = useState<(SampleFile & { url: string; id: string })[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    try {
      const made: SampleFile[] = [];
      if (kind === "video") {
        setStatus(`Recording ${videoSeconds}s of video…`);
        made.push(await generateVideo(videoSeconds));
      } else {
        for (let i = 0; i < HOW_MANY; i++) {
          setStatus(`Generating file ${i + 1} of ${HOW_MANY}…`);
          if (kind === "image") made.push(await generateImage(bytes, imageFormat));
          else if (kind === "pdf") made.push(await generatePdf(bytes));
          else if (kind === "docx") made.push(await generateDocx(bytes));
          else made.push(generateText(bytes, kind));
        }
      }
      // Randomised generation can yield identical filename+label pairs, so a
      // dedicated id is the only safe React key. Repeated filenames also get a
      // suffix, otherwise the browser saves them as "file (1).pdf".
      const seen = new Map<string, number>();
      setItems(
        made.map((m, index) => {
          const count = (seen.get(m.filename) ?? 0) + 1;
          seen.set(m.filename, count);
          const filename =
            count === 1
              ? m.filename
              : m.filename.replace(/(\.[^.]+)$/, `-${count}$1`);
          return {
            ...m,
            filename,
            id: `${Date.now()}-${index}`,
            url: URL.createObjectURL(m.blob),
          };
        })
      );
      setStatus(null);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setStatus("Generation failed. Try a smaller size or a different type.");
    } finally {
      setBusy(false);
    }
  }, [kind, bytes, imageFormat, videoSeconds, items]);

  const copyDataUrl = async (item: SampleFile & { url: string; id: string }) => {
    const reader = new FileReader();
    reader.onload = async () => {
      await navigator.clipboard.writeText(String(reader.result));
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    };
    reader.readAsDataURL(item.blob);
  };

  const applyCustom = (value: string) => {
    setCustomKb(value);
    const kb = parseFloat(value);
    if (!Number.isNaN(kb) && kb > 0) setBytes(Math.round(kb * 1024));
  };

  return (
    <div className="space-y-5">
      {kinds.length > 1 && (
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">File type</span>
        <div className="flex flex-wrap gap-2">
          {kinds.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                kind === k.id ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}>{k.label}</button>
          ))}
        </div>
      </div>
      )}

      {kind === "image" && (
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Image format</span>
          <div className="flex flex-wrap gap-2">
            {IMAGE_FORMATS.map((f) => (
              <button key={f.id} onClick={() => setImageFormat(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  imageFormat === f.id ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}>{f.label}</button>
            ))}
          </div>
        </div>
      )}

      {kind === "video" ? (
        <div className="space-y-1.5">
          <label htmlFor="vid-secs" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Length
          </label>
          <div className="flex items-center gap-3">
            <input id="vid-secs" type="range" min={1} max={10} value={videoSeconds}
              onChange={(e) => setVideoSeconds(parseInt(e.target.value, 10))}
              className="w-40 accent-blue-600 cursor-pointer" />
            <span className="text-xs font-bold text-blue-600 tabular-nums">{videoSeconds}s</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target size</span>
          <div className="flex flex-wrap gap-2">
            {SIZE_PRESETS.map((p) => (
              <button key={p.label} onClick={() => { setBytes(p.bytes); setCustomKb(String(Math.round(p.bytes / 1024))); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bytes === p.bytes ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}>{p.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <label htmlFor="custom-kb" className="text-xs text-slate-500">Custom</label>
            <input id="custom-kb" type="number" min={1} value={customKb}
              onChange={(e) => applyCustom(e.target.value)}
              className="w-24 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-900 dark:text-white" />
            <span className="text-xs text-slate-500">KB</span>
          </div>
        </div>
      )}

      <button onClick={generate} disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition">
        {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
        <span>{busy ? status ?? "Working…" : items.length ? "Generate new samples" : "Generate samples"}</span>
      </button>

      {status && !busy && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{status}</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-3">
          {items.map((item) => (
            <li key={item.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
              <div className="aspect-video bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                {item.kind === "image" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                ) : item.kind === "video" ? (
                  <video src={item.url} controls className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold uppercase text-slate-300 dark:text-slate-700">
                    {item.filename.split(".").pop()}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2 flex-1 flex flex-col">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatBytesShort(item.blob.size)} · {item.label}
                  </p>
                </div>
                <div className="flex gap-1.5 mt-auto">
                  <button onClick={() => downloadBlob(item.blob, item.filename)}
                    className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  {item.blob.size <= 200 * 1024 && (
                    <button onClick={() => copyDataUrl(item)}
                      title="Copy as a data: URL you can paste into HTML or CSS"
                      className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <button onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]); }}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition">
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
