"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { LocalAIProvider } from "@/lib/ai/providers/local-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { AIProviderType, AIOutput as AIOutputType } from "@/lib/ai/types";
import { ToneType } from "@/lib/ai/nlp/rewriter";
import { runAI } from "@/lib/ai/run";

const SAMPLE_TEXT = `Hey boss, I'm gonna be a bit late to the morning sync because my train got stuck. Gonna try to jump on the call from my phone if I can. Let me know if we gotta reschedule our 1-on-1 talk for later today. Thanks a lot!`;

const localProvider = new LocalAIProvider();
const geminiProvider = new GeminiProvider();

const TONES: { id: ToneType; label: string; desc: string }[] = [
  { id: "professional", label: "Professional", desc: "Polished and business-ready" },
  { id: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { id: "concise", label: "Concise", desc: "Short and directly to the point" },
  { id: "formal", label: "Formal", desc: "Traditional and authoritative" },
  { id: "casual", label: "Casual", desc: "Relaxed and conversational" },
  { id: "simple", label: "Simple", desc: "Clear and straightforward" },
];

export default function AiTextRewriter() {
  const [provider, setProvider] = useState<AIProviderType>("local");
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [tone, setTone] = useState<ToneType>("professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<AIOutputType | null>(null);
  // Text as it streams in, before the final AIOutput lands.
  const [partial, setPartial] = useState("");

  const handleRun = async () => {
    if (!input.trim()) {
      setError("Please enter text to rewrite.");
      return;
    }

    setBusy(true);
    setError(null);
    setPartial("");

    try {
      const activeProvider = provider === "local" ? localProvider : geminiProvider;
      const res = await runAI(activeProvider, {
        text: input,
        task: "rewrite",
        options: { tone },
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
        runLabel={`Rewrite as ${TONES.find((t) => t.id === tone)?.label || "Text"}`}
        error={error}
        onClearError={() => setError(null)}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste or write text you want to rewrite..."
          sampleText={SAMPLE_TEXT}
          sampleLabel="Load Email Sample"
          disabled={busy}
        />

        {/* Tone Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Desired Tone
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  tone === t.id
                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </AIWorkspace>

      {/* Output Panel */}
      {output && (
        <AIOutput
          title={`Rewritten Text (${TONES.find((t) => t.id === tone)?.label})`}
          result={output.result}
          provider={output.provider}
          modelUsed={output.modelUsed}
          elapsedMs={output.elapsedMs}
          filename="rewritten.txt"
          toolName="ai-text-rewriter"
          onRegenerate={handleRun}
        />
      )}
    </div>
  );
}
