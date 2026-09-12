"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import JsBarcode from "jsbarcode";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { downloadDataUrl } from "@/lib/utils/download";
import {
  Barcode,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Palette,
  Settings,
  Printer,
  Trash2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ArrowRightLeft,
  FileSpreadsheet,
  FileUp,
  FolderDown,
  Archive,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import JSZip from "jszip";

export type BarcodeFormat =
  | "CODE128"
  | "EAN13"
  | "EAN8"
  | "UPC"
  | "UPCE"
  | "CODE39"
  | "ITF14"
  | "MSI"
  | "pharmacode"
  | "codabar";

interface BarcodePreset {
  id: string;
  name: string;
  desc: string;
  format: BarcodeFormat;
  defaultVal: string;
}

const BARCODE_PRESETS: BarcodePreset[] = [
  {
    id: "retail-ean13",
    name: "Retail Product (EAN-13)",
    desc: "Global 13-digit standard for retail products",
    format: "EAN13",
    defaultVal: "978020137962",
  },
  {
    id: "retail-upca",
    name: "US Supermarket (UPC-A)",
    desc: "North American 12-digit standard",
    format: "UPC",
    defaultVal: "01234567890",
  },
  {
    id: "logistics-code128",
    name: "Shipping & Logistics (Code 128)",
    desc: "High-density alphanumeric for packages & inventory",
    format: "CODE128",
    defaultVal: "TB-SHIP-2026-X9",
  },
  {
    id: "carton-itf14",
    name: "Master Carton (ITF-14)",
    desc: "14-digit standard for outer corrugated boxes",
    format: "ITF14",
    defaultVal: "1001234567890",
  },
  {
    id: "asset-code39",
    name: "Asset Tracking (Code 39)",
    desc: "Industrial & defense alphanumeric standard",
    format: "CODE39",
    defaultVal: "ASSET-84920",
  },
  {
    id: "compact-ean8",
    name: "Small Item (EAN-8)",
    desc: "8-digit compact code for small retail items",
    format: "EAN8",
    defaultVal: "9638507",
  },
];

interface BarcodeHistoryItem {
  id: string;
  val: string;
  format: BarcodeFormat;
  fg: string;
  bg: string;
  timestamp: number;
}

export default function BarcodeGenerator() {
  const [format, setFormat] = usePersistentState<BarcodeFormat>("bc_format", "CODE128");
  const [val, setVal] = usePersistentState<string>("bc_val", "TB-LOGISTICS-9842");

  // Customization
  const [barWidth, setBarWidth] = usePersistentState<number>("bc_width", 2);
  const [barHeight, setBarHeight] = usePersistentState<number>("bc_height", 90);
  const [margin, setMargin] = usePersistentState<number>("bc_margin", 12);
  const [displayValue, setDisplayValue] = usePersistentState<boolean>("bc_show_text", true);
  const [font, setFont] = usePersistentState<string>("bc_font", "monospace");
  const [fontSize, setFontSize] = usePersistentState<number>("bc_font_size", 16);
  const [textPosition, setTextPosition] = usePersistentState<"bottom" | "top">("bc_text_pos", "bottom");
  const [textAlign, setTextAlign] = usePersistentState<"center" | "left" | "right">("bc_text_align", "center");

  // Colors
  const [fgColor, setFgColor] = usePersistentState<string>("bc_fg", "#0f172a");
  const [bgColor, setBgColor] = usePersistentState<string>("bc_bg", "#ffffff");
  const [transparentBg, setTransparentBg] = useState<boolean>(false);

  // States
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copiedPng, setCopiedPng] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [exportScale, setExportScale] = useState<number>(2); // 1x, 2x, 4x

  // History
  const [history, setHistory] = usePersistentState<BarcodeHistoryItem[]>("bc_history", []);

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasExportRef = useRef<HTMLCanvasElement>(null);
  const csvBatchInputRef = useRef<HTMLInputElement>(null);

  // Batch CSV Mode State
  interface BarcodeBatchItem {
    id: string;
    label: string;
    format: BarcodeFormat;
    value: string;
  }

  const [mode, setMode] = useState<"single" | "batch">("single");
  const [batchItems, setBatchItems] = useState<BarcodeBatchItem[]>([
    { id: "1", label: "Inventory Item Alpha", format: "CODE128", value: "INV-ITEM-001" },
    { id: "2", label: "Warehouse Box Beta", format: "CODE128", value: "WH-BOX-892" },
    { id: "3", label: "Retail Book Standard", format: "EAN13", value: "9780201379624" },
    { id: "4", label: "Carton Master Case", format: "ITF14", value: "1001234567890" },
    { id: "5", label: "Industrial Asset Tag", format: "CODE39", value: "ASSET-991" },
    { id: "6", label: "Supermarket Product", format: "UPC", value: "012345678905" },
  ]);
  const [batchSelectedIdx, setBatchSelectedIdx] = useState<number>(0);
  const [batchIsExporting, setBatchIsExporting] = useState<boolean>(false);
  const [newBatchLabel, setNewBatchLabel] = useState<string>("");
  const [newBatchFormat, setNewBatchFormat] = useState<BarcodeFormat>("CODE128");
  const [newBatchValue, setNewBatchValue] = useState<string>("");

  const handleCsvUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const parsed: BarcodeBatchItem[] = [];
      const startIdx = lines[0].toLowerCase().includes("value") || lines[0].toLowerCase().includes("format") || lines[0].toLowerCase().includes("label") ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length === 1 && cols[0]) {
          parsed.push({
            id: String(Date.now() + i),
            label: `Item #${i + 1}`,
            format: "CODE128",
            value: cols[0],
          });
        } else if (cols.length === 2) {
          parsed.push({
            id: String(Date.now() + i),
            label: cols[0] || `Item #${i + 1}`,
            format: "CODE128",
            value: cols[1],
          });
        } else if (cols.length >= 3) {
          const rawFormat = cols[1].toUpperCase() as BarcodeFormat;
          const validFormats: BarcodeFormat[] = ["CODE128", "EAN13", "EAN8", "UPC", "UPCE", "CODE39", "ITF14", "MSI", "pharmacode", "codabar"];
          const resolvedFormat = validFormats.includes(rawFormat) ? rawFormat : "CODE128";
          parsed.push({
            id: String(Date.now() + i),
            label: cols[0] || `Item #${i + 1}`,
            format: resolvedFormat,
            value: cols[2],
          });
        }
      }

      if (parsed.length > 0) {
        setBatchItems(parsed);
        setBatchSelectedIdx(0);
        setVal(parsed[0].value);
        setFormat(parsed[0].format);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const sample = `Label,Format,Value
Logistics Box Alpha,CODE128,TB-LOG-1001
Retail Book Item,EAN13,9780201379624
Supermarket Can,UPC,012345678905
Warehouse Carton,ITF14,1001234567890
Asset Equipment,CODE39,ASSET-8492
Compact Item,EAN8,96385074`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-services-barcodes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllBatchCsv = () => {
    if (batchItems.length === 0) return;
    const header = "Label,Format,Value,ExportDate\n";
    const nowIso = new Date().toISOString();
    const rows = batchItems
      .map((item) => `"${item.label.replace(/"/g, '""')}","${item.format}","${item.value.replace(/"/g, '""')}","${nowIso}"`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-services-barcodes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
  };

  const downloadAllBatchZip = async () => {
    if (batchItems.length === 0) return;
    setBatchIsExporting(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("barcodes");

      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        const canvas = document.createElement("canvas");
        try {
          JsBarcode(canvas, item.value, {
            format: item.format,
            width: barWidth,
            height: barHeight,
            displayValue: displayValue,
            font: font,
            fontSize: fontSize,
            textAlign: textAlign,
            textPosition: textPosition,
            lineColor: fgColor,
            background: transparentBg ? "rgba(0,0,0,0)" : bgColor,
            margin: margin,
          });

          const dataUrl = canvas.toDataURL("image/png");
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          const safeLabel = item.label.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().slice(0, 30);
          const fileName = `${String(i + 1).padStart(2, "0")}-${safeLabel || "barcode"}.png`;
          folder?.file(fileName, base64Data, { base64: true });
        } catch (err) {
          console.warn(`Could not render barcode for item #${i + 1} (${item.value}):`, err);
        }
      }

      const header = "Index,Label,Format,Value\n";
      const csvContent = header + batchItems.map((it, idx) => `${idx + 1},"${it.label.replace(/"/g, '""')}","${it.format}","${it.value.replace(/"/g, '""')}"`).join("\n");
      zip.file("services-barcodes-manifest.csv", csvContent);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-services-barcodes-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.85 } });
    } catch (err) {
      console.error("Batch ZIP export error:", err);
    } finally {
      setBatchIsExporting(false);
    }
  };

  const handleAddBatchItem = () => {
    if (!newBatchValue.trim()) return;
    const newItem: BarcodeBatchItem = {
      id: String(Date.now()),
      label: newBatchLabel.trim() || `Item #${batchItems.length + 1}`,
      format: newBatchFormat,
      value: newBatchValue.trim(),
    };
    setBatchItems((prev) => [...prev, newItem]);
    setNewBatchLabel("");
    setNewBatchValue("");
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (batchSelectedIdx >= next.length) {
        setBatchSelectedIdx(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const selectBatchItem = (idx: number) => {
    setBatchSelectedIdx(idx);
    const item = batchItems[idx];
    if (item) {
      setVal(item.value);
      setFormat(item.format);
    }
  };

  // Compute checksum for EAN-13 if 12 digits provided
  const calculateEan13Checksum = (digits12: string): string => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const n = parseInt(digits12[i], 10);
      sum += i % 2 === 0 ? n : n * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return check.toString();
  };

  // Compute checksum for UPC-A if 11 digits provided
  const calculateUpcaChecksum = (digits11: string): string => {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const n = parseInt(digits11[i], 10);
      sum += i % 2 === 0 ? n * 3 : n;
    }
    const check = (10 - (sum % 10)) % 10;
    return check.toString();
  };

  // Compute checksum for EAN-8 if 7 digits provided
  const calculateEan8Checksum = (digits7: string): string => {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const n = parseInt(digits7[i], 10);
      sum += i % 2 === 0 ? n * 3 : n;
    }
    const check = (10 - (sum % 10)) % 10;
    return check.toString();
  };

  // Auto-fill Checksum helper button
  const autoChecksumSuggestion = useMemo(() => {
    const raw = val.trim();
    if (format === "EAN13") {
      if (/^\d{12}$/.test(raw)) {
        return raw + calculateEan13Checksum(raw);
      }
    } else if (format === "UPC") {
      if (/^\d{11}$/.test(raw)) {
        return raw + calculateUpcaChecksum(raw);
      }
    } else if (format === "EAN8") {
      if (/^\d{7}$/.test(raw)) {
        return raw + calculateEan8Checksum(raw);
      }
    }
    return null;
  }, [val, format]);

  // Render Barcode
  useEffect(() => {
    if (!svgRef.current) return;
    setRenderError(null);

    const targetVal = val.trim();
    if (!targetVal) {
      setRenderError("Please enter a value to generate barcode.");
      return;
    }

    try {
      JsBarcode(svgRef.current, targetVal, {
        format,
        width: barWidth,
        height: barHeight,
        displayValue,
        font,
        fontSize,
        textPosition,
        textAlign,
        textMargin: 4,
        margin,
        background: transparentBg ? "transparent" : bgColor,
        lineColor: fgColor,
        valid: (valid: boolean) => {
          if (!valid) {
            setRenderError(`The value "${targetVal}" is not valid for ${format} barcode standard.`);
          }
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRenderError(msg);
    }
  }, [
    val,
    format,
    barWidth,
    barHeight,
    margin,
    displayValue,
    font,
    fontSize,
    textPosition,
    textAlign,
    bgColor,
    fgColor,
    transparentBg,
  ]);

  // Save to history helper
  const recordHistory = () => {
    const item: BarcodeHistoryItem = {
      id: String(Date.now()),
      val,
      format,
      fg: fgColor,
      bg: bgColor,
      timestamp: Date.now(),
    };
    setHistory((prev = []) => [item, ...prev.filter((p) => p.val !== item.val)].slice(0, 6));
  };

  // Render high-res Canvas from SVG for PNG exports
  const getExportDataUrl = (scaleMultiplier = 2): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!svgRef.current) return reject(new Error("SVG ref not found"));

      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scaleMultiplier;
        canvas.height = img.height * scaleMultiplier;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));

        if (!transparentBg) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Export PNG
  const handleDownloadPng = async () => {
    if (renderError) return;
    try {
      const dataUrl = await getExportDataUrl(exportScale);
      downloadDataUrl(dataUrl, `barcode-${format.toLowerCase()}-${Date.now()}.png`);
      recordHistory();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
    } catch (e) {
      console.error(e);
    }
  };

  // Export SVG
  const handleDownloadSvg = () => {
    if (!svgRef.current || renderError) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `barcode-${format.toLowerCase()}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    recordHistory();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
  };

  // Copy PNG to Clipboard
  const handleCopyPng = async () => {
    if (renderError) return;
    try {
      const dataUrl = await getExportDataUrl(2);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
      recordHistory();
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  // Copy SVG Markup
  const handleCopySvg = async () => {
    if (!svgRef.current || renderError) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      await navigator.clipboard.writeText(svgData);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
      recordHistory();
    } catch (err) {
      console.error("SVG copy error:", err);
    }
  };

  // Print Barcode Label
  const handlePrint = () => {
    if (!svgRef.current || renderError) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${val}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; text-align: center; }
              svg { max-width: 100%; height: auto; }
            }
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; margin: 0; }
          </style>
        </head>
        <body>
          <div>${svgData}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const applyPreset = (preset: BarcodePreset) => {
    setFormat(preset.format);
    setVal(preset.defaultVal);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "single"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Single Generator Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "batch"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Batch CSV (Bulk Processing)</span>
          </button>
        </div>

        {mode === "batch" && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 px-3 font-medium">
            {batchItems.length} services / items loaded
          </span>
        )}
      </div>

      {/* Preset Templates Header (Single mode only) */}
      {mode === "single" && (
        <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Popular Standard Templates</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Click to load template & format
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {BARCODE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`p-2 rounded-2xl border text-left transition ${
                  format === p.format && val === p.defaultVal
                    ? "bg-white dark:bg-slate-800 border-blue-600 shadow-xs"
                    : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {p.name}
                </div>
                <div className="text-[9px] text-slate-400 truncate">{p.format}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio Columns */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 @4xl:gap-8 items-start">
        {/* Left Column: Barcode Inputs & Customization */}
        <div className="@container @4xl:col-span-7 space-y-5">
          {/* Section 1: Single Mode or Batch Mode */}
          {mode === "single" ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Barcode Data & Standard</span>
              </div>

              {/* Symbology / Format Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Barcode Symbology Standard
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CODE128">Code 128 (Universal Alphanumeric - Shipping & Logistics)</option>
                  <option value="EAN13">EAN-13 (International Retail 13-digit code)</option>
                  <option value="UPC">UPC-A (North American Retail 12-digit code)</option>
                  <option value="EAN8">EAN-8 (Compact Retail 8-digit code)</option>
                  <option value="CODE39">Code 39 (Alphanumeric - Automotive & Defense)</option>
                  <option value="ITF14">ITF-14 (Outer Carton Shipping 14-digit code)</option>
                  <option value="MSI">MSI / Plessey (Warehouse & Inventory numeric)</option>
                  <option value="pharmacode">Pharmacode (Pharmaceutical Packaging)</option>
                  <option value="codabar">Codabar (Libraries & Blood Banks)</option>
                </select>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Barcode Content / Value
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder="Enter value or SKU..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Auto Checksum suggestion button */}
                {autoChecksumSuggestion && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-blue-700 dark:text-blue-300">
                      Auto-calculated {format} with check digit:{" "}
                      <strong className="font-mono font-bold">{autoChecksumSuggestion}</strong>
                    </span>
                    <button
                      onClick={() => setVal(autoChecksumSuggestion)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 transition"
                    >
                      Apply Check Digit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <input
                ref={csvBatchInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleCsvUpload(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />

              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex flex-col gap-1">
                <div className="font-bold flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Bulk Barcode CSV Processing</span>
                </div>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                  Process entire inventory, SKUs, and service catalogs at once. Upload a CSV (columns: <code>Label, Format, Value</code>), preview each barcode live in the preview studio, and export all as a CSV manifest or packed ZIP archive.
                </p>
              </div>

              {/* Batch Actions Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => csvBatchInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                </button>

                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                >
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>

                <button
                  type="button"
                  onClick={downloadAllBatchCsv}
                  disabled={batchItems.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download All as CSV</span>
                </button>

                <button
                  type="button"
                  onClick={downloadAllBatchZip}
                  disabled={batchItems.length === 0 || batchIsExporting}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{batchIsExporting ? "Generating ZIP..." : "Download All as ZIP (Images)"}</span>
                </button>

                {batchItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBatchItems([])}
                    className="ml-auto flex items-center gap-1 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                    title="Clear All Items"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Add Single Barcode Row */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Add Single Barcode / Item
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newBatchLabel}
                    onChange={(e) => setNewBatchLabel(e.target.value)}
                    placeholder="Label / Product Title"
                    className="sm:col-span-4 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <select
                    value={newBatchFormat}
                    onChange={(e) => setNewBatchFormat(e.target.value as BarcodeFormat)}
                    className="sm:col-span-3 px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="CODE128">Code 128</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="UPC">UPC-A</option>
                    <option value="EAN8">EAN-8</option>
                    <option value="CODE39">Code 39</option>
                    <option value="ITF14">ITF-14</option>
                  </select>
                  <input
                    type="text"
                    value={newBatchValue}
                    onChange={(e) => setNewBatchValue(e.target.value)}
                    placeholder="Barcode Value / SKU..."
                    className="sm:col-span-3 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleAddBatchItem()}
                  />
                  <button
                    type="button"
                    onClick={handleAddBatchItem}
                    disabled={!newBatchValue.trim()}
                    className="sm:col-span-2 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Loaded Barcodes ({batchItems.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Click row to preview barcode</span>
                </div>

                {batchItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No barcodes loaded. Upload a CSV file or click "Download Sample CSV" to get started.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {batchItems.map((item, idx) => {
                      const isSelected = batchSelectedIdx === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => selectBatchItem(idx)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition text-xs ${
                            isSelected
                              ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 pl-2"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                #{idx + 1} {item.label}
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.format}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                              {item.value}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[10px] font-medium px-2 py-1 rounded-lg ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {isSelected ? "Previewing" : "Preview"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBatchItem(item.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Delete row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Bar Dimensions & Quiet Zone */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Dimensions & Layout</span>
            </div>

            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Bar Width:</span>
                  <span className="font-mono font-bold">{barWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={barWidth}
                  onChange={(e) => setBarWidth(Number(e.target.value))}
                  className="w-full cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Bar Height:</span>
                  <span className="font-mono font-bold">{barHeight}px</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="160"
                  step="5"
                  value={barHeight}
                  onChange={(e) => setBarHeight(Number(e.target.value))}
                  className="w-full cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Margin / Quiet Zone:</span>
                  <span className="font-mono font-bold">{margin}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Label / Human-readable Text Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displayValue}
                    onChange={(e) => setDisplayValue(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Show Human-Readable Text Underneath</span>
                </label>
              </div>

              {displayValue && (
                <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Font Family
                    </label>
                    <select
                      value={font}
                      onChange={(e) => setFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                    >
                      <option value="monospace">Monospace</option>
                      <option value="sans-serif">Sans-serif</option>
                      <option value="serif">Serif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Font Size ({fontSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Text Position
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTextPosition("bottom")}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition ${
                          textPosition === "bottom"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        Bottom
                      </button>
                      <button
                        onClick={() => setTextPosition("top")}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition ${
                          textPosition === "top"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        Top
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Color Customization */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Colors & Palette</span>
              </div>
              <button
                onClick={() => {
                  const temp = fgColor;
                  setFgColor(bgColor);
                  setBgColor(temp);
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center space-x-1"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Invert</span>
              </button>
            </div>

            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Bars & Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full font-mono text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    disabled={transparentBg}
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0 disabled:opacity-40"
                  />
                  <input
                    type="text"
                    disabled={transparentBg}
                    value={transparentBg ? "Transparent" : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full font-mono text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Transparent BG
                </label>
                <button
                  onClick={() => setTransparentBg(!transparentBg)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
                    transparentBg
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {transparentBg ? "Alpha (ON)" : "Solid Fill"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Barcode Preview & High-Res Export */}
        <div className="@container @4xl:col-span-5 space-y-5 @4xl:sticky @4xl:top-24">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center justify-center space-y-6">
            <div className="w-full flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Live Barcode Card</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {format}
              </span>
            </div>

            {/* Error Message if barcode is invalid */}
            {renderError ? (
              <div className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{renderError}</div>
              </div>
            ) : (
              /* Visual Barcode Display Box */
              <div
                className={`w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs overflow-hidden ${
                  transparentBg
                    ? "bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)]"
                    : ""
                }`}
                style={{ backgroundColor: transparentBg ? undefined : bgColor }}
              >
                <svg ref={svgRef} className="max-w-full h-auto" />
              </div>
            )}

            {/* Scale Selector */}
            <div className="w-full flex items-center justify-between text-xs px-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Export Scaling:
              </span>
              <div className="flex items-center space-x-1">
                {[1, 2, 4].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setExportScale(scale)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition ${
                      exportScale === scale
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                    }`}
                  >
                    {scale}x {scale === 2 ? "(Print)" : scale === 4 ? "(Ultra)" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="w-full space-y-2.5">
              <button
                disabled={!!renderError}
                onClick={handleDownloadPng}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res PNG ({exportScale}x Scale)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={!!renderError}
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Download SVG</span>
                </button>

                <button
                  disabled={!!renderError}
                  onClick={handleCopyPng}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  {copiedPng ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPng ? "Copied PNG!" : "Copy PNG"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={!!renderError}
                  onClick={handlePrint}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Label</span>
                </button>

                <button
                  disabled={!!renderError}
                  onClick={handleCopySvg}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                >
                  {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSvg ? "SVG Copied!" : "Copy SVG"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History of generated barcodes */}
      {history && history.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Generated Barcodes ({history.length}/6)
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Saved in your browser
              </span>
            </div>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setVal(item.val);
                  setFormat(item.format);
                  setFgColor(item.fg);
                  setBgColor(item.bg);
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-blue-500/50 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                    {item.format} •{" "}
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition truncate max-w-[200px]">
                    {item.val}
                  </div>
                </div>
                <div className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
