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
  provider: "OpenAI" | "Anthropic" | "Google";
  contextWindow: number;
  /** Standard (not batch, not cached) USD list price per 1M tokens. */
  inputPer1M: number;
  outputPer1M: number;
  /** Higher rates for the whole request once the prompt is over `above` tokens. */
  longContext?: { above: number; inputPer1M: number; outputPer1M: number };
  /**
   * Estimated tokens relative to OpenAI's o200k tokenizer, which the
   * estimator is calibrated against. From each provider's published ratios:
   * Anthropic's tokenizer for Claude 4.7 and later produces about 30% more
   * tokens than its previous one (which tracked o200k closely), and Google
   * puts a Gemini token at about 4 characters (o200k averages ~4.4 on English).
   */
  tokenMultiplier: number;
  note?: string;
}

/**
 * List prices checked 9 October 2026 on each provider's own pages. Providers
 * change models and prices often: re-check every few months, update the date
 * in PRICES_CHECKED, and keep the notes below the table in step.
 *   OpenAI:    https://developers.openai.com/api/docs/pricing
 *              https://developers.openai.com/api/docs/models
 *   Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
 *              https://platform.claude.com/docs/en/about-claude/models/overview
 *   Google:    https://ai.google.dev/gemini-api/docs/pricing
 *              https://ai.google.dev/gemini-api/docs/models
 */
const PRICES_CHECKED = "9 October 2026";

const PRICE_SOURCES = [
  { label: "OpenAI", href: "https://developers.openai.com/api/docs/pricing" },
  { label: "Anthropic", href: "https://platform.claude.com/docs/en/about-claude/pricing" },
  { label: "Google", href: "https://ai.google.dev/gemini-api/docs/pricing" },
];

const MODELS: Record<string, ModelPricing> = {
  "gpt-6-astra": {
    name: "GPT-6 Astra",
    provider: "OpenAI",
    contextWindow: 1_050_000,
    inputPer1M: 10,
    outputPer1M: 50,
    longContext: { above: 272_000, inputPer1M: 20, outputPer1M: 75 },
    tokenMultiplier: 1,
  },
  "gpt-6.1-sol": {
    name: "GPT-6.1 Sol",
    provider: "OpenAI",
    contextWindow: 1_050_000,
    inputPer1M: 2,
    outputPer1M: 10,
    longContext: { above: 272_000, inputPer1M: 4, outputPer1M: 15 },
    tokenMultiplier: 1,
  },
  "gpt-6-luna": {
    name: "GPT-6 Luna",
    provider: "OpenAI",
    contextWindow: 1_050_000,
    inputPer1M: 0.1,
    outputPer1M: 0.5,
    longContext: { above: 272_000, inputPer1M: 0.2, outputPer1M: 0.75 },
    tokenMultiplier: 1,
  },
  "claude-fable-5-1": {
    name: "Claude Fable 5.1",
    provider: "Anthropic",
    contextWindow: 1_000_000,
    inputPer1M: 10,
    outputPer1M: 50,
    tokenMultiplier: 1.3,
  },
  "claude-opus-5-5": {
    name: "Claude Opus 5.5",
    provider: "Anthropic",
    contextWindow: 1_000_000,
    inputPer1M: 4,
    outputPer1M: 20,
    tokenMultiplier: 1.3,
  },
  "claude-sonnet-5-5": {
    name: "Claude Sonnet 5.5",
    provider: "Anthropic",
    contextWindow: 1_000_000,
    inputPer1M: 2,
    outputPer1M: 10,
    tokenMultiplier: 1.3,
  },
  "claude-haiku-5-5": {
    name: "Claude Haiku 5.5",
    provider: "Anthropic",
    contextWindow: 1_000_000,
    inputPer1M: 0.1,
    outputPer1M: 0.5,
    longContext: { above: 100_000, inputPer1M: 0.5, outputPer1M: 2.5 },
    tokenMultiplier: 1.3,
  },
  "gemini-3.1-pro-preview": {
    name: "Gemini 3.1 Pro (preview)",
    provider: "Google",
    contextWindow: 1_048_576,
    inputPer1M: 2,
    outputPer1M: 12,
    longContext: { above: 200_000, inputPer1M: 4, outputPer1M: 18 },
    tokenMultiplier: 1.1,
  },
  "gemini-3.8-flash": {
    name: "Gemini 3.8 Flash",
    provider: "Google",
    contextWindow: 1_048_576,
    inputPer1M: 0.75,
    outputPer1M: 3.75,
    tokenMultiplier: 1.1,
    note: "Gemini 3.8 Flash: promotional price until 31 December 2026; $1.50 input and $7.50 output per 1M tokens from 1 January 2027.",
  },
};

