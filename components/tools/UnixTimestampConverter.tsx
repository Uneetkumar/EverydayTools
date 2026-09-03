"use client";

import React, { useState, useEffect } from "react";
import ResultCard from "@/components/ResultCard";
import { Copy, Check, Clock, RefreshCw, Calendar } from "lucide-react";

export default function UnixTimestampConverter() {
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [inputEpoch, setInputEpoch] = useState<string>(String(Math.floor(Date.now() / 1000)));
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live ticking epoch clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Parse input epoch
  const numEpoch = parseFloat(inputEpoch) || 0;
  // Detect if seconds or milliseconds (milliseconds if > 1e11)
  const isMs = numEpoch > 100000000000;
  const parsedDate = new Date(isMs ? numEpoch : numEpoch * 1000);
  const isValidDate = !isNaN(parsedDate.getTime()) && numEpoch > 0;

  // Relative time calculation
  const getRelativeTime = (d: Date) => {
    const diffSec = Math.floor((d.getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
    if (Math.abs(diffSec) < 3600) return rtf.format(Math.floor(diffSec / 60), "minute");
    if (Math.abs(diffSec) < 86400) return rtf.format(Math.floor(diffSec / 3600), "hour");
    return rtf.format(Math.floor(diffSec / 86400), "day");
  };

  // Date to epoch reverse conversion
  const handleDateChange = (val: string) => {
    setInputDate(val);
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      setInputEpoch(String(Math.floor(d.getTime() / 1000)));
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Live Current Epoch Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Current Unix Epoch Timestamp
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {currentEpoch}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputEpoch(String(currentEpoch))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Use Current
          </button>
          <button
            onClick={() => handleCopy(String(currentEpoch), "live")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copiedKey === "live" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Converter Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Convert Timestamp or Date
          </h2>

          {/* Timestamp Input */}
          <div className="space-y-1.5">
            <label htmlFor="epoch-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Unix Epoch Timestamp (Seconds or Milliseconds)
            </label>
            <input
              id="epoch-input"
              type="number"
              value={inputEpoch}
              onChange={(e) => setInputEpoch(e.target.value)}
              placeholder="1741000000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="text-center text-xs font-semibold text-slate-400">— OR —</div>

          {/* Date Picker Input */}
          <div className="space-y-1.5">
            <label htmlFor="epoch-date-picker" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pick Human Date & Time (Local)
            </label>
            <input
              id="epoch-date-picker"
              type="datetime-local"
              value={inputDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Converted Output Breakdown */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Decoded Date & Formats
          </h3>

          {!isValidDate ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-600 font-medium">
              Invalid epoch timestamp entered. Please provide a valid Unix timestamp.
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                { key: "utc", label: "UTC / GMT String", value: parsedDate.toUTCString() },
                { key: "iso", label: "ISO 8601 String", value: parsedDate.toISOString() },
                { key: "local", label: "Your Local Time", value: parsedDate.toLocaleString() },
                { key: "relative", label: "Relative Time", value: getRelativeTime(parsedDate) },
                { key: "sec", label: "Epoch Seconds", value: String(Math.floor(parsedDate.getTime() / 1000)) },
                { key: "ms", label: "Epoch Milliseconds", value: String(parsedDate.getTime()) },
              ].map(({ key, label, value }) => (
                <div
                  key={key}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">{label}</span>
                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">{value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(value, key)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
                    title="Copy"
                  >
                    {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
