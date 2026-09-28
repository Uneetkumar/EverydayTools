"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Copy, Check, Hash } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";

export default function UuidGenerator() {
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [removeHyphens, setRemoveHyphens] = useState<boolean>(false);
  const [wrapQuotes, setWrapQuotes] = useState<boolean>(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const generateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let u = crypto.randomUUID();
      if (uppercase) u = u.toUpperCase();
      if (removeHyphens) u = u.replace(/-/g, "");
      if (wrapQuotes) u = `"${u}"`;
      list.push(u);
    }
    setUuids(list);
  };

  useEffect(() => {
    // Deferred: generating synchronously inside the effect cascades renders.
    const id = setTimeout(generateUuids, 0);
    return () => clearTimeout(id);
    // generateUuids reads exactly these settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, uppercase, removeHyphens, wrapQuotes]);

  const copySingle = async (val: string, index: number) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
      setCopiedAll(true);
      markToolCompleted();
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-foreground">
            Quantity:
          </label>
          <select aria-label="Quantity"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value={1}>1 UUID</option>
            <option value={5}>5 UUIDs</option>
            <option value={10}>10 UUIDs</option>
            <option value={25}>25 UUIDs</option>
            <option value={50}>50 UUIDs</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>UPPERCASE</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeHyphens}
              onChange={(e) => setRemoveHyphens(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Remove Hyphens</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={wrapQuotes}
              onChange={(e) => setWrapQuotes(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Wrap in Quotes (&quot;)</span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={generateUuids}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
          <button
            onClick={copyAll}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs rounded-lg transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? "Copied All!" : "Copy All"}</span>
          </button>
        </div>
      </div>

      {/* UUID List Display */}
      <div className="space-y-2">
        {uuids.map((u, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition"
          >
            <span className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold truncate pr-2">
              {u}
            </span>
            <button
              onClick={() => copySingle(u, idx)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 transition shrink-0"
            >
              {copiedIndex === idx ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
