"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  PDFDocument, StandardFonts, rgb, degrees,
  PDFTextField, PDFCheckBox, PDFDropdown,
} from "pdf-lib";
import {
  Upload, Download, RotateCw, RotateCcw, Trash2, ArrowLeft, ArrowRight,
  RefreshCw, AlertTriangle, Undo, Type, Square, ImageIcon, MousePointer2,
  ChevronLeft, ChevronRight, FileText, ListChecks, Pencil, Eye, EyeOff,
} from "lucide-react";
import confetti from "canvas-confetti";
import { loadPdfJs, pdfDocumentOptions } from "@/lib/pdf/loader";
import { downloadBlob } from "@/lib/utils/download";

type Tool = "select" | "text" | "whiteout" | "image";
type Tab = "edit" | "pages" | "fields";

/** Positions are fractions of the page (0-1) so they survive any zoom level. */
interface Annot {
  id: string;
  page: number;
  type: "text" | "whiteout" | "image";
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  size?: number;
  color?: string;
  dataUrl?: string;
}

/**
 * A word or phrase pdf.js found already painted on the page, with its box
 * expressed in page fractions. Clicking one is what turns "add a floating
 * textbox" into "edit the text that is actually there".
 */
interface TextRun {
  id: string;
  page: number;
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
}

interface PageState {
  sourceIndex: number;
  rotation: number;
  thumbnail: string | null;
  width: number;
  height: number;
}

interface FormFieldState {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio";
  value: string;
  options?: string[];
}

const COLORS = ["#000000", "#ffffff", "#dc2626", "#2563eb", "#16a34a", "#ca8a04"];

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/**
 * PDF editor.
 *
 * WHAT THIS CAN AND CANNOT DO - worth understanding before extending it:
 *
 * A PDF stores positioned glyphs, not editable text runs, and fonts are usually
 * subset-embedded (only the characters actually used are present). So literally
 * rewriting an existing string in place is not achievable in a browser: it needs
 * font re-encoding and content-stream surgery.
 *
 * What this does instead is make that limitation invisible for the common case.
 * pdf.js reports the bounding box of every text run on the page, so clicking a
 * word can automatically (a) cover it with a rectangle painted in the sampled
 * background colour and (b) drop an editable text box in the same spot, at the
 * same size, in the sampled ink colour, pre-filled with the original string.
 * The user experience is click-and-retype; the mechanism underneath is
 * cover-and-redraw, which is also how desktop editors handle flattened text.
 *
 * The other genuine path is **form fields**: a real AcroForm field is structured
 * data and pdf-lib can read and write it properly. Most invoices and receipts
 * have none, which is why click-to-edit carries most of the weight.
 */
