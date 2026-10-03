"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Trash2, Cpu, Coins, Gauge, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextArea,
  SelectInput,
  StatGrid,
  Stat,
  Chips,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface ModelPricing {
  name: string;
  provider: string;
  contextWindow: number;
  inputPer1M: number;
  outputPer1M: number;
  tokenMultiplier: number;
}

const MODELS: Record<string, ModelPricing> = {
  "gpt-4o": {
    name: "GPT-4o",
    provider: "OpenAI",
    contextWindow: 128000,
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    tokenMultiplier: 1.0,
  },
  "gpt-4o-mini": {
    name: "GPT-4o-mini",
    provider: "OpenAI",
    contextWindow: 128000,
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    tokenMultiplier: 1.0,
  },
  "claude-3-5-sonnet": {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextWindow: 200000,
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    tokenMultiplier: 1.05,
  },
  "claude-3-5-haiku": {
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    contextWindow: 200000,
    inputPer1M: 0.8,
    outputPer1M: 4.0,
    tokenMultiplier: 1.05,
  },
  "gemini-1-5-pro": {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    contextWindow: 2000000,
    inputPer1M: 1.25,
    outputPer1M: 5.0,
    tokenMultiplier: 0.98,
  },
  "gemini-1-5-flash": {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    contextWindow: 1000000,
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    tokenMultiplier: 0.98,
  },
  "llama-3-1-70b": {
    name: "Llama 3.1 70B",
    provider: "Meta",
    contextWindow: 128000,
    inputPer1M: 0.6,
    outputPer1M: 0.8,
    tokenMultiplier: 1.02,
  },
};

const SAMPLE_TEXTS = [
  {
    label: "Agent System Prompt",
    text: `You are an elite Senior Staff Software Engineer and System Architect. Your role is to conduct deep code audits, identify latency bottlenecks, optimize memory allocations, and propose elegant refactors.
Always think step-by-step before answering. Enclose architectural decisions inside <rationale> tags. Write idiomatic, memory-safe, and self-documenting code. Never use deprecated patterns.`,
  },
  {
    label: "TypeScript Code",
    text: `export async function fetchUserData(userId: string): Promise<UserResult> {
  const cacheKey = \`user:\${userId}\`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [user, permissions] = await Promise.all([
    db.users.findUniqueOrThrow({ where: { id: userId } }),
    db.permissions.findMany({ where: { userId } }),
  ]);

  const payload = { ...user, permissions };
  await redis.set(cacheKey, JSON.stringify(payload), "EX", 3600);
  return payload;
}`,
  },
  {
    label: "JSON Context",
    text: JSON.stringify(
      {
        conversation_id: "conv_8492019",
        messages: [
          { role: "user", content: "Can you analyze our Q3 retention curve?" },
          { role: "assistant", content: "Looking at cohort week 4, retention stabilized at 42.8%." },
        ],
        metadata: { latency_ms: 142, tokens_used: 89 },
      },
      null,
      2
    ),
  },
];

// High-fidelity BPE token estimation
function estimateTokens(text: string, multiplier: number): number {
  if (!text) return 0;
  // BPE pattern matching words, numbers, punctuation, spaces, code symbols
  const bpeRegex = /[A-Z]?[a-z]+|[A-Z]+(?![a-z])|[0-9]+|[^\s\w]+|\s+(?!\S)|\s+/g;
  const matches = text.match(bpeRegex);
  if (!matches) return 0;

  let count = 0;
  for (const token of matches) {
    if (token.length <= 4) {
      count += 1;
    } else {
      // Long words or continuous numbers split into multiple tokens
      count += Math.ceil(token.length / 3.8);
    }
  }

  return Math.max(1, Math.round(count * multiplier));
}

