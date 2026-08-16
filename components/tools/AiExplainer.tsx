"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Check, Copy } from "lucide-react";
import confetti from "canvas-confetti";

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
      {/* Topic Preset Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Select Topic to Explain
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
