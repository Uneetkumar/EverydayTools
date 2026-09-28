"use client";

import React, { useState } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Copy, Check, Download, Trash2, FileText, Sparkles, Undo2 } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";

/**
 * Words for programmer cases. Splits on anything that is not a letter or
 * digit in any script (so "café" and "नमस्ते" survive), and on existing case
 * boundaries, so "myHTTPRequest" becomes my / HTTP / Request.
 */
function splitWords(text: string): string[] {
  return text
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export default function CaseConverter() {
  const [text, setText] = usePersistentState<string>(
    "case_converter_text",
    "TabBench provides instant, client-side utility for students, engineers, and creators."
  );
  const [copied, setCopied] = useState(false);

  // One level of undo: every transformation replaces the text in place.
  const [previous, setPrevious] = useState<string | null>(null);
  const apply = (next: string) => {
    if (next === text) return;
    setPrevious(text);
    setText(next);
  };

  // Transformations
  const toUppercase = () => apply(text.toUpperCase());
  const toLowercase = () => apply(text.toLowerCase());

  const toSentenceCase = () => {
    // Capitalise the first letter of the text, of every line, and after
    // sentence-ending punctuation; keep a lone "i" as "I".
    const result = text
      .toLowerCase()
      .replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase())
      .replace(/\bi\b/g, "I");
    apply(result);
  };

  const toTitleCase = () => {
    const stopWords = new Set([
      "a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor", "of", "on", "or", "so", "the", "to", "up", "yet", "via"
    ]);
    // Line by line, so line breaks survive.
    const result = text
      .split("\n")
      .map((line) =>
        line
          .toLowerCase()
          .split(" ")
          .map((word, index, arr) => {
            if (!word) return "";
            if (index === 0 || index === arr.length - 1 || !stopWords.has(word)) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
          })
          .join(" ")
      )
      .join("\n");
    apply(result);
  };

  const toCamelCase = () => {
    const words = splitWords(text);
    if (words.length === 0) return;
    apply(
      words[0].toLowerCase() +
        words
          .slice(1)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join("")
    );
  };

  const toPascalCase = () =>
    apply(
      splitWords(text)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("")
    );

  const toSnakeCase = () => apply(splitWords(text).map((w) => w.toLowerCase()).join("_"));
  const toKebabCase = () => apply(splitWords(text).map((w) => w.toLowerCase()).join("-"));
  const toConstantCase = () => apply(splitWords(text).map((w) => w.toUpperCase()).join("_"));

  const cleanWhitespace = () => {
    const result = text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n");
    apply(result);
  };

  const removeEmptyLines = () => {
    const result = text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");
    apply(result);
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
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the text", { description: "Select it and copy it manually." });
    }
  };

  const handleDownload = () => {
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "formatted-text.txt", "case-converter");
  };

  return (
    <div className="space-y-6">
      {/* Transformation Action Pills */}
      <div className="space-y-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Standard Cases
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toUppercase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            UPPERCASE
          </button>
          <button
            onClick={toLowercase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            lowercase
          </button>
          <button
            onClick={toTitleCase}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition bg-background text-foreground border hover:bg-muted"
          >
            Title Case (Headlines)
          </button>
          <button
            onClick={toSentenceCase}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            Sentence case
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition bg-background text-foreground border hover:bg-muted"
          >
            Clean Extra Spaces
          </button>
          <button
            onClick={removeEmptyLines}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition bg-background text-foreground border hover:bg-muted"
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
          aria-label="Text to convert"
          placeholder="Paste or type your text here to convert cases or count metrics..."
          className="w-full p-4 font-sans leading-relaxed text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        {/* Text Actions */}
        <div className="absolute right-3 bottom-3 flex items-center space-x-1.5">
          {previous !== null && (
            <button
              type="button"
              onClick={() => {
                setText(previous);
                setPrevious(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-card border text-foreground hover:bg-muted transition"
            >
              <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
              Undo
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
            className="p-1.5 text-slate-600 dark:text-slate-300 border transition rounded-lg bg-muted/60"
            aria-label="Download as a .txt file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => apply("")}
            aria-label="Clear text"
            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border bg-muted/30">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Words</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{wordCount}</div>
        </div>
        <div className="p-3 rounded-xl border bg-muted/30">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Characters</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{charCount}</div>
        </div>
        <div className="p-3 rounded-xl border bg-muted/30">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">No Spaces</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{charNoSpaces}</div>
        </div>
        <div className="p-3 rounded-xl border bg-muted/30">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sentences</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{sentenceCount}</div>
        </div>
        <div className="p-3 rounded-xl border col-span-2 sm:col-span-1 bg-muted/30">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reading Time</div>
          <div className="text-lg font-semibold mt-0.5 text-foreground">~{readingTimeMins} min</div>
        </div>
      </div>
    </div>
  );
}