export default function LlmTokenCounter() {
  const [selectedModelKey, setSelectedModelKey] = useState("gpt-4o");
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [copied, setCopied] = useState(false);

  const model = MODELS[selectedModelKey] || MODELS["gpt-4o"];

  const stats = useMemo(() => {
    const rawTokens = estimateTokens(text, model.tokenMultiplier);
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const tokensPerWord = words > 0 ? (rawTokens / words).toFixed(2) : "0";

    const inputCost = ((rawTokens / 1_000_000) * model.inputPer1M).toFixed(5);
    const outputCost = ((rawTokens / 1_000_000) * model.outputPer1M).toFixed(5);

    const contextPercent = Math.min(100, (rawTokens / model.contextWindow) * 100);

    return {
      tokens: rawTokens,
      words,
      charsWithSpaces,
      charsNoSpaces,
      tokensPerWord,
      inputCost,
      outputCost,
      contextPercent: contextPercent.toFixed(2),
    };
  }, [text, model]);

  const copyStats = () => {
    const summary = [
      `Model: ${model.name} (${model.provider})`,
      `Tokens: ${stats.tokens.toLocaleString()}`,
      `Words: ${stats.words.toLocaleString()}`,
      `Characters: ${stats.charsWithSpaces.toLocaleString()}`,
      `Estimated Input Cost: $${stats.inputCost}`,
      `Context Usage: ${stats.contextPercent}% of ${model.contextWindow.toLocaleString()} tokens`,
    ].join("\n");
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Token stats copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="LLM Token Counter & API Cost Calculator"
        description="Estimate BPE tokens, character count, and exact prompt & completion pricing across GPT-4o, Claude 3.5, Gemini 1.5, and Llama 3."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips
            value={null}
            onChange={(val) => {
              const item = SAMPLE_TEXTS.find((x) => x.label === val);
              if (item) setText(item.text);
            }}
            options={SAMPLE_TEXTS.map((s) => ({ value: s.label, label: s.label }))}
            ariaLabel="Sample Texts"
          />

          <div className="w-56">
            <SelectInput
              value={selectedModelKey}
              onChange={(e) => setSelectedModelKey(e.target.value)}
              aria-label="Model Selector"
            >
              {Object.entries(MODELS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </SelectInput>
          </div>
        </div>

        <Field label="Prompt / Text Input" hint="Paste system prompt, instructions, code, or context">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your prompt or document here..."
            className="font-mono text-xs leading-relaxed min-h-48"
            aria-label="LLM Text Input"
          />
        </Field>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Token & Content Metrics">
        <StatGrid>
          <Stat
            label="Estimated Tokens"
            value={stats.tokens.toLocaleString()}
            tone="success"
            hint={`~${stats.tokensPerWord} tokens per word`}
          />
          <Stat label="Total Words" value={stats.words.toLocaleString()} />
          <Stat label="Characters" value={stats.charsWithSpaces.toLocaleString()} hint={`${stats.charsNoSpaces} without spaces`} />
          <Stat label="Input API Cost" value={`$${stats.inputCost}`} hint={`$${model.inputPer1M} / 1M tokens`} />
        </StatGrid>

        {/* Context Window Progress Meter */}
        <div className="space-y-2 rounded-lg border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Gauge className="size-3.5 text-primary" /> Context Window Capacity
            </span>
            <span className="font-mono text-muted-foreground">
              {stats.tokens.toLocaleString()} / {model.contextWindow.toLocaleString()} tokens ({stats.contextPercent}%)
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{ width: `${Math.min(100, Math.max(1, parseFloat(stats.contextPercent)))}%` }}
              className="h-full bg-primary transition-all duration-300 rounded-full"
            />
          </div>
        </div>

        {/* Cost Comparison Table across top models */}
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Context Window</th>
                <th className="px-3 py-2">Estimated Tokens</th>
                <th className="px-3 py-2">Prompt Cost</th>
                <th className="px-3 py-2">Completion Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(MODELS).map(([k, m]) => {
                const modelTokens = estimateTokens(text, m.tokenMultiplier);
                const pCost = ((modelTokens / 1_000_000) * m.inputPer1M).toFixed(5);
                const cCost = ((modelTokens / 1_000_000) * m.outputPer1M).toFixed(5);
                const isCurrent = k === selectedModelKey;
                return (
                  <tr
                    key={k}
                    className={isCurrent ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}
                  >
                    <td className="px-3 py-2 text-foreground font-medium">
                      {m.name} <span className="text-[10px] text-muted-foreground">({m.provider})</span>
                    </td>
                    <td className="px-3 py-2">{m.contextWindow.toLocaleString()}</td>
                    <td className="px-3 py-2">{modelTokens.toLocaleString()}</td>
                    <td className="px-3 py-2">${pCost}</td>
                    <td className="px-3 py-2">${cCost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ActionBar>
          <Button variant="outline" size="sm" onClick={copyStats}>
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            Copy Token Metrics Summary
          </Button>
        </ActionBar>
      </ToolSection>
    </div>
  );
}
