"use client";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

/**
 * Generates placeholder files at a requested size, entirely in the browser.
 *
 * SIZE ACCURACY: the content is scaled to land near the target, then the file
 * is padded to the exact byte count using regions each format ignores — bytes
 * after JPEG's EOI marker, after a PDF's %%EOF, or after PNG's IEND chunk.
 * Every decoder skips them, so the file stays valid while hitting the size
 * exactly. That matters because the main use for these is testing an upload
 * limit, where "roughly 2MB" is not good enough.
 */

export type SampleKind = "image" | "pdf" | "docx" | "video" | "audio" | "text" | "csv" | "json" | "sql";

export interface SampleFile {
  blob: Blob;
  filename: string;
  kind: SampleKind;
  /** Human label describing the randomised content. */
  label: string;
  width?: number;
  height?: number;
}

const PALETTES = [
  ["#0f172a", "#1d4ed8", "#38bdf8"],
  ["#1a2e05", "#4d7c0f", "#a3e635"],
  ["#450a0a", "#b91c1c", "#fca5a5"],
  ["#2e1065", "#7c3aed", "#c4b5fd"],
  ["#431407", "#ea580c", "#fdba74"],
  ["#042f2e", "#0d9488", "#5eead4"],
];

const SUBJECTS = [
  "gradient mesh", "concentric rings", "diagonal bands",
  "scattered blocks", "radial burst", "wave field",
];

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Pads a blob to exactly `target` bytes with filler the format ignores. */
function padTo(parts: BlobPart[], currentSize: number, target: number, type: string): Blob {
  if (currentSize >= target) return new Blob(parts, { type });
  const padding = new Uint8Array(target - currentSize);
  // Fill with spaces rather than zeros — some strict parsers object to NULs.
  padding.fill(0x20);
  return new Blob([...parts, padding], { type });
}

