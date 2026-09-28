"use client";

import React, { useState } from "react";
import { Copy, Check, Trash2, ArrowRightLeft } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";

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
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 border rounded-lg bg-muted/60">
        <div className="flex space-x-2">
          <button
            onClick={() => setMode("encode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "encode"
                ? "bg-background text-foreground shadow-xs dark:bg-input/50"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Encode URL
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "decode"
                ? "bg-background text-foreground shadow-xs dark:bg-input/50"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Decode URL
          </button>
        </div>

        <label className="flex items-center space-x-2 text-sm pr-2 cursor-pointer font-medium text-foreground">
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
          <div className="flex justify-between text-sm font-medium text-foreground">
            <span>Input Text / URL</span>
            <button
              onClick={() => setInput("")}
              className="text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea aria-label="Text or URL to encode or decode"
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL to encode or decode..."
            className="w-full p-3.5 font-mono text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-foreground">
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
          <textarea aria-label="Result"
            rows={8}
            readOnly
            value={errorMsg || output}
            placeholder="Result will appear here..."
            className={`w-full p-3.5 font-mono text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
              errorMsg
                ? "border-rose-300 text-rose-500 dark:border-rose-800 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                : "dark:text-emerald-400 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
