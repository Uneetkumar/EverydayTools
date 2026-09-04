"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Check, Copy, RefreshCw, AlertTriangle, Globe } from "lucide-react";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import confetti from "canvas-confetti";

/**
 * Hand-written reference answers, not model output. They are instant, work
 * offline and are checked for accuracy, which is exactly what a curated set
 * should be — but they are NOT AI, and the tool must not imply otherwise.
 * Free-form questions go to the model below; these do not.
 */
const EXPLANATION_KNOWLEDGE: Record<string, { title: string; answer: string; formula: string }> = {
  "margin-vs-markup": {
    title: "Margin vs. Markup Explained in Plain English",
    formula: "Margin = (Profit / Revenue) × 100  |  Markup = (Profit / Cost) × 100",
    answer:
      "Margin is what you KEEP from each dollar of sales. If an item costs $60 and sells for $100, your profit is $40. Margin is $40/$100 = 40%. Markup is what you ADD to the cost to get the price ($40/$60 = 66.7%). Remember: Margin can never exceed 100%, but Markup can go to infinity.",
  },
  percentage: {
    title: "Percentage Change vs. Percentage Difference",
    formula: "Change = ((New - Old) / Old) × 100  |  Difference = (|A - B| / Average(A,B)) × 100",
    answer:
      "Use Percentage Change when you have a clear starting point in time (e.g. sales increased from $100 to $150 = +50%). Use Percentage Difference when comparing two independent quantities where neither is the 'original' baseline.",
  },
  "jwt-tokens": {
    title: "How JWT Authentication Tokens Work",
    formula: "JWT = Base64Url(Header) . Base64Url(Payload) . HMAC-SHA256(Signature)",
    answer:
      "A JSON Web Token contains three parts separated by dots. The header declares the algorithm, the payload holds user claims (like user ID and expiration time), and the signature ensures the payload has not been tampered with by an attacker.",
  },
  "loan-emi": {
    title: "How Loan EMI Amortization Works",
    formula: "EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]",
    answer:
      "In the early months of a loan, most of your monthly EMI goes towards paying accrued interest rather than principal. As the remaining principal decreases over the years, a larger percentage of each payment chips away at the principal balance.",
  },
};

export default function AiExplainer() {
  const [selectedTopic, setSelectedTopic] = useState<string>("margin-vs-markup");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  // `customQuestion` used to be declared and never read: the tool was a static
  // FAQ named "AI Formula Explainer". It now asks a real model.
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const askAi = async () => {
    const q = customQuestion.trim();
    if (!q || asking) return;
    setAsking(true);
    setAiError(null);
    setAiAnswer(null);
    try {
      const out = await new GeminiProvider().generate({
        text:
          "Explain the following clearly and accurately for someone with no background in the subject. " +
          "Show any formula involved and define each term. Use plain language, no more than 200 words. " +
          "If the question is ambiguous, state the assumption you made.\n\nQuestion: " +
          q,
        task: "general",
      });
      setAiAnswer(out.result);
    } catch (e) {
      // GeminiProvider already turns SDK errors into actionable text.
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAsking(false);
    }
  };

  const activeKnowledge = EXPLANATION_KNOWLEDGE[selectedTopic];

  const handleCopy = async () => {
    if (!activeKnowledge) return;
    try {
      await navigator.clipboard.writeText(
        `${activeKnowledge.title}\n\nFormula: ${activeKnowledge.formula}\n\n${activeKnowledge.answer}`
      );
      setCopied(true);
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ask a real model. Kept above the curated chips because a free-form
          question is what people arrive wanting; the presets are the fallback,
          not the main event. */}
      <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/25">
        <label
          htmlFor="ai-question"
          className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
        >
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Ask anything
          <span className="ml-auto flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            <Globe className="h-3 w-3" /> Sent to Google
          </span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="ai-question"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askAi();
            }}
            placeholder="e.g. Why does compound interest beat simple interest?"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            onClick={askAi}
            disabled={asking || !customQuestion.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {asking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {asking ? "Thinking…" : "Explain"}
          </button>
        </div>

        {aiError && (
          <p className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {aiError}
          </p>
        )}

        {aiAnswer && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {aiAnswer}
            </p>
            <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800">
              Generated by Gemini. Check anything you intend to rely on \u2014 models
              state wrong things confidently.
            </p>
          </div>
        )}
      </div>

      {/* Topic Preset Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Or pick a hand-written explanation (instant, works offline)
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "margin-vs-markup", label: "Margin vs. Markup" },
            { id: "percentage", label: "Percent Change vs Difference" },
            { id: "jwt-tokens", label: "JWT Token Structure" },
            { id: "loan-emi", label: "Loan EMI Amortization" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                selectedTopic === t.id
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Explanation Card */}
      {activeKnowledge && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeKnowledge.title}
              </h3>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner">
            <code>{activeKnowledge.formula}</code>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {activeKnowledge.answer}
          </p>
        </div>
      )}
    </div>
  );
}
