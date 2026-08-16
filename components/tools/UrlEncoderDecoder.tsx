"use client";

import React, { useState } from "react";
import { Copy, Check, Trash2, ArrowRightLeft } from "lucide-react";
import confetti from "canvas-confetti";

export default function UrlEncoderDecoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState<string>("https://example.com/search?query=hello world & category=web tools!");
  const [copied, setCopied] = useState<boolean>(false);
  const [useComponent, setUseComponent] = useState<boolean>(true);

  let output = "";
  let errorMsg = null;

  if (input) {
    try {
      if (mode === "encode") {
        output = useComponent ? encodeURIComponent(input) : encodeURI(input);
      } else {
        output = useComponent ? decodeURIComponent(input) : decodeURI(input);
      }
    } catch (e: unknown) {
      if (e instanceof Error) errorMsg = "Malformed URI sequence.";
    }
  }

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setMode("encode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "encode"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Encode URL
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "decode"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Decode URL
          </button>
        </div>

        <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 pr-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useComponent}
            onChange={(e) => setUseComponent(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          <span>encodeURIComponent (all special symbols)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Input Text / URL</span>
            <button
              onClick={() => setInput("")}
              className="text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL to encode or decode..."
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Output</span>
            {output && (
              <button
                onClick={handleCopy}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Result"}
              </button>
            )}
          </div>
          <textarea
            rows={8}
            readOnly
            value={errorMsg || output}
            placeholder="Result will appear here..."
            className={`w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none ${
              errorMsg
                ? "border-rose-300 text-rose-500 dark:border-rose-800"
                : "border-slate-200 dark:border-slate-800 text-slate-900 dark:text-emerald-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
