/**
 * Cloud OCR via Firebase AI Logic (Gemini).
 *
 * This is the OPT-IN path. It exists because on-device Tesseract has real
 * limits: it is poor at handwriting, at non-Latin scripts, and at anything with
 * a table or a multi-column layout. Gemini handles all three well.
 *
 * The trade is explicit and must stay visible in the UI: the image is uploaded
 * to Google. Every other tool on this site claims "runs in your browser", and
 * that claim only stays honest if the one tool that breaks it says so plainly.
 * `ToolShell`'s NETWORK_TOOLS set is the existing mechanism for that label.
 *
 * ── BEFORE THIS WORKS IN PRODUCTION ──────────────────────────────────────────
 * 1. Enable Firebase AI Logic in the Firebase console (it provisions the
 *    Gemini Developer API for the project).
 * 2. Turn on App Check with reCAPTCHA Enterprise and ENFORCE it for AI Logic.
 *
 * Step 2 is not optional. This is a public static site: `firebaseConfig` is in
 * the page source, as it is designed to be. Firebase AI Logic brokers the model
 * call so no Gemini API key is exposed, but without App Check enforcement
 * anyone can point that same config at the endpoint and spend the quota. App
 * Check is the only thing standing between the free tier and a scraper.
 */
import { app, ensureAppCheck } from "@/lib/firebase";
import { GEMINI_MODEL_CANDIDATES, isModelNotFound } from "@/lib/ai/model-fallback";
import { withTimeout, AI_TIMEOUTS, TimeoutError , condenseProviderError } from "@/lib/ai/timeout";
import { visionGenerationConfigFor } from "@/lib/ai/generation-config";

export interface CloudOcrResult {
  text: string;
  model: string;
}

/**
 * Downscales before upload.
 *
 * base64 inflates bytes by about a third, so the 1MB photo a phone produces
 * becomes a ~1.4MB inline payload — slow on a typical uplink and the main
 * reason a request appears to hang. Gemini gains nothing from the extra
 * pixels: text is legible well below 2000px on the long edge, and the model
 * downsamples anyway.
 *
 * JPEG at 0.85 rather than PNG: OCR does not benefit from lossless encoding of
 * a photograph, and PNG of a photo is several times larger.
 */
const MAX_EDGE = 2000;

async function downscaleForUpload(file: Blob): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);
    if (longEdge <= MAX_EDGE) {
      bitmap.close();
      return file;
    }
    const scale = MAX_EDGE / longEdge;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const out = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85)
    );
    // Only accept the resize if it actually helped.
    return out && out.size < file.size ? out : file;
  } catch {
    // An exotic format createImageBitmap cannot decode: send the original.
    return file;
  }
}

/** Gemini needs raw base64, without the `data:` prefix FileReader produces. */
async function toBase64(file: Blob): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/**
 * Asking for a transcription rather than a description matters. Without the
 * "do not summarise or add commentary" instruction Gemini will happily return
 * "This image shows an invoice from…", which is not what an OCR tool is for.
 */
const PROMPT = [
  "Transcribe all text visible in this image, exactly as it appears.",
  "Preserve the original line breaks, reading order and spelling.",
  "Keep table rows on one line with columns separated by tabs.",
  "Do not summarise, translate, describe the image, or add any commentary.",
  "If there is no legible text, reply with exactly: NO_TEXT_FOUND",
].join(" ");

const MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

export async function recognizeWithGemini(file: Blob): Promise<CloudOcrResult> {
  // AI Logic is enforced; without a token this is rejected before Gemini.
  await ensureAppCheck();
  const { getAI, getGenerativeModel, GoogleAIBackend } = await import("firebase/ai");

  // GoogleAIBackend is the Gemini Developer API, which has a free tier.
  // VertexAIBackend would require the Blaze plan.
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const upload = await downscaleForUpload(file);
  const parts = [
    { inlineData: { mimeType: upload.type || "image/png", data: await toBase64(upload) } },
    { text: PROMPT },
  ];

  // Same fallback reasoning as the text provider: a missing model id is worth
  // retrying, anything else fails identically on every id.
  let lastError: unknown = null;
  for (const candidate of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = getGenerativeModel(ai, {
        model: candidate,
        generationConfig: visionGenerationConfigFor(candidate),
      });
      const result = await withTimeout(
        model.generateContent(parts),
        AI_TIMEOUTS.vision,
        `Gemini (${candidate})`
      );
      const text = result.response.text().trim();
      return {
        text: text === "NO_TEXT_FOUND" ? "" : text,
        model: candidate,
      };
    } catch (e) {
      lastError = e;
      if (e instanceof TimeoutError) throw e;
      if (!isModelNotFound(e)) throw e;
    }
  }
  throw lastError ?? new Error("No Gemini model responded.");
}

/**
 * Turns the SDK's errors into something a user can act on. The two that
 * actually happen are "AI Logic was never enabled for this project" and "App
 * Check rejected the request", and both look like opaque 403s otherwise.
 */
export function describeGeminiError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  // The raw message is always appended: a friendly sentence on its own hides
  // the one detail needed to tell "service off" from "model name wrong".
  // Condensed, not raw: a verbatim provider error is JSON and overflows.
  const detail = ` (${condenseProviderError(msg)})`;
  if (/API has not been used|SERVICE_DISABLED|has not been enabled/i.test(msg))
    return `Firebase AI Logic is not enabled for this project. Enable it in the Firebase console, then try again.${detail}`;
  if (/not found|NOT_FOUND|404/i.test(msg)) {
    const failed = msg.match(/models\/([a-z0-9.-]+):/i)?.[1] ?? MODEL;
    return `The model "${failed}" is not available to this project.${detail}`;
  }
  if (/app.?check|unauthorized|403|PERMISSION_DENIED/i.test(msg))
    return `The request was rejected before reaching the model — usually App Check or an API restriction.${detail}`;
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg))
    return `The AI quota for this project is used up for now. The on-device option still works.${detail}`;
  if (/timed out/i.test(msg))
    return `The AI did not respond in time. The on-device option runs locally and has no network to wait on.${detail}`;

  if (/network|fetch|offline|Failed to fetch/i.test(msg))
    return `Could not reach the AI service. Check your connection, or use the on-device option.${detail}`;
  return `AI extraction failed: ${msg}`;
}
