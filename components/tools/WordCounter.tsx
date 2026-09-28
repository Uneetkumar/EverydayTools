"use client";

import React, { useState } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Copy, Check, Trash2, FileText, Sparkles } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";
import { toast } from "sonner";

/** "45 sec", "3 min", "1 hr 5 min" from a duration in minutes. */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 sec";
  const secs = Math.round(minutes * 60);
  if (secs < 60) return `${Math.max(1, secs)} sec`;
  const mins = Math.round(minutes);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}

const hasSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl;

function countGraphemes(text: string): number {
  if (!text) return 0;
  if (!hasSegmenter) return Array.from(text).length;
  let n = 0;
  for (const _ of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)) n++;
  return n;
}

// Scripts written without spaces between words (Chinese, Japanese, Thai…).
const NO_SPACE_SCRIPTS = /[\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/;

function countWords(text: string): number {
  if (!text.trim()) return 0;
  // Space-separated text is counted the way word processors count it, so
  // "well-known" is one word and totals match Word and Google Docs.
  if (!hasSegmenter || !NO_SPACE_SCRIPTS.test(text)) return text.trim().split(/\s+/).length;
  let n = 0;
  for (const seg of new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)) if (seg.isWordLike) n++;
  return n;
}

export default function WordCounter() {
  const [text, setText, resetText] = usePersistentState<string>(
    "word_counter_text",
    "TabBench delivers fast, privacy-first online calculators, converters, and formatters directly to your browser. No signups, no latency, and zero data logging."
  );
  const [copied, setCopied] = useState<boolean>(false);

  // Characters as people see them (an emoji or a Devanagari syllable is one).
  // Words are split on spaces, or segmented for languages written without them.
  const charCount = countGraphemes(text);
  const charNoSpaces = countGraphemes(text.replace(/\s/g, ""));
  const wordCount = countWords(text);
  const sentenceCount = text.trim() ? (text.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
  const paragraphCount = text.trim() ? text.split(/\n+/).filter(Boolean).length : 0;
  const readingTime = formatDuration(wordCount / 200);
  const speakingTime = formatDuration(wordCount / 130);

  // Social media character limits
  const twitterLimit = 280;
  const instagramLimit = 2200;
  const linkedInLimit = 3000;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the text", { description: "Select it and copy it manually." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
        {[
          ["Words", wordCount],
          ["Characters", charCount],
          ["Sentences", sentenceCount],
          ["Paragraphs", paragraphCount],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border bg-muted/30 px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-3xl font-semibold tabular-nums text-foreground">
              {(value as number).toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      {/* Editor */}
      <div className="relative">
        <textarea aria-label="Text to count"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to count words, characters, and reading time..."
          className="w-full p-4 leading-relaxed text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <div className="absolute right-4 bottom-4 flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs rounded-lg transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
          <button aria-label="Clear text"
            onClick={() => setText("")}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
            title="Clear text"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reading Time & Social Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border text-xs bg-muted/30">
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Estimated Durations</h3>
          <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Reading Time (200 wpm):</span>
            <strong className="text-slate-900 dark:text-white">{readingTime}</strong>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <span className="text-slate-500">Speaking Time (130 wpm):</span>
            <strong className="text-slate-900 dark:text-white">{speakingTime}</strong>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Social Platform Limits</h3>
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
