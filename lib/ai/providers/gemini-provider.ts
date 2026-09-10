import { AIInput, AIOutput, AIProvider } from "../types";
import { app, ensureAppCheck } from "@/lib/firebase";
import { GEMINI_MODEL_CANDIDATES, isModelNotFound } from "../model-fallback";
import { withTimeout, AI_TIMEOUTS, TimeoutError , condenseProviderError } from "../timeout";
import { generationConfigFor } from "../generation-config";

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

/**
 * One AI service handle for the page. `getAI` is cheap, but re-deriving it on
 * every keystroke-triggered call is needless, and holding it keeps the
 * dynamically imported chunk resident.
 */
let aiServicePromise: Promise<import("firebase/ai").AI> | null = null;

async function getAiService() {
  if (!aiServicePromise) {
    aiServicePromise = (async () => {
      const { getAI, GoogleAIBackend } = await import("firebase/ai");
      // GoogleAIBackend is the Gemini Developer API — the backend with a free
      // tier. VertexAIBackend would require the Blaze plan.
      return getAI(app, { backend: new GoogleAIBackend() });
    })();
  }
  return aiServicePromise;
}

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
      const { getGenerativeModel } = await import("firebase/ai");
      const ai = await getAiService();
      const prompt = buildTaskPrompt(input.task, input.text, input.options);

      let lastError: unknown = null;
      let answer: string | null = null;
      for (const candidate of GEMINI_MODEL_CANDIDATES) {
        try {
          const generativeModel = getGenerativeModel(ai, {
            model: candidate,
            // Disables the 2.5 "thinking" pass, which is the dominant latency
            // cost for tasks that need no reasoning.
            generationConfig: generationConfigFor(candidate),
          });
          const result = await withTimeout(
            generativeModel.generateContent(prompt),
            AI_TIMEOUTS.text,
            `Gemini (${candidate})`
          );
          answer = result.response.text().trim();
          usedModel = candidate;
          break;
        } catch (e) {
          lastError = e;
          // Only a missing model is worth retrying. A quota or App Check
          // failure would fail identically on every id, so stop immediately
          // rather than burning the rate limit proving it.
          // A timeout is not "wrong model" — retrying would triple the wait for
          // a user who is already staring at a spinner.
          if (e instanceof TimeoutError) throw e;
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

  /**
   * Streaming variant.
   *
   * Wall-clock time is unchanged; what changes is that the first words appear
   * in about a second instead of the user watching a spinner until the whole
   * answer is ready. For a paragraph of summary that is most of the perceived
   * wait.
   *
   * The model chain IS walked here, but only up to the first emitted token.
   *
   * An earlier version pinned this to `CANDIDATES[0]` on the reasoning that a
   * mid-stream model swap would show text and then replace it. That reasoning
   * only holds *after* output has started. A model that is unavailable fails
   * on the opening request, before a single token exists, and refusing to try
   * the next id there meant streaming permanently failed on a project whose
   * first-choice model simply is not offered — while the non-streaming path
   * worked fine by falling through.
   *
   * So: retry freely until the first chunk arrives; never after.
   */
  async generateStream(
    input: AIInput,
    onChunk: (textSoFar: string) => void
  ): Promise<AIOutput> {
    const startTime = performance.now();
    const prompt = buildTaskPrompt(input.task, input.text, input.options);

    try {
      await ensureAppCheck();
      const { getGenerativeModel } = await import("firebase/ai");
      const ai = await getAiService();

      let lastError: unknown = null;

      for (const candidate of GEMINI_MODEL_CANDIDATES) {
        // Tracks whether this attempt has shown the user anything. Once it has,
        // switching models would rewrite text already on screen, so we stop.
        let emitted = false;
        try {
          const generativeModel = getGenerativeModel(ai, {
            model: candidate,
            generationConfig: generationConfigFor(candidate),
          });

          const { stream, response } = await withTimeout(
            generativeModel.generateContentStream(prompt),
            AI_TIMEOUTS.text,
            `Gemini stream (${candidate})`
          );

          let acc = "";
          for await (const chunk of stream) {
            const piece = chunk.text();
            if (piece) {
              acc += piece;
              emitted = true;
              onChunk(acc);
            }
          }

          // `response` resolves when the stream completes and carries the
          // aggregated result, authoritative over hand-accumulated text.
          const final = (await response).text().trim() || acc.trim();
          return {
            result: final,
            provider: "gemini",
            modelUsed: candidate,
            elapsedMs: Math.round(performance.now() - startTime),
            metrics: {
              wordCount: final.split(/\s+/).filter(Boolean).length,
              charCount: final.length,
            },
          };
        } catch (e) {
          lastError = e;
          // Past the first token there is no safe recovery: the user is
          // reading a partial answer and a different model would contradict it.
          if (emitted) throw e;
          if (e instanceof TimeoutError) throw e;
          if (!isModelNotFound(e)) throw e;
          // Unavailable model, nothing shown yet — try the next id.
          onChunk("");
        }
      }

      throw lastError ?? new Error("No Gemini model responded.");
    } catch (e) {
      throw new Error(describeAiError(e));
    }
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
  // Condensed, not raw: a verbatim provider error is JSON and overflows.
  const detail = ` (${condenseProviderError(msg)})`;

  // Genuinely disabled: the platform says so in these exact terms. 404 is NOT
  // in this list — on this API a 404 almost always means the *model name* is
  // wrong, not the service.
  if (/API has not been used|SERVICE_DISABLED|has not been enabled/i.test(msg))
    return `Firebase AI Logic is not enabled for this project. Enable it in the Firebase console, then retry.${detail}`;

  if (/not found|NOT_FOUND|404/i.test(msg)) {
    // Name the model that actually failed, not the module default. Reporting
    // `MODEL` meant every failure blamed "gemini-2.5-flash" even when a later
    // candidate was the one that broke — the same misattribution as the old
    // "404 means the service is disabled" bug, and just as misleading.
    const failed = msg.match(/models\/([a-z0-9.-]+):/i)?.[1] ?? MODEL;
    const others = GEMINI_MODEL_CANDIDATES.filter((m) => m !== failed);
    return `The model "${failed}" is not available to this project${
      others.length ? ` (also tried: ${others.join(", ")})` : ""
    }.${detail}`;
  }

  if (/app.?check|unauthorized|403|PERMISSION_DENIED/i.test(msg))
    return `The request was rejected before reaching the model. This is usually App Check or an API restriction.${detail}`;

  if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg))
    return `The AI quota is used up for now. Switch to On-Device AI for unlimited free processing.${detail}`;

  if (/timed out/i.test(msg))
    return `The AI did not respond in time. Switch to On-Device AI, which runs locally and has no network to wait on.${detail}`;

  if (/network|fetch|offline|Failed to fetch/i.test(msg))
    return `Could not reach the AI service. Check your connection, or use On-Device AI.${detail}`;

  return `Cloud AI failed: ${msg}`;
}
