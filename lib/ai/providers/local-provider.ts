import { AIInput, AIOutput, AIProvider } from "../types";
import { summarizeTextLocally } from "../nlp/summarizer";
import { rewriteWithChanges, ToneType } from "../nlp/rewriter";
import { simplifyTextLocally } from "../nlp/simplifier";
import { extractKeywordsLocally } from "../nlp/keywords";
import { explainJsonLocally, jsonExplanationToMarkdown } from "../nlp/json-explainer";

/**
 * The on-device engines. They are rule-based and statistical text
 * processing, not a language model, and the model name reported says so.
 * `metrics.data` carries each engine's structured result for the UI.
 */
const ENGINE = "On-device text engine";

export class LocalAIProvider implements AIProvider {
  id = "local" as const;
  name = "On-device (private)";

  async isAvailable(): Promise<boolean> {
    return typeof window !== "undefined";
  }

  async generate(input: AIInput): Promise<AIOutput> {
    const start = performance.now();
    const done = (result: string, data?: unknown): AIOutput => ({
      result,
      provider: "local",
      modelUsed: ENGINE,
      elapsedMs: Math.round(performance.now() - start),
      metrics: { data },
    });

    switch (input.task) {
      case "summarize": {
        const length = (input.options?.length as "short" | "medium" | "detailed") || "medium";
        const bulletPoints = Boolean(input.options?.bulletPoints);
        const res = summarizeTextLocally(input.text, { length, bulletPoints });
        const text = bulletPoints ? res.keyPoints.map((k) => `- ${k}`).join("\n") : res.summary;
        return done(text, res);
      }
      case "rewrite": {
        const tone = (input.options?.tone as ToneType) || "professional";
        const res = rewriteWithChanges(input.text, tone);
        return done(res.text, res);
      }
      case "simplify": {
        const res = simplifyTextLocally(input.text);
        return done(res.simplifiedText, res);
      }
      case "keywords": {
        const res = extractKeywordsLocally(input.text, Number(input.options?.topN) || 10);
        const text = [
          `Keywords: ${res.keywords.map((k) => k.keyword).join(", ")}`,
          res.phrases.length ? `Key phrases: ${res.phrases.map((p) => p.phrase).join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        return done(text, res);
      }
      case "explain-json": {
        const res = explainJsonLocally(input.text);
        return done(jsonExplanationToMarkdown(res), res);
      }
      default:
        return done(input.text);
    }
  }
}
