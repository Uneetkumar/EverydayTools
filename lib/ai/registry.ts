import { AIModelDefinition } from "./types";

/**
 * Model catalogue.
 *
 * These entries are user-visible copy, so every claim here has to be true of
 * the code. An earlier entry advertised a "DistilBART Summarizer" — described
 * as a 65MB quantized on-device transformer — for what `lib/ai/nlp/summarizer.ts`
 * actually implements: TextRank and lexical scoring. It was removed rather than
 * left to mislead. The heuristics are good and genuinely run on-device; they
 * just are not a neural model, and should not be described as one.
 */
export const LOCAL_AI_MODELS: Record<string, AIModelDefinition> = {
  "fast-nlp-engine": {
    id: "fast-nlp-engine",
    name: "TabBench In-Browser NLP",
    task: "text-analysis",
    sizeBytes: 0,
    browserCompatible: true,
    webGPUCompatible: true,
    license: "MIT",
    description:
      "Algorithmic text processing that runs in browser memory with nothing to download.",
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Google Gemini 2.5 Flash",
    task: "general",
    sizeBytes: 0,
    browserCompatible: true,
    license: "Proprietary (Free Tier API)",
    description: "Cloud-hosted multimodal LLM for complex reasoning and synthesis.",
  },
};
