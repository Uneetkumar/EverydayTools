"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PDFDict, PDFDocument, PDFName, PDFRef, PDFStream } from "pdf-lib";
import { FileSearch, Lock } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToolErrorState, ToolLoadingState } from "@/components/tool/tool-states";
import { markToolCompleted, markToolError } from "@/lib/analytics";

/**
 * PDF Inspector (kept at /tools/pdf-compressor for existing links).
 *
 * Reads the file with pdf-lib entirely in the browser and reports what is in
 * it — pages and their sizes, metadata, version, encryption, form fields, and
 * where the bytes go (images and embedded fonts) — which is what you need to
 * know before deciding how to make a PDF smaller.
 */

interface PageSizeGroup {
  label: string;
  count: number;
}

interface Report {
  version: string | null;
  encrypted: boolean;
  pageCount: number;
  pageSizes: PageSizeGroup[];
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  created?: Date;
  modified?: Date;
  formFields: number | null;
  images: { count: number; bytes: number };
  fonts: { count: number; bytes: number };
}

const PAPER_SIZES: { name: string; w: number; h: number }[] = [
  { name: "A3", w: 841.89, h: 1190.55 },
  { name: "A4", w: 595.28, h: 841.89 },
  { name: "A5", w: 419.53, h: 595.28 },
  { name: "Letter", w: 612, h: 792 },
  { name: "Legal", w: 612, h: 1008 },
  { name: "Tabloid", w: 792, h: 1224 },
];

