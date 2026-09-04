"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { LocalAIProvider } from "@/lib/ai/providers/local-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { AIProviderType, AIOutput as AIOutputType } from "@/lib/ai/types";
import { Hash, Tag } from "lucide-react";

const SAMPLE_TEXT = `Next.js 15 delivers advanced React Server Components, hybrid static site generation, and optimized client bundles for superior Core Web Vitals. Web developers utilize Next.js for high-performance search engine optimization, server actions, dynamic caching, and seamless TypeScript integration across modern cloud hosting platforms like Firebase, Vercel, and Cloudflare Pages.`;

const localProvider = new LocalAIProvider();
const geminiProvider = new GeminiProvider();

export default function AiKeywordExtractor() {
  const [provider, setProvider] = useState<AIProviderType>("local");
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [topN, setTopN] = useState<number>(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<AIOutputType | null>(null);

  const handleRun = async () => {
    if (!input.trim()) {
      setError("Please enter text to extract keywords.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const activeProvider = provider === "local" ? localProvider : geminiProvider;
      const res = await activeProvider.generate({
        text: input,
        task: "keywords",
        options: { topN },
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
        runLabel="Extract Keywords"
        error={error}
        onClearError={() => setError(null)}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste article, description, or content to extract keywords..."
          sampleText={SAMPLE_TEXT}
          sampleLabel="Load Tech Article Sample"
          disabled={busy}
        />

        {/* Count control */}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Keyword Limit:
          </span>
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {[6, 10, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTopN(num)}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  topN === num
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </AIWorkspace>

      {/* Output Panel */}
      {output && (
        <AIOutput
          title="Extracted Keywords & Phrases"
          result={output.result}
          provider={output.provider}
          modelUsed={output.modelUsed}
          elapsedMs={output.elapsedMs}
          filename="keywords.txt"
          toolName="ai-keyword-extractor"
          onRegenerate={handleRun}
        />
      )}
    </div>
  );
}
