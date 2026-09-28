"use client";

import React, { useState, useMemo } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Sparkles,
  Copy,
  Check,
  Trash2,
  FileDown,
  Shuffle,
  RotateCcw,
  ListOrdered,
  Scissors,
  Filter,
  Layers,
} from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";
import { copyText } from "@/lib/utils/clipboard";

export default function TextSorter() {
  const [inputText, setInputText] = usePersistentState<string>(
    "ts_input",
    `Banana\nApple\nCherry\napple\nDragonfruit\nBanana\nElderberry\nFig\nCherry`
  );

  const [sortOrder, setSortOrder] = useState<
    "none" | "az" | "za" | "length-asc" | "length-desc" | "reverse"
  >("az");
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [removeEmptyLines, setRemoveEmptyLines] = useState<boolean>(true);
  const [addLineNumbers, setAddLineNumbers] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Process text according to active settings
  const { outputText, originalCount, finalCount, duplicatesRemoved } = useMemo(() => {
    let lines = inputText.split(/\r?\n/);
    const originalCount = lines.length;

    // 1. Trim whitespace
    if (trimWhitespace) {
      lines = lines.map((l) => l.trim());
    }

    // 2. Remove empty lines
    if (removeEmptyLines) {
      lines = lines.filter((l) => l.length > 0);
    }

    // 3. Remove duplicates
    let dupsCount = 0;
    if (removeDuplicates) {
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const line of lines) {
        const key = caseSensitive ? line : line.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(line);
        } else {
          dupsCount++;
        }
      }
      lines = unique;
    }

    // 4. Sort
    if (sortOrder === "az") {
      lines.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: caseSensitive ? "variant" : "base" }));
    } else if (sortOrder === "za") {
      lines.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: caseSensitive ? "variant" : "base" }));
    } else if (sortOrder === "length-asc") {
      lines.sort((a, b) => a.length - b.length || a.localeCompare(b));
    } else if (sortOrder === "length-desc") {
      lines.sort((a, b) => b.length - a.length || a.localeCompare(b));
    } else if (sortOrder === "reverse") {
      lines.reverse();
    }

    // 5. Add line numbers
    if (addLineNumbers) {
      const padLen = String(lines.length).length;
      lines = lines.map((l, i) => `${String(i + 1).padStart(padLen, " ")}. ${l}`);
    }

    return {
      outputText: lines.join("\n"),
      originalCount,
      finalCount: lines.length,
      duplicatesRemoved: dupsCount,
    };
  }, [
    inputText,
    sortOrder,
    removeDuplicates,
    caseSensitive,
    trimWhitespace,
    removeEmptyLines,
    addLineNumbers,
  ]);

  // Shuffle Action
  const handleShuffle = () => {
    let lines = inputText.split(/\r?\n/);
    if (trimWhitespace) lines = lines.map((l) => l.trim());
    if (removeEmptyLines) lines = lines.filter((l) => l.length > 0);

    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setSortOrder("none");
    setInputText(lines.join("\n"));
  };

  // Copy
  const handleCopy = () => {
    copyText(outputText);
    setCopied(true);
    markToolCompleted();
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .txt
  const handleDownload = () => {
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sorted-text-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sample data loader
  const handleLoadSample = () => {
    setInputText(
      `Paris, France\nTokyo, Japan\nNew York, USA\nLondon, UK\nTokyo, Japan\nBerlin, Germany\nSydney, Australia\nParis, France\nToronto, Canada\nDubai, UAE`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 rounded-xl border space-y-4 bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm text-slate-900 dark:text-white font-semibold">
              Sort & Clean Settings
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-medium text-slate-500 hover:text-foreground"
            >
              Load sample
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setInputText("")}
              className="text-xs font-medium text-slate-500 hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Sort Presets Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSortOrder("az")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              sortOrder === "az"
                ? "bg-brand-subtle text-brand-subtle-foreground ring-1 ring-inset ring-primary/30 font-medium"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>Alphabetical A → Z</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder("za")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              sortOrder === "za"
                ? "bg-brand-subtle text-brand-subtle-foreground ring-1 ring-inset ring-primary/30 font-medium"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <ArrowUpAZ className="w-3.5 h-3.5" />
            <span>Reverse Z → A</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder("length-asc")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              sortOrder === "length-asc"
                ? "bg-brand-subtle text-brand-subtle-foreground ring-1 ring-inset ring-primary/30 font-medium"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <span>Shortest First</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder("length-desc")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              sortOrder === "length-desc"
                ? "bg-brand-subtle text-brand-subtle-foreground ring-1 ring-inset ring-primary/30 font-medium"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <span>Longest First</span>
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 transition bg-muted/30"
          >
            <Shuffle className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Cleaning Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Deduplicate Lines</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={(e) => setTrimWhitespace(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Trim Whitespace</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={removeEmptyLines}
              onChange={(e) => setRemoveEmptyLines(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Remove Blank Lines</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={addLineNumbers}
              onChange={(e) => setAddLineNumbers(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Line Numbering</span>
          </label>
        </div>
      </div>

      {/* Main Dual Pane: Input vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-foreground">
            <span>Input Raw Text ({originalCount} lines)</span>
            <span className="font-normal text-slate-500 dark:text-slate-400">{inputText.length} characters</span>
          </div>
          <textarea aria-label="Text to sort"
            rows={12}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text, list of names, URLs, SKUs, or items (one per line)..."
            className="w-full p-4 font-mono leading-relaxed resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Output Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-foreground">
            <span>Cleaned & Sorted Result ({finalCount} lines)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleDownload}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 font-semibold"
                title="Download as text file"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
          <textarea aria-label="Sorted result"
            rows={12}
            readOnly
            value={outputText}
            placeholder="Processed list will appear here..."
            className="w-full p-4 font-mono leading-relaxed resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* Summary Statistics Bar */}
      <div className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-muted/30">
        <div className="flex items-center gap-4">
          <div>
            Original Lines: <strong className="text-slate-900 dark:text-white">{originalCount}</strong>
          </div>
          <div>
            Cleaned Output: <strong className="text-slate-900 dark:text-white">{finalCount}</strong>
          </div>
          <div>
            Duplicates Removed:{" "}
            <strong className={duplicatesRemoved > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-900 dark:text-white"}>
              {duplicatesRemoved}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
