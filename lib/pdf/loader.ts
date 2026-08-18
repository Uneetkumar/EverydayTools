/**
 * Shared pdf.js bootstrap.
 *
 * The worker is copied into /public rather than bundled via
 * `new URL(..., import.meta.url)`. With `output: "export"` the app is served as
 * plain static files from Firebase Hosting, and a predictable absolute path is
 * far more reliable there than a bundler-generated worker chunk.
 *
 * Keep public/pdf.worker.min.mjs in sync with the pdfjs-dist version in
 * package.json — a worker/API version mismatch fails at runtime.
 */
export const PDF_WORKER_SRC = "/pdf.worker.min.mjs";

/**
 * pdf.js fetches these at runtime; they are not bundled.
 *
 * Without `standardFontDataUrl` the renderer stalls on any document using the
 * standard-14 fonts (Helvetica, Times, Courier) — which is most PDFs — because
 * it cannot obtain the glyph data. Text extraction works without them, which
 * makes the omission easy to miss until you try to rasterise a page.
 *
 * `cMapUrl` is the equivalent for CJK encodings.
 */
export const PDF_STANDARD_FONTS_URL = "/pdfjs/standard_fonts/";
export const PDF_CMAP_URL = "/pdfjs/cmaps/";
export const PDF_WASM_URL = "/pdfjs/wasm/";

/** Shared options every getDocument() call in the app should pass. */
export function pdfDocumentOptions(data: ArrayBuffer) {
  return {
    data,
    standardFontDataUrl: PDF_STANDARD_FONTS_URL,
    cMapUrl: PDF_CMAP_URL,
    cMapPacked: true,
    wasmUrl: PDF_WASM_URL,
  };
}

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

/** Loads pdf.js on demand so its ~1MB bundle stays off the initial page load. */
export function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Extracts the text layer of every page. Returns one string per page. */
export async function extractPdfText(file: File): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument(pdfDocumentOptions(data));
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // pdf.js returns positioned text runs, not paragraphs. Group runs by their
    // vertical position so lines survive; anything more structural (columns,
    // tables) cannot be recovered from a PDF's glyph positions.
    const lines = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const key = Math.round(y / 3) * 3; // tolerate sub-pixel drift
      if (!lines.has(key)) lines.set(key, []);
      lines.get(key)!.push({ x, s: item.str });
    }

    const ordered = [...lines.entries()]
      .sort((a, b) => b[0] - a[0]) // PDF origin is bottom-left
      .map(([, runs]) =>
        runs
          .sort((a, b) => a.x - b.x)
          .map((r) => r.s)
          .join("")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    pages.push(ordered.join("\n"));
    page.cleanup();
  }

  // destroy() lives on the loading task; it tears down the worker port.
  await loadingTask.destroy();
  return pages;
}
