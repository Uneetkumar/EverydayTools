import { AIInput, AIOutput, AIProvider } from "../types";
import { app } from "@/lib/firebase";

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
    const model = "gemini-2.5-flash";

    let text: string;
    try {
      const { getAI, getGenerativeModel, GoogleAIBackend } = await import("firebase/ai");
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const generativeModel = getGenerativeModel(ai, { model });

      const result = await generativeModel.generateContent(
        buildTaskPrompt(input.task, input.text, input.options)
      );
      text = result.response.text().trim();
    } catch (e) {
      throw new Error(describeAiError(e));
    }

    if (!text) {
      throw new Error("The AI returned an empty response. Try again, or use On-Device AI.");
    }

    return {
      result: text,
      provider: "gemini",
      modelUsed: model,
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
  if (/API has not been used|SERVICE_DISABLED|not enabled|404/i.test(msg))
    return "Firebase AI Logic is not enabled for this project yet. Enable it in the Firebase console, then retry. On-Device AI works in the meantime.";
  if (/app.?check|unauthorized|403|PERMISSION_DENIED/i.test(msg))
    return "App Check rejected this request. Confirm App Check is registered for this domain.";
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg))
    return "The AI quota is used up for now. Switch to On-Device AI for unlimited free processing.";
  if (/network|fetch|offline/i.test(msg))
    return "Could not reach the AI service. Check your connection, or use On-Device AI.";
  return `Cloud AI failed: ${msg}`;
}