const DEFAULT_MODEL = "gpt-6.1-sol";

/** The rates that apply to a request whose prompt is `tokens` long. */
function ratesFor(model: ModelPricing, tokens: number) {
  const long = model.longContext && tokens > model.longContext.above ? model.longContext : null;
  return {
    inputPer1M: long ? long.inputPer1M : model.inputPer1M,
    outputPer1M: long ? long.outputPer1M : model.outputPer1M,
    isLong: !!long,
  };
}

// Numbers use a fixed locale: the page is prerendered, so the build machine's or the visitor's
// locale (10,50,000 vs 1,050,000 vs 1.050.000) would make the server HTML and hydration disagree.
const fmtUsd = (n: number) => `$${n < 0.01 ? n.toFixed(5) : n.toFixed(4)}`;
const fmtRate = (n: number) => `$${n < 1 ? n.toFixed(2) : n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

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

/**
 * Heuristic token estimate, calibrated against OpenAI's o200k_base tokenizer:
 * within about 5% on English prose, source code and JSON, about 10-15% on
 * CSS, CSV and URLs. It is not any provider's real tokenizer.
 *
 * BPE tokenizers attach the space before a word to the word (" token"), so a
 * word with its leading space is one piece; camelCase splits into its parts;
 * digits group in threes; runs of punctuation and of whitespace (newlines,
 * indentation) are about one token each. Devanagari and other non-Latin
 * alphabets average ~4 characters a token, CJK ~1.5.
 */
function estimateTokens(text: string, multiplier: number): number {
  if (!text) return 0;
  const pieces =
    text.match(/ ?(?:[A-Z]?[a-z]+|[A-Z]+(?![a-z])|[\p{L}\p{M}]+)| ?\p{N}+| ?[^\s\p{L}\p{M}\p{N}]+|\s+/gu) ?? [];
  let count = 0;
  for (const piece of pieces) {
    const t = piece.trimStart();
    if (!t) {
      count += 1; // a whitespace run
      continue;
    }
    const cp = t.codePointAt(0) ?? 0;
    if (/\p{N}/u.test(t[0])) {
      count += Math.ceil(t.length / 3);
    } else if (/[\p{L}\p{M}]/u.test(t[0])) {
      const isCjk = (cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x3040 && cp <= 0x30ff);
      const len = [...t].length;
      if (isCjk) count += Math.ceil(len / 1.5);
      else if (cp > 0x24f) count += Math.ceil(len / 4);
      else count += len <= 12 ? 1 : Math.ceil(len / 7);
    } else {
      count += Math.ceil(t.length / 6);
    }
  }
  return Math.max(1, Math.round(count * multiplier));
}

export default function LlmTokenCounter() {
  const [selectedModelKey, setSelectedModelKey] = useState(DEFAULT_MODEL);
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [copied, setCopied] = useState(false);

  const model = MODELS[selectedModelKey] || MODELS[DEFAULT_MODEL];

  const stats = useMemo(() => {
    const rawTokens = estimateTokens(text, model.tokenMultiplier);
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const tokensPerWord = words > 0 ? (rawTokens / words).toFixed(2) : "0";

    const rates = ratesFor(model, rawTokens);
    const inputCost = fmtUsd((rawTokens / 1_000_000) * rates.inputPer1M);
    const outputCost = fmtUsd((rawTokens / 1_000_000) * rates.outputPer1M);

    const contextPercent = Math.min(100, (rawTokens / model.contextWindow) * 100);

    return {
      tokens: rawTokens,
      words,
      charsWithSpaces,
      charsNoSpaces,
      tokensPerWord,
      inputCost,
      outputCost,
      rates,
      contextPercent: contextPercent.toFixed(2),
    };
  }, [text, model]);

  const copyStats = () => {
    const summary = [
      `Model: ${model.name} (${model.provider})`,
      `Tokens: ${stats.tokens.toLocaleString("en-US")}`,
      `Words: ${stats.words.toLocaleString("en-US")}`,
      `Characters: ${stats.charsWithSpaces.toLocaleString("en-US")}`,
      `Estimated Input Cost: ${stats.inputCost} at ${fmtRate(stats.rates.inputPer1M)} per 1M tokens (prices checked ${PRICES_CHECKED})`,
      `Context Usage: ${stats.contextPercent}% of ${model.contextWindow.toLocaleString("en-US")} tokens`,
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
        description="Estimate tokens, characters and API cost for a prompt. Counts approximate how BPE tokenizers split text (each provider's real tokenizer differs a little), and prices are list prices per 1M tokens that providers change often."
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
            value={stats.tokens.toLocaleString("en-US")}
            tone="success"
            hint={`~${stats.tokensPerWord} tokens per word`}
          />
          <Stat label="Total Words" value={stats.words.toLocaleString("en-US")} />
          <Stat label="Characters" value={stats.charsWithSpaces.toLocaleString("en-US")} hint={`${stats.charsNoSpaces} without spaces`} />
          <Stat
            label="Input API Cost"
            value={stats.inputCost}
            hint={`${fmtRate(stats.rates.inputPer1M)} / 1M tokens${stats.rates.isLong ? " (long-prompt rate)" : ""}`}
          />
        </StatGrid>

        {/* Context Window Progress Meter */}
        <div className="space-y-2 rounded-lg border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Gauge className="size-3.5 text-primary" /> Context Window Capacity
            </span>
            <span className="font-mono text-muted-foreground">
              {stats.tokens.toLocaleString("en-US")} / {model.contextWindow.toLocaleString("en-US")} tokens ({stats.contextPercent}%)
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
                const r = ratesFor(m, modelTokens);
                const pCost = fmtUsd((modelTokens / 1_000_000) * r.inputPer1M);
                const cCost = fmtUsd((modelTokens / 1_000_000) * r.outputPer1M);
                const isCurrent = k === selectedModelKey;
                return (
                  <tr
                    key={k}
                    className={isCurrent ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}
                  >
                    <td className="px-3 py-2 text-foreground font-medium">
                      {m.name} <span className="text-[10px] text-muted-foreground">({m.provider})</span>
                    </td>
                    <td className="px-3 py-2">{m.contextWindow.toLocaleString("en-US")}</td>
                    <td className="px-3 py-2">{modelTokens.toLocaleString("en-US")}</td>
                    <td className="px-3 py-2">
                      {pCost}
                      {r.isLong && <span className="ml-1 text-[10px] text-muted-foreground">long</span>}
                    </td>
                    <td className="px-3 py-2">{cCost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>
            Standard list prices per 1M tokens, checked {PRICES_CHECKED} on each provider&apos;s pricing page (
            {PRICE_SOURCES.map((src, i) => (
              <React.Fragment key={src.href}>
                {i > 0 && ", "}
                <a href={src.href} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                  {src.label}
                </a>
              </React.Fragment>
            ))}
            ). Batch and prompt-caching discounts are not included, and prices change often, so confirm before
            budgeting. Completion cost is what generating the same number of tokens would cost.
          </p>
          <p>
            Long-prompt rates (marked &ldquo;long&rdquo;) apply to the whole request once the prompt passes a size:
            over 272K tokens on OpenAI&apos;s GPT-6 models, over 200K on Gemini 3.1 Pro, and over 100K on Claude
            Haiku 5.5.{" "}
            {Object.values(MODELS)
              .filter((m) => m.note)
              .map((m) => m.note)
              .join(" ")}
          </p>
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
