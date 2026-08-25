"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
} from "pdf-lib";
import {
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Undo2,
  Redo2,
  Type,
  Square,
  ImageIcon,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Pencil,
  Eye,
  EyeOff,
  Highlighter,
  PenTool,
  Check,
  Copy,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Layers,
  X,
  Bold,
  Italic,
  FileUp,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  UserCheck,
  Globe,
  Sparkles,
  Shapes,
} from "lucide-react";
import confetti from "canvas-confetti";
import { loadPdfJs, pdfDocumentOptions } from "@/lib/pdf/loader";
import { downloadBlob } from "@/lib/utils/download";

export type EditorTool =
  | "select"
  | "text"
  | "whiteout"
  | "highlight"
  | "draw"
  | "signature"
  | "image";

export type EditorTab = "edit" | "annotate" | "forms" | "organize" | "batch";

export type FontCategory = "sans-serif" | "serif" | "monospace";

export interface Annot {
  id: string;
  page: number;
  type: "text" | "whiteout" | "highlight" | "image" | "draw" | "signature" | "formfield";
  x: number; // fraction of page width (0 to 1)
  y: number; // fraction of page height (0 to 1)
  w?: number; // fraction
  h?: number; // fraction
  text?: string;
  size?: number; // pt size
  color?: string; // hex
  fontCategory?: FontCategory;
  isBold?: boolean;
  isItalic?: boolean;
  dataUrl?: string; // for image/signature
  opacity?: number;
  points?: { x: number; y: number }[]; // for freehand draw (fractions)
  lineWidth?: number;
  fieldName?: string;
  fieldType?: "text" | "checkbox" | "dropdown";
  fieldValue?: string;
  fieldOptions?: string[];
  /** Colour sampled from the page, used to hide whatever sits under a field. */
  bgColor?: string;
  /** True for fields that already existed in the uploaded PDF. Those must not
   *  be recreated on export — the document already owns their widgets. */
  isSourceField?: boolean;
}

export interface TextRun {
  id: string;
  page: number;
  str: string;
  x: number; // fraction
  y: number; // fraction
  w: number; // fraction
  h: number; // fraction
  size: number; // pt
  fontCategory: FontCategory;
  isBold: boolean;
  isItalic: boolean;
}

export interface PageState {
  sourceIndex: number;
  rotation: number;
  thumbnail: string | null;
  width: number;
  height: number;
}

export interface FormFieldState {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio";
  value: string;
  options?: string[];
}

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#475569",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", // Yellow
  "#bbf7d0", // Green
  "#bae6fd", // Blue
  "#fbcfe8", // Pink
  "#fed7aa", // Orange
];

/**
 * PDF field names use "." to express hierarchy, and pdf-lib rejects duplicates
 * outright, so a raw user string cannot be trusted as a field name.
 */
const sanitizeFieldName = (raw: string) =>
  (raw || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 48) || "field";

