/**
 * On-device OCR.
 *
 * Everything is self-hosted from /public/tesseract rather than tesseract.js's
 * default CDN, matching how ffmpeg and pdf.js are handled here. Three reasons:
 * the CDN is a third-party dependency on the critical path, `output: "export"`
 * means there is no server to proxy it, and — most importantly — the whole
 * point of this engine is that the image never leaves the browser. Fetching
 * the model from someone else's origin would not break that, but self-hosting
 * makes it verifiable rather than something a user has to take on trust.
 *
 * Assets (~9.5MB, loaded on first use only):
 *   worker.min.js                      the worker shim
 *   tesseract-core-simd-lstm.wasm.js   SIMD build, used where supported
 *   tesseract-core-lstm.wasm.js        fallback for browsers without SIMD
 *   lang/eng.traineddata.gz            English LSTM model (tessdata_fast)
 *
 * Keep these in sync with the tesseract.js version in package.json — a worker
 * built against a different core fails at runtime, the same trap as the pdf.js
 * worker.
 */
import type { Worker } from "tesseract.js";

export interface OcrProgress {
  /** 0–1, or null while the stage has no measurable progress. */
  progress: number | null;
  /** Human-readable stage, e.g. "recognizing text". */
  status: string;
}

export interface OcrResult {
  text: string;
  /** Mean confidence 0–100 as reported by Tesseract. */
  confidence: number;
  /** Milliseconds spent in recognition. */
  elapsedMs: number;
}

/**
 * One worker is kept alive across runs. Spinning up a worker re-parses ~7MB of
 * wasm and re-reads the language model, which costs seconds — unacceptable when
 * a user is OCR-ing several images in a row.
 */
let workerPromise: Promise<Worker> | null = null;

async function getWorker(onProgress?: (p: OcrProgress) => void): Promise<Worker> {
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    const { createWorker } = await import("tesseract.js");
    return createWorker("eng", 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract",
      langPath: "/tesseract/lang",
      // The model ships gzipped; without this tesseract.js looks for a plain
      // .traineddata and 404s.
      gzip: true,
      logger: (m: { progress?: number; status?: string }) => {
        onProgress?.({
          progress: typeof m.progress === "number" ? m.progress : null,
          status: m.status ?? "working",
        });
      },
    });
  })();

  try {
    return await workerPromise;
  } catch (e) {
    // A failed init must not poison every later attempt.
    workerPromise = null;
    throw e;
  }
}

/** Recognises text in an image entirely on this device. */
export async function recognizeLocally(
  file: Blob,
  onProgress?: (p: OcrProgress) => void
): Promise<OcrResult> {
  const started = performance.now();
  const worker = await getWorker(onProgress);
  const { data } = await worker.recognize(file);
  return {
    text: data.text.trim(),
    confidence: Math.round(data.confidence ?? 0),
    elapsedMs: Math.round(performance.now() - started),
  };
}

/** Frees the worker and its wasm heap. Safe to call when it was never started. */
export async function disposeOcr(): Promise<void> {
  if (!workerPromise) return;
  const p = workerPromise;
  workerPromise = null;
  try {
    (await p).terminate();
  } catch {
    /* already gone */
  }
}
