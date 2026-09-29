"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, RefreshCw, Type, AlignLeft, List, Sparkles } from "lucide-react";
import { copyText } from "@/lib/utils/clipboard";

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

type Rng = () => number;

/**
 * Small seeded PRNG (mulberry32). The text is generated during render, and
 * the page is prerendered, so it has to come out the same on the server and
 * in the browser for a given seed; "Regenerate" just moves to the next seed.
 */
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSentence(rand: Rng, minWords = 8, maxWords = 16): string {
  const count = Math.floor(rand() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const word = LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)];
    words.push(word);
  }
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function generateParagraph(rand: Rng, minSentences = 4, maxSentences = 7): string {
  const count = Math.floor(rand() * (maxSentences - minSentences + 1)) + minSentences;
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence(rand));
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
    const rand = seeded(seed + 1);
    const items: string[] = [];

    if (type === "paragraphs") {
      for (let i = 0; i < count; i++) {
        items.push(generateParagraph(rand));
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
        items.push(generateSentence(rand));
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
        items.push(LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)]);
      }
      if (startWithLorem && items.length >= 2) {
        items[0] = "lorem";
        items[1] = "ipsum";
      }
      return items.join(" ");
    }

    if (type === "list") {
      for (let i = 0; i < count; i++) {
        items.push(generateSentence(rand, 4, 10));
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
    copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-5 rounded-xl border space-y-4 bg-muted/30">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-0.5 min-[400px]:flex min-[400px]:gap-0 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
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
              <label htmlFor="lorem-count-input" className="text-sm font-medium text-foreground">
                Count:
              </label>
              <input
                id="lorem-count-input"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                className="w-16 px-2.5 py-1.5 text-center text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border text-slate-700 dark:text-slate-300 transition-colors bg-muted/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
          <div className="ml-auto text-slate-500 dark:text-slate-400 font-mono text-xs">
            {wordCount} words · {charCount} characters
          </div>
        </div>
      </div>

      {/* Output Content Container */}
      <div className="relative">
        <textarea aria-label="Generated text"
          readOnly
          value={text}
          rows={12}
          className="w-full p-4 sm:p-5 font-serif leading-relaxed resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
    </div>
  );
}
