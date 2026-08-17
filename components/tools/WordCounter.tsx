"use client";

import React, { useState } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Copy, Check, Trash2, FileText, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function WordCounter() {
  const [text, setText, resetText] = usePersistentState<string>(
    "word_counter_text",
    "EverydayTools delivers fast, privacy-first online calculators, converters, and formatters directly to your browser. No signups, no latency, and zero data logging."
  );
  const [copied, setCopied] = useState<boolean>(false);

  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, "").length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentenceCount = text.trim() ? (text.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
  const paragraphCount = text.trim() ? text.split(/\n+/).filter(Boolean).length : 0;
  const readingTimeMins = (wordCount / 200).toFixed(1);
  const speakingTimeMins = (wordCount / 130).toFixed(1);

  // Social media character limits
  const twitterLimit = 280;
  const instagramLimit = 2200;
  const linkedInLimit = 3000;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            Words
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {wordCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            Characters
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {charCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-center">
          <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Sentences
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {sentenceCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Paragraphs
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {paragraphCount}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to count words, characters, and reading time..."
          className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="absolute right-4 bottom-4 flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
          <button
            onClick={() => setText("")}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
            title="Clear text"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reading Time & Social Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white">Estimated Durations</h4>
          <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Reading Time (200 wpm):</span>
            <strong className="text-slate-900 dark:text-white">~{readingTimeMins} min</strong>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Speaking Time (130 wpm):</span>
            <strong className="text-slate-900 dark:text-white">~{speakingTimeMins} min</strong>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white">Social Platform Limits</h4>
          <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Twitter / X ({charCount}/280):</span>
            <strong className={charCount > twitterLimit ? "text-rose-500" : "text-emerald-600"}>
              {twitterLimit - charCount} left
            </strong>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Instagram ({charCount}/2,200):</span>
            <strong className={charCount > instagramLimit ? "text-rose-500" : "text-emerald-600"}>
              {instagramLimit - charCount} left
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
