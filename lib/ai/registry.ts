import { AIModelDefinition } from "./types";

export const LOCAL_AI_MODELS: Record<string, AIModelDefinition> = {
  "fast-nlp-engine": {
    id: "fast-nlp-engine",
    name: "TabBench In-Browser NLP",
    task: "text-analysis",
    sizeBytes: 0,
    browserCompatible: true,
    webGPUCompatible: true,
    license: "MIT",
    description: "Instant in-memory algorithmic text processing with zero download requirements.",
  },
  "xenova-summarizer": {
    id: "xenova-summarizer",
    name: "DistilBART Summarizer",
    task: "summarize",
    sizeBytes: 65 * 1024 * 1024,
    browserCompatible: true,
    webGPUCompatible: true,
    license: "Apache-2.0",
    description: "Quantized on-device transformer model for neural abstractive summarization.",
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