export default function PdfEditor() {
  const [tab, setTab] = useState<Tab>("edit");
  const [tool, setTool] = useState<Tool>("select");
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageState[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [annots, setAnnots] = useState<Annot[]>([]);
  const [runs, setRuns] = useState<TextRun[]>([]);
  const [usedRuns, setUsedRuns] = useState<Set<string>>(new Set());
  const [showRuns, setShowRuns] = useState(true);
  const [fields, setFields] = useState<FormFieldState[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ pages: PageState[]; annots: Annot[] }[]>([]);
  // Defaults for freshly placed text; per-item overrides live on the annotation.
  const fontSize = 14;
  const color = "#000000";
  const [stageW, setStageW] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sampleRef = useRef<CanvasRenderingContext2D | null>(null);
  const focusNext = useRef(false);

  const snapshot = useCallback(() => {
    setHistory((h) => [...h.slice(-24), { pages, annots }]);
  }, [pages, annots]);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setPages(prev.pages);
      setAnnots(prev.annots);
      return h.slice(0, -1);
    });
  };

  // The preview is a scaled bitmap, so on-screen type has to be sized from the
  // real stage width or it will not match what gets drawn into the PDF.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    setStageW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [pages.length, tab]);

  // Decode the current page bitmap once so colour sampling stays synchronous.
  useEffect(() => {
    const src = pages[pageIndex]?.thumbnail;
    if (!src) { sampleRef.current = null; return; }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      sampleRef.current = ctx;
    };
    img.src = src;
    return () => { alive = false; };
  }, [pages, pageIndex]);

  /** Modal colour just outside a box - i.e. what the text is sitting on. */
  const sampleBackground = (r: TextRun): string => {
    const ctx = sampleRef.current;
    if (!ctx) return "#ffffff";
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const x0 = r.x * W, y0 = r.y * H, w = r.w * W, h = r.h * H;
    const counts = new Map<string, number>();
    const probe = (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const d = ctx.getImageData(Math.floor(px), Math.floor(py), 1, 1).data;
      const key = toHex(d[0], d[1], d[2]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    };
    for (let i = 0; i <= 10; i++) {
      const px = x0 + (w * i) / 10;
      probe(px, y0 - Math.max(2, h * 0.35));
      probe(px, y0 + h + Math.max(2, h * 0.35));
    }
    for (let i = 0; i <= 4; i++) {
      const py = y0 + (h * i) / 4;
      probe(x0 - Math.max(3, w * 0.04), py);
      probe(x0 + w + Math.max(3, w * 0.04), py);
    }
    let best = "#ffffff", n = 0;
    for (const [k, v] of counts) if (v > n) { best = k; n = v; }
    return best;
  };

  /** Darkest pixel inside the box - a good stand-in for the ink colour. */
  const sampleInk = (r: TextRun): string => {
    const ctx = sampleRef.current;
    if (!ctx) return "#000000";
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const x = Math.max(0, Math.floor(r.x * W));
    const y = Math.max(0, Math.floor(r.y * H));
    const w = Math.min(W - x, Math.ceil(r.w * W));
    const h = Math.min(H - y, Math.ceil(r.h * H));
    if (w <= 0 || h <= 0) return "#000000";
    const d = ctx.getImageData(x, y, w, h).data;
    let bi = -1, bl = 1e9;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum < bl) { bl = lum; bi = i; }
    }
    return bi < 0 ? "#000000" : toHex(d[bi], d[bi + 1], d[bi + 2]);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setHistory([]);
    setAnnots([]);
    setRuns([]);
    setUsedRuns(new Set());
    setSelectedId(null);
    setStatus("Reading document…");
    try {
      const buf = await file.arrayBuffer();
      // pdf-lib and pdf.js both detach buffers they are given, so keep a clone.
      bytesRef.current = buf.slice(0);

      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument(pdfDocumentOptions(buf.slice(0)));
      const doc = await task.promise;

      const next: PageState[] = [];
      const foundRuns: TextRun[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`Reading page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvas, viewport: vp, background: "#ffffff" }).promise;

        const base = page.getViewport({ scale: 1 });

        // Locate every painted text run. getTextContent() gives a text matrix
        // per run; composing it with the viewport transform converts it to
        // top-left page coordinates, which is what the overlay needs.
        try {
          const content = await page.getTextContent();
          content.items.forEach((item, k) => {
            if (!("str" in item) || !item.str.trim()) return;
            const t = pdfjs.Util.transform(base.transform, item.transform);
            const size = Math.hypot(t[2], t[3]);
            if (size < 1) return;
            const width = item.width || item.str.length * size * 0.5;
            foundRuns.push({
              id: `${i - 1}-${k}`,
              page: i - 1,
              str: item.str,
              x: t[4] / base.width,
              y: (t[5] - size) / base.height,
              w: width / base.width,
              h: size / base.height,
              size,
            });
          });
        } catch {
          // A page with no text layer (a pure scan) simply yields no runs.
        }

        next.push({
          sourceIndex: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL("image/jpeg", 0.85),
          width: base.width,
          height: base.height,
        });
        page.cleanup();
      }
      await task.destroy();

      // Read any real form fields - the one path to genuine structured edits.
      const foundFields: FormFieldState[] = [];
      try {
        const lib = await PDFDocument.load(buf.slice(0));
        for (const f of lib.getForm().getFields()) {
          const name = f.getName();
          // instanceof, not constructor.name - the production build minifies
          // class names, so name-based checks match nothing once deployed.
          if (f instanceof PDFTextField) {
            foundFields.push({ name, type: "text", value: f.getText() ?? "" });
          } else if (f instanceof PDFCheckBox) {
            foundFields.push({ name, type: "checkbox", value: f.isChecked() ? "on" : "" });
          } else if (f instanceof PDFDropdown) {
            foundFields.push({
              name,
              type: "dropdown",
              value: f.getSelected()[0] ?? "",
              options: f.getOptions(),
            });
          }
        }
      } catch {
        // No AcroForm, or an unreadable one - editing still works.
      }

      setFileName(file.name);
      setPages(next);
      setRuns(foundRuns);
      setFields(foundFields);
      setPageIndex(0);
      setTab("edit");

      const parts = [`${next.length} page${next.length === 1 ? "" : "s"}`];
      if (foundRuns.length) parts.push(`${foundRuns.length} editable text items — click any of them on the page`);
      else parts.push("no selectable text (looks like a scan) — use Add text and Cover text");
      if (foundFields.length) parts.push(`${foundFields.length} form field${foundFields.length === 1 ? "" : "s"}`);
      setStatus(parts.join(" · ") + ".");
    } catch (e) {
      console.error(e);
      setError("Could not read that PDF. It may be password-protected or damaged.");
      setPages([]);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Click-to-edit. Covers the original run in its own background colour and
   * drops an editable copy on top, matched for position, size and ink.
   */
  const replaceRun = (r: TextRun) => {
    snapshot();
    const bg = sampleBackground(r);
    const ink = sampleInk(r);
    const page = pages[r.page];
    // A hair of bleed so antialiased glyph edges do not survive the cover.
    const padX = 1.2 / page.width;
    const padY = 1.6 / page.height;
    const coverId = crypto.randomUUID();
    const textId = crypto.randomUUID();

    setAnnots((a) => [
      ...a,
      {
        id: coverId, page: r.page, type: "whiteout", color: bg,
        x: Math.max(0, r.x - padX),
        y: Math.max(0, r.y - padY),
        w: r.w + padX * 2,
        h: r.h + padY * 2,
      },
      {
        id: textId, page: r.page, type: "text", text: r.str,
        x: r.x, y: r.y, size: Math.round(r.size * 10) / 10, color: ink,
      },
    ]);
    setUsedRuns((s) => new Set(s).add(r.id));
    setSelectedId(textId);
    focusNext.current = true;
  };

  // Put the caret in the text box the moment one is created, so typing works
  // without hunting for the side panel.
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    const el = textareaRef.current;
    if (el) { el.focus(); el.select(); }
  }, [selectedId]);

  const stageClick = (e: React.MouseEvent) => {
    if (tool === "select" || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    snapshot();

    if (tool === "text") {
      const id = crypto.randomUUID();
      setAnnots((a) => [...a, { id, page: pageIndex, type: "text", x, y, text: "New text", size: fontSize, color }]);
      setSelectedId(id);
      focusNext.current = true;
    } else if (tool === "whiteout") {
      const id = crypto.randomUUID();
      setAnnots((a) => [...a, { id, page: pageIndex, type: "whiteout", x, y, w: 0.25, h: 0.03, color: "#ffffff" }]);
      setSelectedId(id);
    }
    setTool("select");
  };

  const addImage = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(file);
    });
    snapshot();
    const id = crypto.randomUUID();
    setAnnots((a) => [...a, { id, page: pageIndex, type: "image", x: 0.1, y: 0.1, w: 0.3, h: 0.12, dataUrl }]);
    setSelectedId(id);
  };

  // Dragging works in page fractions, so it stays correct at any preview size.
  const onPointerDown = (e: React.PointerEvent, a: Annot) => {
    if (tool !== "select" || !stageRef.current) return;
    e.stopPropagation();
    const r = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      id: a.id,
      dx: (e.clientX - r.left) / r.width - a.x,
      dy: (e.clientY - r.top) / r.height - a.y,
    };
    setSelectedId(a.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width - d.dx));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height - d.dy));
    setAnnots((list) => list.map((a) => (a.id === d.id ? { ...a, x, y } : a)));
  };

  const endDrag = () => { dragRef.current = null; };

  const patch = (id: string, next: Partial<Annot>) =>
    setAnnots((list) => list.map((a) => (a.id === id ? { ...a, ...next } : a)));

  const removeAnnot = (id: string) => {
    snapshot();
    setAnnots((list) => list.filter((a) => a.id !== id));
    setSelectedId(null);
  };

  const movePage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pages.length) return;
    snapshot();
    const next = [...pages];
    [next[i], next[j]] = [next[j], next[i]];
    setPages(next);
  };

  const rotatePage = (i: number, delta: number) => {
    snapshot();
    setPages((p) => p.map((pg, idx) => (idx === i ? { ...pg, rotation: (pg.rotation + delta + 360) % 360 } : pg)));
  };

  const removePage = (i: number) => {
    snapshot();
    setPages((p) => p.filter((_, idx) => idx !== i));
    setAnnots((a) => a.filter((x) => x.page !== i).map((x) => (x.page > i ? { ...x, page: x.page - 1 } : x)));
    setPageIndex((p) => Math.max(0, Math.min(p, pages.length - 2)));
  };

  const save = async () => {
    if (!bytesRef.current || !pages.length) return;
    setBusy(true);
    setStatus("Building document…");
    try {
      const src = await PDFDocument.load(bytesRef.current.slice(0));

      // Write form values back into the real fields before flattening anything.
      if (fields.length) {
        try {
          const form = src.getForm();
          for (const f of fields) {
            if (f.type === "text") form.getTextField(f.name).setText(f.value);
            else if (f.type === "checkbox") {
              const cb = form.getCheckBox(f.name);
              if (f.value) cb.check(); else cb.uncheck();
            } else if (f.type === "dropdown" && f.value) {
              form.getDropdown(f.name).select(f.value);
            }
          }
        } catch (e) {
          console.warn("Some form fields could not be written:", e);
        }
      }

      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.Helvetica);
      const copied = await out.copyPages(src, pages.map((p) => p.sourceIndex));

      for (let i = 0; i < copied.length; i++) {
        const page = copied[i];
        const extra = pages[i].rotation;
        if (extra) page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        out.addPage(page);

        const { width, height } = page.getSize();
        // Covers are emitted first so a replacement never lands under its own
        // whiteout when the two were added in the same click.
        const mine = annots.filter((x) => x.page === i);
        const ordered = [
          ...mine.filter((a) => a.type === "whiteout"),
          ...mine.filter((a) => a.type !== "whiteout"),
        ];

        for (const a of ordered) {
          // Canvas coordinates run top-down; PDF's origin is bottom-left.
          const px = a.x * width;
          const py = height - a.y * height;

          if (a.type === "whiteout") {
            page.drawRectangle({
              x: px,
              y: py - (a.h ?? 0.03) * height,
              width: (a.w ?? 0.25) * width,
              height: (a.h ?? 0.03) * height,
              color: hexToRgb(a.color || "#ffffff"),
            });
          } else if (a.type === "text" && a.text) {
            const size = a.size ?? 14;
            a.text.split("\n").forEach((line, n) => {
              page.drawText(line, {
                x: px,
                y: py - size - n * size * 1.2,
                size,
                font,
                color: hexToRgb(a.color || "#000000"),
              });
            });
          } else if (a.type === "image" && a.dataUrl) {
            const img = a.dataUrl.startsWith("data:image/png")
              ? await out.embedPng(a.dataUrl)
              : await out.embedJpg(a.dataUrl);
            page.drawImage(img, {
              x: px,
              y: py - (a.h ?? 0.12) * height,
              width: (a.w ?? 0.3) * width,
              height: (a.h ?? 0.12) * height,
            });
          }
        }
      }

      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${fileName.replace(/\.pdf$/i, "") || "document"}-edited.pdf`
      );
      setStatus("Saved.");
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
      setError("Could not build the edited PDF.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => { bytesRef.current = null; }, []);

  const current = pages[pageIndex];
  const selected = annots.find((a) => a.id === selectedId) ?? null;
  const pageAnnots = annots.filter((a) => a.page === pageIndex);
  const pageRuns = runs.filter((r) => r.page === pageIndex && !usedRuns.has(r.id));
  // Points -> CSS pixels for the current preview size, so what you see on the
  // page is the size that gets written into the file.
  const scale = current && stageW ? stageW / current.width : 1;

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center transition hover:bg-blue-50/30">
        <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload a PDF to edit
        </p>
        <p className="text-xs text-slate-500">
          Click any text on the page to retype it. Add text or images, cover mistakes, reorder pages. Nothing is uploaded.
        </p>
        <input type="file" accept="application/pdf,.pdf" disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])} aria-label="Choose a PDF"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait" />
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> {status ?? "Working…"}
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap gap-1.5">
              {([["edit", "Edit text", Pencil], ["fields", `Form fields${fields.length ? ` (${fields.length})` : ""}`, ListChecks], ["pages", "Pages", FileText]] as const).map(
                ([id, label, Icon]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      tab === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={undo} disabled={!history.length}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200">
                <Undo className="h-4 w-4" /> Undo
              </button>
              <button onClick={save}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                <Download className="h-4 w-4" /> Save PDF
              </button>
            </div>
          </div>

          {status && !busy && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{status}</p>
          )}

          {tab === "fields" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {fields.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This PDF has no interactive form fields — most invoices, receipts and
                  exported documents have none, because their text is painted straight
                  onto the page. Use <strong>Edit text</strong> instead: every word there
                  is clickable and can be retyped.
                </p>
              ) : (
                <>
                  <p className="mb-3 text-xs text-slate-500">
                    These are real form fields — editing them changes the document&rsquo;s
                    actual data, not an overlay.
                  </p>
                  <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                    {fields.map((f, i) => (
                      <label key={f.name} className="space-y-1">
                        <span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{f.name}</span>
                        {f.type === "dropdown" ? (
                          <select value={f.value}
                            onChange={(e) => setFields((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                            {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : f.type === "checkbox" ? (
                          <input type="checkbox" checked={!!f.value}
                            onChange={(e) => setFields((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.checked ? "on" : "" } : x)))}
                            className="h-5 w-5 cursor-pointer accent-blue-600" />
                        ) : (
                          <input type="text" value={f.value}
                            onChange={(e) => setFields((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                        )}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "edit" && current && (
            <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                  {([["select", "Click to edit", MousePointer2], ["text", "Add text", Type], ["whiteout", "Cover area", Square]] as const).map(
                    ([id, label, Icon]) => (
                      <button key={id} onClick={() => setTool(id)} title={label}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          tool === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}>
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </button>
                    )
                  )}
                  <label className="relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                    <ImageIcon className="h-3.5 w-3.5" /> Image
                    <input type="file" accept="image/png,image/jpeg"
                      onChange={(e) => addImage(e.target.files?.[0])}
                      className="absolute inset-0 cursor-pointer opacity-0" aria-label="Add an image" />
                  </label>

                  {pageRuns.length > 0 && (
                    <button onClick={() => setShowRuns((s) => !s)}
                      title={showRuns ? "Hide the editable-text highlights" : "Show the editable-text highlights"}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                      {showRuns ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Highlights
                    </button>
                  )}

                  <span className="ml-auto flex items-center gap-1.5">
                    <button onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0}
                      aria-label="Previous page" className="rounded p-1 disabled:opacity-30">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs tabular-nums text-slate-500">{pageIndex + 1} / {pages.length}</span>
                    <button onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))} disabled={pageIndex === pages.length - 1}
                      aria-label="Next page" className="rounded p-1 disabled:opacity-30">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </span>
                </div>

                {tool === "select" && pageRuns.length > 0 && (
                  <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    Click any highlighted word on the page to retype it — the original is
                    covered in its own background colour and replaced with editable text.
                  </p>
                )}
                {tool === "select" && pageRuns.length === 0 && runs.length === 0 && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    No selectable text on this page — it is a scanned image. Use{" "}
                    <strong>Cover area</strong> then <strong>Add text</strong>.
                  </p>
                )}

                <div
                  ref={stageRef}
                  onClick={stageClick}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  className={`relative mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 ${
                    tool === "select" ? "" : "cursor-crosshair"
                  }`}
                >
                  {current.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={current.thumbnail} alt={`Page ${pageIndex + 1}`}
                      style={{ transform: `rotate(${current.rotation}deg)` }}
                      className="block w-full select-none" draggable={false} />
                  )}

                  {/* Hit targets over the text pdf.js found. Hidden while a
                      placement tool is active so clicks reach the page. */}
                  {tool === "select" && showRuns && pageRuns.map((r) => (
                    <button
                      key={r.id}
                      title={`Edit: ${r.str}`}
                      onClick={(e) => { e.stopPropagation(); replaceRun(r); }}
                      style={{
                        left: `${r.x * 100}%`,
                        top: `${r.y * 100}%`,
                        width: `${r.w * 100}%`,
                        height: `${r.h * 100}%`,
                      }}
                      className="absolute cursor-text rounded-[2px] bg-blue-500/10 ring-1 ring-inset ring-blue-500/25 transition hover:bg-blue-500/30 hover:ring-blue-500"
                    />
                  ))}

                  {pageAnnots.map((a) => (
                    <div
                      key={a.id}
                      onPointerDown={(e) => onPointerDown(e, a)}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}
                      style={{
                        left: `${a.x * 100}%`,
                        top: `${a.y * 100}%`,
                        width: a.type === "text" ? undefined : `${(a.w ?? 0.25) * 100}%`,
                        height: a.type === "text" ? undefined : `${(a.h ?? 0.03) * 100}%`,
                        background: a.type === "whiteout" ? a.color : undefined,
                        color: a.type === "text" ? a.color : undefined,
                        fontSize: a.type === "text" ? `${(a.size ?? 14) * scale}px` : undefined,
                        lineHeight: a.type === "text" ? 1.2 : undefined,
                        fontFamily: a.type === "text" ? "Helvetica, Arial, sans-serif" : undefined,
                      }}
                      className={`absolute cursor-move whitespace-pre ${
                        selectedId === a.id ? "outline-2 outline-dashed outline-blue-500" : ""
                      }`}
                    >
                      {a.type === "text" && (a.text || " ")}
                      {a.type === "image" && a.dataUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={a.dataUrl} alt="" className="h-full w-full object-contain" draggable={false} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {selected ? "Selected item" : "Nothing selected"}
                </h3>

                {!selected && (
                  <p className="text-xs leading-relaxed text-slate-500">
                    Click a highlighted word on the page to retype it. Or pick{" "}
                    <strong>Add text</strong> / <strong>Cover area</strong> and click
                    anywhere to place something new.
                  </p>
                )}

                {selected?.type === "text" && (
                  <>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Text</span>
                      <textarea ref={textareaRef} value={selected.text ?? ""} rows={3}
                        onChange={(e) => patch(selected.id, { text: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Size {selected.size}px
                      </span>
                      <input type="range" min={4} max={48} step={0.5} value={selected.size ?? 14}
                        onChange={(e) => patch(selected.id, { size: parseFloat(e.target.value) })}
                        className="w-full cursor-pointer accent-blue-600" />
                    </label>
                  </>
                )}

                {(selected?.type === "whiteout" || selected?.type === "image") && (
                  <>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Width</span>
                      <input type="range" min={0.5} max={100} step={0.5} value={(selected.w ?? 0.25) * 100}
                        onChange={(e) => patch(selected.id, { w: parseFloat(e.target.value) / 100 })}
                        className="w-full cursor-pointer accent-blue-600" />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Height</span>
                      <input type="range" min={0.3} max={100} step={0.1} value={(selected.h ?? 0.03) * 100}
                        onChange={(e) => patch(selected.id, { h: parseFloat(e.target.value) / 100 })}
                        className="w-full cursor-pointer accent-blue-600" />
                    </label>
                  </>
                )}

                {selected && selected.type !== "image" && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Colour</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COLORS.map((c) => (
                        <button key={c} onClick={() => patch(selected.id, { color: c })}
                          aria-label={`Colour ${c}`}
                          style={{ background: c }}
                          className={`h-6 w-6 rounded-md border ${selected.color === c ? "ring-2 ring-blue-500" : "border-slate-300"}`} />
                      ))}
                      <input type="color" value={selected.color ?? "#000000"}
                        onChange={(e) => patch(selected.id, { color: e.target.value })}
                        aria-label="Pick an exact colour"
                        className="h-6 w-8 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0" />
                    </div>
                  </div>
                )}

                {selected && (
                  <button onClick={() => removeAnnot(selected.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30">
                    <Trash2 className="h-3.5 w-3.5" /> Delete item
                  </button>
                )}

                {selected?.type === "whiteout" && (
                  <p className="rounded-lg bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    <strong>Covering is not redaction.</strong> The original text stays in
                    the file underneath and can still be found by copy-paste or a search
                    tool. Do not rely on this to hide account numbers or ID numbers.
                  </p>
                )}

                <p className="border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-400 dark:border-slate-800">
                  Replacement text is drawn in Helvetica, so it will not match a
                  decorative original exactly. Non-Latin scripts such as Hindi or
                  Arabic cannot be drawn — use a form field, or an image of the text.
                  Replaced text remains in the file underneath the cover.
                </p>
              </div>
            </div>
          )}

          {tab === "pages" && (
            <ul className="grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-5">
              {pages.map((p, i) => (
                <li key={`${p.sourceIndex}-${i}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative grid aspect-[3/4] place-items-center overflow-hidden bg-slate-100 dark:bg-slate-950">
                    {p.thumbnail && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.thumbnail} alt={`Page ${i + 1}`}
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                        className="max-h-full max-w-full transition-transform" />
                    )}
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{i + 1}</span>
                  </div>
                  <div className="flex items-center justify-center gap-0.5 p-1.5">
                    <button onClick={() => movePage(i, -1)} disabled={i === 0} aria-label={`Move page ${i + 1} left`}
                      className="rounded p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30"><ArrowLeft className="h-3.5 w-3.5" /></button>
                    <button onClick={() => rotatePage(i, -90)} aria-label={`Rotate page ${i + 1} left`}
                      className="rounded p-1.5 text-slate-500 hover:text-blue-600"><RotateCcw className="h-3.5 w-3.5" /></button>
                    <button onClick={() => rotatePage(i, 90)} aria-label={`Rotate page ${i + 1} right`}
                      className="rounded p-1.5 text-slate-500 hover:text-blue-600"><RotateCw className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removePage(i)} aria-label={`Delete page ${i + 1}`}
                      className="rounded p-1.5 text-slate-500 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => movePage(i, 1)} disabled={i === pages.length - 1} aria-label={`Move page ${i + 1} right`}
                      className="rounded p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30"><ArrowRight className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
