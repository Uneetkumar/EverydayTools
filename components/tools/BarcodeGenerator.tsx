"use client";

import React, { useState, useRef, useMemo } from "react";
import JsBarcode from "jsbarcode";
import JSZip from "jszip";
import { toast } from "sonner";
import { Archive, ArrowRightLeft, Barcode, Check, Copy, Download, FileSpreadsheet, FileUp, FolderDown, Plus, Printer, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Chips,
  Field,
  Notice,
  Segmented,
  SelectInput,
  TextInput,
  ToggleRow,
  ToolDivider,
  ToolSection,
} from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { downloadBlob, downloadDataUrl } from "@/lib/utils/download";
import { copyText } from "@/lib/utils/clipboard";
import { markToolCompleted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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

const FORMATS: { value: BarcodeFormat; label: string; use: string; rule: string }[] = [
  { value: "CODE128", label: "Code 128", use: "Shipping labels, inventory and SKUs.", rule: "Letters, numbers and symbols (standard ASCII)." },
  { value: "EAN13", label: "EAN-13", use: "Retail products worldwide, and books (ISBN).", rule: "12 digits (the check digit is added for you) or all 13." },
  { value: "UPC", label: "UPC-A", use: "Retail products in North America.", rule: "11 digits (the check digit is added for you) or all 12." },
  { value: "EAN8", label: "EAN-8", use: "Small retail items with little space.", rule: "7 digits (the check digit is added for you) or all 8." },
  { value: "UPCE", label: "UPC-E", use: "Small packages in North America.", rule: "6, 7 or 8 digits." },
  { value: "CODE39", label: "Code 39", use: "Asset tags, automotive and defence.", rule: "A–Z, 0–9, space and - . $ / + %." },
  { value: "ITF14", label: "ITF-14", use: "Outer cartons and shipping cases.", rule: "13 digits (the check digit is added for you) or all 14." },
  { value: "MSI", label: "MSI Plessey", use: "Warehouse shelves and inventory.", rule: "Digits only." },
  { value: "pharmacode", label: "Pharmacode", use: "Pharmaceutical packaging.", rule: "A whole number from 3 to 131070." },
  { value: "codabar", label: "Codabar", use: "Libraries, blood banks, courier forms.", rule: "Digits and - $ : / . + (may start and end with A, B, C or D)." },
];
const FORMAT_BY_VALUE = Object.fromEntries(FORMATS.map((f) => [f.value, f])) as Record<BarcodeFormat, (typeof FORMATS)[number]>;

const PRESETS: { id: string; label: string; format: BarcodeFormat; value: string }[] = [
  { id: "code128", label: "Shipping (Code 128)", format: "CODE128", value: "TB-SHIP-2026-X9" },
  { id: "ean13", label: "Retail (EAN-13)", format: "EAN13", value: "978020137962" },
  { id: "upca", label: "Retail US (UPC-A)", format: "UPC", value: "01234567890" },
  { id: "itf14", label: "Carton (ITF-14)", format: "ITF14", value: "1001234567890" },
  { id: "code39", label: "Asset tag (Code 39)", format: "CODE39", value: "ASSET-84920" },
  { id: "ean8", label: "Small item (EAN-8)", format: "EAN8", value: "9638507" },
];

interface BarcodeHistoryItem {
  id: string;
  val: string;
  format: BarcodeFormat;
  fg: string;
  bg: string;
  timestamp: number;
}

interface BarcodeBatchItem {
  id: string;
  label: string;
  format: BarcodeFormat;
  value: string;
}

const checkDigit = (digits: string, firstWeight: 1 | 3) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const n = Number(digits[i]);
    sum += i % 2 === 0 ? n * firstWeight : n * (firstWeight === 1 ? 3 : 1);
  }
  return String((10 - (sum % 10)) % 10);
};