function describePageSize(width: number, height: number): string {
  const short = Math.min(width, height);
  const long = Math.max(width, height);
  const orientation = width > height ? "landscape" : "portrait";
  const paper = PAPER_SIZES.find((p) => Math.abs(p.w - short) < 3 && Math.abs(p.h - long) < 3);
  const mm = (pt: number) => Math.round((pt / 72) * 25.4);
  const dims = `${mm(width)} × ${mm(height)} mm`;
  return paper ? `${paper.name} ${orientation} (${dims})` : `${dims}, ${orientation}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(d?: Date): string | undefined {
  if (!d || Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function streamSize(stream: PDFStream): number {
  try {
    return stream.getContentsSize();
  } catch {
    return 0;
  }
}

function readPdfVersion(buffer: ArrayBuffer): string | null {
  const head = new TextDecoder("latin1").decode(new Uint8Array(buffer, 0, Math.min(1024, buffer.byteLength)));
  return head.match(/%PDF-(\d\.\d)/)?.[1] ?? null;
}

async function inspect(file: File): Promise<Report> {
  const buffer = await file.arrayBuffer();
  const version = readPdfVersion(buffer);
  // ignoreEncryption lets password-protected files open far enough to count
  // pages and report that they are encrypted, instead of failing outright.
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
  const encrypted = doc.isEncrypted;

  const groups = new Map<string, number>();
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const rotated = page.getRotation().angle % 180 !== 0;
    const label = rotated ? describePageSize(height, width) : describePageSize(width, height);
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }

  const images = { count: 0, bytes: 0 };
  const fonts = { count: 0, bytes: 0 };
  const Subtype = PDFName.of("Subtype");
  const Type = PDFName.of("Type");
  const Image = PDFName.of("Image");
  const FontDescriptor = PDFName.of("FontDescriptor");
  const fontFileKeys = ["FontFile", "FontFile2", "FontFile3"].map((k) => PDFName.of(k));

  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFStream) {
      if (obj.dict.get(Subtype) === Image) {
        images.count += 1;
        images.bytes += streamSize(obj);
      }
    } else if (obj instanceof PDFDict && obj.get(Type) === FontDescriptor) {
      for (const key of fontFileKeys) {
        const ref = obj.get(key);
        const stream = ref instanceof PDFRef ? doc.context.lookup(ref) : ref;
        if (stream instanceof PDFStream) {
          fonts.count += 1;
          fonts.bytes += streamSize(stream);
        }
      }
    }
  }

  let formFields: number | null = null;
  try {
    formFields = doc.getForm().getFields().length;
  } catch {
    formFields = null;
  }

  // Metadata strings are themselves encrypted in a protected file; showing
  // them would print garbage, so they are withheld.
  const meta = <T,>(read: () => T | undefined): T | undefined => {
    if (encrypted) return undefined;
    try {
      return read() || undefined;
    } catch {
      return undefined;
    }
  };

  return {
    version,
    encrypted,
    pageCount: doc.getPageCount(),
    pageSizes: [...groups.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    title: meta(() => doc.getTitle()),
    author: meta(() => doc.getAuthor()),
    subject: meta(() => doc.getSubject()),
    keywords: meta(() => doc.getKeywords()),
    creator: meta(() => doc.getCreator()),
    producer: meta(() => doc.getProducer()),
    created: meta(() => doc.getCreationDate()),
    modified: meta(() => doc.getModificationDate()),
    formFields,
    images,
    fonts,
  };
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border bg-background px-3.5 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setReport(null);
    setError(null);
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setReport(null);
    setError(null);
    setBusy(true);
    try {
      setReport(await inspect(f));
      markToolCompleted();
    } catch (err) {
      console.error("PDF inspection error:", err);
      markToolError("invalid_pdf");
      setError(
        f.type && f.type !== "application/pdf"
          ? "This file isn't a PDF. Choose a file that ends in .pdf."
          : "This PDF couldn't be read. It may be damaged or use a structure the browser reader doesn't support."
      );
    } finally {
      setBusy(false);
    }
  };

  const perPage = report && file && report.pageCount > 0 ? file.size / report.pageCount : 0;
  const imageShare = report && file && file.size > 0 ? Math.round((report.images.bytes / file.size) * 100) : 0;
  const fontShare = report && file && file.size > 0 ? Math.round((report.fonts.bytes / file.size) * 100) : 0;

  const metadata: [string, string | undefined][] = report
    ? [
        ["Title", report.title],
        ["Author", report.author],
        ["Subject", report.subject],
        ["Keywords", report.keywords],
        ["Created with", report.creator],
        ["PDF producer", report.producer],
        ["Created", formatDate(report.created)],
        ["Last modified", formatDate(report.modified)],
      ]
    : [];

  return (
    <div className="space-y-6">
      <DropZone
        accept="application/pdf,.pdf"
        maxSizeMB={200}
        title="Drop a PDF here or choose one"
        subtitle="Read in your browser to report pages, sizes, metadata and what makes it large. Nothing is uploaded."
        supportedFormatsText="PDF"
        selectedFile={file}
        onFileSelect={handleFile}
        onClear={reset}
        isProcessing={false}
      />

      {busy && <ToolLoadingState label="Reading the PDF…" />}

      {error && <ToolErrorState title="Couldn't inspect this file" description={error} onRetry={reset} />}

      {report && file && (
        <div className="space-y-6" aria-live="polite">
          {report.encrypted && (
            <Alert>
              <Lock aria-hidden="true" />
              <AlertTitle>This PDF is encrypted</AlertTitle>
              <AlertDescription>
                <p>
                  Its metadata is encrypted too, so it isn&apos;t shown. If you know the password, the{" "}
                  <Link href="/tools/unlock-pdf" className="text-link underline-offset-4 hover:underline">
                    Unlock PDF
                  </Link>{" "}
                  tool can remove it.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <section aria-labelledby="pdf-overview">
            <h3 id="pdf-overview" className="type-h4 text-foreground">Overview</h3>
            <dl className="mt-3 grid grid-cols-2 gap-2.5 @lg:grid-cols-4">
              <Stat label="Pages" value={report.pageCount} />
              <Stat label="File size" value={formatBytes(file.size)} hint={perPage ? `${formatBytes(perPage)} per page` : undefined} />
              <Stat label="PDF version" value={report.version ?? "Unknown"} />
              <Stat label="Encryption" value={report.encrypted ? "Encrypted" : "None"} />
              <Stat label="Images" value={report.images.count} hint={report.images.count ? `${formatBytes(report.images.bytes)} · ${imageShare}% of file` : undefined} />
              <Stat label="Embedded fonts" value={report.fonts.count} hint={report.fonts.count ? `${formatBytes(report.fonts.bytes)} · ${fontShare}% of file` : undefined} />
              <Stat label="Form fields" value={report.formFields ?? "—"} hint={report.formFields ? "Fill them with PDF Editor" : undefined} />
              <Stat label="Page sizes" value={report.pageSizes.length} hint={report.pageSizes.length > 1 ? "Mixed sizes" : undefined} />
            </dl>
          </section>

          <section aria-labelledby="pdf-weight">
            <h3 id="pdf-weight" className="type-h4 text-foreground">What makes it this size</h3>
            <p className="mt-2 type-body-sm text-muted-foreground">
              {perPage > 1024 * 1024
                ? `At ${formatBytes(perPage)} per page, the pages are almost certainly scanned images. Rescanning at 150–200 DPI, or keeping only the pages you need, will shrink it most.`
                : imageShare >= 50
                  ? `Images account for about ${imageShare}% of the file. Lower-resolution images when you export it, or removing pages you don't need, will shrink it most.`
                  : fontShare >= 30
                    ? `Embedded fonts account for about ${fontShare}% of the file. Exporting with font subsetting turned on usually fixes this.`
                    : "Nothing stands out: this is a compact file for its page count. Removing pages is the remaining way to make it smaller."}
            </p>
          </section>

          <section aria-labelledby="pdf-pages">
            <h3 id="pdf-pages" className="type-h4 text-foreground">Page sizes</h3>
            <ul className="mt-2 divide-y rounded-lg border bg-background">
              {report.pageSizes.map((g) => (
                <li key={g.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <span className="text-foreground">{g.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {g.count} {g.count === 1 ? "page" : "pages"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {!report.encrypted && (
            <section aria-labelledby="pdf-meta">
              <h3 id="pdf-meta" className="type-h4 text-foreground">Document properties</h3>
              <p className="mt-1 type-body-sm text-muted-foreground">
                These travel with the file. Check them before sending it outside your organisation.
              </p>
              <dl className="mt-3 divide-y rounded-lg border bg-background">
                {metadata.map(([label, value]) => (
                  <div key={label} className="grid gap-1 px-3.5 py-2.5 text-sm sm:grid-cols-[10rem_1fr] sm:gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className={value ? "break-words text-foreground" : "text-muted-foreground"}>{value ?? "Not set"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {!busy && !error && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileSearch className="size-3.5" aria-hidden="true" />
              Read in your browser. The file was not uploaded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
