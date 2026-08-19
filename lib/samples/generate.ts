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

export type SampleKind = "image" | "pdf" | "docx" | "video" | "text" | "csv" | "json";

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

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, quality)
  );
}

export async function generateImage(
  targetBytes: number,
  format: "image/png" | "image/jpeg" | "image/webp",
  dimensions?: { w: number; h: number }
): Promise<SampleFile> {
  const subject = rand(SUBJECTS);
  // Rough bytes-per-pixel so the drawn content lands near the target rather
  // than being mostly padding.
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

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paintCanvas(canvas, subject);

  let blob = await canvasBlob(canvas, format, format === "image/png" ? undefined : 0.92);
  // One corrective pass if we badly overshot: drop quality before padding.
  if (blob.size > targetBytes && format !== "image/png") {
    const q = Math.max(0.3, 0.92 * (targetBytes / blob.size));
    blob = await canvasBlob(canvas, format, q);
  }

  const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
  const buf = await blob.arrayBuffer();
  const final = padTo([buf], buf.byteLength, targetBytes, format);
  return {
    blob: final,
    filename: `sample-${w}x${h}-${formatBytesShort(targetBytes)}.${ext}`,
    kind: "image",
    label: `${subject}, ${w}×${h}`,
    width: w,
    height: h,
  };
}

export async function generatePdf(targetBytes: number): Promise<SampleFile> {
  const pageCount = randInt(1, 4);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText("Sample PDF Document", { x: 56, y: 770, size: 22, font: bold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`Page ${i + 1} of ${pageCount}`, { x: 56, y: 742, size: 11, font, color: rgb(0.4, 0.45, 0.5) });
    page.drawText(`Generated ${new Date().toISOString().slice(0, 19).replace("T", " ")}`, {
      x: 56, y: 724, size: 9, font, color: rgb(0.55, 0.6, 0.65),
    });
    let y = 690;
    for (let line = 0; line < 26; line++) {
      page.drawText(LOREM[(i * 26 + line) % LOREM.length], { x: 56, y, size: 10.5, font, color: rgb(0.2, 0.24, 0.29) });
      y -= 18;
    }
    page.drawRectangle({ x: 56, y: 90, width: 483, height: 90, color: rgb(0.93, 0.95, 0.98) });
    page.drawText("This file exists only for testing uploads and viewers.", {
      x: 72, y: 130, size: 10, font, color: rgb(0.35, 0.4, 0.45),
    });
  }

  const bytes = await doc.save();
  // Bytes after %%EOF are ignored by every reader, so padding is safe here.
  const final = padTo([bytes as BlobPart], bytes.byteLength, targetBytes, "application/pdf");
  return {
    blob: final,
    filename: `sample-${pageCount}page-${formatBytesShort(targetBytes)}.pdf`,
    kind: "pdf",
    label: `${pageCount} page${pageCount === 1 ? "" : "s"}, text and shapes`,
  };
}

export async function generateDocx(targetBytes: number): Promise<SampleFile> {
  const paras = randInt(6, 14);
  const children = [
    new Paragraph({ text: "Sample Word Document", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [new TextRun({ text: `Generated ${new Date().toUTCString()}`, italics: true, color: "888888" })],
    }),
  ];
  for (let i = 0; i < paras; i++) {
    children.push(new Paragraph({ text: LOREM[i % LOREM.length] }));
  }
  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const buf = await blob.arrayBuffer();
  // A .docx is a ZIP; trailing bytes after the central directory are tolerated
  // by Word and by every unzip implementation we care about.
  const final = padTo([buf], buf.byteLength, targetBytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  return {
    blob: final,
    filename: `sample-${paras}para-${formatBytesShort(targetBytes)}.docx`,
    kind: "docx",
    label: `${paras} paragraphs of placeholder text`,
  };
}

export function generateText(targetBytes: number, kind: "text" | "csv" | "json"): SampleFile {
  let content = "";
  if (kind === "csv") {
    content = "id,name,email,city,amount,created_at\n";
    let i = 1;
    while (content.length < targetBytes) {
      content += `${i},User ${i},user${i}@example.com,${rand(CITIES)},${(Math.random() * 5000).toFixed(2)},2026-08-${String((i % 28) + 1).padStart(2, "0")}\n`;
      i++;
    }
  } else if (kind === "json") {
    const records: unknown[] = [];
    let approx = 2;
    let i = 1;
    while (approx < targetBytes) {
      const rec = { id: i, name: `User ${i}`, email: `user${i}@example.com`, city: rand(CITIES), active: Math.random() > 0.5 };
      records.push(rec);
      approx += JSON.stringify(rec).length + 2;
      i++;
    }
    content = JSON.stringify(records, null, 2);
  } else {
    while (content.length < targetBytes) content += LOREM[content.length % LOREM.length] + "\n";
  }
  content = content.slice(0, Math.max(1, targetBytes));
  const type = kind === "json" ? "application/json" : kind === "csv" ? "text/csv" : "text/plain";
  const ext = kind === "json" ? "json" : kind === "csv" ? "csv" : "txt";
  const blob = new Blob([content], { type });
  return {
    blob,
    filename: `sample-${formatBytesShort(targetBytes)}.${ext}`,
    kind,
    label: kind === "csv" ? "tabular rows with headers" : kind === "json" ? "array of records" : "lorem ipsum paragraphs",
  };
}

/**
 * Records a canvas animation to WebM.
 *
 * Unavoidably slower than the other generators — MediaRecorder captures in real
 * time, so a three-second clip takes three seconds. Size is also approximate:
 * the encoder decides its own bitrate and the container cannot be padded the
 * way the other formats can.
 */
export async function generateVideo(seconds: number): Promise<SampleFile> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

  const palette = rand(PALETTES);
  let frame = 0;
  const draw = () => {
    const t = frame / 30;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, palette[0]);
    g.addColorStop(1, palette[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette[2];
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 5; i++) {
      const x = canvas.width / 2 + Math.cos(t * 1.4 + i) * 150;
      const y = canvas.height / 2 + Math.sin(t * 1.9 + i) * 90;
      ctx.beginPath();
      ctx.arc(x, y, 26 + i * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "bold 30px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Sample video · ${t.toFixed(1)}s`, canvas.width / 2, canvas.height - 40);
    frame++;
  };

  const interval = setInterval(draw, 1000 / 30);
  recorder.start();
  await new Promise((r) => setTimeout(r, seconds * 1000));
  clearInterval(interval);
  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });
  stream.getTracks().forEach((t) => t.stop());

  const blob = new Blob(chunks, { type: "video/webm" });
  return {
    blob,
    filename: `sample-${seconds}s-640x360.webm`,
    kind: "video",
    label: `${seconds}s, 640×360, VP9/WebM`,
  };
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
