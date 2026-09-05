import type { GenerationConfig } from "firebase/ai";

/**
 * Latency tuning for the cloud models.
 *
 * **Thinking is the big one.** Gemini 2.5 models run an internal reasoning pass
 * before answering, and the SDK's own docs note a higher budget "can also
 * increase latency". For summarising a paragraph or describing a JSON schema
 * that reasoning buys nothing — the task is not a puzzle — so it is pure wait.
 * `thinkingBudget: 0` turns it off.
 *
 * The catch: the SDK throws if you set a thinking budget on a model that does
 * not support it. Our fallback chain includes 2.0 models, which do not. So the
 * config is applied **only to 2.5 models**, matched by name.
 *
 * `maxOutputTokens` is a second, smaller win: without a ceiling the model
 * decides when to stop, and a rambling answer is billed and waited for in full.
 * These tasks all have naturally short outputs.
 */
export function generationConfigFor(model: string): GenerationConfig {
  const config: GenerationConfig = {
    // Enough for a long summary or a full JSON schema walkthrough; short
    // enough that a runaway generation cannot stall the UI for a minute.
    maxOutputTokens: 2048,
  };

  // Only the 2.5 series accepts thinkingBudget. Setting it on 2.0 errors.
  if (/gemini-2\.5/.test(model)) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  return config;
}

/** Vision needs more room: a dense page of text is a lot of output tokens. */
export function visionGenerationConfigFor(model: string): GenerationConfig {
  const config: GenerationConfig = { maxOutputTokens: 4096 };
  if (/gemini-2\.5/.test(model)) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }
  return config;
}
