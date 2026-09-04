import { AIInput, AIOutput, AIProvider } from "../types";
import { app, ensureAppCheck } from "@/lib/firebase";
import { GEMINI_MODEL_CANDIDATES, isModelNotFound } from "../model-fallback";

/**
 * Cloud AI via Firebase AI Logic, called straight from the browser.
 *
 * ── WHY NOT THE API ROUTE ────────────────────────────────────────────────────
 * This used to POST to `/api/ai/generate`. That route exists in the source and
 * works in `npm run dev`, but next.config sets
 *
 *     output: process.env.NODE_ENV === "production" ? "export" : undefined
 *
 * and a static export cannot emit API routes — there is no server to run them.
 * So the route silently disappeared from the build and Firebase Hosting served
 * a 404 for every cloud AI request in production, while everything looked fine
 * locally. That is the "Server AI processing failed (404)" users were seeing.
 *
 * Firebase AI Logic is the right fit here precisely because it is designed for
 * client-side apps: it brokers the model call through Firebase, so no Gemini
 * API key is shipped to the browser. The old route needed `GEMINI_API_KEY` as a
 * server secret, which a static site has nowhere to keep.
 *
 * ── WHAT THIS LOSES, AND WHY IT IS ACCEPTABLE ────────────────────────────────
 * The route did per-IP rate limiting. A browser cannot rate-limit itself
 * meaningfully, so that protection now has to come from **App Check**, enforced
 * on AI Logic in the Firebase console. Without it, anyone can lift the public
 * firebaseConfig and spend the project's quota. App Check is not optional here.
 */
/**
 * Overridable because model availability shifts: ids get renamed, and some are
 * not offered on every plan or region. Changing this should be an env change,
 * not a source edit.
 */
const MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

export class GeminiProvider implements AIProvider {
  id = "gemini" as const;
  name = "Google Gemini 2.5 Flash (Cloud)";

  async isAvailable(): Promise<boolean> {
    // Availability is not knowable without making a request: AI Logic may be
    // disabled for the project, or App Check may reject this origin. Report
    // true and let `generate` surface a precise error instead of hiding the
    // cloud option behind a guess.
    return true;
  }

  async generate(input: AIInput): Promise<AIOutput> {
    const startTime = performance.now();
    const model = MODEL;

    let text: string;
    let usedModel = model;
    try {
      // Must precede the model call: AI Logic is enforced, so a request
      // without an App Check token is rejected before it reaches Gemini.
      await ensureAppCheck();
      const { getAI, getGenerativeModel, GoogleAIBackend } = await import("firebase/ai");
      // GoogleAIBackend is the Gemini Developer API — the backend with a free
      // tier. VertexAIBackend would require the Blaze plan.
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const prompt = buildTaskPrompt(input.task, input.text, input.options);

      let lastError: unknown = null;
      let answer: string | null = null;
      for (const candidate of GEMINI_MODEL_CANDIDATES) {
        try {
          const generativeModel = getGenerativeModel(ai, { model: candidate });
          const result = await generativeModel.generateContent(prompt);
          answer = result.response.text().trim();
          usedModel = candidate;
          break;
        } catch (e) {
          lastError = e;
          // Only a missing model is worth retrying. A quota or App Check
          // failure would fail identically on every id, so stop immediately
          // rather than burning the rate limit proving it.
          if (!isModelNotFound(e)) throw e;
        }
      }
      if (answer === null) throw lastError ?? new Error("No Gemini model responded.");
      text = answer;
    } catch (e) {
      throw new Error(describeAiError(e));
    }

    if (!text) {
      throw new Error("The AI returned an empty response. Try again, or use On-Device AI.");
    }

    return {
      result: text,
      provider: "gemini",
      modelUsed: usedModel,
      elapsedMs: Math.round(performance.now() - startTime),
      metrics: {
        wordCount: text.split(/\s+/).filter(Boolean).length,
        charCount: text.length,
      },
    };
  }
}

/**
 * Prompts are carried over verbatim from the deleted API route so the cloud
 * results users saw in development are the results they get in production.
 */
function buildTaskPrompt(
  task: string,
  text: string,
  options?: Record<string, unknown>
): string {
  switch (task) {
    case "summarize": {
      const length = (options?.length as string) || "medium";
      const bullet = options?.bulletPoints
        ? "Format the summary as concise bullet points."
        : "Provide clear, concise paragraphs.";
      return `Summarize the following text accurately without hallucinating details. Target length: ${length}. ${bullet}\n\nText:\n"""${text}"""`;
    }
    case "rewrite": {
      const tone = (options?.tone as string) || "professional";
      return `Rewrite the following text in a ${tone} tone. Preserve all key facts, numbers, names, dates, and instructions accurately.\n\nText:\n"""${text}"""`;
    }
    case "simplify":
      return `Simplify the following text into plain, clear English (accessible to an 8th-grade reading level). Replace jargon and convoluted phrasing while preserving technical accuracy, numbers, and facts.\n\nText:\n"""${text}"""`;
    case "keywords":
      return `Extract the most important primary keywords, secondary keywords, and key phrases from the following text. Format as a ranked list with brief relevance notes.\n\nText:\n"""${text}"""`;
    case "explain-json":
      return `Analyze and explain this JSON structure in plain English. Describe its schema, key fields, data types, hierarchy, and any potential security or optimization insights.\n\nJSON:\n"""${text}"""`;
    default:
      return text;
  }
}

/**
 * The SDK's errors arrive as opaque 4xx strings. These are the three that
 * actually happen, and each has a different fix, so they are worth separating.
 */
function describeAiError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  // Every branch appends the raw message. An earlier version returned only a
  // friendly sentence, and because `404` was lumped in with "service disabled"
  // it reported "AI Logic is not enabled" for a plain model-not-found — sending
  // the reader to the console to re-enable something that was already on.
  // A guess dressed up as a diagnosis is worse than no diagnosis.
  const detail = ` (${msg})`;

  // Genuinely disabled: the platform says so in these exact terms. 404 is NOT
  // in this list — on this API a 404 almost always means the *model name* is
  // wrong, not the service.
  if (/API has not been used|SERVICE_DISABLED|has not been enabled/i.test(msg))
    return `Firebase AI Logic is not enabled for this project. Enable it in the Firebase console, then retry.${detail}`;

  if (/not found|NOT_FOUND|404/i.test(msg))
    return `The model "${MODEL}" was not found for this project. It may not be available on your plan or in your region — try another model id.${detail}`;

  if (/app.?check|unauthorized|403|PERMISSION_DENIED/i.test(msg))
    return `The request was rejected before reaching the model. This is usually App Check or an API restriction.${detail}`;

  if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg))
    return `The AI quota is used up for now. Switch to On-Device AI for unlimited free processing.${detail}`;

  if (/network|fetch|offline|Failed to fetch/i.test(msg))
    return `Could not reach the AI service. Check your connection, or use On-Device AI.${detail}`;

  return `Cloud AI failed: ${msg}`;
}
