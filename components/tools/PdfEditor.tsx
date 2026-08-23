"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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

export type EditorTab = "edit" | "pages" | "fields";

export type FontCategory = "sans-serif" | "serif" | "monospace";

export interface Annot {
  id: string;
  page: number;
  type: "text" | "whiteout" | "highlight" | "image" | "draw" | "signature";
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
  const combined = `${fontName || ""} ${styleObj?.fontFamily || ""}`.toLowerCase();

  const isBold =
    combined.includes("bold") ||
    combined.includes("black") ||
    combined.includes("heavy") ||
    combined.includes("700") ||
    combined.includes("800") ||
    combined.includes("900") ||
    /-b\b|_b\b|\bbold\b/i.test(combined);

  const isItalic =
    combined.includes("italic") ||
    combined.includes("oblique") ||
    combined.includes("slanted") ||
    /-i\b|_i\b|\bitalic\b/i.test(combined);

  let fontCategory: FontCategory = "sans-serif";
  if (
    combined.includes("times") ||
    combined.includes("serif") ||
    combined.includes("georgia") ||
    combined.includes("garamond") ||
    combined.includes("roman") ||
    combined.includes("cambria") ||
    combined.includes("minion") ||
    combined.includes("baskerville")
  ) {
    fontCategory = "serif";
  } else if (
    combined.includes("courier") ||
    combined.includes("mono") ||
    combined.includes("consolas") ||
    combined.includes("code") ||
    combined.includes("typewriter") ||
    combined.includes("menlo")
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Drawing state
  const isDrawing = useRef(false);
  const currentDrawPoints = useRef<{ x: number; y: number }[]>([]);

  const bytesRef = useRef<ArrayBuffer | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number; startX: number; startY: number } | null>(null);
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
        setSelectedId(null);
        setEditingId(null);
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

  /** Sample background colour of the text */
  const sampleBackground = (r: TextRun): string => {
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
    let best = "#ffffff",
      n = 0;
    for (const [k, v] of counts)
      if (v > n) {
        best = k;
        n = v;
      }
    return best;
  };

