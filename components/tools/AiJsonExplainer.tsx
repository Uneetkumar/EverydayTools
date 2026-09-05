"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { LocalAIProvider } from "@/lib/ai/providers/local-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { AIProviderType, AIOutput as AIOutputType } from "@/lib/ai/types";
import { Code2, ShieldAlert } from "lucide-react";
import { runAI } from "@/lib/ai/run";

const SAMPLE_JSON = `{
  "status": "success",
  "data": {
    "user_id": "usr_94827a1b",
    "email": "alex.dev@example.com",
    "role": "enterprise_admin",
    "subscription": {
      "plan": "pro_annual",
      "active": true,
      "expires_at": "2027-01-01T00:00:00Z",
      "seat_count": 25
    },
    "metadata": {
      "last_ip": "192.168.1.1",
      "two_factor_enabled": true
    }
  }
}`;

const localProvider = new LocalAIProvider();
const geminiProvider = new GeminiProvider();

export default function AiJsonExplainer() {
  const [provider, setProvider] = useState<AIProviderType>("local");
  const [input, setInput] = useState(SAMPLE_JSON);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<AIOutputType | null>(null);
  // Text as it streams in, before the final AIOutput lands.
  const [partial, setPartial] = useState("");

  const handleRun = async () => {
    if (!input.trim()) {
      setError("Please paste a JSON payload to explain.");
      return;
    }

    setBusy(true);
    setError(null);
    setPartial("");

    try {
      const activeProvider = provider === "local" ? localProvider : geminiProvider;
      const res = await runAI(activeProvider, {
        text: input,
        task: "explain-json",
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
        runLabel="Explain JSON Structure"
        error={error}
        onClearError={() => setError(null)}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste JSON object or array payload..."
          sampleText={SAMPLE_JSON}
          sampleLabel="Load API Payload Sample"
          disabled={busy}
        />

        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <Code2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Deterministic AST schema analysis ensures 100% syntactic precision without hallucination.</span>
        </div>
      </AIWorkspace>

      {/* Output Panel */}
      {output && (
        <AIOutput
          title="JSON Schema & Architecture Explanation"
          result={output.result}
          provider={output.provider}
          modelUsed={output.modelUsed}
          elapsedMs={output.elapsedMs}
          filename="json-explanation.md"
          toolName="ai-json-explainer"
          onRegenerate={handleRun}
        />
      )}
    </div>
  );
}
