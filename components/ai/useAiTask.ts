"use client";

import { useCallback, useRef, useState } from "react";
import { LocalAIProvider } from "@/lib/ai/providers/local-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { AIInput, AIOutput, AIProviderType } from "@/lib/ai/types";
import { runAI } from "@/lib/ai/run";
import { markToolCompleted } from "@/lib/analytics";

const local = new LocalAIProvider();
const gemini = new GeminiProvider();

/**
 * Engine choice, run state, streaming text and errors for one AI tool.
 * The input that produced the current result is kept alongside it, so a
 * "Show changes" view compares against what was actually processed, not
 * whatever the box holds now.
 */
export function useAiTask(task: AIInput["task"], { stream = true }: { stream?: boolean } = {}) {
  const [provider, setProvider] = useState<AIProviderType>("local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<(AIOutput & { input: string }) | null>(null);
  const [partial, setPartial] = useState("");
  const runId = useRef(0);

  const run = useCallback(
    async (text: string, options?: Record<string, unknown>, emptyMessage = "Add some text first.") => {
      if (!text.trim()) {
        setError(emptyMessage);
        return null;
      }
      const id = ++runId.current;
      setBusy(true);
      setError(null);
      setPartial("");
      try {
        const engine = provider === "local" ? local : gemini;
        const res = await runAI(engine, { text, task, options }, stream ? setPartial : () => {});
        // A later run started while this one was in flight: drop this result.
        if (id !== runId.current) return null;
        const withInput = { ...res, input: text };
        setOutput(withInput);
        markToolCompleted();
        return withInput;
      } catch (err) {
        if (id === runId.current) setError(err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        if (id === runId.current) {
          setBusy(false);
          setPartial("");
        }
      }
    },
    [provider, task, stream]
  );

  return { provider, setProvider, busy, error, setError, output, setOutput, partial, run };
}
