"use client";

import React, { useState } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Check, Copy, Download, Trash2, FileJson, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

const SAMPLE_JSON = {
  appName: "TabBench",
  version: "1.0.0",
  features: ["Zero Latency", "Client-Side Privacy", "Search Optimized"],
  monetization: {
    baseLayer: "Display Ads",
    growthLayer: "Affiliate & Pro Tools",
    rpmTarget: 12.5,
  },
  activeUsers: 10000,
  isLive: true,
};

export default function JsonFormatter() {
  const [inputJson, setInputJson] = usePersistentState<string>(
    "json_formatter_input",
    JSON.stringify(SAMPLE_JSON, null, 2)
  );
  const [indentSize, setIndentSize] = usePersistentState<"2" | "4" | "tab">("json_formatter_indent", "2");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ size: number; keys: number } | null>({
    size: 215,
    keys: 6,
  });

  const formatJson = (space: "2" | "4" | "tab") => {
    try {
      const parsed = JSON.parse(inputJson);
      const indentation = space === "tab" ? "\t" : parseInt(space, 10);
      const formatted = JSON.stringify(parsed, null, indentation);
      setInputJson(formatted);
      setErrorMsg(null);
      setIndentSize(space);
      const keyCount = typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 1;
      setStats({ size: new Blob([formatted]).size, keys: keyCount });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Invalid JSON syntax.");
      }
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setInputJson(minified);
      setErrorMsg(null);
      const keyCount = typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 1;
      setStats({ size: new Blob([minified]).size, keys: keyCount });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Invalid JSON syntax.");
      }
    }
  };

  const loadSample = () => {
    setInputJson(JSON.stringify(SAMPLE_JSON, null, 2));
    setErrorMsg(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inputJson);
      setCopied(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([inputJson], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = "data.json";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => formatJson("2")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              indentSize === "2" && !errorMsg
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            Prettify (2 Spaces)
          </button>
          <button
            onClick={() => formatJson("4")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              indentSize === "4" && !errorMsg
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            4 Spaces
          </button>
          <button
            onClick={() => formatJson("tab")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              indentSize === "tab" && !errorMsg
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            Tabs
          </button>
          <button
            onClick={minifyJson}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
          >
            Minify / Compact
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadSample}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
          >
            Load Sample
          </button>
          <button
            onClick={() => setInputJson("")}
            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">Invalid JSON Syntax</div>
            <div className="font-mono mt-1 text-[11px]">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          rows={14}
          value={inputJson}
          onChange={(e) => {
            setInputJson(e.target.value);
            setErrorMsg(null);
          }}
          placeholder="Paste raw JSON here to format or validate..."
          className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
        />

        {/* Floating Quick Action Buttons */}
        <div className="absolute right-4 bottom-4 flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Download .json file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadata / Stats */}
      {stats && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div>
            <span>Payload Size: </span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {stats.size} bytes
            </strong>
          </div>
          <div>
            <span>Root Properties: </span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {stats.keys}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
