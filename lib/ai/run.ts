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
      } catch {
        // Report the streaming failure: it is the one the user actually hit,
        // and the retry usually fails for the same underlying reason.
        throw streamError;
      }
    }
  }
  return provider.generate(input);
}