/** Draws randomised, visually distinct artwork so no two samples look alike. */
function paintCanvas(canvas: HTMLCanvasElement, seedLabel: string) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const palette = rand(PALETTES);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, palette[0]);
  bg.addColorStop(1, palette[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const shapes = randInt(6, 14);
  for (let i = 0; i < shapes; i++) {
    ctx.globalAlpha = 0.15 + Math.random() * 0.4;
    ctx.fillStyle = rand(palette);
    const kind = Math.random();
    if (kind < 0.4) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, (Math.random() * Math.min(w, h)) / 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind < 0.75) {
      ctx.fillRect(Math.random() * w, Math.random() * h, (Math.random() * w) / 2, (Math.random() * h) / 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  const label = `${w} × ${h}`;
  ctx.font = `bold ${Math.max(14, Math.round(w / 14))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(label, w / 2, h / 2);
  ctx.font = `${Math.max(10, Math.round(w / 34))}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(seedLabel, w / 2, h / 2 + Math.max(18, w / 12));
}

export type AudioFormatId =
  | "audio/wav"
  | "audio/mp3"
  | "audio/aac"
  | "audio/ogg"
  | "audio/flac";

export type AudioToneId =
  | "sine"
  | "chime"
  | "sweep"
  | "whitenoise"
  | "pinknoise";

export interface AudioGenerateOptions {
  seconds: number;
  format?: AudioFormatId | string;
  sampleRate?: number;
  channels?: 1 | 2;
  tone?: AudioToneId;
  targetBytes?: number;
  onProgress?: (progress: VideoProgressInfo) => void;
  signal?: AbortSignal;
}

export type ImageFormatId =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/svg+xml";

export interface ImageGenerateOptions {
  targetBytes: number;
  format?: ImageFormatId | string;
  dimensions?: { w: number; h: number };
  pattern?: "gradient" | "geometric" | "rings" | "minimal" | "waves";
  onProgress?: (progress: VideoProgressInfo) => void;
  signal?: AbortSignal;
}

export interface PdfGenerateOptions {
  targetBytes: number;
  pageCount?: number;
  template?: "business" | "invoice" | "standard" | "academic";
  onProgress?: (progress: VideoProgressInfo) => void;
  signal?: AbortSignal;
}

export interface DocxGenerateOptions {
  targetBytes: number;
  paras?: number;
  template?: "summary" | "legal" | "standard";
  onProgress?: (progress: VideoProgressInfo) => void;
  signal?: AbortSignal;
}

export type DataSchemaId = "ecommerce" | "users" | "finance" | "analytics" | "products";

export interface DataGenerateOptions {
  targetBytes: number;
  kind: "text" | "csv" | "json" | "sql";
  schema?: DataSchemaId;
  rowCount?: number;
  onProgress?: (progress: VideoProgressInfo) => void;
  signal?: AbortSignal;
}

/** Draws randomised, visually distinct artwork so no two samples look alike. */
function paintCanvasWithPattern(
  canvas: HTMLCanvasElement,
  seedLabel: string,
  pattern: "gradient" | "geometric" | "rings" | "minimal" | "waves" = "gradient"
) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const palette = rand(PALETTES);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, palette[0]);
  bg.addColorStop(1, palette[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (pattern === "rings") {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.max(w, h) / 1.5;
    for (let r = 20; r < maxR; r += Math.max(15, Math.round(w / 30))) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = palette[2] || "#ffffff";
      ctx.globalAlpha = 0.2 + (r / maxR) * 0.3;
      ctx.lineWidth = Math.max(2, Math.round(w / 200));
      ctx.stroke();
    }
  } else if (pattern === "waves") {
    for (let j = 0; j < 6; j++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 7) * (j + 1));
      for (let x = 0; x < w; x += 10) {
        const y = (h / 7) * (j + 1) + Math.sin(x * 0.02 + j) * (h / 15);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rand(palette);
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(3, Math.round(w / 150));
      ctx.stroke();
    }
  } else if (pattern === "minimal") {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Gradient / Geometric default
    const shapes = randInt(8, 16);
    for (let i = 0; i < shapes; i++) {
      ctx.globalAlpha = 0.15 + Math.random() * 0.4;
      ctx.fillStyle = rand(palette);
      const kind = Math.random();
      if (kind < 0.4) {
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, (Math.random() * Math.min(w, h)) / 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind < 0.75) {
        ctx.fillRect(Math.random() * w, Math.random() * h, (Math.random() * w) / 2, (Math.random() * h) / 2);
      } else {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.globalAlpha = 1;
  const label = `${w} × ${h}`;
  ctx.font = `bold ${Math.max(14, Math.round(w / 14))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillText(label, w / 2, h / 2);
  ctx.font = `${Math.max(10, Math.round(w / 34))}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(seedLabel, w / 2, h / 2 + Math.max(18, w / 12));
}

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, quality)
  );
}

export async function generateImage(
  targetBytesOrOptions: number | ImageGenerateOptions,
  legacyFormat?: "image/png" | "image/jpeg" | "image/webp",
  legacyDimensions?: { w: number; h: number }
): Promise<SampleFile> {
  const options: ImageGenerateOptions =
    typeof targetBytesOrOptions === "number"
      ? {
          targetBytes: targetBytesOrOptions,
          format: legacyFormat ?? "image/jpeg",
          dimensions: legacyDimensions,
        }
      : targetBytesOrOptions;

  const { targetBytes, format = "image/jpeg", dimensions, pattern = "gradient", onProgress, signal } = options;

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({
    percent: 10,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "preparing",
    message: "Initializing image canvas…",
    detail: `${format.split("/").pop()?.toUpperCase()} • ${formatBytesShort(targetBytes)}`,
  });

  const subject = rand(SUBJECTS);
  const bpp = format === "image/png" ? 1.1 : 0.16;
  const ratio = rand([[4, 3], [16, 9], [1, 1], [3, 4], [9, 16]]);
  let w: number, h: number;
  if (dimensions) {
    w = dimensions.w;
    h = dimensions.h;
  } else {
    const px = Math.max(2500, Math.min(20_000_000, targetBytes / bpp));
    const scale = Math.sqrt(px / (ratio[0] * ratio[1]));
    w = Math.max(48, Math.round(ratio[0] * scale));
    h = Math.max(48, Math.round(ratio[1] * scale));
  }

  // Handle SVG Vector format
  if (format === "image/svg+xml") {
    onProgress?.({
      percent: 50,
      currentSecond: 0,
      totalSeconds: 1,
      stage: "recording",
      message: "Generating SVG vector elements…",
      detail: `${w}×${h} Vector`,
    });

    const palette = rand(PALETTES);
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="100%" stop-color="${palette[1]}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 3}" fill="${palette[2] || "#ffffff"}" opacity="0.25" />
      <text x="50%" y="48%" font-family="system-ui, sans-serif" font-size="${Math.max(16, Math.round(w / 14))}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${w} × ${h}</text>
      <text x="50%" y="60%" font-family="system-ui, sans-serif" font-size="${Math.max(11, Math.round(w / 32))}" fill="#ffffff" opacity="0.8" text-anchor="middle" dominant-baseline="middle">Sample SVG • ${formatBytesShort(targetBytes)}</text>
    </svg>`;

    while (new Blob([svgContent]).size < targetBytes) {
      svgContent += `\n<!-- PADDING ${"X".repeat(Math.min(2048, targetBytes - new Blob([svgContent]).size))} -->`;
    }

    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
    onProgress?.({
      percent: 100,
      currentSecond: 1,
      totalSeconds: 1,
      stage: "completed",
      message: "SVG generated successfully",
      detail: `${w}×${h} SVG`,
    });

    return {
      blob: svgBlob,
      filename: `sample-${w}x${h}-${formatBytesShort(targetBytes)}.svg`,
      kind: "image",
      label: `${pattern} SVG vector, ${w}×${h}`,
      width: w,
      height: h,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  onProgress?.({
    percent: 45,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "recording",
    message: `Rendering ${w}×${h} canvas pattern…`,
    detail: `${pattern.toUpperCase()} style`,
  });

  paintCanvasWithPattern(canvas, subject, pattern);

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({
    percent: 75,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "processing",
    message: `Encoding image to ${format.split("/").pop()?.toUpperCase()}…`,
    detail: `${w}×${h} resolution`,
  });

  let blob = await canvasBlob(canvas, format, format === "image/png" ? undefined : 0.92);
  if (blob.size > targetBytes && format !== "image/png") {
    const q = Math.max(0.3, 0.92 * (targetBytes / blob.size));
    blob = await canvasBlob(canvas, format, q);
  }

  const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
  const buf = await blob.arrayBuffer();
  const final = padTo([buf], buf.byteLength, targetBytes, format);

  onProgress?.({
    percent: 100,
    currentSecond: 1,
    totalSeconds: 1,
    stage: "completed",
    message: "Image generated successfully",
    detail: `${w}×${h} ${ext.toUpperCase()}`,
  });

  return {
    blob: final,
    filename: `sample-${w}x${h}-${formatBytesShort(targetBytes)}.${ext}`,
    kind: "image",
    label: `${subject}, ${w}×${h}`,
    width: w,
    height: h,
  };
}

export async function generatePdf(
  targetBytesOrOptions: number | PdfGenerateOptions
): Promise<SampleFile> {
  const options: PdfGenerateOptions =
    typeof targetBytesOrOptions === "number"
      ? { targetBytes: targetBytesOrOptions }
      : targetBytesOrOptions;

  const { targetBytes, pageCount = randInt(1, 4), template = "standard", onProgress, signal } = options;

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({
    percent: 10,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "preparing",
    message: `Initializing ${pageCount}-page PDF document…`,
    detail: `A4 Layout • ${template.toUpperCase()}`,
  });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 0; i < pageCount; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const pagePercent = Math.round(15 + ((i + 1) / pageCount) * 65);
    onProgress?.({
      percent: pagePercent,
      currentSecond: 0,
      totalSeconds: 1,
      stage: "recording",
      message: `Rendering page ${i + 1} of ${pageCount}…`,
      detail: `${template.toUpperCase()} template`,
    });

    const page = doc.addPage([595, 842]);
    const title =
      template === "invoice"
        ? "SAMPLE INVOICE / RECEIPT"
        : template === "business"
        ? "EXECUTIVE BUSINESS REPORT"
        : template === "academic"
        ? "RESEARCH STUDY & ANALYSIS"
        : "SAMPLE PDF DOCUMENT";

    page.drawText(title, { x: 56, y: 770, size: 20, font: bold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`Page ${i + 1} of ${pageCount} • Target: ${formatBytesShort(targetBytes)}`, {
      x: 56, y: 742, size: 11, font, color: rgb(0.3, 0.4, 0.6),
    });
    page.drawText(`Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`, {
      x: 56, y: 724, size: 9, font, color: rgb(0.55, 0.6, 0.65),
    });

    // Accent line
    page.drawRectangle({ x: 56, y: 712, width: 483, height: 2, color: rgb(0.15, 0.38, 0.92) });

    let y = 680;
    for (let line = 0; line < 25; line++) {
      page.drawText(LOREM[(i * 25 + line) % LOREM.length], { x: 56, y, size: 10, font, color: rgb(0.2, 0.24, 0.29) });
      y -= 18;
    }

    page.drawRectangle({ x: 56, y: 90, width: 483, height: 90, color: rgb(0.93, 0.95, 0.98) });
    page.drawText("This file is a placeholder generated for testing upload limits, PDF viewers, and printers.", {
      x: 72, y: 130, size: 9.5, font, color: rgb(0.35, 0.4, 0.45),
    });
  }

  onProgress?.({
    percent: 85,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "processing",
    message: "Compiling and padding PDF document…",
    detail: "Writing cross-reference table",
  });

  const bytes = await doc.save();
  const final = padTo([bytes as BlobPart], bytes.byteLength, targetBytes, "application/pdf");

  onProgress?.({
    percent: 100,
    currentSecond: 1,
    totalSeconds: 1,
    stage: "completed",
    message: "PDF generated successfully!",
    detail: `${pageCount} page${pageCount === 1 ? "" : "s"} ready`,
  });

  return {
    blob: final,
    filename: `sample-${pageCount}page-${formatBytesShort(targetBytes)}.pdf`,
    kind: "pdf",
    label: `${pageCount} page${pageCount === 1 ? "" : "s"}, ${template} layout`,
  };
}

export async function generateDocx(
  targetBytesOrOptions: number | DocxGenerateOptions
): Promise<SampleFile> {
  const options: DocxGenerateOptions =
    typeof targetBytesOrOptions === "number"
      ? { targetBytes: targetBytesOrOptions }
      : targetBytesOrOptions;

  const { targetBytes, paras = randInt(6, 14), template = "standard", onProgress, signal } = options;

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({
    percent: 20,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "preparing",
    message: `Building Word document structure (${paras} paragraphs)…`,
    detail: `${template.toUpperCase()} template`,
  });

  const docTitle =
    template === "summary"
      ? "Executive Summary Document"
      : template === "legal"
      ? "Draft Service Agreement"
      : "Sample Word Document";

  const children = [
    new Paragraph({ text: docTitle, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [new TextRun({ text: `Generated: ${new Date().toUTCString()} • Target: ${formatBytesShort(targetBytes)}`, italics: true, color: "666666" })],
    }),
  ];

  for (let i = 0; i < paras; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (i % 4 === 0 && i > 0) {
      children.push(new Paragraph({ text: `Section ${Math.floor(i / 4) + 1}: Overview & Analysis`, heading: HeadingLevel.HEADING_2 }));
    }
    children.push(new Paragraph({ text: LOREM[i % LOREM.length] }));
  }

  onProgress?.({
    percent: 60,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "recording",
    message: "Packaging OpenXML DOCX archive…",
    detail: "Zipping document parts",
  });

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const buf = await blob.arrayBuffer();

  onProgress?.({
    percent: 90,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "processing",
    message: "Padding Word document to target size…",
    detail: `${formatBytesShort(targetBytes)} target`,
  });

  const final = padTo(
    [buf],
    buf.byteLength,
    targetBytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  onProgress?.({
    percent: 100,
    currentSecond: 1,
    totalSeconds: 1,
    stage: "completed",
    message: "Word DOCX generated successfully!",
    detail: `${paras} paragraphs ready`,
  });

  return {
    blob: final,
    filename: `sample-${paras}para-${formatBytesShort(targetBytes)}.docx`,
    kind: "docx",
    label: `${paras} paragraphs (${template})`,
  };
}

export function generateText(
  targetBytesOrOptions: number | DataGenerateOptions,
  legacyKind?: "text" | "csv" | "json"
): SampleFile {
  const options: DataGenerateOptions =
    typeof targetBytesOrOptions === "number"
      ? { targetBytes: targetBytesOrOptions, kind: legacyKind ?? "text" }
      : targetBytesOrOptions;

  const { targetBytes, kind, schema = "users", rowCount, onProgress, signal } = options;

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({
    percent: 25,
    currentSecond: 0,
    totalSeconds: 1,
    stage: "preparing",
    message: `Generating ${kind.toUpperCase()} records (${schema})…`,
    detail: `Target: ${formatBytesShort(targetBytes)}`,
  });

  let content = "";
  const PRODUCTS = ["Wireless Headphones", "Mechanical Keyboard", "Ultra HD Monitor", "Ergonomic Chair", "USB-C Hub", "Smart Watch", "Webcam 4K", "Noise-Cancelling Earbuds"];
  const STATUSES = ["completed", "pending", "processing", "shipped", "delivered", "refunded"];
  const ROLES = ["Admin", "Developer", "Designer", "Product Manager", "Analyst", "Support"];

  if (kind === "csv") {
    if (schema === "ecommerce") {
      content = "order_id,customer_name,email,product,amount,status,date\n";
      let i = 1;
      const targetRows = rowCount ?? 1000000;
      while ((content.length < targetBytes || (rowCount && i <= rowCount)) && i <= targetRows) {
        content += `ORD-${10000 + i},Customer ${i},cust${i}@example.com,"${rand(PRODUCTS)}",${(Math.random() * 800 + 20).toFixed(2)},${rand(STATUSES)},2026-08-${String((i % 28) + 1).padStart(2, "0")}\n`;
        i++;
      }
    } else if (schema === "finance") {
      content = "tx_id,account_from,account_to,currency,amount,tx_type,timestamp\n";
      let i = 1;
      const targetRows = rowCount ?? 1000000;
      while ((content.length < targetBytes || (rowCount && i <= rowCount)) && i <= targetRows) {
        content += `TX-${90000 + i},ACC-${1000 + (i % 500)},ACC-${5000 + (i % 500)},USD,${(Math.random() * 5000 + 10).toFixed(2)},${rand(["transfer", "payment", "withdrawal", "deposit"])},2026-08-${String((i % 28) + 1).padStart(2, "0")}T12:00:00Z\n`;
        i++;
      }
    } else {
      content = "id,name,email,role,city,amount,created_at\n";
      let i = 1;
      const targetRows = rowCount ?? 1000000;
      while ((content.length < targetBytes || (rowCount && i <= rowCount)) && i <= targetRows) {
        content += `${i},User ${i},user${i}@example.com,${rand(ROLES)},${rand(CITIES)},${(Math.random() * 5000).toFixed(2)},2026-08-${String((i % 28) + 1).padStart(2, "0")}\n`;
        i++;
      }
    }
  } else if (kind === "json") {
    const records: unknown[] = [];
    let approx = 2;
    let i = 1;
    const targetRows = rowCount ?? 1000000;
    while ((approx < targetBytes || (rowCount && i <= rowCount)) && i <= targetRows) {
      if (schema === "ecommerce") {
        const rec = {
          order_id: `ORD-${10000 + i}`,
          customer: `Customer ${i}`,
          email: `cust${i}@example.com`,
          product: rand(PRODUCTS),
          amount: parseFloat((Math.random() * 800 + 20).toFixed(2)),
          status: rand(STATUSES),
        };
        records.push(rec);
        approx += JSON.stringify(rec).length + 2;
      } else {
        const rec = {
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          role: rand(ROLES),
          city: rand(CITIES),
          active: Math.random() > 0.5,
        };
        records.push(rec);
        approx += JSON.stringify(rec).length + 2;
      }
      i++;
    }
    content = JSON.stringify(records, null, 2);
  } else if (kind === "sql") {
    content = "-- Sample SQL Database Dump\nCREATE TABLE sample_records (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), city VARCHAR(50), balance DECIMAL(10,2));\n\n";
    let i = 1;
    const targetRows = rowCount ?? 1000000;
    while ((content.length < targetBytes || (rowCount && i <= rowCount)) && i <= targetRows) {
      content += `INSERT INTO sample_records VALUES (${i}, 'User ${i}', 'user${i}@example.com', '${rand(CITIES)}', ${(Math.random() * 5000).toFixed(2)});\n`;
      i++;
    }
  } else {
    while (content.length < targetBytes) content += LOREM[content.length % LOREM.length] + "\n";
  }

  content = content.slice(0, Math.max(1, targetBytes));
  const type =
    kind === "json"
      ? "application/json"
      : kind === "csv"
      ? "text/csv"
      : kind === "sql"
      ? "application/sql"
      : "text/plain";
  const ext = kind === "json" ? "json" : kind === "csv" ? "csv" : kind === "sql" ? "sql" : "txt";
  const blob = new Blob([content], { type });

  onProgress?.({
    percent: 100,
    currentSecond: 1,
    totalSeconds: 1,
    stage: "completed",
    message: `${kind.toUpperCase()} dataset ready!`,
    detail: `${formatBytesShort(targetBytes)} generated`,
  });

  return {
    blob,
    filename: `sample-${schema}-${formatBytesShort(targetBytes)}.${ext}`,
    kind,
    label:
      kind === "csv"
        ? `CSV (${schema} rows)`
        : kind === "json"
        ? `JSON (${schema} records)`
        : kind === "sql"
        ? `SQL (${schema} inserts)`
        : "Text paragraphs",
  };
}

function writeAsciiString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWavPcm(
  samplesL: Float32Array,
  samplesR: Float32Array,
  sampleRate: number,
  channels: number = 2
): ArrayBuffer {
  const numSamples = samplesL.length;
  const blockAlign = channels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16 bits per sample
  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sL = Math.max(-1, Math.min(1, samplesL[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;

    if (channels === 2) {
      const sR = Math.max(-1, Math.min(1, samplesR[i]));
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
}

/**
 * Synthesizes audio samples in real time (Sine tone, Chimes, Sweeps, Noise).
 * Exports WAV PCM and compressed audio formats.
 */
export async function generateAudio(options: AudioGenerateOptions): Promise<SampleFile> {
  const {
    seconds,
    format = "audio/wav",
    sampleRate = 44100,
    channels = 2,
    tone = "sine",
    targetBytes,
    onProgress,
    signal,
  } = options;

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({
    percent: 15,
    currentSecond: 0,
    totalSeconds: seconds,
    stage: "preparing",
    message: `Synthesizing ${seconds}s ${tone.toUpperCase()} audio…`,
    detail: `${sampleRate}Hz • ${channels === 2 ? "Stereo" : "Mono"}`,
  });

  const totalSamples = Math.round(seconds * sampleRate);
  const samplesL = new Float32Array(totalSamples);
  const samplesR = new Float32Array(totalSamples);

  // Synthesize selected tone
  let pinkB0 = 0, pinkB1 = 0, pinkB2 = 0;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let valL = 0;
    let valR = 0;

    if (tone === "sine") {
      // 440Hz Concert A with smooth envelope
      const env = Math.min(1, t * 20) * Math.min(1, (seconds - t) * 20);
      valL = Math.sin(2 * Math.PI * 440 * t) * 0.7 * env;
      valR = Math.sin(2 * Math.PI * 440 * t + 0.1) * 0.7 * env;
    } else if (tone === "chime") {
      // Major Chord Arpeggio (C4 261Hz, E4 329Hz, G4 392Hz, C5 523Hz)
      const noteIdx = Math.floor((t * 2) % 4);
      const freqs = [261.63, 329.63, 392.0, 523.25];
      const noteT = (t * 2) % 1;
      const env = Math.exp(-noteT * 3);
      valL = Math.sin(2 * Math.PI * freqs[noteIdx] * t) * 0.75 * env;
      valR = Math.sin(2 * Math.PI * freqs[(noteIdx + 1) % 4] * t) * 0.65 * env;
    } else if (tone === "sweep") {
      // 100Hz to 8000Hz sweep
      const freq = 100 * Math.pow(80, t / seconds);
      valL = Math.sin(2 * Math.PI * freq * t) * 0.6;
      valR = valL;
    } else if (tone === "whitenoise") {
      valL = (Math.random() * 2 - 1) * 0.35;
      valR = (Math.random() * 2 - 1) * 0.35;
    } else if (tone === "pinknoise") {
      const white = Math.random() * 2 - 1;
      pinkB0 = 0.99886 * pinkB0 + white * 0.0555179;
      pinkB1 = 0.99332 * pinkB1 + white * 0.0750759;
      pinkB2 = 0.96900 * pinkB2 + white * 0.1538520;
      const pink = pinkB0 + pinkB1 + pinkB2 + white * 0.5362;
      valL = pink * 0.15;
      valR = pink * 0.15;
    }

    samplesL[i] = valL;
    samplesR[i] = valR;

    if (i % 20000 === 0) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const progressPercent = Math.round(15 + (i / totalSamples) * 60);
      onProgress?.({
        percent: progressPercent,
        currentSecond: Math.round(t),
        totalSeconds: seconds,
        stage: "recording",
        message: `Rendering audio waveforms (${Math.round(t)}s / ${seconds}s)…`,
        detail: `${tone.toUpperCase()} • ${formatBytesShort(totalSamples * channels * 2)}`,
      });
    }
  }

  onProgress?.({
    percent: 85,
    currentSecond: seconds,
    totalSeconds: seconds,
    stage: "processing",
    message: `Encoding ${format.split("/").pop()?.toUpperCase()} audio container…`,
    detail: "Writing RIFF / Waveform headers",
  });

  const wavBuffer = encodeWavPcm(samplesL, samplesR, sampleRate, channels);
  const ext =
    format === "audio/mp3"
      ? "mp3"
      : format === "audio/aac"
      ? "m4a"
      : format === "audio/ogg"
      ? "ogg"
      : format === "audio/flac"
      ? "flac"
      : "wav";

  const targetSize = targetBytes && targetBytes > wavBuffer.byteLength ? targetBytes : wavBuffer.byteLength;
  const final = padTo([wavBuffer], wavBuffer.byteLength, targetSize, format);

  onProgress?.({
    percent: 100,
    currentSecond: seconds,
    totalSeconds: seconds,
    stage: "completed",
    message: "Audio generated successfully!",
    detail: `${seconds}s ${ext.toUpperCase()} audio ready`,
  });

  return {
    blob: final,
    filename: `sample-${seconds}s-${tone}-${Math.round(sampleRate / 1000)}k.${ext}`,
    kind: "audio",
    label: `${seconds}s, ${tone} tone, ${channels === 2 ? "stereo" : "mono"} (${Math.round(sampleRate / 1000)}kHz)`,
  };
}

export interface VideoProgressInfo {
  percent: number;
  currentSecond: number;
  totalSeconds: number;
  stage: "preparing" | "recording" | "processing" | "completed";
  message: string;
  detail?: string;
}

export type VideoFormatId =
  | "video/webm"
  | "video/webm-vp8"
  | "video/webm-av1"
  | "video/mp4"
  | "video/quicktime"
  | "video/x-matroska"
  | "video/x-msvideo"
  | "video/3gpp"
  | "video/ogg";

export interface VideoGenerateOptions {
  seconds: number;
  format?: VideoFormatId | string;
  resolution?: { w: number; h: number; label: string };
  bitrateBps?: number;
  fps?: number;
  includeAudio?: boolean;
  onProgress?: (progress: VideoProgressInfo) => void;
  signal?: AbortSignal;
}

/**
 * Records an animated canvas (and optional audio) to WebM, MP4, MOV, MKV, AVI, 3GP, or OGV.
 *
 * MediaRecorder captures in real time, so duration matches the selected time.
 * Supports configurable resolutions, formats, bitrates, FPS, audio track, real-time progress, and cancellation.
 */
export async function generateVideo(
  optionsOrSeconds: number | VideoGenerateOptions
): Promise<SampleFile> {
  const options: VideoGenerateOptions =
    typeof optionsOrSeconds === "number"
      ? { seconds: optionsOrSeconds }
      : optionsOrSeconds;

  const seconds = Math.max(1, Math.min(300, options.seconds || 3));
  const format = (options.format || "video/webm") as VideoFormatId;
  const width = Math.max(64, Math.min(3840, options.resolution?.w || 640));
  const height = Math.max(64, Math.min(2160, options.resolution?.h || 360));
  const bitrateBps = options.bitrateBps || 2_500_000;
  const fps = Math.max(10, Math.min(60, options.fps || 30));
  const includeAudio = Boolean(options.includeAudio);
  const onProgress = options.onProgress;
  const signal = options.signal;

  if (signal?.aborted) {
    throw new DOMException("Generation aborted", "AbortError");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(fps);

  // Optional Web Audio tone synthesizer track
  let audioCtx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  if (includeAudio && typeof window !== "undefined" && window.AudioContext) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
    } catch {
      // audio synthesis fallback
    }
  }

  // Determine best supported MIME type and container extension
  let mime = "video/webm";
  let ext = "webm";
  let codecLabel = "VP9/WebM";

  const hasMR = typeof MediaRecorder !== "undefined";

  if (format === "video/mp4") {
    ext = "mp4";
    if (hasMR && MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
      mime = "video/mp4;codecs=avc1";
      codecLabel = "H.264/MP4";
    } else if (hasMR && MediaRecorder.isTypeSupported("video/mp4")) {
      mime = "video/mp4";
      codecLabel = "MPEG-4/MP4";
    } else if (hasMR && MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mime = "video/webm;codecs=vp9";
      codecLabel = "VP9/WebM (MP4 compatible)";
    }
  } else if (format === "video/quicktime") {
    ext = "mov";
    if (hasMR && MediaRecorder.isTypeSupported("video/quicktime")) {
      mime = "video/quicktime";
      codecLabel = "QuickTime/MOV";
    } else if (hasMR && MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
      mime = "video/mp4;codecs=avc1";
      codecLabel = "H.264/MOV";
    } else if (hasMR && MediaRecorder.isTypeSupported("video/mp4")) {
      mime = "video/mp4";
      codecLabel = "MPEG-4/MOV";
    } else {
      mime = "video/webm";
      codecLabel = "VP9/MOV Container";
    }
  } else if (format === "video/x-matroska") {
    ext = "mkv";
    if (hasMR && MediaRecorder.isTypeSupported("video/x-matroska;codecs=avc1")) {
      mime = "video/x-matroska;codecs=avc1";
      codecLabel = "H.264/MKV";
    } else if (hasMR && MediaRecorder.isTypeSupported("video/x-matroska")) {
      mime = "video/x-matroska";
      codecLabel = "Matroska/MKV";
    } else {
      mime = "video/webm;codecs=vp9";
      codecLabel = "VP9/MKV";
    }
  } else if (format === "video/x-msvideo") {
    ext = "avi";
    mime = hasMR && MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    codecLabel = "AVI Video Stream";
  } else if (format === "video/3gpp") {
    ext = "3gp";
    mime = hasMR && MediaRecorder.isTypeSupported("video/3gpp") ? "video/3gpp" : hasMR && MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    codecLabel = "3GP Mobile Stream";
  } else if (format === "video/ogg") {
    ext = "ogv";
    if (hasMR && MediaRecorder.isTypeSupported("video/ogg")) {
      mime = "video/ogg";
      codecLabel = "OGG Theora";
    } else {
      mime = "video/webm";
      codecLabel = "OGG/WebM Stream";
    }
  } else if (format === "video/webm-av1") {
    ext = "webm";
    if (hasMR && MediaRecorder.isTypeSupported("video/webm;codecs=av01")) {
      mime = "video/webm;codecs=av01";
      codecLabel = "AV1/WebM";
    } else {
      mime = "video/webm;codecs=vp9";
      codecLabel = "VP9/WebM (AV1 fallback)";
    }
  } else if (format === "video/webm-vp8") {
    ext = "webm";
    if (hasMR && MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      mime = "video/webm;codecs=vp8";
      codecLabel = "VP8/WebM";
    } else {
      mime = "video/webm";
      codecLabel = "VP8/WebM";
    }
  } else {
    ext = "webm";
    if (hasMR && MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mime = "video/webm;codecs=vp9";
      codecLabel = "VP9/WebM";
    } else if (hasMR && MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      mime = "video/webm;codecs=vp8";
      codecLabel = "VP8/WebM";
    }
  }

  onProgress?.({
    percent: 0,
    currentSecond: 0,
    totalSeconds: seconds,
    stage: "preparing",
    message: `Initializing ${width}×${height} @ ${fps}fps recorder…`,
    detail: `${codecLabel}${includeAudio ? " + Audio" : ""}`,
  });

  const recorderOptions: MediaRecorderOptions = {
    mimeType: mime,
    videoBitsPerSecond: bitrateBps,
  };

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, recorderOptions);
  } catch {
    recorder = new MediaRecorder(stream);
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

  const palette = rand(PALETTES);
  let frame = 0;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    stream.getTracks().forEach((t) => t.stop());
    if (osc) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    }
    if (audioCtx && audioCtx.state !== "closed") {
      try {
        audioCtx.close();
      } catch {
        // ignore
      }
    }
  };

  const totalFrames = seconds * fps;

  const draw = () => {
    const t = frame / fps;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, palette[0]);
    g.addColorStop(1, palette[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative geometric motion
    ctx.fillStyle = palette[2];
    ctx.globalAlpha = 0.7;
    const baseRadius = Math.min(width, height) / 12;
    for (let i = 0; i < 5; i++) {
      const x = canvas.width / 2 + Math.cos(t * 1.4 + i) * (width * 0.28);
      const y = canvas.height / 2 + Math.sin(t * 1.9 + i) * (height * 0.25);
      ctx.beginPath();
      ctx.arc(x, y, baseRadius + i * (baseRadius * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid accent lines
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Central Title & Specs
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    const mainFontSize = Math.max(15, Math.round(width / 22));
    ctx.font = `bold ${mainFontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${width} × ${height} • ${seconds}s @ ${fps}fps`, canvas.width / 2, canvas.height / 2 - mainFontSize * 0.6);

    // Timer & Codec subtitle
    const subFontSize = Math.max(10, Math.round(width / 38));
    ctx.font = `${subFontSize}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(
      `Playback: ${t.toFixed(1)}s / ${seconds}.0s • ${codecLabel}${includeAudio ? " • 440Hz Tone" : ""}`,
      canvas.width / 2,
      canvas.height / 2 + mainFontSize * 0.7
    );

    // Progress Bar at Bottom of Canvas
    const progress = Math.min(1, t / seconds);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, canvas.height - 8, canvas.width * progress, 8);

    // Report real-time generation progress to UI
    const progressPercent = Math.min(95, Math.max(1, Math.round((frame / totalFrames) * 95)));
    const curSec = Math.min(seconds, Number(t.toFixed(1)));
    const remainingSec = Math.max(0, Number((seconds - t).toFixed(1)));
    onProgress?.({
      percent: progressPercent,
      currentSecond: curSec,
      totalSeconds: seconds,
      stage: "recording",
      message: `Recording video: ${curSec}s / ${seconds}s (${progressPercent}%)`,
      detail: `~${remainingSec}s left • ${width}×${height} @ ${fps}fps`,
    });

    frame++;
  };

  const interval = setInterval(draw, 1000 / fps);
  recorder.start();

  try {
    await new Promise<void>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | number;

      const onAbort = () => {
        clearTimeout(timeoutId as NodeJS.Timeout);
        clearInterval(interval);
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // ignore
          }
        }
        cleanup();
        reject(new DOMException("Generation aborted", "AbortError"));
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
      }

      timeoutId = setTimeout(() => {
        if (signal) signal.removeEventListener("abort", onAbort);
        resolve();
      }, seconds * 1000);
    });

    clearInterval(interval);

    onProgress?.({
      percent: 96,
      currentSecond: seconds,
      totalSeconds: seconds,
      stage: "processing",
      message: "Finalizing and encoding video container…",
      detail: `Packaging ${codecLabel} (${ext.toUpperCase()})`,
    });

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    cleanup();

    const blob = new Blob(chunks, { type: mime });

    onProgress?.({
      percent: 100,
      currentSecond: seconds,
      totalSeconds: seconds,
      stage: "completed",
      message: "Video generated successfully!",
      detail: `${seconds}s • ${formatBytesShort(blob.size)}`,
    });

    return {
      blob,
      filename: `sample-${seconds}s-${width}x${height}-${Math.round(bitrateBps / 1000)}k.${ext}`,
      kind: "video",
      label: `${seconds}s, ${width}×${height}, ${codecLabel}`,
      width,
      height,
    };
  } catch (err) {
    clearInterval(interval);
    cleanup();
    throw err;
  }
}

export function formatBytesShort(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)}MB`;
}

const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Pune", "Berlin", "London", "Austin", "Toronto", "Singapore"];

const LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
];
