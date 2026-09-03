"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, RefreshCw, Type, AlignLeft, List, Sparkles } from "lucide-react";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "in",
  "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui",
  "officia", "deserunt", "mollit", "anim", "id", "est", "laborum", "curabitur",
  "pretium", "tincidunt", "lacus", "nulla", "gravida", "orci", "a", "odio", "nullam",
  "varius", "turpis", "et", "commodo", "pharetra", "est", "eros", "bibendum",
  "elit", "nec", "luctus", "magna", "felis", "sollicitudin", "mauris", "integer",
  "in", "mauris", "eu", "nibh", "euismod", "gravida", "duis", "ac", "tellus", "et",
  "risus", "vulputate", "vehicula", "donec", "lobortis", "risus", "a", "elit",
];

function generateSentence(minWords = 8, maxWords = 16): string {
  const count = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const word = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    words.push(word);
  }
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function generateParagraph(minSentences = 4, maxSentences = 7): string {
  const count = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(" ");
}

export default function LoremIpsumGenerator() {
  const [count, setCount] = useState<number>(3);
  const [type, setType] = useState<"paragraphs" | "sentences" | "words" | "list">("paragraphs");
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [htmlTags, setHtmlTags] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const text = useMemo(() => {
    // Seed triggers re-computation
    void seed;
    let items: string[] = [];

    if (type === "paragraphs") {
      for (let i = 0; i < count; i++) {
        items.push(generateParagraph());
      }
      if (startWithLorem && items.length > 0) {
        items[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " + items[0];
      }
      if (htmlTags) {
        return items.map((p) => `<p>${p}</p>`).join("\n\n");
      }
      return items.join("\n\n");
    }

    if (type === "sentences") {
      for (let i = 0; i < count; i++) {
        items.push(generateSentence());
      }
      if (startWithLorem && items.length > 0) {
        items[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
      }
      if (htmlTags) {
        return items.map((s) => `<p>${s}</p>`).join("\n");
      }
      return items.join(" ");
    }

    if (type === "words") {
      for (let i = 0; i < count; i++) {
        items.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      }
      if (startWithLorem && items.length >= 2) {
        items[0] = "lorem";
        items[1] = "ipsum";
      }
      return items.join(" ");
    }

    if (type === "list") {
      for (let i = 0; i < count; i++) {
        items.push(generateSentence(4, 10));
      }
      if (htmlTags) {
        return `<ul>\n${items.map((li) => `  <li>${li}</li>`).join("\n")}\n</ul>`;
      }
      return items.map((li) => `• ${li}`).join("\n");
    }

    return "";
  }, [count, type, startWithLorem, htmlTags, seed]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type selector */}
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              {(["paragraphs", "sentences", "words", "list"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    type === t
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Quantity Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="lorem-count-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Count:
              </label>
              <input
                id="lorem-count-input"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            Start with &quot;Lorem ipsum...&quot;
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={htmlTags}
              onChange={(e) => setHtmlTags(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            Include HTML tags (&lt;p&gt;, &lt;ul&gt;)
          </label>
          <div className="ml-auto text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            {wordCount} words · {charCount} characters
          </div>
        </div>
      </div>

      {/* Output Content Container */}
      <div className="relative">
        <textarea
          readOnly
          value={text}
          rows={12}
          className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </div>
  );
}