const luminance = (hex: string) => {
  const c = hex.replace("#", "");
  const rgb = c.length === 3 ? [0, 1, 2].map((i) => parseInt(c[i] + c[i], 16)) : [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [r, g, b] = rgb.map((v) => {
    const s = (Number.isFinite(v) ? v : 0) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export default function BarcodeGenerator() {
  const [format, setFormat] = usePersistentState<BarcodeFormat>("bc_format", "CODE128");
  const [val, setVal] = usePersistentState<string>("bc_val", "TB-LOGISTICS-9842");

  const [barWidth, setBarWidth] = usePersistentState<number>("bc_width", 2);
  const [barHeight, setBarHeight] = usePersistentState<number>("bc_height", 90);
  const [margin, setMargin] = usePersistentState<number>("bc_margin", 12);
  const [displayValue, setDisplayValue] = usePersistentState<boolean>("bc_show_text", true);
  const [font, setFont] = usePersistentState<string>("bc_font", "monospace");
  const [fontSize, setFontSize] = usePersistentState<number>("bc_font_size", 16);
  const [textPosition, setTextPosition] = usePersistentState<"bottom" | "top">("bc_text_pos", "bottom");

  const [fgColor, setFgColor] = usePersistentState<string>("bc_fg", "#0f172a");
  const [bgColor, setBgColor] = usePersistentState<string>("bc_bg", "#ffffff");
  const [transparentBg, setTransparentBg] = useState<boolean>(false);

  const [copiedPng, setCopiedPng] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [exportScale, setExportScale] = useState<number>(2);
  const [history, setHistory] = usePersistentState<BarcodeHistoryItem[]>("bc_history", []);

  const csvBatchInputRef = useRef<HTMLInputElement>(null);
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

  const isClient = useIsClient();

  const jsOptions = (fmt: BarcodeFormat) => ({
    format: fmt,
    width: barWidth,
    height: barHeight,
    displayValue,
    font,
    fontSize,
    textPosition,
    textMargin: 4,
    margin,
    background: transparentBg ? "transparent" : bgColor,
    lineColor: fgColor,
  });

  /**
   * Draw the barcode into a detached SVG and keep its markup. The preview,
   * downloads and copy all use this markup, so what you see is exactly what
   * you get, and an invalid value can't leave a stale barcode (or a stuck
   * error) on screen.
   */
  const rendered = useMemo((): { svg: string | null; error: string | null } => {
    if (!isClient) return { svg: null, error: null };
    const value = val.trim();
    if (!value) return { svg: null, error: "empty" };
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let valid = true;
    try {
      JsBarcode(el, value, { ...jsOptions(format), valid: (v: boolean) => (valid = v) });
    } catch {
      valid = false;
    }
    if (!valid) return { svg: null, error: "invalid" };
    el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return { svg: new XMLSerializer().serializeToString(el), error: null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, val, format, barWidth, barHeight, margin, displayValue, font, fontSize, textPosition, bgColor, fgColor, transparentBg]);

  const checksumNote = useMemo(() => {
    const raw = val.trim();
    if (format === "EAN13" && /^\d{12}$/.test(raw)) return raw + checkDigit(raw, 1);
    if (format === "UPC" && /^\d{11}$/.test(raw)) return raw + checkDigit(raw, 3);
    if (format === "EAN8" && /^\d{7}$/.test(raw)) return raw + checkDigit(raw, 3);
    return null;
  }, [val, format]);

  const lowContrast = !transparentBg && Math.abs(luminance(fgColor) - luminance(bgColor)) < 0.35;
  const inverted = !transparentBg && luminance(fgColor) > luminance(bgColor);

  const recordHistory = () => {
    const item: BarcodeHistoryItem = { id: String(Date.now()), val, format, fg: fgColor, bg: bgColor, timestamp: Date.now() };
    setHistory((prev = []) => [item, ...prev.filter((p) => p.val !== item.val || p.format !== item.format)].slice(0, 6));
  };

  const svgToCanvas = (svg: string, scale: number, fill: string | null): Promise<HTMLCanvasElement> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // Barcodes must stay sharp: no smoothing when scaling up.
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image"));
      };
      img.src = url;
    });

  const fileBase = `barcode-${format.toLowerCase()}-${val.trim().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)}`;

  const handleDownloadPng = async () => {
    if (!rendered.svg) return;
    try {
      const canvas = await svgToCanvas(rendered.svg, exportScale, transparentBg ? null : bgColor);
      downloadDataUrl(canvas.toDataURL("image/png"), `${fileBase}.png`);
      recordHistory();
      markToolCompleted();
    } catch {
      toast.error("Couldn't create the PNG");
    }
  };

  const handleDownloadSvg = () => {
    if (!rendered.svg) return;
    downloadBlob(new Blob([rendered.svg], { type: "image/svg+xml;charset=utf-8" }), `${fileBase}.svg`, "barcode-generator");
    recordHistory();
    markToolCompleted();
  };

  const handleCopyPng = async () => {
    if (!rendered.svg) return;
    try {
      if (typeof ClipboardItem === "undefined") throw new Error("unsupported");
      const canvas = await svgToCanvas(rendered.svg, 2, transparentBg ? null : bgColor);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
      recordHistory();
      markToolCompleted();
    } catch {
      toast.error("Couldn't copy the image", { description: "Your browser doesn't allow copying images. Download the PNG instead." });
    }
  };

  const handleCopySvg = async () => {
    if (!rendered.svg) return;
    if (await copyText(rendered.svg)) {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
      recordHistory();
    }
  };

  const handlePrint = () => {
    if (!rendered.svg) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Couldn't open the print window", { description: "Allow pop-ups for this site, or download the PNG and print that." });
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Barcode ${escapeHtml(val)}</title>
<style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}svg{max-width:100%;height:auto}@media print{body{min-height:0;padding:20px}}</style>
</head><body>${rendered.svg}<script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}<\/script></body></html>`);
    printWindow.document.close();
  };

  // ---- Bulk (CSV) ----
  const validFormats = FORMATS.map((f) => f.value);

  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;
      const first = lines[0].toLowerCase();
      const startIdx = first.includes("value") || first.includes("format") || first.includes("label") ? 1 : 0;
      const parsed: BarcodeBatchItem[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length === 1 && cols[0]) {
          parsed.push({ id: String(Date.now() + i), label: `Item ${i + 1}`, format: "CODE128", value: cols[0] });
        } else if (cols.length === 2) {
          parsed.push({ id: String(Date.now() + i), label: cols[0] || `Item ${i + 1}`, format: "CODE128", value: cols[1] });
        } else if (cols.length >= 3) {
          const raw = cols[1].toUpperCase();
          const fmt = (validFormats.find((f) => f.toUpperCase() === raw) ?? "CODE128") as BarcodeFormat;
          parsed.push({ id: String(Date.now() + i), label: cols[0] || `Item ${i + 1}`, format: fmt, value: cols[2] });
        }
      }
      if (parsed.length > 0) {
        setBatchItems(parsed);
        setBatchSelectedIdx(0);
        setVal(parsed[0].value);
        setFormat(parsed[0].format);
        markToolCompleted();
        toast.success(`Loaded ${parsed.length} ${parsed.length === 1 ? "row" : "rows"}`);
      } else {
        toast.error("No rows found", { description: "Use the columns Label, Format, Value — the sample CSV shows the format." });
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
    // A template, not a result, so it isn't added to the recent-files list.
    downloadDataUrl(URL.createObjectURL(new Blob([sample], { type: "text/csv;charset=utf-8" })), "sample-barcodes.csv", true);
  };

  const downloadAllBatchCsv = () => {
    if (batchItems.length === 0) return;
    const nowIso = new Date().toISOString();
    const rows = batchItems.map((it) => `"${it.label.replace(/"/g, '""')}","${it.format}","${it.value.replace(/"/g, '""')}","${nowIso}"`).join("\n");
    downloadBlob(new Blob(["Label,Format,Value,ExportDate\n" + rows], { type: "text/csv;charset=utf-8" }), `barcodes-${Date.now()}.csv`, "barcode-generator");
    markToolCompleted();
  };

  const downloadAllBatchZip = async () => {
    if (batchItems.length === 0) return;
    setBatchIsExporting(true);
    const skipped: string[] = [];
    try {
      const zip = new JSZip();
      const folder = zip.folder("barcodes");
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        const canvas = document.createElement("canvas");
        let valid = true;
        try {
          JsBarcode(canvas, item.value, {
            ...jsOptions(item.format),
            background: transparentBg ? "rgba(0,0,0,0)" : bgColor,
            valid: (v: boolean) => (valid = v),
          });
        } catch {
          valid = false;
        }
        if (!valid) {
          skipped.push(item.label);
          continue;
        }
        const safeLabel = item.label.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().slice(0, 30);
        folder?.file(`${String(i + 1).padStart(2, "0")}-${safeLabel || "barcode"}.png`, canvas.toDataURL("image/png").split(",")[1], { base64: true });
      }
      const manifest = "Index,Label,Format,Value\n" + batchItems.map((it, idx) => `${idx + 1},"${it.label.replace(/"/g, '""')}","${it.format}","${it.value.replace(/"/g, '""')}"`).join("\n");
      zip.file("manifest.csv", manifest);
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `barcodes-${Date.now()}.zip`, "barcode-generator");
      markToolCompleted();
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} ${skipped.length === 1 ? "row was" : "rows were"} skipped`, {
          description: `Not valid for their barcode type: ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}`,
        });
      }
    } catch (err) {
      console.error("Batch ZIP export error:", err);
      toast.error("Couldn't create the ZIP");
    } finally {
      setBatchIsExporting(false);
    }
  };

  const handleAddBatchItem = () => {
    if (!newBatchValue.trim()) return;
    setBatchItems((prev) => [
      ...prev,
      { id: String(Date.now()), label: newBatchLabel.trim() || `Item ${prev.length + 1}`, format: newBatchFormat, value: newBatchValue.trim() },
    ]);
    setNewBatchLabel("");
    setNewBatchValue("");
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (batchSelectedIdx >= next.length) setBatchSelectedIdx(Math.max(0, next.length - 1));
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

  const info = FORMAT_BY_VALUE[format] ?? FORMATS[0];
  const activePreset = PRESETS.find((p) => p.format === format && p.value === val)?.id ?? null;
  const canExport = !!rendered.svg;

  return (
    <div className="space-y-6">
      <Segmented
        value={mode}
        onChange={setMode}
        ariaLabel="Mode"
        options={[
          { value: "single", label: "Single barcode" },
          { value: "batch", label: "Bulk (CSV)" },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-x-8 gap-y-6 @4xl:grid-cols-12">
        <div className="@container space-y-6 @4xl:col-span-7 @4xl:row-start-1">
          {mode === "single" ? (
            <ToolSection title="Barcode">
              <Field label="Type" htmlFor="bc-format" hint={info.use}>
                <SelectInput id="bc-format" value={format} onChange={(e) => setFormat(e.target.value as BarcodeFormat)}>
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field
                label="Value"
                htmlFor="bc-value"
                error={rendered.error === "invalid" ? `Not valid for ${info.label}. ${info.rule}` : undefined}
                hint={info.rule}
              >
                <TextInput
                  id="bc-value"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder="Enter a number or SKU"
                  className="font-mono"
                  aria-invalid={rendered.error === "invalid" || undefined}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              {checksumNote && (
                <p className="text-xs text-muted-foreground">
                  Encoded as <span className="font-mono text-foreground">{checksumNote}</span> — the last digit is the check digit.{" "}
                  <button type="button" className="text-link hover:underline" onClick={() => setVal(checksumNote)}>
                    Use full number
                  </button>
                </p>
              )}
              <Field label="Examples">
                <Chips
                  value={activePreset}
                  onChange={(id) => {
                    const p = PRESETS.find((x) => x.id === id);
                    if (p) {
                      setFormat(p.format);
                      setVal(p.value);
                    }
                  }}
                  ariaLabel="Example barcodes"
                  options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
                />
              </Field>
            </ToolSection>
          ) : (
            <ToolSection title="Bulk (CSV)">
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
              <p className="text-sm text-muted-foreground">
                Make many barcodes at once from a CSV with the columns{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">Label, Format, Value</code>. Select a row to preview it; the size, text and colour settings apply to all.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => csvBatchInputRef.current?.click()}>
                  <FileUp aria-hidden="true" />
                  Upload CSV
                </Button>
                <Button type="button" variant="outline" onClick={downloadSampleCsv}>
                  <FolderDown aria-hidden="true" />
                  Sample CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 @md:grid-cols-12">
                <TextInput aria-label="Label for the new row" value={newBatchLabel} onChange={(e) => setNewBatchLabel(e.target.value)} placeholder="Label" className="@md:col-span-4" />
                <SelectInput aria-label="Barcode type for the new row" value={newBatchFormat} onChange={(e) => setNewBatchFormat(e.target.value as BarcodeFormat)} className="@md:col-span-3">
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  aria-label="Value for the new row"
                  value={newBatchValue}
                  onChange={(e) => setNewBatchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBatchItem()}
                  placeholder="Value"
                  className="font-mono @md:col-span-3"
                />
                <Button type="button" variant="outline" onClick={handleAddBatchItem} disabled={!newBatchValue.trim()} className="h-10 @md:col-span-2">
                  <Plus aria-hidden="true" />
                  Add
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    {batchItems.length} {batchItems.length === 1 ? "row" : "rows"}
                  </span>
                  {batchItems.length > 0 && (
                    <button type="button" onClick={() => setBatchItems([])} className="hover:text-foreground">
                      Clear all
                    </button>
                  )}
                </div>
                {batchItems.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No rows yet. Upload a CSV or add one above.</p>
                ) : (
                  <ul className="max-h-72 divide-y overflow-y-auto">
                    {batchItems.map((item, idx) => {
                      const selected = batchSelectedIdx === idx;
                      return (
                        <li key={item.id} className={cn("flex items-center gap-2 pr-2", selected && "bg-brand-subtle/60")}>
                          <button
                            type="button"
                            onClick={() => selectBatchItem(idx)}
                            aria-pressed={selected}
                            className="min-w-0 flex-1 px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
                              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{FORMAT_BY_VALUE[item.format]?.label ?? item.format}</span>
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{item.value}</span>
                          </button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleRemoveBatchItem(item.id)} aria-label={`Remove ${item.label}`}>
                            <X aria-hidden="true" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={downloadAllBatchZip} disabled={batchItems.length === 0 || batchIsExporting}>
                  <Archive aria-hidden="true" />
                  {batchIsExporting ? "Creating ZIP…" : "Download all as PNG (ZIP)"}
                </Button>
                <Button type="button" variant="outline" onClick={downloadAllBatchCsv} disabled={batchItems.length === 0}>
                  <FileSpreadsheet aria-hidden="true" />
                  Download list (CSV)
                </Button>
              </div>
            </ToolSection>
          )}

        </div>

        {/* Preview & download. Second in the DOM so that on narrow screens it
            follows the content fields instead of every setting; on wide screens
            it spans both rows of the right column. */}
        <div className="space-y-4 @4xl:sticky @4xl:top-24 @4xl:col-span-5 @4xl:col-start-8 @4xl:row-span-2 @4xl:row-start-1">
          <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Preview</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{info.label}</span>
            </div>
            <div className="flex min-h-48 items-center justify-center">
              {rendered.svg ? (
                <div
                  className={cn(
                    "flex w-full items-center justify-center overflow-hidden rounded-lg border p-4",
                    transparentBg &&
                      "bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)]"
                  )}
                  style={{ backgroundColor: transparentBg ? undefined : bgColor }}
                >
                  <div
                    role="img"
                    aria-label={`${info.label} barcode for ${val}`}
                    className="max-w-full [&>svg]:h-auto [&>svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: rendered.svg }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Barcode className="size-10 text-muted-foreground/50" aria-hidden="true" />
                  <p className="max-w-60 text-sm text-muted-foreground">
                    {rendered.error === "invalid" ? "Fix the value to see the barcode." : "Enter a value to see the barcode."}
                  </p>
                </div>
              )}
            </div>

            <Field label="PNG size">
              <Segmented
                value={String(exportScale)}
                onChange={(v) => setExportScale(Number(v))}
                ariaLabel="PNG size"
                size="sm"
                fill
                options={[
                  { value: "1", label: "1× screen" },
                  { value: "2", label: "2× print" },
                  { value: "4", label: "4× large" },
                ]}
              />
            </Field>

            <div className="space-y-2">
              <Button type="button" size="lg" className="h-10 w-full" onClick={handleDownloadPng} disabled={!canExport}>
                <Download aria-hidden="true" />
                Download PNG
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadSvg} disabled={!canExport}>
                  <Download aria-hidden="true" />
                  SVG
                </Button>
                <Button type="button" variant="outline" onClick={handleCopyPng} disabled={!canExport}>
                  {copiedPng ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
                  {copiedPng ? "Copied" : "Copy image"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={handlePrint} disabled={!canExport}>
                  <Printer aria-hidden="true" />
                  Print
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={handleCopySvg} disabled={!canExport}>
                  {copiedSvg ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
                  {copiedSvg ? "SVG code copied" : "Copy SVG code"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="@container space-y-6 @4xl:col-span-7 @4xl:row-start-2">
          <ToolDivider />

          <ToolSection title="Size">
            <div className="grid grid-cols-1 gap-5 @sm:grid-cols-3">
              <Field label={`Bar width · ${barWidth} px`} htmlFor="bc-width" hint="Wider bars scan from further away.">
                <input id="bc-width" type="range" min="1" max="4" step="1" value={barWidth} onChange={(e) => setBarWidth(Number(e.target.value))} className="w-full cursor-pointer accent-primary" />
              </Field>
              <Field label={`Height · ${barHeight} px`} htmlFor="bc-height">
                <input id="bc-height" type="range" min="30" max="160" step="5" value={barHeight} onChange={(e) => setBarHeight(Number(e.target.value))} className="w-full cursor-pointer accent-primary" />
              </Field>
              <Field label={`Quiet zone · ${margin} px`} htmlFor="bc-margin" hint="Blank space scanners need at each side.">
                <input id="bc-margin" type="range" min="0" max="30" step="2" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full cursor-pointer accent-primary" />
              </Field>
            </div>
          </ToolSection>

          <ToolDivider />

          <ToolSection title="Text">
            <ToggleRow id="bc-show-text" label="Show the value as text" description="The human-readable number printed with the bars." checked={displayValue} onCheckedChange={setDisplayValue} />
            {displayValue && (
              <div className="grid grid-cols-1 gap-4 @sm:grid-cols-3">
                <Field label="Font" htmlFor="bc-font">
                  <SelectInput id="bc-font" value={font} onChange={(e) => setFont(e.target.value)}>
                    <option value="monospace">Monospace</option>
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                  </SelectInput>
                </Field>
                <Field label={`Size · ${fontSize} px`} htmlFor="bc-font-size">
                  <input id="bc-font-size" type="range" min="10" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="mt-3 w-full cursor-pointer accent-primary" />
                </Field>
                <Field label="Position">
                  <Segmented
                    value={textPosition}
                    onChange={setTextPosition}
                    ariaLabel="Text position"
                    fill
                    options={[
                      { value: "bottom", label: "Below" },
                      { value: "top", label: "Above" },
                    ]}
                  />
                </Field>
              </div>
            )}
          </ToolSection>

          <ToolDivider />

          <ToolSection
            title="Colours"
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={transparentBg}
                onClick={() => {
                  setFgColor(bgColor);
                  setBgColor(fgColor);
                }}
              >
                <ArrowRightLeft aria-hidden="true" />
                Swap
              </Button>
            }
          >
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              <Field label="Bars and text" htmlFor="bc-fg-hex">
                <div className="flex items-center gap-2">
                  <input type="color" aria-label="Pick bar colour" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border bg-background p-1" />
                  <TextInput id="bc-fg-hex" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="font-mono" spellCheck={false} />
                </div>
              </Field>
              <Field label="Background" htmlFor="bc-bg-hex">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick background colour"
                    value={bgColor}
                    disabled={transparentBg}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <TextInput id="bc-bg-hex" value={transparentBg ? "Transparent" : bgColor} disabled={transparentBg} onChange={(e) => setBgColor(e.target.value)} className="font-mono" spellCheck={false} />
                </div>
              </Field>
            </div>
            <ToggleRow id="bc-transparent" label="Transparent background" description="For placing the barcode on your own label design." checked={transparentBg} onCheckedChange={setTransparentBg} />
            {(lowContrast || inverted) && (
              <Notice tone="warning">Most scanners need dark bars on a light background with strong contrast. These colours may not scan.</Notice>
            )}
          </ToolSection>
        </div>

      </div>

      {history && history.length > 0 && (
        <section aria-labelledby="bc-recent" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 id="bc-recent" className="text-sm font-semibold text-foreground">
              Recent barcodes
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setHistory([])} className="text-muted-foreground">
              <Trash2 aria-hidden="true" />
              Clear
            </Button>
          </div>
          <ul className="grid grid-cols-1 gap-2 @md:grid-cols-2 @3xl:grid-cols-3">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("single");
                    setVal(item.val);
                    setFormat(item.format);
                    setFgColor(item.fg);
                    setBgColor(item.bg);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/20"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm text-foreground">{item.val}</span>
                    <span className="block text-xs text-muted-foreground">
                      {FORMAT_BY_VALUE[item.format]?.label ?? item.format} · {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                  <RefreshCw className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
