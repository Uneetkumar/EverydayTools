"use client";

import React, { useState } from "react";
import { GitCompare, Trash2, ArrowRightLeft } from "lucide-react";

export default function TextDiffChecker() {
  const [original, setOriginal] = useState<string>(
    "TabBench provides fast online utilities.\nRuns completely in your browser.\nNo login required."
  );
  const [modified, setModified] = useState<string>(
    "TabBench provides fast, private online utilities.\nRuns completely in your local browser.\nNo signup or login required."
  );

  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  const maxLines = Math.max(origLines.length, modLines.length);

  return (
    <div className="space-y-6">
      {/* Side-by-Side Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Original Text (Before)</span>
            <button
              onClick={() => setOriginal("")}
              className="text-rose-500 hover:underline"
            >
              Clear
            </button>
          </div>
          <textarea
            rows={8}
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Paste original text..."
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Modified Text (After)</span>
            <button
              onClick={() => setModified("")}
              className="text-rose-500 hover:underline"
            >
              Clear
            </button>
          </div>
          <textarea
            rows={8}
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder="Paste modified text..."
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Visual Diff Output */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Line-by-Line Comparison
        </h3>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden divide-y divide-slate-800">
          {Array.from({ length: maxLines }).map((_, idx) => {
            const lineO = origLines[idx] ?? "";
            const lineM = modLines[idx] ?? "";
            const isDiff = lineO !== lineM;

            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* Left side */}
                <div
                  className={`p-2.5 flex items-start space-x-2 ${
                    isDiff ? "bg-rose-950/40 text-rose-300" : "text-slate-400"
                  }`}
                >
                  <span className="text-[10px] text-slate-600 select-none w-6 shrink-0">{idx + 1}</span>
                  <span className="break-all">{lineO || <span className="text-slate-700">·</span>}</span>
                </div>

                {/* Right side */}
                <div
                  className={`p-2.5 flex items-start space-x-2 ${
                    isDiff ? "bg-emerald-950/40 text-emerald-300" : "text-slate-400"
                  }`}
                >
                  <span className="text-[10px] text-slate-600 select-none w-6 shrink-0">{idx + 1}</span>
                  <span className="break-all">{lineM || <span className="text-slate-700">·</span>}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
