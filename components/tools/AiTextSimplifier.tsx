"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { LocalAIProvider } from "@/lib/ai/providers/local-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { AIProviderType, AIOutput as AIOutputType } from "@/lib/ai/types";
import { CheckCircle2, FileText, Zap } from "lucide-react";
import { runAI } from "@/lib/ai/run";

const SAMPLE_TEXT = `Notwithstanding the aforementioned stipulations, the contractor shall endeavor to expeditiously facilitate the dissemination of all relevant documentation subsequent to the verification of compliance. In the event that extraneous impediments transpire, the party shall implement remedial measures to mitigate deleterious repercussions.`;

const localProvider = new LocalAIProvider();
const geminiProvider = new GeminiProvider();

export default function AiTextSimplifier() {
  const [provider, setProvider] = useState<AIProviderType>("local");
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<AIOutputType | null>(null);
  // Text as it streams in, before the final AIOutput lands.
  const [partial, setPartial] = useState("");

  const handleRun = async () => {
    if (!input.trim()) {
      setError("Please enter text to simplify.");
      return;
    }

    setBusy(true);
    setError(null);
    setPartial("");

    try {
      const activeProvider = provider === "local" ? localProvider : geminiProvider;
      const res = await runAI(activeProvider, {
        text: input,
        task: "simplify",
      }, setPartial);
      setOutput(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AIWorkspace
        provider={provider}
        onProviderChange={setProvider}
        streamingText={partial}
        busy={busy}
        onRun={handleRun}
        runLabel="Simplify to Plain English"
        error={error}
        onClearError={() => setError(null)}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste complex or legalistic text to simplify..."
          sampleText={SAMPLE_TEXT}
          sampleLabel="Load Legal Jargon Sample"
          disabled={busy}
        />

        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Translates complex jargon, passive phrasing, and convoluted sentences into clear 8th-grade reading level.</span>
        </div>
      </AIWorkspace>

      {/* Output Panel */}
      {output && (
        <AIOutput
          title="Simplified Plain-English Result"
          result={output.result}
          provider={output.provider}
          modelUsed={output.modelUsed}
          elapsedMs={output.elapsedMs}
          filename="simplified.txt"
          toolName="ai-text-simplifier"
          onRegenerate={handleRun}
        />
      )}
    </div>
  );
}
