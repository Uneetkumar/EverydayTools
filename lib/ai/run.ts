import { AIInput, AIOutput, AIProvider } from "./types";

/**
 * Runs a provider, streaming when it can and falling back when it cannot.
 *
 * Every tool calls this instead of `provider.generate` directly, so the
 * streaming decision — and its failure handling — lives in one place rather
 * than being copy-pasted into six components that would drift apart.
 *
 * Two fallbacks, for different reasons:
 *  - The on-device providers do not implement `generateStream` at all. They are
 *    synchronous string transforms; emitting fake chunks would add latency to
 *    disguise the fact that they are already instant.
 *  - A stream that fails *after* emitting text is retried non-streaming. That
 *    path still walks the model fallback chain, which the stream deliberately
 *    skips. `onPartial("")` clears the partial text first, so a user never sees
 *    half an answer replaced by a different one mid-sentence.
 */
export async function runAI(
  provider: AIProvider,
  input: AIInput,
  onPartial: (textSoFar: string) => void
): Promise<AIOutput> {
  if (typeof provider.generateStream === "function") {
    try {
      return await provider.generateStream(input, onPartial);
    } catch (streamError) {
      onPartial("");
      try {
        return await provider.generate(input);
      } catch (fallbackError) {
        // Report the FALLBACK's error, not the stream's.
        //
        // The earlier version rethrew `streamError` on the reasoning that it
        // was "the one the user actually hit". In practice that hid the real
        // blocker: a stream failing on an unavailable model, then a fallback
        // failing on an exhausted daily quota, surfaced as "model not found"
        // and sent the reader chasing a model id when the actual problem was
        // that they were out of requests.
        //
        // The fallback ran second and tried every model, so its error is the
        // more complete account of why nothing worked.
        throw fallbackError;
      }
    }
  }
  return provider.generate(input);
}
