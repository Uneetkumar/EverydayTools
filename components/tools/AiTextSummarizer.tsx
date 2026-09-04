"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { LocalAIProvider } from "@/lib/ai/providers/local-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { AIProviderType, AIOutput as AIOutputType } from "@/lib/ai/types";
import { AlignLeft, List, Sparkles } from "lucide-react";

const SAMPLE_TEXT = `Artificial intelligence is transforming modern computing by shifting heavy computational workloads directly onto end-user client devices. Historically, web applications relied almost entirely on centralized cloud servers for natural language processing, image generation, and machine learning inference. However, modern client-side architectures leverage WebAssembly, WebGPU, and optimized quantized models running within the browser. This technological shift delivers three critical benefits: dramatic reductions in cloud server operating costs, zero latency responses with offline computing capabilities, and absolute user privacy since private data never leaves local device memory. By decoupling foundational utility tools from continuous cloud API calls, web platforms can offer free, unlimited, and sustainable software to millions of daily users without incurring prohibitive hosting fees.`;

const localProvider = new LocalAIProvider();
const geminiProvider = new GeminiProvider();

export default function AiTextSummarizer() {
  const [provider, setProvider] = useState<AIProviderType>("local");
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [length, setLength] = useState<"short" | "medium" | "detailed">("medium");
  const [bulletPoints, setBulletPoints] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<AIOutputType | null>(null);

  const handleRun = async () => {
    if (!input.trim()) {
      setError("Please enter some text to summarize.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const activeProvider = provider === "local" ? localProvider : geminiProvider;
      const res = await activeProvider.generate({
        text: input,
        task: "summarize",
        options: { length, bulletPoints },
      });
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
        busy={busy}
        onRun={handleRun}
        runLabel="Summarize Text"
        error={error}
        onClearError={() => setError(null)}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste or type text to summarize..."
          sampleText={SAMPLE_TEXT}
          sampleLabel="Load AI Sample"
          disabled={busy}
        />

        {/* Summarizer Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Length:
            </span>
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {(["short", "medium", "detailed"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition cursor-pointer ${
                    length === l
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBulletPoints(!bulletPoints)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              bulletPoints
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {bulletPoints ? <List className="w-3.5 h-3.5" /> : <AlignLeft className="w-3.5 h-3.5" />}
            <span>Bullet Points</span>
          </button>
        </div>
      </AIWorkspace>

      {/* Output Panel */}
      {output && (
        <AIOutput
          title="Summary Result"
          result={output.result}
          provider={output.provider}
          modelUsed={output.modelUsed}
          elapsedMs={output.elapsedMs}
          filename="summary.txt"
          toolName="ai-text-summarizer"
          onRegenerate={handleRun}
        />
      )}
    </div>
  );
}
