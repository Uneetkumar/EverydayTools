"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Link2, ArrowRight, Settings2, Trash2 } from "lucide-react";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "about", "above", "after", "along", "amid",
  "among", "as", "at", "by", "for", "from", "in", "into", "like", "of", "off", "on",
  "onto", "out", "over", "to", "with", "is", "it", "this", "that"
]);

export default function SlugGenerator() {
  const [input, setInput] = useState<string>("How to Build a Fast & Modern Web Application in 2026!");
  const [separator, setSeparator] = useState<string>("-");
  const [lowercase, setLowercase] = useState<boolean>(true);
  const [removeStopwords, setRemoveStopwords] = useState<boolean>(false);
  const [stripNumbers, setStripNumbers] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const slug = useMemo(() => {
    if (!input.trim()) return "";

    let text = input;

    // Normalize accents & diacritics (e.g. é -> e, ñ -> n)
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (lowercase) {
      text = text.toLowerCase();
    }

    if (stripNumbers) {
      text = text.replace(/[0-9]/g, "");
    }

    // Replace special symbols and punctuation with space
    text = text.replace(/[^a-zA-Z0-9\s-_]/g, " ");

    // Split into tokens
    let tokens = text.split(/[\s-_]+/).filter(Boolean);

    if (removeStopwords) {
      tokens = tokens.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
    }

    return tokens.join(separator);
  }, [input, separator, lowercase, removeStopwords, stripNumbers]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input & Options */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label htmlFor="slug-input">Original Title or Headline</label>
              <button
                onClick={() => setInput("")}
                className="text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
            <textarea
              id="slug-input"
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste article title, product name or headline here..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Options Panel */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Settings2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Slug Customization
            </div>

            {/* Separator choice */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Word Separator</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Hyphen (-)", val: "-" },
                  { label: "Underscore (_)", val: "_" },
                  { label: "Slash (/)", val: "/" },
                  { label: "Dot (.)", val: "." },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSeparator(val)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      separator === val
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                Force lowercase
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeStopwords}
                  onChange={(e) => setRemoveStopwords(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                Remove stop words (a, the, in)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripNumbers}
                  onChange={(e) => setStripNumbers(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                Strip numbers (0-9)
              </label>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Generated SEO URL Slug
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {slug.length} characters
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 font-mono text-sm break-all select-all text-blue-600 dark:text-blue-400 font-medium min-h-[48px] flex items-center">
              {slug || <span className="text-slate-400 italic">Slug will appear here...</span>}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Example Live URL Preview:
              </span>
              <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                https://example.com/blog/<span className="text-blue-600 dark:text-blue-400 font-bold">{slug || "your-slug"}</span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              disabled={!slug}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Slug Copied to Clipboard!" : "Copy Clean Slug"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
