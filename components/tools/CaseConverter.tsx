"use client";

import React, { useState } from "react";
import { Copy, Check, Download, Trash2, FileText, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function CaseConverter() {
  const [text, setText] = useState<string>(
    "Everyday tools provide instant, client-side utility for students, engineers, and creators."
  );
  const [copied, setCopied] = useState(false);

  // Transformations
  const toUppercase = () => setText(text.toUpperCase());
  const toLowercase = () => setText(text.toLowerCase());

  const toSentenceCase = () => {
    const result = text
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    setText(result);
  };

  const toTitleCase = () => {
    const stopWords = new Set([
      "a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor", "of", "on", "or", "so", "the", "to", "up", "yet", "via"
    ]);

    const result = text
      .toLowerCase()
      .split(" ")
      .map((word, index, arr) => {
        if (!word) return "";
        if (index === 0 || index === arr.length - 1 || !stopWords.has(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(" ");

    setText(result);
  };

  const toCamelCase = () => {
    const words = text.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/);
    if (words.length === 0 || !words[0]) return;
    const result =
      words[0].toLowerCase() +
      words
        .slice(1)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    setText(result);
  };

  const toPascalCase = () => {
    const words = text.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/);
    const result = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");
    setText(result);
  };

  const toSnakeCase = () => {
    const result = text
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .join("_");
    setText(result);
  };

  const toKebabCase = () => {
    const result = text
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .join("-");
    setText(result);
  };

  const toConstantCase = () => {
    const result = text
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w.toUpperCase())
      .join("_");
    setText(result);
  };

  const cleanWhitespace = () => {
    const result = text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n");
    setText(result);
  };

  const removeEmptyLines = () => {
    const result = text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");
    setText(result);
  };

  // Metrics
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, "").length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentenceCount = text.trim() ? (text.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
  const paragraphCount = text.trim() ? text.split(/\n+/).filter(Boolean).length : 0;
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 200));

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

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "formatted-text.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Transformation Action Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Standard Cases
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toUppercase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            UPPERCASE
          </button>
          <button
            onClick={toLowercase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            lowercase
          </button>
          <button
            onClick={toTitleCase}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition"
          >
            Title Case (Headlines)
          </button>
          <button
            onClick={toSentenceCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            Sentence case
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Developer Cases & Cleanup
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toCamelCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            camelCase
          </button>
          <button
            onClick={toPascalCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            PascalCase
          </button>
          <button
            onClick={toKebabCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            kebab-case
          </button>
          <button
            onClick={toSnakeCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            snake_case
          </button>
          <button
            onClick={toConstantCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            CONSTANT_CASE
          </button>
          <button
            onClick={cleanWhitespace}
            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-medium border border-amber-200 dark:border-amber-800 transition"
          >
            Clean Extra Spaces
          </button>
          <button
            onClick={removeEmptyLines}
            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-medium border border-amber-200 dark:border-amber-800 transition"
          >
            Remove Empty Lines
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here to convert cases or count metrics..."
          className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed shadow-inner"
        />

        {/* Text Actions */}
        <div className="absolute right-3 bottom-3 flex items-center space-x-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            title="Download .txt file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setText("")}
            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
          <div className="text-[11px] text-slate-400 font-medium">Words</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{wordCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
          <div className="text-[11px] text-slate-400 font-medium">Characters</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{charCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
          <div className="text-[11px] text-slate-400 font-medium">No Spaces</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{charNoSpaces}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
          <div className="text-[11px] text-slate-400 font-medium">Sentences</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{sentenceCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400 font-medium">Reading Time</div>
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">~{readingTimeMins} min</div>
        </div>
      </div>
    </div>
  );
}