  /** Sample ink colour of the text */
  const sampleInk = (r: TextRun): string => {
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
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum < bl) {
        bl = lum;
        bi = i;
      }
    }
    return bi < 0 ? "#000000" : toHex(d[bi], d[bi + 1], d[bi + 2]);
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
    setStatus("Reading document…");
    try {
      const buf = await file.arrayBuffer();
      bytesRef.current = buf.slice(0);

      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument(pdfDocumentOptions(buf.slice(0)));
      const doc = await task.promise;

      const next: PageState[] = [];
      const foundRuns: TextRun[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`Rendering page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvas, viewport: vp, background: "#ffffff" }).promise;

        const base = page.getViewport({ scale: 1 });

        try {
          const content = await page.getTextContent();
          content.items.forEach((item, k) => {
            if (!("str" in item) || !item.str.trim()) return;
            const t = pdfjs.Util.transform(base.transform, item.transform);
            const size = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 12;
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
    const padX = 1.5 / page.width;
    const padY = 2.0 / page.height;
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
        w: r.w + padX * 2,
        h: r.h + padY * 2,
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

  /** Stage click handler for placing tools */
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

  /** Pointer move for dragging */
  const onPointerMove = (e: React.PointerEvent) => {
    if (tool === "draw") {
      onDrawMove(e);
      return;
    }
    const d = dragRef.current;
    if (!d || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width - d.dx));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height - d.dy));
    setAnnots((list) => list.map((a) => (a.id === d.id ? { ...a, x, y } : a)));
  };

  /** End drag */
  const endDrag = () => {
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
    setAnnots((list) => list.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
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

  /** Export edited PDF with precise font family, bold, italic, and size embedding */
  const save = async () => {
    if (!bytesRef.current || !pages.length) return;
    setBusy(true);
    setStatus("Generating PDF with your matching font edits…");
    try {
      const src = await PDFDocument.load(bytesRef.current.slice(0));

      // Write form fields back
      if (fields.length) {
        try {
          const form = src.getForm();
          for (const f of fields) {
            if (f.type === "text") form.getTextField(f.name).setText(f.value);
            else if (f.type === "checkbox") {
              const cb = form.getCheckBox(f.name);
              if (f.value) cb.check();
              else cb.uncheck();
            } else if (f.type === "dropdown" && f.value) {
              form.getDropdown(f.name).select(f.value);
            }
          }
        } catch (e) {
          console.warn("Some form fields could not be written:", e);
        }
      }

      const out = await PDFDocument.create();

      // Embed full font matrix for exact matching
      const helvetica = await out.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await out.embedFont(StandardFonts.HelveticaBold);
      const helveticaOblique = await out.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldOblique = await out.embedFont(StandardFonts.HelveticaBoldOblique);

      const timesRoman = await out.embedFont(StandardFonts.TimesRoman);
      const timesRomanBold = await out.embedFont(StandardFonts.TimesRomanBold);
      const timesRomanItalic = await out.embedFont(StandardFonts.TimesRomanItalic);
      const timesRomanBoldItalic = await out.embedFont(StandardFonts.TimesRomanBoldItalic);

      const courier = await out.embedFont(StandardFonts.Courier);
      const courierBold = await out.embedFont(StandardFonts.CourierBold);
      const courierOblique = await out.embedFont(StandardFonts.CourierOblique);
      const courierBoldOblique = await out.embedFont(StandardFonts.CourierBoldOblique);

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

      const copied = await out.copyPages(
        src,
        pages.map((p) => p.sourceIndex)
      );

      for (let i = 0; i < copied.length; i++) {
        const page = copied[i];
        const extra = pages[i].rotation;
        if (extra) {
          page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        }
        out.addPage(page);

        const { width, height } = page.getSize();
        const mine = annots.filter((x) => x.page === i);

        // Sort covers first, then highlights, then text, images, drawings
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
            const font = resolveFont(
              a.fontCategory,
              a.isBold,
              a.isItalic
            );
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
          } else if (
            (a.type === "image" || a.type === "signature") &&
            a.dataUrl
          ) {
            const img = a.dataUrl.startsWith("data:image/png")
              ? await out.embedPng(a.dataUrl)
              : await out.embedJpg(a.dataUrl);
            page.drawImage(img, {
              x: px,
              y: py - (a.h ?? 0.12) * height,
              width: (a.w ?? 0.3) * width,
              height: (a.h ?? 0.12) * height,
            });
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

      const bytes = await out.save();
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
  const pageRuns = runs.filter(
    (r) => r.page === pageIndex && !usedRuns.has(r.id)
  );
  const scale = current && stageW ? stageW / current.width : 1;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {pages.length === 0 && (
        <div className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-400/60 dark:border-blue-500/40 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/50 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-950 p-10 text-center transition-all hover:border-blue-500 hover:shadow-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <FileUp className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              Upload PDF to Edit Words & Match Fonts
            </p>
            <p className="max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Click any text directly on the page to retype words with <strong>matching font style, weight, size, and color</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              Font & Weight Matching
            </span>
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              Direct In-Place Editing
            </span>
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              100% Private (No Uploads)
            </span>
          </div>

          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0])}
            aria-label="Choose a PDF"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
          />
        </div>
      )}

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

      {/* Main PDF Editor Workspace */}
      {pages.length > 0 && !busy && (
        <div className="space-y-3">
          {/* Header Navigation & Main Actions Bar */}
          <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
            {/* Primary Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ["edit", "Editor & Words", Pencil],
                  [
                    "fields",
                    `Form Fields${fields.length ? ` (${fields.length})` : ""}`,
                    ListChecks,
                  ],
                  ["pages", `Pages (${pages.length})`, Layers],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => {
                    setTab(id);
                    setSelectedId(null);
                    setEditingId(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    tab === id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Quick Actions (Undo, Redo, Zoom, Save) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={undo}
                disabled={!history.length}
                title="Undo (Ctrl+Z)"
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-200"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={redo}
                disabled={!redoStack.length}
                title="Redo (Ctrl+Y)"
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-200"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

              {/* Page Selector */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                <button
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                  className="rounded p-0.5 text-slate-600 hover:text-blue-600 disabled:opacity-30 dark:text-slate-300"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {pageIndex + 1} / {pages.length}
                </span>
                <button
                  onClick={() =>
                    setPageIndex((p) => Math.min(pages.length - 1, p + 1))
                  }
                  disabled={pageIndex === pages.length - 1}
                  className="rounded p-0.5 text-slate-600 hover:text-blue-600 disabled:opacity-30 dark:text-slate-300"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Export PDF */}
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
              >
                <Download className="h-3.5 w-3.5" /> Save PDF
              </button>
            </div>
          </div>

          {/* EDIT MODE */}
          {tab === "edit" && current && (
            <div className="space-y-3">
              {/* Secondary Visual Tool Bar & Active Font Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 p-2 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setTool("select");
                      setEditingId(null);
                    }}
                    title="Click any word to edit with matching font"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      tool === "select"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <MousePointer2 className="h-3.5 w-3.5" /> Edit Words & Select
                  </button>

                  <button
                    onClick={() => {
                      setTool("text");
                      setSelectedId(null);
                      setEditingId(null);
                    }}
                    title="Click anywhere to type new text"
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      tool === "text"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Type className="h-3.5 w-3.5" /> Add Text
                  </button>

                  <button
                    onClick={() => {
                      setTool("whiteout");
                      setSelectedId(null);
                      setEditingId(null);
                    }}
                    title="Cover any area with background color"
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      tool === "whiteout"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Square className="h-3.5 w-3.5" /> Cover Area
                  </button>

                  <button
                    onClick={() => {
                      setTool("highlight");
                      setSelectedId(null);
                      setEditingId(null);
                    }}
                    title="Highlight text with marker"
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      tool === "highlight"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Highlighter className="h-3.5 w-3.5" /> Highlight
                  </button>

                  <button
                    onClick={() => setShowSignatureModal(true)}
                    title="Draw or insert signature"
                    className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <PenTool className="h-3.5 w-3.5" /> Sign
                  </button>

                  <label className="relative flex cursor-pointer items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <ImageIcon className="h-3.5 w-3.5" /> Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => addImage(e.target.files?.[0])}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>

                {/* Font Styling Controls for Text */}
                <div className="flex items-center gap-1.5">
                  {/* Font Family Selector */}
                  <select
                    value={fontCategory}
                    onChange={(e) => {
                      const cat = e.target.value as FontCategory;
                      setFontCategory(cat);
                      if (selectedId) patch(selectedId, { fontCategory: cat });
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="sans-serif">Sans (Helvetica / Arial)</option>
                    <option value="serif">Serif (Times New Roman)</option>
                    <option value="monospace">Mono (Courier New)</option>
                  </select>

                  {/* Font Size Selector */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                    <button
                      onClick={() => {
                        const next = Math.max(6, fontSize - 1);
                        setFontSize(next);
                        if (selectedId) patch(selectedId, { size: next });
                      }}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Decrease font size"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-1 text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {fontSize}pt
                    </span>
                    <button
                      onClick={() => {
                        const next = Math.min(72, fontSize + 1);
                        setFontSize(next);
                        if (selectedId) patch(selectedId, { size: next });
                      }}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Increase font size"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Bold & Italic Toggles */}
                  <button
                    onClick={() => {
                      const next = !isBold;
                      setIsBold(next);
                      if (selectedId) patch(selectedId, { isBold: next });
                    }}
                    title="Bold"
                    className={`rounded-lg p-1.5 border transition ${
                      isBold
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                    title="Italic"
                    className={`rounded-lg p-1.5 border transition ${
                      isItalic
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>

                  {/* Color Picker */}
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        if (selectedId) patch(selectedId, { color: e.target.value });
                      }}
                      title="Font Color"
                      className="h-7 w-7 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0 dark:border-slate-700"
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-1 py-0.5 dark:border-slate-700 dark:bg-slate-800 ml-1">
                    <button
                      onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
                      title="Zoom Out"
                      className="rounded p-1 text-slate-600 hover:text-blue-600 dark:text-slate-300"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom((z) => Math.min(1.7, z + 0.15))}
                      title="Zoom In"
                      className="rounded p-1 text-slate-600 hover:text-blue-600 dark:text-slate-300"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Hint */}
              <div className="flex items-center justify-between rounded-lg bg-blue-50/80 px-3 py-1.5 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                <span>
                  ✨ <strong>Auto-Font Match Active:</strong> Clicking any word auto-detects its exact font category (Serif/Sans/Mono), weight (Bold/Regular), size, and ink color!
                </span>
                {pageRuns.length > 0 && (
                  <button
                    onClick={() => setShowRuns((s) => !s)}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {showRuns ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {showRuns ? "Hide Word Boxes" : "Show Word Boxes"}
                  </button>
                )}
              </div>

              {/* Main Document Canvas Viewport */}
              <div
                ref={containerRef}
                className="relative overflow-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-4 text-center dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div
                  ref={stageRef}
                  onClick={handleStageClick}
                  onPointerDown={tool === "draw" ? startDrawing : undefined}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  style={{
                    width: `${zoom * 100}%`,
                    maxWidth: zoom > 1 ? undefined : "100%",
                  }}
                  className={`relative mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 ${
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
                    showRuns &&
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

                  {/* Render All Annotations / User Placed Elements */}
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
                          if (a.type === "text") {
                            setFontCategory(a.fontCategory || "sans-serif");
                            setIsBold(!!a.isBold);
                            setIsItalic(!!a.isItalic);
                            setFontSize(a.size ?? 14);
                            setTextColor(a.color ?? "#000000");
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
                              ? a.color || "#ffffff"
                              : a.type === "highlight"
                              ? a.color || "#fef08a"
                              : undefined,
                          opacity:
                            a.type === "highlight"
                              ? a.opacity ?? 0.45
                              : undefined,
                          color: a.type === "text" ? a.color || "#000000" : undefined,
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
                        {/* DIRECT INLINE EDITING */}
                        {a.type === "text" && isEditing ? (
                          <div className="relative z-30" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              ref={inlineInputRef}
                              value={a.text ?? ""}
                              rows={Math.max(1, (a.text ?? "").split("\n").length)}
                              onChange={(e) =>
                                patch(a.id, { text: e.target.value })
                              }
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  setEditingId(null);
                                } else if (e.key === "Escape") {
                                  setEditingId(null);
                                }
                              }}
                              style={{
                                color: a.color || "#000000",
                                fontSize: `${(a.size ?? 14) * scale}px`,
                                lineHeight: 1.2,
                                fontFamily: getFontFamilyCss(a.fontCategory),
                                fontWeight: a.isBold ? 700 : 400,
                                fontStyle: a.isItalic ? "italic" : "normal",
                                minWidth: "80px",
                              }}
                              className="m-0 rounded border border-blue-500 bg-white/95 px-1.5 py-0.5 shadow-lg outline-none ring-2 ring-blue-500/50 dark:bg-slate-900"
                            />
                            <div className="absolute -top-7 left-0 flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white shadow">
                              <span>Press Enter to save</span>
                              <button
                                onClick={() => setEditingId(null)}
                                className="ml-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ) : a.type === "text" ? (
                          <span className="px-0.5">{a.text || " "}</span>
                        ) : null}

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

                        {/* Floating Quick Action Pill above Selected Item */}
                        {isSelected && !isEditing && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute -top-9 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
                          >
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
                              a.type === "highlight" ||
                              a.type === "image" ||
                              a.type === "signature") && (
                              <>
                                <button
                                  onClick={() =>
                                    patch(a.id, {
                                      w: Math.max(0.05, (a.w ?? 0.25) - 0.05),
                                    })
                                  }
                                  title="Narrower"
                                  className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    patch(a.id, {
                                      w: Math.min(0.95, (a.w ?? 0.25) + 0.05),
                                    })
                                  }
                                  title="Wider"
                                  className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => duplicateAnnot(a.id)}
                              title="Duplicate"
                              className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                            >
                              <Copy className="h-3 w-3" />
                            </button>

                            <button
                              onClick={() => removeAnnot(a.id)}
                              title="Delete"
                              className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* FORM FIELDS MODE */}
          {tab === "fields" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive Form Fields
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {fields.length > 0
                    ? `Found ${fields.length} interactive form fields in this document. Edit values below and save.`
                    : "No interactive PDF form fields found in this document. Use the Editor tab to click and retype text directly."}
                </p>
              </div>

              {fields.length > 0 && (
                <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
                  {fields.map((f, i) => (
                    <label
                      key={f.name}
                      className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {f.name}
                      </span>
                      {f.type === "dropdown" ? (
                        <select
                          value={f.value}
                          onChange={(e) =>
                            setFields((p) =>
                              p.map((x, j) =>
                                j === i ? { ...x, value: e.target.value } : x
                              )
                            )
                          }
                          className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          {(f.options ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "checkbox" ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            checked={!!f.value}
                            onChange={(e) =>
                              setFields((p) =>
                                p.map((x, j) =>
                                  j === i
                                    ? { ...x, value: e.target.checked ? "on" : "" }
                                    : x
                                )
                              )
                            }
                            className="h-5 w-5 cursor-pointer accent-blue-600 rounded"
                          />
                          <span className="text-xs text-slate-500">Checked</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={f.value}
                          onChange={(e) =>
                            setFields((p) =>
                              p.map((x, j) =>
                                j === i ? { ...x, value: e.target.value } : x
                              )
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAGES MANAGER MODE */}
          {tab === "pages" && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Organize & Rotate Pages
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reorder pages, rotate sideways sheets, or delete unwanted pages.
                  </p>
                </div>
              </div>

              <ul className="grid grid-cols-2 gap-4 @sm:grid-cols-3 @md:grid-cols-4 @xl:grid-cols-6">
                {pages.map((p, i) => (
                  <li
                    key={`${p.sourceIndex}-${i}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 transition hover:shadow-md"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden grid place-items-center bg-slate-200/50 dark:bg-slate-900">
                      {p.thumbnail && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.thumbnail}
                          alt={`Page ${i + 1}`}
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                          className="max-h-full max-w-full transition-transform"
                        />
                      )}
                      <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-bold text-white shadow">
                        {i + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-around border-t border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
                      <button
                        onClick={() => movePage(i, -1)}
                        disabled={i === 0}
                        title="Move Left"
                        className="rounded p-1 text-slate-500 hover:text-blue-600 disabled:opacity-25"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => rotatePage(i, -90)}
                        title="Rotate Left"
                        className="rounded p-1 text-slate-500 hover:text-blue-600"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => rotatePage(i, 90)}
                        title="Rotate Right"
                        className="rounded p-1 text-slate-500 hover:text-blue-600"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removePage(i)}
                        disabled={pages.length <= 1}
                        title="Delete Page"
                        className="rounded p-1 text-slate-500 hover:text-red-500 disabled:opacity-25"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => movePage(i, 1)}
                        disabled={i === pages.length - 1}
                        title="Move Right"
                        className="rounded p-1 text-slate-500 hover:text-blue-600 disabled:opacity-25"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SIGNATURE MODAL */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
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
        </div>
      )}
    </div>
  );
}
