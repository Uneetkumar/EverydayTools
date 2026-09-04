import { AIInput, AIOutput, AIProvider } from "../types";
import { summarizeTextLocally } from "../nlp/summarizer";
import { rewriteTextLocally, ToneType } from "../nlp/rewriter";
import { simplifyTextLocally } from "../nlp/simplifier";
import { extractKeywordsLocally } from "../nlp/keywords";
import { explainJsonLocally } from "../nlp/json-explainer";

export class LocalAIProvider implements AIProvider {
  id = "local" as const;
  name = "On-Device Engine (Private)";

  async isAvailable(): Promise<boolean> {
    return typeof window !== "undefined";
  }

  async generate(input: AIInput): Promise<AIOutput> {
    const startTime = performance.now();

    switch (input.task) {
      case "summarize": {
        const length = (input.options?.length as "short" | "medium" | "detailed") || "medium";
        const bulletPoints = Boolean(input.options?.bulletPoints);
        const res = summarizeTextLocally(input.text, { length, bulletPoints });

        let resultText = res.summary;
        if (bulletPoints && res.keyPoints.length > 0) {
          resultText = res.keyPoints.map((kp) => `• ${kp}`).join("\n");
        }

        return {
          result: resultText,
          provider: "local",
          modelUsed: "TabBench In-Browser NLP",
          elapsedMs: Math.round(performance.now() - startTime),
          metrics: {
            wordCount: res.summaryWords,
            charCount: resultText.length,
            keyPoints: res.keyPoints,
            data: res,
          },
        };
      }

      case "rewrite": {
        const tone = (input.options?.tone as ToneType) || "professional";
        const rewritten = rewriteTextLocally(input.text, tone);
        return {
          result: rewritten,
          provider: "local",
          modelUsed: "TabBench In-Browser NLP",
          elapsedMs: Math.round(performance.now() - startTime),
          metrics: {
            wordCount: rewritten.split(/\s+/).filter(Boolean).length,
            charCount: rewritten.length,
          },
        };
      }

      case "simplify": {
        const res = simplifyTextLocally(input.text);
        return {
          result: res.simplifiedText,
          provider: "local",
          modelUsed: "TabBench In-Browser NLP",
          elapsedMs: Math.round(performance.now() - startTime),
          metrics: {
            wordCount: res.simplifiedText.split(/\s+/).filter(Boolean).length,
            charCount: res.simplifiedText.length,
            data: res,
          },
        };
      }

      case "keywords": {
        const topN = Number(input.options?.topN) || 12;
        const res = extractKeywordsLocally(input.text, topN);
        const formatted = [
          "### Primary Keywords:",
          ...res.primaryKeywords.map((k) => `• **${k.keyword}** (frequency: ${k.count}, score: ${k.score})`),
          "",
          "### Secondary Keywords:",
          ...res.secondaryKeywords.map((k) => `• ${k.keyword} (${k.count})`),
          "",
          "### Key Phrases:",
          ...res.keyPhrases.map((p) => `• ${p}`),
        ].join("\n");

        return {
          result: formatted,
          provider: "local",
          modelUsed: "TabBench In-Browser NLP",
          elapsedMs: Math.round(performance.now() - startTime),
          metrics: {
            data: res,
          },
        };
      }

      case "explain-json": {
        const res = explainJsonLocally(input.text);
        if (!res.isValid) {
          return {
            result: `Invalid JSON: ${res.error}`,
            provider: "local",
            modelUsed: "TabBench AST Parser",
            elapsedMs: Math.round(performance.now() - startTime),
            metrics: { data: res },
          };
        }

        const lines = [
          `## Overview\n${res.overview}`,
          `\n**Root Type:** \`${res.rootType}\` | **Total Fields:** \`${res.totalKeys}\` | **Hierarchy Depth:** \`${res.maxDepth}\``,
          "\n### Field Breakdown:",
          ...res.fields.map((f) => `- \`${f.path}\` (*${f.type}*): ${f.description} (e.g. \`${f.sampleValue}\`)`),
          "\n### Architecture Insights:",
          ...res.insights.map((i) => `• ${i}`),
        ];

        return {
          result: lines.join("\n"),
          provider: "local",
          modelUsed: "TabBench AST Parser",
          elapsedMs: Math.round(performance.now() - startTime),
          metrics: { data: res },
        };
      }

      default: {
        return {
          result: input.text,
          provider: "local",
          modelUsed: "TabBench Local Fallback",
          elapsedMs: Math.round(performance.now() - startTime),
        };
      }
    }
  }
}