const uniqueFieldName = (raw: string, taken: Set<string>) => {
  const base = sanitizeFieldName(raw);
  let name = base;
  let n = 2;
  while (taken.has(name)) name = `${base}_${n++}`;
  taken.add(name);
  return name;
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/** Detect font properties from pdf.js metadata */
function detectFontProperties(
  fontName: string,
  styleObj?: { fontFamily?: string }
): {
  fontCategory: FontCategory;
  isBold: boolean;
  isItalic: boolean;
} {
  const cleanName = (fontName || "").replace(/^[A-Z]{6}\+/i, "");
  const cleanFamily = (styleObj?.fontFamily || "").replace(/^[A-Z]{6}\+/i, "");
  const combined = `${cleanName} ${cleanFamily}`.toLowerCase();

  const isBold =
    /\b(bold|black|heavy|semibold|semi-bold|demibold|demi|medium|w[6-9]|700|800|900)\b/i.test(combined) ||
    /[-_,](bd|bold|black|heavy|b|semibold|sb)\b/i.test(combined) ||
    /boldmt|boldps/i.test(combined);

  const isItalic =
    /\b(italic|oblique|slanted|kursiv)\b/i.test(combined) ||
    /[-_,](it|italic|oblique|i)\b/i.test(combined) ||
    /italicmt|obliquemt/i.test(combined);

  let fontCategory: FontCategory = "sans-serif";
  if (
    /\b(times|serif|georgia|garamond|roman|cambria|minion|baskerville|palatino|century|bookman|charter)\b/i.test(combined) ||
    /[-_,](roman|serif)\b/i.test(combined) ||
    /timesnewroman/i.test(combined)
  ) {
    fontCategory = "serif";
  } else if (
    /\b(courier|mono|consolas|code|typewriter|menlo|monaco|inconsolata|sourcecode)\b/i.test(combined) ||
    /[-_,](mono|typewriter)\b/i.test(combined)
  ) {
    fontCategory = "monospace";
  }

  return { fontCategory, isBold, isItalic };
}

export default function PdfEditor() {
  const [tab, setTab] = useState<EditorTab>("edit");
  const [tool, setTool] = useState<EditorTool>("select");
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageState[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [annots, setAnnots] = useState<Annot[]>([]);
  const [runs, setRuns] = useState<TextRun[]>([]);
  const [usedRuns, setUsedRuns] = useState<Set<string>>(new Set());
  const [showRuns, setShowRuns] = useState(true);
  const [fields, setFields] = useState<FormFieldState[]>([]);
  // Names of the document's own fields the user deleted. Dropping them from
  // `fields` only stops us writing a value — the widget itself still lives in
  // the file, so export has to remove them explicitly.
  const [removedFields, setRemovedFields] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<{ pages: PageState[]; annots: Annot[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ pages: PageState[]; annots: Annot[] }[]>([]);

  // Editor styling settings for new items
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(14);
  const [fontCategory, setFontCategory] = useState<FontCategory>("sans-serif");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(3);

  // Canvas zoom & dimensions
  const [zoom, setZoom] = useState(1);
  const [stageW, setStageW] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Signature Modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [typedSigText, setTypedSigText] = useState("");
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isSigDrawing = useRef(false);

  // Interactive Form Field Modal state
  const [showFormFieldModal, setShowFormFieldModal] = useState(false);
  const [formFieldName, setFormFieldName] = useState("");
  const [formFieldType, setFormFieldType] = useState<"text" | "checkbox" | "dropdown">("text");
  const [formFieldVal, setFormFieldVal] = useState("");
  const [formFieldOpts, setFormFieldOpts] = useState("Option 1, Option 2, Option 3");
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Drawing state
  const isDrawing = useRef(false);
  const currentDrawPoints = useRef<{ x: number; y: number }[]>([]);

  const bytesRef = useRef<ArrayBuffer | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number; startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number; aspect: number } | null>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement | null>(null);
  const sampleRef = useRef<CanvasRenderingContext2D | null>(null);

  // Push to undo stack
  const snapshot = useCallback(() => {
    setHistory((h) => [...h.slice(-30), { pages, annots }]);
    setRedoStack([]);
  }, [pages, annots]);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, { pages, annots }]);
    setPages(prev.pages);
    setAnnots(prev.annots);
    setHistory((h) => h.slice(0, -1));
    setSelectedId(null);
    setEditingId(null);
  }, [history, pages, annots]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, { pages, annots }]);
    setPages(next.pages);
    setAnnots(next.annots);
    setRedoStack((r) => r.slice(0, -1));
  }, [redoStack, pages, annots]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") {
          setEditingId(null);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        redo();
        e.preventDefault();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !editingId) {
          snapshot();
          setAnnots((list) => list.filter((a) => a.id !== selectedId));
          setSelectedId(null);
          e.preventDefault();
        }
      } else if (e.key === "Escape") {
        if (selectedId || editingId) {
          setSelectedId(null);
          setEditingId(null);
        } else {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, editingId, undo, redo, snapshot]);

  // ResizeObserver for preview container
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    setStageW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [pages.length, tab, zoom]);

  // Decode the current page bitmap for synchronous colour sampling
  useEffect(() => {
    const src = pages[pageIndex]?.thumbnail;
    if (!src) {
      sampleRef.current = null;
      return;
    }
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
    return () => {
      alive = false;
    };
  }, [pages, pageIndex]);

  // Focus inline editor when editingId changes
  useEffect(() => {
    if (editingId && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingId]);

function getLuminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  if (isNaN(n)) return 1;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Guarantees ink stays readable against the background it is painted on.
 *
 * The editor keeps ONE `textColor` for every item type, and the palette offers
 * white (needed for covers over dark artwork). Pick white anywhere, then add a
 * form field, and the field inherits white ink on its own white widget
 * background: the value is still visible in the side panel — which paints with
 * theme colours, not the annotation's — but the page and the exported PDF both
 * render an empty box. Canvas and export must apply this identically or the
 * preview stops matching the file.
 */
function legibleInk(ink?: string, bg?: string): string {
  const fg = ink || "#0f172a";
  const back = bg || "#ffffff";
  if (Math.abs(getLuminance(fg) - getLuminance(back)) >= 0.35) return fg;
  return getLuminance(back) >= 0.5 ? "#0f172a" : "#ffffff";
}

  /** Sample background colour of the text */
  /**
   * Colour a field widget must be painted so it disappears into the page.
   *
   * `sampleBackground` probes *around* a box — correct when covering a text run,
   * wrong for a widget, which has to match what sits directly beneath it. A
   * field dropped on a tinted table row would sample the white margin next to
   * the row and export as a white patch on colour. Taking the modal colour
   * inside the rect gets the fill instead: glyphs are a minority of the pixels,
   * so the mode is the paper or band underneath.
   */
  /**
   * Finds an empty band on the page to drop a new field into.
   *
   * The old fixed 20%/25% landed on body text on most real documents, so a
   * fresh field appeared straddling a line of the invoice. Scans rows of the
   * rendered page for a run tall enough to hold the field with nothing printed
   * in it, preferring the first one below the top margin. Falls back to the old
   * constant when the page is too dense to find a gap.
   */
  const findBlankSpot = (w: number, h: number): { x: number; y: number } => {
    const fallback = { x: 0.2, y: 0.25 };
    const ctx = sampleRef.current;
    if (!ctx) return fallback;
    const W = ctx.canvas.width,
      H = ctx.canvas.height;
    const x0 = Math.floor(0.08 * W);
    const x1 = Math.min(W, Math.ceil((0.08 + w + 0.04) * W));
    if (x1 <= x0) return fallback;

    // One pass: mark each row as inked if any pixel in the band is clearly
    // darker than the page. Sampling every 3rd pixel is ample for glyphs.
    const inked: boolean[] = new Array(H).fill(false);
    for (let y = 0; y < H; y++) {
      const row = ctx.getImageData(x0, y, x1 - x0, 1).data;
      for (let i = 0; i < row.length; i += 12) {
        const lum = (0.299 * row[i] + 0.587 * row[i + 1] + 0.114 * row[i + 2]) / 255;
        if (lum < 0.75) { inked[y] = true; break; }
      }
    }

    const need = Math.ceil(h * H) + Math.ceil(0.006 * H); // field plus breathing room
    let run = 0;
    for (let y = Math.floor(0.06 * H); y < Math.floor(0.94 * H); y++) {
      run = inked[y] ? 0 : run + 1;
      if (run >= need) {
        const top = y - run + 1 + Math.floor((run - need) / 2);
        return { x: 0.08, y: top / H };
      }
    }
    return fallback;
  };

  const sampleFillUnder = (r: { x: number; y: number; w: number; h: number }): string => {
    const ctx = sampleRef.current;
    if (!ctx) return "#ffffff";
    const W = ctx.canvas.width,
      H = ctx.canvas.height;
    const x = Math.max(0, Math.floor(r.x * W));
    const y = Math.max(0, Math.floor(r.y * H));
    const w = Math.min(W - x, Math.max(1, Math.ceil(r.w * W)));
    const h = Math.min(H - y, Math.max(1, Math.ceil(r.h * H)));
    if (w <= 0 || h <= 0) return "#ffffff";
    const d = ctx.getImageData(x, y, w, h).data;

    // Bucket at 5 bits per channel. Coarser (3 bits) puts white paper and a
    // pale tint in the same bucket, which is exactly the confusion this needs
    // to avoid; finer defeats the grouping because the preview is a JPEG and
    // a flat fill arrives as dozens of near-identical values.
    const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < d.length; i += 4) {
      const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      const e = counts.get(key);
      if (e) { e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]; }
      else counts.set(key, { n: 1, r: d[i], g: d[i + 1], b: d[i + 2] });
    }

    let best: { n: number; r: number; g: number; b: number } | null = null;
    for (const e of counts.values()) if (!best || e.n > best.n) best = e;
    if (!best) return "#ffffff";
    // Average the real pixels in the winning bucket rather than reconstructing
    // from the bucket index — a midpoint would render white paper as #f0f0f0.
    return toHex(
      Math.round(best.r / best.n),
      Math.round(best.g / best.n),
      Math.round(best.b / best.n)
    );
  };

  const sampleBackground = (r: { x: number; y: number; w: number; h: number }): string => {
    const ctx = sampleRef.current;
    if (!ctx) return "#ffffff";
    const W = ctx.canvas.width,
      H = ctx.canvas.height;
    const x0 = r.x * W,
      y0 = r.y * H,
      w = r.w * W,
      h = r.h * H;
    const counts = new Map<string, number>();
    const probe = (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const d = ctx.getImageData(Math.floor(px), Math.floor(py), 1, 1).data;
      if (d[3] < 128) return; // Skip transparent
      const key = toHex(d[0], d[1], d[2]);
      // Only count light colors for background
      if (getLuminance(key) > 0.4) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    };
    for (let i = 0; i <= 10; i++) {
      const px = x0 + (w * i) / 10;
      probe(px, y0 - Math.max(3, h * 0.4));
      probe(px, y0 + h + Math.max(3, h * 0.4));
    }
    for (let i = 0; i <= 4; i++) {
      const py = y0 + (h * i) / 4;
      probe(x0 - Math.max(4, w * 0.05), py);
      probe(x0 + w + Math.max(4, w * 0.05), py);
    }
    let best = "#ffffff",
      n = 0;
    for (const [k, v] of counts) {
      if (v > n) {
        best = k;
        n = v;
      }
    }
    // Safeguard: paper background should always be clean white/light
    return getLuminance(best) >= 0.5 ? best : "#ffffff";
  };

  /** Sample ink colour of the text */
  const sampleInk = (r: { x: number; y: number; w: number; h: number }): string => {
    const ctx = sampleRef.current;
    if (!ctx) return "#000000";
    const W = ctx.canvas.width,
      H = ctx.canvas.height;
    const x = Math.max(0, Math.floor(r.x * W));
    const y = Math.max(0, Math.floor(r.y * H));
    const w = Math.min(W - x, Math.ceil(r.w * W));
    const h = Math.min(H - y, Math.ceil(r.h * H));
    if (w <= 0 || h <= 0) return "#000000";
    const d = ctx.getImageData(x, y, w, h).data;
    let bi = -1,
      bl = 1e9;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum < bl) {
        bl = lum;
        bi = i;
      }
    }
    const sampled = bi < 0 ? "#000000" : toHex(d[bi], d[bi + 1], d[bi + 2]);
    // If sampled ink is too light, force dark black for readability
    return getLuminance(sampled) > 0.7 ? "#000000" : sampled;
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setHistory([]);
    setRedoStack([]);
    setAnnots([]);
    setRuns([]);
    setUsedRuns(new Set());
    setSelectedId(null);
    setEditingId(null);
    setRemovedFields([]);
    setStatus("Reading document…");
    try {
      const buf = await file.arrayBuffer();
      bytesRef.current = buf.slice(0);

      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument(pdfDocumentOptions(buf.slice(0)));
      const doc = await task.promise;

      const next: PageState[] = [];
      const foundRuns: TextRun[] = [];
      const foundFormAnnots: Annot[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`Rendering page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvas, viewport: vp, background: "#ffffff" }).promise;

        const base = page.getViewport({ scale: 1 });

        // Extract widget annotations (AcroForms) to cleanly overlay and sync live text
        try {
          const annotations = await page.getAnnotations();
          for (const annot of annotations) {
            if (annot.subtype === "Widget" && annot.fieldName) {
              const rect = annot.rect || [0, 0, 0, 0];
              const x1 = Math.min(rect[0], rect[2]);
              const x2 = Math.max(rect[0], rect[2]);
              const y1 = Math.min(rect[1], rect[3]);
              const y2 = Math.max(rect[1], rect[3]);
              const fx = x1 / base.width;
              const fy = (base.height - y2) / base.height;
              const fw = Math.max(0.06, (x2 - x1) / base.width);
              const fh = Math.max(0.03, (y2 - y1) / base.height);
              const fType =
                annot.fieldType === "Btn"
                  ? "checkbox"
                  : annot.fieldType === "Ch"
                  ? "dropdown"
                  : "text";
              const fVal =
                typeof annot.fieldValue === "string" ? annot.fieldValue : "";

              foundFormAnnots.push({
                id: `form-${i - 1}-${annot.fieldName}`,
                page: i - 1,
                type: "formfield",
                x: fx,
                y: fy,
                w: fw,
                h: fh,
                fieldName: annot.fieldName,
                fieldType: fType,
                fieldValue: fVal,
                text: fVal,
                size: 12,
                isSourceField: true,
              });
            }
          }
        } catch {
          // No widget annotations on this page
        }

        try {
          const content = await page.getTextContent();
          content.items.forEach((item, k) => {
            if (!("str" in item) || !item.str.trim()) return;
            const t = pdfjs.Util.transform(base.transform, item.transform);
            const itemH =
              "height" in item && typeof item.height === "number" && item.height > 0
                ? item.height
                : 0;
            const scaleH = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 0;
            const rawSize =
              itemH > 0 && itemH <= scaleH * 1.6 ? itemH : scaleH || 12;
            const size = Math.round(rawSize * 10) / 10;
            if (size < 1) return;
            const width = item.width || item.str.length * size * 0.5;

            // Extract font details & weight/style matching
            const fontName = item.fontName || "";
            const styleObj = content.styles ? content.styles[fontName] : undefined;
            const { fontCategory: detectedCat, isBold: detectedBold, isItalic: detectedItalic } =
              detectFontProperties(fontName, styleObj);

            foundRuns.push({
              id: `${i - 1}-${k}`,
              page: i - 1,
              str: item.str,
              x: t[4] / base.width,
              y: (t[5] - size) / base.height,
              w: width / base.width,
              h: size / base.height,
              size: Math.round(size * 10) / 10,
              fontCategory: detectedCat,
              isBold: detectedBold,
              isItalic: detectedItalic,
            });
          });
        } catch {
          // Scanned page with no text layer
        }

        next.push({
          sourceIndex: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL("image/jpeg", 0.88),
          width: base.width,
          height: base.height,
        });
        page.cleanup();
      }
      await task.destroy();

      // Read real form fields
      const foundFields: FormFieldState[] = [];
      try {
        const lib = await PDFDocument.load(buf.slice(0));
        for (const f of lib.getForm().getFields()) {
          const name = f.getName();
          if (f instanceof PDFTextField) {
            foundFields.push({ name, type: "text", value: f.getText() ?? "" });
          } else if (f instanceof PDFCheckBox) {
            foundFields.push({
              name,
              type: "checkbox",
              value: f.isChecked() ? "on" : "",
            });
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
        // No form fields
      }

      setFileName(file.name);
      setPages(next);
      setRuns(foundRuns);
      setFields(foundFields);
      setAnnots(foundFormAnnots);
      setPageIndex(0);
      setTab("edit");
      setStatus(null);
    } catch (e) {
      console.error(e);
      setError("Could not load PDF. It may be password-protected or corrupted.");
      setPages([]);
    } finally {
      setBusy(false);
    }
  };

  /**
   * DIRECT WORD EDITING WITH FONT MATCHING:
   * When user clicks any detected word/phrase run on the PDF canvas,
   * cover the background and IMMEDIATELY enter direct inline editing
   * matching the PREVIOUS font family (serif, sans, mono), font weight (bold/regular),
   * font style (italic), font size, and ink color!
   */
  const handleDirectWordEdit = (r: TextRun) => {
    snapshot();
    const bg = sampleBackground(r);
    const ink = sampleInk(r);
    const page = pages[r.page];
    const padX = Math.max(3.5 / page.width, 0.005);
    const padY = Math.max(4.0 / page.height, 0.006);
    const coverId = crypto.randomUUID();
    const textId = crypto.randomUUID();

    // Sync active editor state to matched font properties
    setFontCategory(r.fontCategory);
    setIsBold(r.isBold);
    setIsItalic(r.isItalic);
    setFontSize(r.size);
    setTextColor(ink);

    setAnnots((a) => [
      ...a,
      {
        id: coverId,
        page: r.page,
        type: "whiteout",
        color: bg,
        x: Math.max(0, r.x - padX),
        y: Math.max(0, r.y - padY),
        w: r.w + padX * 2.2,
        h: r.h + padY * 2.4,
      },
      {
        id: textId,
        page: r.page,
        type: "text",
        text: r.str,
        x: r.x,
        y: r.y,
        size: r.size,
        color: ink,
        fontCategory: r.fontCategory,
        isBold: r.isBold,
        isItalic: r.isItalic,
      },
    ]);
    setUsedRuns((s) => new Set(s).add(r.id));
    setSelectedId(textId);
    setEditingId(textId);
  };

  /** Batch edit line handler */
  const handleBatchLineSave = (
    line: {
      id: string;
      originalText: string;
      runs: TextRun[];
      x: number;
      y: number;
      w: number;
      h: number;
      size: number;
      fontCategory: FontCategory;
      isBold: boolean;
      isItalic: boolean;
    },
    newText: string
  ) => {
    if (!newText.trim() || newText === line.originalText) return;
    snapshot();
    const page = pages[pageIndex];
    if (!page) return;
    const padX = Math.max(3.5 / page.width, 0.005);
    const padY = Math.max(4.0 / page.height, 0.006);
    const coverId = crypto.randomUUID();
    const textId = crypto.randomUUID();

    // Mark all constituent runs as used
    setUsedRuns((s) => {
      const next = new Set(s);
      line.runs.forEach((r) => next.add(r.id));
      return next;
    });

    setAnnots((a) => [
      ...a,
      {
        id: coverId,
        page: pageIndex,
        type: "whiteout",
        color: "#ffffff",
        x: Math.max(0, line.x - padX),
        y: Math.max(0, line.y - padY),
        w: line.w + padX * 2.2,
        h: line.h + padY * 2.4,
      },
      {
        id: textId,
        page: pageIndex,
        type: "text",
        text: newText,
        x: line.x,
        y: line.y,
        size: line.size,
        color: "#000000",
        fontCategory: line.fontCategory,
        isBold: line.isBold,
        isItalic: line.isItalic,
      },
    ]);
  };

  /** Helper to group raw text runs into coherent text lines for batch editing */
  const getGroupedLines = () => {
    const pageRuns = runs.filter((r) => r.page === pageIndex);
    if (!pageRuns.length) return [];
    const sorted = [...pageRuns].sort((a, b) => {
      const dy = a.y - b.y;
      if (Math.abs(dy) > 0.009) return dy;
      return a.x - b.x;
    });

    const lines: {
      id: string;
      originalText: string;
      currentText: string;
      runs: TextRun[];
      x: number;
      y: number;
      w: number;
      h: number;
      size: number;
      fontCategory: FontCategory;
      isBold: boolean;
      isItalic: boolean;
    }[] = [];

    let currentLine: TextRun[] = [];

    for (const r of sorted) {
      if (!currentLine.length) {
        currentLine.push(r);
        continue;
      }
      const prev = currentLine[currentLine.length - 1];
      if (Math.abs(r.y - prev.y) <= 0.009) {
        currentLine.push(r);
      } else {
        const first = currentLine[0];
        const minX = Math.min(...currentLine.map((x) => x.x));
        const maxX = Math.max(...currentLine.map((x) => x.x + x.w));
        const minY = Math.min(...currentLine.map((x) => x.y));
        const maxH = Math.max(...currentLine.map((x) => x.h));
        const text = currentLine.map((x) => x.str).join(" ").replace(/\s+/g, " ").trim();

        // Check if there is an active edited annotation at this line
        const existing = annots.find(
          (a) =>
            a.page === pageIndex &&
            a.type === "text" &&
            Math.abs(a.y - minY) < 0.015 &&
            Math.abs(a.x - minX) < 0.05
        );

        if (text) {
          lines.push({
            id: currentLine.map((x) => x.id).join("_"),
            originalText: text,
            currentText: existing?.text || text,
            runs: [...currentLine],
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxH,
            size: first.size,
            fontCategory: first.fontCategory,
            isBold: currentLine.some((x) => x.isBold),
            isItalic: currentLine.some((x) => x.isItalic),
          });
        }
        currentLine = [r];
      }
    }

    if (currentLine.length) {
      const first = currentLine[0];
      const minX = Math.min(...currentLine.map((x) => x.x));
      const maxX = Math.max(...currentLine.map((x) => x.x + x.w));
      const minY = Math.min(...currentLine.map((x) => x.y));
      const maxH = Math.max(...currentLine.map((x) => x.h));
      const text = currentLine.map((x) => x.str).join(" ").replace(/\s+/g, " ").trim();

      const existing = annots.find(
        (a) =>
          a.page === pageIndex &&
          a.type === "text" &&
          Math.abs(a.y - minY) < 0.015 &&
          Math.abs(a.x - minX) < 0.05
      );

      if (text) {
        lines.push({
          id: currentLine.map((x) => x.id).join("_"),
          originalText: text,
          currentText: existing?.text || text,
          runs: [...currentLine],
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxH,
          size: first.size,
          fontCategory: first.fontCategory,
          isBold: currentLine.some((x) => x.isBold),
          isItalic: currentLine.some((x) => x.isItalic),
        });
      }
    }

    return lines;
  };
  const handleStageClick = (e: React.MouseEvent) => {
    if (!stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));

    if (tool === "text") {
      snapshot();
      const id = crypto.randomUUID();
      setAnnots((a) => [
        ...a,
        {
          id,
          page: pageIndex,
          type: "text",
          x,
          y,
          text: "Type here...",
          size: fontSize,
          color: textColor,
          fontCategory,
          isBold,
          isItalic,
        },
      ]);
      setSelectedId(id);
      setEditingId(id);
      setTool("select");
    } else if (tool === "whiteout") {
      snapshot();
      const id = crypto.randomUUID();
      setAnnots((a) => [
        ...a,
        {
          id,
          page: pageIndex,
          type: "whiteout",
          x,
          y,
          w: 0.25,
          h: 0.04,
          color: "#ffffff",
        },
      ]);
      setSelectedId(id);
      setTool("select");
    } else if (tool === "highlight") {
      snapshot();
      const id = crypto.randomUUID();
      setAnnots((a) => [
        ...a,
        {
          id,
          page: pageIndex,
          type: "highlight",
          x,
          y,
          w: 0.25,
          h: 0.035,
          color: highlightColor,
          opacity: 0.45,
        },
      ]);
      setSelectedId(id);
      setTool("select");
    } else {
      if (e.target === stageRef.current || (e.target as HTMLElement).tagName === "IMG") {
        setSelectedId(null);
        setEditingId(null);
      }
    }
  };

  /** Freehand drawing start */
  const startDrawing = (e: React.PointerEvent) => {
    if (tool !== "draw" || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    isDrawing.current = true;
    currentDrawPoints.current = [{ x, y }];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  /** Freehand drawing move */
  const onDrawMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || tool !== "draw" || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    currentDrawPoints.current.push({ x, y });
  };

  /** Freehand drawing finish */
  const finishDrawing = () => {
    if (!isDrawing.current || tool !== "draw") return;
    isDrawing.current = false;
    if (currentDrawPoints.current.length > 1) {
      snapshot();
      const id = crypto.randomUUID();
      setAnnots((a) => [
        ...a,
        {
          id,
          page: pageIndex,
          type: "draw",
          x: 0,
          y: 0,
          color: drawColor,
          lineWidth: drawWidth,
          points: [...currentDrawPoints.current],
        },
      ]);
      setSelectedId(id);
    }
    currentDrawPoints.current = [];
  };

  /** Start corner drag resizing */
  const startResizing = (e: React.PointerEvent, a: Annot) => {
    e.stopPropagation();
    if (!stageRef.current) return;
    const w = a.w ?? (a.type === "signature" ? 0.28 : 0.25);
    const h = a.h ?? (a.type === "signature" ? 0.1 : 0.04);
    resizeRef.current = {
      id: a.id,
      startX: e.clientX,
      startY: e.clientY,
      startW: w,
      startH: h,
      aspect: w / Math.max(0.01, h),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  /** Pointer down on existing annotation for dragging */
  const onPointerDown = (e: React.PointerEvent, a: Annot) => {
    if (editingId === a.id) return;
    if (tool !== "select" || !stageRef.current) return;
    e.stopPropagation();
    const r = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      id: a.id,
      dx: (e.clientX - r.left) / r.width - a.x,
      dy: (e.clientY - r.top) / r.height - a.y,
      startX: a.x,
      startY: a.y,
    };
    setSelectedId(a.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  /** Pointer move for dragging & resizing */
  const onPointerMove = (e: React.PointerEvent) => {
    if (tool === "draw") {
      onDrawMove(e);
      return;
    }
    const res = resizeRef.current;
    if (res && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect();
      const dx = (e.clientX - res.startX) / r.width;
      const targetAnnot = annots.find((a) => a.id === res.id);
      const isAspectLocked =
        targetAnnot?.type === "signature" || targetAnnot?.type === "image";

      const newW = Math.max(0.04, Math.min(0.95, res.startW + dx));
      const newH = isAspectLocked
        ? Math.max(0.02, Math.min(0.9, newW / res.aspect))
        : Math.max(
            0.02,
            Math.min(0.9, res.startH + (e.clientY - res.startY) / r.height)
          );

      setAnnots((list) =>
        list.map((a) => (a.id === res.id ? { ...a, w: newW, h: newH } : a))
      );
      return;
    }

    const d = dragRef.current;
    if (!d || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width - d.dx));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height - d.dy));
    setAnnots((list) => list.map((a) => (a.id === d.id ? { ...a, x, y } : a)));
  };

  /** End drag or resize */
  const endDrag = () => {
    if (resizeRef.current) {
      snapshot();
      resizeRef.current = null;
    }
    if (dragRef.current) {
      const { id, startX, startY } = dragRef.current;
      const currentAnnot = annots.find((a) => a.id === id);
      if (currentAnnot && (currentAnnot.x !== startX || currentAnnot.y !== startY)) {
        snapshot();
      }
      dragRef.current = null;
    }
    finishDrawing();
  };

  const patch = (id: string, next: Partial<Annot>) =>
    setAnnots((list) => list.map((a) => (a.id === id ? { ...a, ...next } : a)));

  const removeAnnot = (id: string) => {
    snapshot();
    const target = annots.find((a) => a.id === id);
    if (target?.isSourceField && target.fieldName) {
      const name = target.fieldName;
      setFields((list) => list.filter((f) => f.name !== name));
      setRemovedFields((list) => [...list, name]);
    }
    setAnnots((list) => list.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const removeFormField = (name: string) => {
    snapshot();
    setFields((prev) => prev.filter((f) => f.name !== name));
    setAnnots((prev) => prev.filter((a) => a.fieldName !== name));
    setRemovedFields((prev) => [...prev, name]);
    setSelectedId(null);
  };

  const duplicateAnnot = (id: string) => {
    const target = annots.find((a) => a.id === id);
    if (!target) return;
    snapshot();
    const newId = crypto.randomUUID();
    setAnnots((a) => [
      ...a,
      {
        ...target,
        id: newId,
        x: Math.min(0.9, target.x + 0.03),
        y: Math.min(0.9, target.y + 0.03),
      },
    ]);
    setSelectedId(newId);
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
    setAnnots((a) => [
      ...a,
      {
        id,
        page: pageIndex,
        type: "image",
        x: 0.15,
        y: 0.15,
        w: 0.3,
        h: 0.15,
        dataUrl,
      },
    ]);
    setSelectedId(id);
  };

  /** Insert Signature from modal */
  const insertSignature = (dataUrl: string) => {
    snapshot();
    const id = crypto.randomUUID();
    setAnnots((a) => [
      ...a,
      {
        id,
        page: pageIndex,
        type: "signature",
        x: 0.35,
        y: 0.75,
        w: 0.28,
        h: 0.1,
        dataUrl,
      },
    ]);
    setSelectedId(id);
    setShowSignatureModal(false);
    setTool("select");
  };

  /** Update one field by annotation identity. */
  const setFieldValue = (a: Annot, nextVal: string) => {
    setAnnots((prev) =>
      prev.map((x) =>
        x.id === a.id ? { ...x, fieldValue: nextVal, text: nextVal } : x
      )
    );
    // Fields that came from the uploaded PDF are written back through `fields`
    // on export, so that list has to track the edit too.
    if (a.isSourceField && a.fieldName) {
      setFields((prev) =>
        prev.map((f) => (f.name === a.fieldName ? { ...f, value: nextVal } : f))
      );
    }
  };

  /** Update a document-owned field from the Forms panel, keyed by name. */
  const updateSourceField = (name: string, nextVal: string) => {
    setFields((prev) =>
      prev.map((f) => (f.name === name ? { ...f, value: nextVal } : f))
    );
    setAnnots((prev) =>
      prev.map((a) =>
        a.isSourceField && a.fieldName === name
          ? { ...a, fieldValue: nextVal, text: nextVal }
          : a
      )
    );
  };

  /** Insert Interactive Form Field */
  const insertFormField = (
    name: string,
    type: "text" | "checkbox" | "dropdown" = "text",
    val = "",
    opts: string[] = []
  ) => {
    snapshot();
    const id = crypto.randomUUID();
    const taken = new Set<string>([
      ...fields.map((f) => f.name),
      ...annots
        .filter((a) => a.type === "formfield" && a.fieldName)
        .map((a) => a.fieldName as string),
    ]);
    const fieldCleanName = uniqueFieldName(name || "field", taken);

    const w = type === "checkbox" ? 0.035 : 0.16;
    const h = type === "checkbox" ? 0.03 : 0.028;
    const spot = findBlankSpot(w, h);
    const rect = { x: spot.x, y: spot.y, w, h };

    setAnnots((a) => [
      ...a,
      {
        id,
        page: pageIndex,
        type: "formfield",
        ...rect,
        fieldName: fieldCleanName,
        fieldType: type,
        fieldValue: val,
        fieldOptions: opts,
        text: val,
        size: fontSize || 12,
        fontCategory: fontCategory || "sans-serif",
        isBold,
        isItalic,
        color: textColor || "#0f172a",
        // Deliberately transparent. An opaque widget paints over whatever it
        // is dropped on, and the default drop point routinely lands on body
        // text — that is what erased the middle of an address line and read as
        // the editor corrupting the page. Covering is a real need, but it is
        // now an explicit choice via "Cover" in the Forms panel.
        bgColor: undefined,
      },
    ]);
    setSelectedId(id);
    setShowFormFieldModal(false);
    setFormFieldName("");
    setFormFieldVal("");
    setTool("select");
  };

  // Signature canvas handlers
  const handleSigCanvasDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    isSigDrawing.current = true;
  };

  const handleSigCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSigDrawing.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleSigCanvasUp = () => {
    isSigDrawing.current = false;
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    insertSignature(canvas.toDataURL("image/png"));
  };

  const saveTypedSignature = () => {
    if (!typedSigText.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "italic 52px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedSigText.trim(), 300, 100);
    insertSignature(canvas.toDataURL("image/png"));
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
    setPages((p) =>
      p.map((pg, idx) =>
        idx === i ? { ...pg, rotation: (pg.rotation + delta + 360) % 360 } : pg
      )
    );
  };

  const removePage = (i: number) => {
    if (pages.length <= 1) return;
    snapshot();
    setPages((p) => p.filter((_, idx) => idx !== i));
    setAnnots((a) =>
      a
        .filter((x) => x.page !== i)
        .map((x) => (x.page > i ? { ...x, page: x.page - 1 } : x))
    );
    setPageIndex((p) => Math.max(0, Math.min(p, pages.length - 2)));
  };

  /**
   * Export.
   *
   * This edits the SOURCE document in place rather than copying pages into a
   * fresh one. Copying leaves any existing AcroForm widgets orphaned — they
   * still render, but the new document's form does not list them, so a form
   * that was fillable before goes dead on save. Editing in place keeps the
   * document's own fields intact, and lets fields added here be registered as
   * real, fillable fields instead of painted-on text.
   */
  const save = async () => {
    if (!bytesRef.current || !pages.length) return;
    setBusy(true);
    setStatus("Generating PDF with your matching font edits…");
    try {
      const doc = await PDFDocument.load(bytesRef.current.slice(0));
      const form = doc.getForm();

      // 0. Drop fields the user deleted, so the widget really goes away rather
      //    than merely being left unwritten.
      for (const name of removedFields) {
        try {
          form.removeField(form.getField(name));
        } catch (e) {
          console.warn(`Could not remove form field "${name}":`, e);
        }
      }

      // 1. Push edited values into the document's own form fields.
      for (const f of fields) {
        try {
          if (f.type === "text") form.getTextField(f.name).setText(f.value);
          else if (f.type === "checkbox") {
            const cb = form.getCheckBox(f.name);
            if (f.value === "on" || f.value === "true") cb.check();
            else cb.uncheck();
          } else if (f.type === "dropdown" && f.value) {
            form.getDropdown(f.name).select(f.value);
          }
        } catch (e) {
          console.warn(`Could not write form field "${f.name}":`, e);
        }
      }

      // 2. Apply deletions and reordering. Skipped when nothing moved, so the
      //    common single-page case never touches the page tree at all.
      const orderChanged =
        pages.length !== doc.getPageCount() ||
        pages.some((p, i) => p.sourceIndex !== i);
      if (orderChanged) {
        const original = doc.getPages();
        const wanted = pages
          .map((p) => original[p.sourceIndex])
          .filter(Boolean);
        for (let i = doc.getPageCount() - 1; i >= 0; i--) doc.removePage(i);
        wanted.forEach((pg, i) => doc.insertPage(i, pg));
      }

      // Embed the full matrix so exported text keeps the family/weight/style
      // detected from the original run.
      const helvetica = await doc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const helveticaOblique = await doc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await doc.embedFont(StandardFonts.HelveticaBoldOblique);

      const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBold = await doc.embedFont(StandardFonts.TimesRomanBold);
      const timesRomanItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
      const timesRomanBoldItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);

      const courier = await doc.embedFont(StandardFonts.Courier);
      const courierBold = await doc.embedFont(StandardFonts.CourierBold);
      const courierOblique = await doc.embedFont(StandardFonts.CourierOblique);
      const courierBoldOblique = await doc.embedFont(StandardFonts.CourierBoldOblique);

      const resolveFont = (
        category: FontCategory = "sans-serif",
        bold = false,
        italic = false
      ) => {
        if (category === "serif") {
          if (bold && italic) return timesRomanBoldItalic;
          if (bold) return timesRomanBold;
          if (italic) return timesRomanItalic;
          return timesRoman;
        } else if (category === "monospace") {
          if (bold && italic) return courierBoldOblique;
          if (bold) return courierBold;
          if (italic) return courierOblique;
          return courier;
        } else {
          if (bold && italic) return helveticaBoldOblique;
          if (bold) return helveticaBold;
          if (italic) return helveticaOblique;
          return helvetica;
        }
      };

      const livePages = doc.getPages();
      // Seeded with the document's existing names so a new field can never
      // collide with one already in the file.
      const takenNames = new Set(form.getFields().map((f) => f.getName()));

      for (let i = 0; i < livePages.length && i < pages.length; i++) {
        const page = livePages[i];
        const extra = pages[i].rotation;
        if (extra) {
          page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        }

        const { width, height } = page.getSize();
        const mine = annots.filter((x) => x.page === i);

        // Covers first, then highlights, then everything drawn on top.
        const ordered = [
          ...mine.filter((a) => a.type === "whiteout"),
          ...mine.filter((a) => a.type === "highlight"),
          ...mine.filter(
            (a) => a.type !== "whiteout" && a.type !== "highlight"
          ),
        ];

        for (const a of ordered) {
          const px = a.x * width;
          const py = height - a.y * height;

          if (a.type === "whiteout") {
            page.drawRectangle({
              x: px,
              y: py - (a.h ?? 0.04) * height,
              width: (a.w ?? 0.25) * width,
              height: (a.h ?? 0.04) * height,
              color: hexToRgb(a.color || "#ffffff"),
            });
          } else if (a.type === "highlight") {
            page.drawRectangle({
              x: px,
              y: py - (a.h ?? 0.035) * height,
              width: (a.w ?? 0.25) * width,
              height: (a.h ?? 0.035) * height,
              color: hexToRgb(a.color || "#fef08a"),
              opacity: a.opacity ?? 0.45,
            });
          } else if (a.type === "text" && a.text) {
            const font = resolveFont(a.fontCategory, a.isBold, a.isItalic);
            const size = a.size ?? 14;
            const baselineY = py - size * 0.82;
            a.text.split("\n").forEach((line, n) => {
              page.drawText(line, {
                x: px,
                y: baselineY - n * size * 1.15,
                size,
                font,
                // Same clamp the canvas applies, so the exported file matches
                // the preview instead of writing ink the editor refused to show.
                color: hexToRgb(
                  a.color && getLuminance(a.color) < 0.8 ? a.color : "#0f172a"
                ),
              });
            });
          } else if (
            (a.type === "image" || a.type === "signature") &&
            a.dataUrl
          ) {
            const img = a.dataUrl.startsWith("data:image/png")
              ? await doc.embedPng(a.dataUrl)
              : await doc.embedJpg(a.dataUrl);
            page.drawImage(img, {
              x: px,
              y: py - (a.h ?? 0.12) * height,
              width: (a.w ?? 0.3) * width,
              height: (a.h ?? 0.12) * height,
            });
          } else if (a.type === "formfield") {
            // Already part of the document — its widget is on the page and its
            // value was written above. Recreating it would duplicate the field.
            if (a.isSourceField) continue;

            const size = a.size ?? 12;
            const fw = (a.w ?? 0.16) * width;
            const fh = (a.h ?? 0.028) * height;
            const fx = px;
            const fy = py - fh;
            const font = resolveFont(a.fontCategory, a.isBold, a.isItalic);
            const textColorRgb = hexToRgb(legibleInk(a.color, a.bgColor || "#ffffff"));
            // undefined => no /BG entry => the page shows through. pdf-lib
            // defaults this to opaque white when the key is absent, so it has
            // to be passed explicitly as undefined.
            const bg = a.bgColor ? hexToRgb(a.bgColor) : undefined;
            const name = uniqueFieldName(a.fieldName || "field", takenNames);

            try {
              if (a.fieldType === "checkbox") {
                const box = Math.min(fw, fh);
                const cb = form.createCheckBox(name);
                cb.addToPage(page, {
                  x: fx,
                  y: fy,
                  width: box,
                  height: box,
                  backgroundColor: bg,
                  borderColor: textColorRgb,
                  borderWidth: 1,
                });
                // pdf-lib renders the tick from ZapfDingbats. Drawing a "✓"
                // with drawText instead throws — WinAnsi cannot encode U+2713.
                if (a.fieldValue === "on" || a.fieldValue === "true") cb.check();
              } else if (a.fieldType === "dropdown") {
                const opts = (a.fieldOptions ?? []).filter(Boolean);
                const dd = form.createDropdown(name);
                if (opts.length) dd.setOptions(opts);
                const chosen = a.fieldValue ?? "";
                if (chosen && opts.includes(chosen)) dd.select(chosen);
                dd.addToPage(page, {
                  x: fx,
                  y: fy,
                  width: fw,
                  height: fh,
                  font,
                  textColor: textColorRgb,
                  backgroundColor: bg,
                  borderColor: undefined,
                  borderWidth: 0,
                });
                dd.setFontSize(size);
              } else {
                const tf = form.createTextField(name);
                const val = a.fieldValue ?? a.text ?? "";
                if (val) tf.setText(val);
                tf.addToPage(page, {
                  x: fx,
                  y: fy,
                  width: fw,
                  height: fh,
                  font,
                  textColor: textColorRgb,
                  backgroundColor: bg,
                  borderColor: undefined,
                  borderWidth: 0,
                });
                // Must follow addToPage: the /DA entry it needs is created there.
                tf.setFontSize(size);
              }
            } catch (e) {
              console.warn(`Could not create form field "${name}":`, e);
            }
          } else if (a.type === "draw" && a.points && a.points.length > 1) {
            const drawColorRgb = hexToRgb(a.color || "#000000");
            for (let pIdx = 0; pIdx < a.points.length - 1; pIdx++) {
              const p1 = a.points[pIdx];
              const p2 = a.points[pIdx + 1];
              page.drawLine({
                start: { x: p1.x * width, y: height - p1.y * height },
                end: { x: p2.x * width, y: height - p2.y * height },
                thickness: a.lineWidth || 2,
                color: drawColorRgb,
              });
            }
          }
        }
      }

      let bytes: Uint8Array;
      try {
        bytes = await doc.save();
      } catch (e) {
        // Appearance regeneration can fail on a value the field's font cannot
        // encode (Hindi in a Helvetica field, say). Saving without it still
        // produces a valid file; the reader renders the field on open.
        console.warn("Falling back to save without appearance update:", e);
        bytes = await doc.save({ updateFieldAppearances: false });
      }

      downloadBlob(
        new Blob([bytes as BlobPart], { type: "application/pdf" }),
        `${fileName.replace(/\.pdf$/i, "") || "document"}-edited.pdf`
      );
      setStatus("Successfully downloaded edited PDF!");
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
    } catch (e) {
      console.error(e);
      setError("Could not build the edited PDF file.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => {
    bytesRef.current = null;
  }, []);

  const current = pages[pageIndex];
const selected = annots.find((a) => a.id === selectedId) ?? null;
  const pageAnnots = annots.filter((a) => a.page === pageIndex);
  // Fields added in this session, across all pages — the Forms panel lists
  // these alongside the fields the uploaded document already had.
  const userFieldAnnots = annots.filter(
    (a) => a.type === "formfield" && !a.isSourceField
  );
  const pageRuns = runs.filter(
    (r) => r.page === pageIndex && !usedRuns.has(r.id)
  );
  const scale = current && stageW ? stageW / current.width : 1;

  return (
    <div className="space-y-5">
      {/* Top Header & Trust Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Pencil className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {/* The page-level <h1> belongs to ToolShell. This is the widget's
                  own heading, so it must not compete for that role. */}
              <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                PDF Editor
              </p>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                PRO STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Edit text, add images, fill forms and annotate your PDF directly in the browser.
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Private
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
            <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            No Signup Required
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-2xs dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
            <Globe className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Works in Browser
          </span>
        </div>
      </div>

      {/* Top Document / Uploader Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-blue-400/70 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/70 p-4 sm:p-5 shadow-xs transition-all hover:border-blue-500 hover:bg-blue-50/90 dark:border-blue-500/40 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 dark:hover:border-blue-400">
        {/* Left: Upload Target & Info with Small Compact Badges */}
        <label className="group relative flex flex-1 cursor-pointer items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 group-hover:scale-105 transition-transform dark:bg-blue-500/20 dark:text-blue-400">
            <FileUp className="h-6 w-6" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {pages.length > 0 ? "Replace PDF Document" : "Upload PDF to Edit"}
              </p>

              {/* Small Compact Alerts */}
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/80 bg-blue-100/50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-300">
                Max 50 MB
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/80 bg-indigo-100/50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300">
                {pages.length > 0 ? `${pages.length} Pages Loaded` : "1 - 500 Pages"}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {pages.length > 0
                ? fileName
                : "Click to browse or drag & drop your PDF file here · 100% private in-browser"}
            </p>
          </div>

          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0])}
            aria-label="Choose a PDF"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
          />
        </label>

        {/* Right Action Button: Choose PDF or Save PDF */}
        <div className="shrink-0 flex items-center gap-2">
          {pages.length === 0 ? (
            <label className="relative flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700">
              <span>Choose PDF File</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={busy}
                onChange={(e) => onFile(e.target.files?.[0])}
                aria-label="Choose a PDF"
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
              />
            </label>
          ) : (
            <button
              onClick={save}
              disabled={pages.length === 0 || busy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
            >
              <Download className="h-4 w-4" />
              <span>Save & Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {busy && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
          <RefreshCw className="h-5 w-5 animate-spin" /> {status ?? "Processing PDF…"}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {/* Main Studio Workspace Layout */}
      {pages.length > 0 && !busy && (
        (() => {
          const studioContent = (
            <div
              className={
                isFullscreen
                  ? "fixed inset-0 z-[999999] bg-slate-950 text-slate-100 flex flex-col h-screen w-screen overflow-hidden p-3 sm:p-4 select-none"
                  : "space-y-4"
              }
            >
              {/* Top Fullscreen Master Header (Single unified studio toolbar) */}
              {isFullscreen && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 px-4 py-2.5 shadow-xl shrink-0">
                  {/* Left: Document Info & Status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                        {fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Page {pageIndex + 1} of {pages.length} · 100% In-Browser Private
                      </p>
                    </div>
                  </div>

                  {/* Center: Pagination & Zoom Controls */}
                  <div className="flex items-center gap-2">
                    {/* Pagination */}
                    <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 p-1 border border-slate-700">
                      <button
                        onClick={() => setPageIndex(0)}
                        disabled={pageIndex === 0}
                        title="First Page"
                        className="rounded p-1 text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={pageIndex === 0}
                        title="Previous Page"
                        className="rounded p-1 text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>

                      <span className="px-1.5 text-xs font-semibold tabular-nums text-white">
                        {pageIndex + 1} / {pages.length}
                      </span>

                      <button
                        onClick={() =>
                          setPageIndex((p) => Math.min(pages.length - 1, p + 1))
                        }
                        disabled={pageIndex === pages.length - 1}
                        title="Next Page"
                        className="rounded p-1 text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setPageIndex(pages.length - 1)}
                        disabled={pageIndex === pages.length - 1}
                        title="Last Page"
                        className="rounded p-1 text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        <ChevronsRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center rounded-xl bg-slate-800/90 p-1 border border-slate-700">
                      <button
                        onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                        title="Zoom Out"
                        className="rounded p-1 text-slate-300 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-1.5 text-[11px] font-bold tabular-nums text-white">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))}
                        title="Zoom In"
                        className="rounded p-1 text-slate-300 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => setZoom(1)}
                      title="Reset Zoom"
                      className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      100%
                    </button>
                    <button
                      onClick={() => setZoom(1.35)}
                      title="Fit Width (135%)"
                      className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      Fit Width
                    </button>
                  </div>

                  {/* Right: Undo, Redo, Save PDF & Exit Fullscreen */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={undo}
                      disabled={!history.length}
                      title="Undo (Ctrl+Z)"
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30 border border-slate-700"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={redo}
                      disabled={!redoStack.length}
                      title="Redo (Ctrl+Y)"
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30 border border-slate-700"
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={save}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition"
                    >
                      <Download className="h-4 w-4" />
                      <span>Save PDF</span>
                    </button>

                    <button
                      onClick={() => setIsFullscreen(false)}
                      title="Exit Full Screen (Esc)"
                      className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
                    >
                      <Minimize2 className="h-4 w-4 text-slate-400" />
                      <span>Exit (Esc)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TWO-COLUMN SIDE-BY-SIDE GRID */}
              <div
                className={
                  isFullscreen
                    ? "flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden"
                    : "grid grid-cols-1 gap-4 lg:grid-cols-12 items-start"
                }
              >
                {/* LEFT & CENTER CANVAS STAGE (8 COLS) */}
                <div
                  className={
                    isFullscreen
                      ? "lg:col-span-8 h-full min-h-0 flex flex-col"
                      : "space-y-3 lg:col-span-8"
                  }
                >
                  {/* Inline Stage Workspace Toolbar (Only shown in standard non-fullscreen mode) */}
                  {!isFullscreen && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-2.5 shadow-2xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95">
                      {/* Document Preview & Pagination */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-blue-600" /> Document Preview
                        </span>

                        <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800">
                          <button
                            onClick={() => setPageIndex(0)}
                            disabled={pageIndex === 0}
                            title="First Page"
                            className="rounded p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30 dark:text-slate-300"
                          >
                            <ChevronsLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                            disabled={pageIndex === 0}
                            title="Previous Page"
                            className="rounded p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30 dark:text-slate-300"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>

                          <span className="px-1 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                            {pageIndex + 1} / {pages.length}
                          </span>

                          <button
                            onClick={() =>
                              setPageIndex((p) => Math.min(pages.length - 1, p + 1))
                            }
                            disabled={pageIndex === pages.length - 1}
                            title="Next Page"
                            className="rounded p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30 dark:text-slate-300"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPageIndex(pages.length - 1)}
                            disabled={pageIndex === pages.length - 1}
                            title="Last Page"
                            className="rounded p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30 dark:text-slate-300"
                          >
                            <ChevronsRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Zoom, Fullscreen, Undo, Redo, Download Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsFullscreen(true)}
                          title="Enter Full Screen (Maximize view)"
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-900 transition shadow-2xs"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          <span>Full Screen</span>
                        </button>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

                        <div className="flex items-center rounded-xl bg-slate-100/90 p-0.5 dark:bg-slate-800">
                          <button
                            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                            title="Zoom Out"
                            className="rounded p-1 text-slate-600 hover:text-blue-600 dark:text-slate-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-1 text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button
                            onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))}
                            title="Zoom In"
                            className="rounded p-1 text-slate-600 hover:text-blue-600 dark:text-slate-300"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => setZoom(1)}
                          title="Reset Zoom to 100%"
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          100%
                        </button>

                        <button
                          onClick={() => setZoom(1.35)}
                          title="Large View (135%)"
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Fit Width
                        </button>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

                        <button
                          onClick={undo}
                          disabled={!history.length}
                          title="Undo (Ctrl+Z)"
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={redo}
                          disabled={!redoStack.length}
                          title="Redo (Ctrl+Y)"
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Redo2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={save}
                          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Canvas Stage with Left Thumbnail Filmstrip */}
                  <div
                    className={`flex gap-3 rounded-2xl border border-slate-200/90 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-950/60 ${
                      isFullscreen
                        ? "flex-1 min-h-0 h-full overflow-hidden"
                        : "min-h-[750px] lg:h-[820px]"
                    }`}
                  >
              {/* Left Page Filmstrip (Compact Thumbnails) */}
              <div
                className={`hidden sm:flex flex-col gap-2 overflow-y-auto w-20 shrink-0 pr-1 select-none ${
                  isFullscreen ? "h-full" : "max-h-[760px]"
                }`}
              >
                {pages.map((p, i) => (
                  <button
                    key={`${p.sourceIndex}-${i}`}
                    onClick={() => setPageIndex(i)}
                    className={`group relative aspect-[3/4] w-full overflow-hidden rounded-xl border-2 transition-all ${
                      pageIndex === i
                        ? "border-blue-600 ring-2 ring-blue-500/30 shadow-md scale-105"
                        : "border-slate-200 bg-white opacity-70 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    {p.thumbnail && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.thumbnail}
                        alt={`Page ${i + 1}`}
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                        className="h-full w-full object-contain pointer-events-none"
                      />
                    )}
                    <span
                      className={`absolute bottom-1 right-1 rounded px-1 text-[9px] font-bold ${
                        pageIndex === i
                          ? "bg-blue-600 text-white"
                          : "bg-black/60 text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>

              {/* Center Canvas Viewport */}
              <div
                ref={containerRef}
                className="relative flex-1 overflow-auto rounded-xl bg-white shadow-sm dark:bg-slate-900 p-2 sm:p-4 grid place-items-center"
              >
                <div
                  ref={stageRef}
                  onClick={handleStageClick}
                  onPointerDown={tool === "draw" ? startDrawing : undefined}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerLeave={endDrag}
                  style={{
                    width: `${zoom * 100}%`,
                    maxWidth: zoom > 1 ? undefined : "100%",
                  }}
                  className={`relative mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 ${
                    tool === "select" ? "" : "cursor-crosshair"
                  }`}
                >
                  {/* Page Background Image */}
                  {current.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={current.thumbnail}
                      alt={`Page ${pageIndex + 1}`}
                      style={{
                        transform: `rotate(${current.rotation}deg)`,
                      }}
                      className="block w-full select-none"
                      draggable={false}
                    />
                  )}

                  {/* Detectable Text Runs Overlay (Click to Edit Words Directly!) */}
                  {tool === "select" &&
                    pageRuns.map((r) => (
                      <button
                        key={r.id}
                        title={`Click to edit: "${r.str}" (${r.fontCategory}, ${r.isBold ? "Bold" : "Regular"}, ${r.size}pt)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectWordEdit(r);
                        }}
                        style={{
                          left: `${r.x * 100}%`,
                          top: `${r.y * 100}%`,
                          width: `${r.w * 100}%`,
                          height: `${r.h * 100}%`,
                        }}
                        className="group absolute cursor-text rounded-[2px] bg-blue-500/10 ring-1 ring-inset ring-blue-500/25 transition-all hover:bg-blue-500/30 hover:ring-2 hover:ring-blue-600"
                      >
                        <span className="sr-only">Edit {r.str}</span>
                      </button>
                    ))}

                  {/* Active Annotations Layer */}
                  {pageAnnots.map((a) => {
                    const isSelected = selectedId === a.id;
                    const isEditing = editingId === a.id;

                    const getFontFamilyCss = (cat?: FontCategory) => {
                      if (cat === "serif") return "'Times New Roman', Times, 'Liberation Serif', Georgia, serif";
                      if (cat === "monospace") return "'Courier New', Courier, 'Liberation Mono', Menlo, Consolas, monospace";
                      return "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif";
                    };

                    return (
                      <div
                        key={a.id}
                        onPointerDown={(e) => onPointerDown(e, a)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(a.id);
                          if (a.type === "text" || a.type === "formfield") {
                            setFontCategory(a.fontCategory || "sans-serif");
                            setIsBold(!!a.isBold);
                            setIsItalic(!!a.isItalic);
                            setFontSize(a.size ?? 12);
                            setTextColor(a.color ?? "#0f172a");
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (a.type === "text") {
                            setSelectedId(a.id);
                            setEditingId(a.id);
                          }
                        }}
                        style={{
                          left: `${a.x * 100}%`,
                          top: `${a.y * 100}%`,
                          width:
                            a.type === "text"
                              ? isEditing
                                ? "auto"
                                : undefined
                              : `${(a.w ?? 0.25) * 100}%`,
                          height:
                            a.type === "text"
                              ? undefined
                              : `${(a.h ?? 0.04) * 100}%`,
                          background:
                            a.type === "whiteout"
                              ? (a.color && getLuminance(a.color) >= 0.5 ? a.color : "#ffffff")
                              : a.type === "highlight"
                              ? a.color || "#fef08a"
                              : undefined,
                          opacity:
                            a.type === "highlight"
                              ? a.opacity ?? 0.45
                              : undefined,
                          color: a.type === "text" ? (a.color && getLuminance(a.color) < 0.8 ? a.color : "#0f172a") : undefined,
                          fontSize:
                            a.type === "text"
                              ? `${(a.size ?? 14) * scale}px`
                              : undefined,
                          lineHeight: a.type === "text" ? 1.2 : undefined,
                          fontFamily: a.type === "text" ? getFontFamilyCss(a.fontCategory) : undefined,
                          fontWeight: a.type === "text" ? (a.isBold ? 700 : 400) : undefined,
                          fontStyle: a.type === "text" ? (a.isItalic ? "italic" : "normal") : undefined,
                        }}
                        className={`absolute whitespace-pre select-none ${
                          isSelected && !isEditing
                            ? "ring-2 ring-blue-600 ring-offset-1 z-20 cursor-move shadow-xs"
                            : "cursor-pointer"
                        }`}
                      >
                        {/* Text Annotation Rendering */}
                        {a.type === "text" ? (
                          isEditing ? (
                            <textarea
                              ref={inlineInputRef}
                              defaultValue={a.text}
                              onBlur={(e) => {
                                patch(a.id, { text: e.target.value });
                                setEditingId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  patch(a.id, {
                                    text: (e.target as HTMLTextAreaElement).value,
                                  });
                                  setEditingId(null);
                                }
                              }}
                              autoFocus
                              style={{
                                color: a.color || "#000000",
                                fontFamily:
                                  a.fontCategory === "serif"
                                    ? "Georgia, serif"
                                    : a.fontCategory === "monospace"
                                    ? "monospace"
                                    : "Inter, system-ui, sans-serif",
                                fontWeight: a.isBold ? 700 : 400,
                                fontStyle: a.isItalic ? "italic" : "normal",
                                fontSize: `${(a.size ?? 14) * scale}px`,
                              }}
                              className="block min-w-[60px] resize-none border-0 bg-transparent p-0 outline-none"
                            />
                          ) : (
                            <span
                              onDoubleClick={() => setEditingId(a.id)}
                              className="block px-0.5 whitespace-pre"
                            >
                              {a.text || " "}
                            </span>
                          )
                        ) : null}

                        {/* Interactive Form Field - Clean, High-Contrast Visible Value Rendering */}
                        {a.type === "formfield" && (
                          <div
                            style={{
                              // Must be the exported widget background, not a
                              // hardcoded white, or the preview cannot show a
                              // mismatched cover colour.
                              background: a.bgColor || "transparent",
                              // pdf-lib insets field text by exactly 1pt
                              // (borderWidth 0 + padding 1), so match it here
                              // in the preview's own scale.
                              padding: `${Math.max(1, 1 * scale)}px`,
                            }}
                            className={`flex h-full w-full items-center rounded transition-all ${
                              isSelected
                                ? "border-2 border-blue-600 shadow-xs"
                                : "border border-blue-400/50 hover:border-blue-600"
                            }`}
                          >
                            {a.fieldType === "checkbox" ? (
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={a.fieldValue === "on" || a.fieldValue === "true"}
                                  onChange={(e) =>
                                    setFieldValue(a, e.target.checked ? "on" : "")
                                  }
                                  className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                                />
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-blue-700 truncate">
                                    {a.fieldName || "Check"}
                                  </span>
                                )}
                              </label>
                            ) : a.fieldType === "dropdown" ? (
                              <select
                                value={a.fieldValue || ""}
                                onChange={(e) => setFieldValue(a, e.target.value)}
                                style={{
                                  fontSize: `${(a.size ?? 12) * scale}px`,
                                  fontFamily: getFontFamilyCss(a.fontCategory),
                                  fontWeight: a.isBold ? 700 : 400,
                                  fontStyle: a.isItalic ? "italic" : "normal",
                                  color: legibleInk(a.color, a.bgColor || "#ffffff"),
                                }}
                                className="w-full cursor-pointer border-0 bg-transparent p-0 leading-none focus:outline-none"
                              >
                                {(a.fieldOptions || ["Option 1", "Option 2"]).map((opt) => (
                                  <option key={opt} value={opt} className="text-slate-950">
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={a.fieldValue ?? a.text ?? ""}
                                placeholder={isSelected ? `[${a.fieldName || "Type value"}]` : "Type value..."}
                                onChange={(e) => setFieldValue(a, e.target.value)}
                                style={{
                                  // No clamp: the exported field renders at
                                  // `size` points, so the preview has to show
                                  // exactly size * scale or the two disagree.
                                  fontSize: `${(a.size ?? 12) * scale}px`,
                                  fontFamily: getFontFamilyCss(a.fontCategory),
                                  fontWeight: a.isBold ? 700 : 400,
                                  fontStyle: a.isItalic ? "italic" : "normal",
                                  color: legibleInk(a.color, a.bgColor || "#ffffff"),
                                }}
                                className="w-full border-0 bg-transparent p-0 leading-none placeholder:text-slate-400 focus:outline-none focus:ring-0"
                              />
                            )}
                          </div>
                        )}
                        {/* Image / Signature Rendering */}
                        {(a.type === "image" || a.type === "signature") &&
                          a.dataUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={a.dataUrl}
                              alt=""
                              className="h-full w-full object-contain pointer-events-none"
                              draggable={false}
                            />
                          )}

                        {/* Corner Drag-to-Resize Handle */}
                        {isSelected &&
                          (a.type === "signature" ||
                            a.type === "image" ||
                            a.type === "whiteout" ||
                            a.type === "highlight" ||
                            a.type === "formfield") && (
                            <div
                              onPointerDown={(e) => startResizing(e, a)}
                              title="Drag handle to resize width & height"
                              className="absolute -bottom-2 -right-2 z-30 flex h-4 w-4 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-md ring-2 ring-blue-500/50 transition-transform hover:scale-125"
                            >
                              <div className="h-1 w-1 rounded-full bg-white" />
                            </div>
                          )}

                        {/* Floating Quick Action Pill above Selected Item */}
                        {isSelected && !isEditing && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute z-40 flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 px-2 py-1 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 max-w-[90vw] whitespace-nowrap ${
                              a.y < 0.08
                                ? "top-[calc(100%+8px)]"
                                : "-top-10"
                            } ${
                              a.x < 0.18
                                ? "left-0 translate-x-0"
                                : a.x > 0.72
                                ? "right-0 translate-x-0"
                                : "left-1/2 -translate-x-1/2"
                            }`}
                          >
                            {/* SIGNATURE SPECIFIC TOOLBAR */}
                            {a.type === "signature" && (
                              <>
                                <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  <PenTool className="h-3 w-3" /> Signature
                                </span>
                                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                  <button
                                    onClick={() => {
                                      const nw = Math.max(0.06, (a.w ?? 0.28) * 0.85);
                                      const nh = Math.max(0.02, (a.h ?? 0.1) * 0.85);
                                      patch(a.id, { w: nw, h: nh });
                                    }}
                                    title="Scale Down (-15%)"
                                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Minus className="h-3 w-3" /> Smaller
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nw = Math.min(0.95, (a.w ?? 0.28) * 1.15);
                                      const nh = Math.min(0.9, (a.h ?? 0.1) * 1.15);
                                      patch(a.id, { w: nw, h: nh });
                                    }}
                                    title="Scale Up (+15%)"
                                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Plus className="h-3 w-3" /> Larger
                                  </button>
                                </div>
                                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                  <button
                                    onClick={() => patch(a.id, { w: 0.18, h: 0.06 })}
                                    title="Small Preset"
                                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    S
                                  </button>
                                  <button
                                    onClick={() => patch(a.id, { w: 0.28, h: 0.10 })}
                                    title="Medium Preset"
                                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    M
                                  </button>
                                  <button
                                    onClick={() => patch(a.id, { w: 0.40, h: 0.14 })}
                                    title="Large Preset"
                                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    L
                                  </button>
                                </div>
                                <button
                                  onClick={() => setShowSignatureModal(true)}
                                  title="Replace with new signature"
                                  className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" /> Re-sign
                                </button>
                              </>
                            )}

                            {/* IMAGE SPECIFIC TOOLBAR */}
                            {a.type === "image" && (
                              <>
                                <span className="flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  <ImageIcon className="h-3 w-3" /> Image
                                </span>
                                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                  <button
                                    onClick={() => {
                                      const nw = Math.max(0.05, (a.w ?? 0.3) * 0.85);
                                      const nh = Math.max(0.03, (a.h ?? 0.12) * 0.85);
                                      patch(a.id, { w: nw, h: nh });
                                    }}
                                    title="Scale Down (-15%)"
                                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Minus className="h-3 w-3" /> Smaller
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nw = Math.min(0.95, (a.w ?? 0.3) * 1.15);
                                      const nh = Math.min(0.9, (a.h ?? 0.12) * 1.15);
                                      patch(a.id, { w: nw, h: nh });
                                    }}
                                    title="Scale Up (+15%)"
                                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Plus className="h-3 w-3" /> Larger
                                  </button>
                                </div>
                                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                  <button
                                    onClick={() => patch(a.id, { w: 0.20, h: 0.08 })}
                                    title="Small Preset"
                                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    S
                                  </button>
                                  <button
                                    onClick={() => patch(a.id, { w: 0.35, h: 0.14 })}
                                    title="Medium Preset"
                                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    M
                                  </button>
                                  <button
                                    onClick={() => patch(a.id, { w: 0.55, h: 0.22 })}
                                    title="Large Preset"
                                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    L
                                  </button>
                                </div>
                              </>
                            )}

                            {/* FORM FIELD SPECIFIC TOOLBAR */}
                            {a.type === "formfield" && (
                              <>
                                <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  <FileText className="h-3 w-3" /> Field
                                </span>

                                {/* Font Category Selector */}
                                <select
                                  value={a.fontCategory || "sans-serif"}
                                  onChange={(e) => {
                                    const cat = e.target.value as FontCategory;
                                    patch(a.id, { fontCategory: cat });
                                    setFontCategory(cat);
                                  }}
                                  className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                  <option value="sans-serif">Sans</option>
                                  <option value="serif">Serif</option>
                                  <option value="monospace">Mono</option>
                                </select>

                                {/* Font Size Controls */}
                                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                  <button
                                    onClick={() => {
                                      const next = Math.max(6, (a.size ?? 12) - 1);
                                      patch(a.id, { size: next });
                                      setFontSize(next);
                                    }}
                                    title="Decrease Font Size"
                                    className="rounded p-0.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                    {a.size ?? 12}pt
                                  </span>
                                  <button
                                    onClick={() => {
                                      const next = Math.min(48, (a.size ?? 12) + 1);
                                      patch(a.id, { size: next });
                                      setFontSize(next);
                                    }}
                                    title="Increase Font Size"
                                    className="rounded p-0.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>

                                {/* Bold Toggle */}
                                <button
                                  onClick={() => {
                                    const next = !a.isBold;
                                    patch(a.id, { isBold: next });
                                    setIsBold(next);
                                  }}
                                  title="Toggle Bold"
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    a.isBold
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  B
                                </button>

                                {/* Box Width Controls */}
                                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                  <button
                                    onClick={() => {
                                      const nw = Math.max(0.06, (a.w ?? 0.16) * 0.85);
                                      patch(a.id, { w: nw });
                                    }}
                                    title="Make Box Narrower"
                                    className="rounded px-1 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    - Width
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nw = Math.min(0.9, (a.w ?? 0.16) * 1.15);
                                      patch(a.id, { w: nw });
                                    }}
                                    title="Make Box Wider"
                                    className="rounded px-1 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    + Width
                                  </button>
                                </div>
                              </>
                            )}

                            {a.type === "text" && (
                              <>
                                <button
                                  onClick={() => setEditingId(a.id)}
                                  title="Edit text"
                                  className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>

                                <select
                                  value={a.fontCategory || "sans-serif"}
                                  onChange={(e) => {
                                    const cat = e.target.value as FontCategory;
                                    patch(a.id, { fontCategory: cat });
                                    setFontCategory(cat);
                                  }}
                                  className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                  <option value="sans-serif">Sans</option>
                                  <option value="serif">Serif</option>
                                  <option value="monospace">Mono</option>
                                </select>

                                <button
                                  onClick={() => {
                                    const next = !a.isBold;
                                    patch(a.id, { isBold: next });
                                    setIsBold(next);
                                  }}
                                  title="Bold"
                                  className={`rounded p-1 ${
                                    a.isBold
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <Bold className="h-3 w-3" />
                                </button>

                                <button
                                  onClick={() => {
                                    const next = !a.isItalic;
                                    patch(a.id, { isItalic: next });
                                    setIsItalic(next);
                                  }}
                                  title="Italic"
                                  className={`rounded p-1 ${
                                    a.isItalic
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <Italic className="h-3 w-3" />
                                </button>

                                <button
                                  onClick={() => {
                                    const next = Math.max(6, (a.size ?? 14) - 1);
                                    patch(a.id, { size: next });
                                    setFontSize(next);
                                  }}
                                  title="Smaller font"
                                  className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 px-0.5">
                                  {a.size ?? 14}pt
                                </span>
                                <button
                                  onClick={() => {
                                    const next = Math.min(72, (a.size ?? 14) + 1);
                                    patch(a.id, { size: next });
                                    setFontSize(next);
                                  }}
                                  title="Larger font"
                                  className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </>
                            )}

                            {(a.type === "whiteout" ||
                              a.type === "highlight") && (
                              <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                                <button
                                  onClick={() =>
                                    patch(a.id, {
                                      w: Math.max(0.05, (a.w ?? 0.25) - 0.05),
                                    })
                                  }
                                  title="Narrower"
                                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Minus className="h-3 w-3" /> Width
                                </button>
                                <button
                                  onClick={() =>
                                    patch(a.id, {
                                      w: Math.min(0.95, (a.w ?? 0.25) + 0.05),
                                    })
                                  }
                                  title="Wider"
                                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Plus className="h-3 w-3" /> Width
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-700">
                              <button
                                onClick={() => duplicateAnnot(a.id)}
                                title="Duplicate"
                                className="flex items-center gap-1 rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => removeAnnot(a.id)}
                                title="Delete"
                                className="flex items-center gap-1 rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT STUDIO SIDEBAR (4 COLS) */}
          <div
            className={
              isFullscreen
                ? "lg:col-span-4 h-full min-h-0 overflow-y-auto space-y-4 pr-1"
                : "space-y-4 lg:col-span-4"
            }
          >
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              {/* Studio Sidebar Tabs Header */}
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {(
                  [
                    ["edit", "Edit", Pencil],
                    ["annotate", "Annotate", PenTool],
                    ["forms", "Forms", FileText],
                    ["organize", "Organize", Layers],
                  ] as const
                ).map(([tabId, tabLabel, Icon]) => (
                  <button
                    key={tabId}
                    onClick={() => {
                      setTab(tabId);
                      setSelectedId(null);
                      setEditingId(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                      tab === tabId
                        ? "bg-white text-blue-600 shadow-2xs dark:bg-slate-900 dark:text-blue-400"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tabLabel}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: EDIT CONTENT */}
              {tab === "edit" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Edit Content
                    </h4>
                    <div className="space-y-2">
                      {/* Edit Text Card */}
                      <button
                        onClick={() => {
                          setTool("select");
                          setEditingId(null);
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          tool === "select"
                            ? "border-blue-500 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold">
                          <Type className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Edit Text
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Click any word to retype with matching font
                          </div>
                        </div>
                      </button>

                      {/* Add Image Card */}
                      <label className="w-full flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Add Image
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Insert image from your device
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => addImage(e.target.files?.[0])}
                          className="hidden"
                        />
                      </label>

                      {/* Add Shape / Cover Card */}
                      <button
                        onClick={() => {
                          setTool("whiteout");
                          setEditingId(null);
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          tool === "whiteout"
                            ? "border-amber-500 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/40"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                          <Shapes className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Add Shape / Cover
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Draw shapes and cover areas
                          </div>
                        </div>
                      </button>

                      {/* Add Interactive Form Field Card (Quick Access) */}
                      <button
                        onClick={() => setShowFormFieldModal(true)}
                        className="w-full flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:hover:border-indigo-500"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Add Form Field / Input</span>
                            <span className="rounded bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold text-white">NEW</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Place fillable text box, checkbox, or dropdown
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Active Typography Toolset */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Typography & Styling
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select
                        value={fontCategory}
                        onChange={(e) => {
                          const cat = e.target.value as FontCategory;
                          setFontCategory(cat);
                          if (selectedId) patch(selectedId, { fontCategory: cat });
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="sans-serif">Sans (Helvetica)</option>
                        <option value="serif">Serif (Times)</option>
                        <option value="monospace">Mono (Courier)</option>
                      </select>

                      <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <button
                          onClick={() => {
                            const next = Math.max(6, fontSize - 1);
                            setFontSize(next);
                            if (selectedId) patch(selectedId, { size: next });
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-1 text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                          {fontSize}pt
                        </span>
                        <button
                          onClick={() => {
                            const next = Math.min(72, fontSize + 1);
                            setFontSize(next);
                            if (selectedId) patch(selectedId, { size: next });
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          const next = !isBold;
                          setIsBold(next);
                          if (selectedId) patch(selectedId, { isBold: next });
                        }}
                        className={`rounded-lg p-1.5 ${
                          isBold
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        }`}
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const next = !isItalic;
                          setIsItalic(next);
                          if (selectedId) patch(selectedId, { isItalic: next });
                        }}
                        className={`rounded-lg p-1.5 ${
                          isItalic
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        }`}
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* PAGE TOOLS */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Page Tools
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => rotatePage(pageIndex, -90)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Rotate Left
                      </button>
                      <button
                        onClick={() => rotatePage(pageIndex, 90)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <RotateCw className="h-3.5 w-3.5" /> Rotate Right
                      </button>
                      <button
                        onClick={() => removePage(pageIndex)}
                        disabled={pages.length <= 1}
                        className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 p-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-30 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Page {pageIndex + 1}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANNOTATE */}
              {tab === "annotate" && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    Annotation Tools
                  </h4>

                  {/* Signature Card */}
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="w-full flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                      <PenTool className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Create Signature
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Draw or type a handwritten signature
                      </div>
                    </div>
                  </button>

                  {/* Highlighter Card */}
                  <button
                    onClick={() => {
                      setTool("highlight");
                      setSelectedId(null);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      tool === "highlight"
                        ? "border-amber-500 bg-amber-50/80 dark:border-amber-500 dark:bg-amber-950/50"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      <Highlighter className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Highlighter
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Highlight text with vibrant colors
                      </div>
                    </div>
                  </button>

                  {/* Freehand Draw Card */}
                  <button
                    onClick={() => {
                      setTool("draw");
                      setSelectedId(null);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      tool === "draw"
                        ? "border-blue-500 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-950/50"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                      <Pencil className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Freehand Draw
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Draw freehand lines and marks
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* TAB 3: FORMS */}
              {tab === "forms" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Document Fields ({fields.length + userFieldAnnots.length})
                    </h4>
                    <button
                      onClick={() => setShowFormFieldModal(true)}
                      className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Field
                    </button>
                  </div>

                  <p className="rounded-lg bg-indigo-50 px-2.5 py-2 text-[11px] leading-relaxed text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                    Fields are saved as real, fillable PDF fields. Reopen the exported
                    file here or in any PDF reader and you only need to change the
                    values — the layout stays put.
                  </p>

                  {fields.length + userFieldAnnots.length > 0 ? (
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                      {/* Fields that were already in the uploaded PDF */}
                      {fields.map((f) => (
                        <div
                          key={`src-${f.name}`}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 dark:border-slate-800 dark:bg-slate-950/40"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              🏷️ {f.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] uppercase font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {f.type}
                              </span>
                              <button
                                onClick={() => removeFormField(f.name)}
                                title={`Delete field "${f.name}"`}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {f.type === "dropdown" ? (
                            <select
                              value={f.value}
                              onChange={(e) => updateSourceField(f.name, e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              {(f.options ?? ["Option 1", "Option 2"]).map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : f.type === "checkbox" ? (
                            <div className="flex items-center gap-2 pt-0.5">
                              <input
                                type="checkbox"
                                checked={f.value === "on" || f.value === "true"}
                                onChange={(e) =>
                                  updateSourceField(f.name, e.target.checked ? "on" : "")
                                }
                                className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Checked
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={f.value}
                              placeholder={`Enter value for ${f.name}...`}
                              onChange={(e) => updateSourceField(f.name, e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                          )}
                        </div>
                      ))}

                      {/* Fields added in this session */}
                      {userFieldAnnots.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setPageIndex(a.page);
                            setSelectedId(a.id);
                          }}
                          className={`cursor-pointer rounded-xl border p-3 space-y-1 transition ${
                            selectedId === a.id
                              ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30"
                              : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <input
                              value={a.fieldName ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => patch(a.id, { fieldName: e.target.value })}
                              placeholder="Field name"
                              title="The name this field will carry in the PDF"
                              className="min-w-0 flex-1 rounded border-0 bg-transparent px-0 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:px-1.5 focus:py-0.5 focus:ring-1 focus:ring-indigo-400 dark:text-slate-200 dark:focus:bg-slate-900"
                            />
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] uppercase font-mono text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {a.fieldType ?? "text"}
                              </span>
                              <span className="text-[9px] text-slate-400">p{a.page + 1}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAnnot(a.id);
                                }}
                                title="Delete this field"
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {a.fieldType === "dropdown" ? (
                            <select
                              value={a.fieldValue ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setFieldValue(a, e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              {(a.fieldOptions ?? ["Option 1", "Option 2"]).map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : a.fieldType === "checkbox" ? (
                            <div className="flex items-center gap-2 pt-0.5">
                              <input
                                type="checkbox"
                                checked={a.fieldValue === "on" || a.fieldValue === "true"}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setFieldValue(a, e.target.checked ? "on" : "")
                                }
                                className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Checked
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={a.fieldValue ?? ""}
                              placeholder="Default value (can be left empty)"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setFieldValue(a, e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                          )}

                          {/* Background is opt-in. A field that paints over the
                              page erases whatever it sits on, so the default is
                              transparent and covering is chosen deliberately. */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 pt-1"
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Background
                            </span>
                            <button
                              onClick={() => patch(a.id, { bgColor: undefined })}
                              title="Let the page show through (default)"
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                                !a.bgColor
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              None
                            </button>
                            <button
                              onClick={() =>
                                patch(a.id, {
                                  bgColor: sampleFillUnder({
                                    x: a.x,
                                    y: a.y,
                                    w: a.w ?? 0.16,
                                    h: a.h ?? 0.028,
                                  }),
                                })
                              }
                              title="Fill with the colour of the page underneath, hiding whatever the field covers"
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                                a.bgColor
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              Cover
                            </button>
                            <input
                              type="color"
                              value={a.bgColor ?? "#ffffff"}
                              onChange={(e) => patch(a.id, { bgColor: e.target.value })}
                              aria-label="Exact background colour"
                              title="Pick an exact background colour"
                              className="h-5 w-7 cursor-pointer rounded border border-slate-300 bg-transparent p-0 dark:border-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                      No interactive fields yet. Click <strong>&ldquo;+ Add Field&rdquo;</strong> to place text boxes, checkboxes, or dropdowns.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ORGANIZE */}
              {tab === "organize" && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    Organize Pages ({pages.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {pages.map((p, i) => (
                      <div
                        key={`${p.sourceIndex}-${i}`}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                          pageIndex === i
                            ? "border-blue-500 shadow-md ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                        }`}
                      >
                        <div
                          onClick={() => setPageIndex(i)}
                          className="relative aspect-[3/4] cursor-pointer overflow-hidden grid place-items-center bg-slate-200/50 dark:bg-slate-900"
                        >
                          {p.thumbnail && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.thumbnail}
                              alt={`Page ${i + 1}`}
                              style={{ transform: `rotate(${p.rotation}deg)` }}
                              className="max-h-full max-w-full transition-transform pointer-events-none"
                            />
                          )}
                          <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                            {i + 1}
                          </span>
                        </div>

                        <div className="flex items-center justify-around border-t border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                          <button
                            onClick={() => movePage(i, -1)}
                            disabled={i === 0}
                            title="Move Left"
                            className="rounded p-1 text-slate-500 hover:text-blue-600 disabled:opacity-25"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => rotatePage(i, 90)}
                            title="Rotate Right"
                            className="rounded p-1 text-slate-500 hover:text-blue-600"
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removePage(i)}
                            disabled={pages.length <= 1}
                            title="Delete Page"
                            className="rounded p-1 text-slate-500 hover:text-red-500 disabled:opacity-25"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => movePage(i, 1)}
                            disabled={i === pages.length - 1}
                            title="Move Right"
                            className="rounded p-1 text-slate-500 hover:text-blue-600 disabled:opacity-25"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
          );

          return isFullscreen && mounted
            ? createPortal(studioContent, document.body)
            : studioContent;
        })()
      )}

      {/* SIGNATURE MODAL - PORTALED TO BODY FOR EXACT CENTER */}
      {showSignatureModal && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-blue-600" /> Create Signature
                </h3>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Draw vs Type Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  onClick={() => setSigMode("draw")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    sigMode === "draw"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Draw Signature
                </button>
                <button
                  onClick={() => setSigMode("type")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    sigMode === "type"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Type Signature
                </button>
              </div>

              {sigMode === "draw" ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-slate-300 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                    <canvas
                      ref={sigCanvasRef}
                      width={460}
                      height={160}
                      onMouseDown={handleSigCanvasDown}
                      onMouseMove={handleSigCanvasMove}
                      onMouseUp={handleSigCanvasUp}
                      onMouseLeave={handleSigCanvasUp}
                      className="w-full cursor-crosshair rounded-lg bg-white touch-none"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Draw with mouse or touchscreen</span>
                    <button
                      onClick={clearSigCanvas}
                      className="text-red-600 hover:underline"
                    >
                      Clear pad
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Type your full name..."
                    value={typedSigText}
                    onChange={(e) => setTypedSigText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  {typedSigText && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                      <p
                        style={{
                          fontFamily:
                            "'Brush Script MT', 'Dancing Script', cursive, sans-serif",
                        }}
                        className="text-3xl italic text-slate-800 dark:text-slate-100"
                      >
                        {typedSigText}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={sigMode === "draw" ? saveDrawnSignature : saveTypedSignature}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Insert Signature
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* INTERACTIVE FORM FIELD CREATOR MODAL - PORTALED TO BODY FOR EXACT CENTER */}
      {showFormFieldModal && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" /> Add Interactive Form Field
                </h3>
                <button
                  onClick={() => setShowFormFieldModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Create an interactive AcroForm field that anyone can click, fill out, and edit in Adobe Acrobat, Chrome, or any PDF reader.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Field Identifier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. full_name, invoice_date, customer_sign, agreed_terms"
                    value={formFieldName}
                    onChange={(e) => setFormFieldName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Field Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["text", "Text Input"],
                        ["checkbox", "Checkbox"],
                        ["dropdown", "Dropdown"],
                      ] as const
                    ).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormFieldType(type)}
                        className={`rounded-xl border p-2 text-xs font-semibold transition ${
                          formFieldType === type
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {formFieldType === "dropdown" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Dropdown Options (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={formFieldOpts}
                      onChange={(e) => setFormFieldOpts(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                ) : formFieldType === "checkbox" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={formFieldVal === "on"}
                      onChange={(e) => setFormFieldVal(e.target.checked ? "on" : "")}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Default checked</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Default Initial Value (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe / Initial text"
                      value={formFieldVal}
                      onChange={(e) => setFormFieldVal(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormFieldModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const opts =
                      formFieldType === "dropdown"
                        ? formFieldOpts
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                        : [];
                    insertFormField(formFieldName, formFieldType, formFieldVal, opts);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Insert Field onto Page
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
