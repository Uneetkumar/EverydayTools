"use client";

import React, { useState, useEffect } from "react";
import ResultCard from "@/components/ResultCard";
import { Copy, Check, Clock, RefreshCw, Calendar } from "lucide-react";
import { toast } from "sonner";
import { markToolCompleted } from "@/lib/analytics";
import { toISODate } from "@/lib/utils/date";

/** "YYYY-MM-DDTHH:mm" in local time, as <input type="datetime-local"> expects. */
function toLocalDateTimeInput(d: Date): string {
  return `${toISODate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function UnixTimestampConverter() {
  // null until mounted: the page is prerendered, so reading the clock during
  // render would bake the build time into the HTML and mismatch on hydration.
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);
  const [inputEpoch, setInputEpoch] = useState<string>("");
  const [inputDate, setInputDate] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live ticking epoch clock; the first tick also seeds both inputs with "now".
  useEffect(() => {
    const now = Date.now();
    const seed = setTimeout(() => {
      setCurrentEpoch(Math.floor(now / 1000));
      setInputEpoch((v) => v || String(Math.floor(now / 1000)));
      setInputDate((v) => v || toLocalDateTimeInput(new Date(now)));
    }, 0);
    const timer = setInterval(() => setCurrentEpoch(Math.floor(Date.now() / 1000)), 1000);
    return () => {
      clearTimeout(seed);
      clearInterval(timer);
    };
  }, []);

  // Parse input epoch. Negative values are dates before 1970.
  const trimmed = inputEpoch.trim();
  const numEpoch = Number(trimmed);
  // Milliseconds if the magnitude is beyond ~5138 AD in seconds.
  const isMs = Math.abs(numEpoch) > 100000000000;
  const parsedDate = new Date(isMs ? numEpoch : numEpoch * 1000);
  const isValidDate = trimmed !== "" && Number.isFinite(numEpoch) && !isNaN(parsedDate.getTime());

  // Relative time calculation
  // Relative to the ticking clock state rather than Date.now(), so render
  // stays pure and the value updates every second.
  const getRelativeTime = (d: Date) => {
    if (currentEpoch === null) return "—";
    const diffSec = Math.round((d.getTime() - currentEpoch * 1000) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(diffSec, "second");
    if (abs < 3600) return rtf.format(Math.trunc(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.trunc(diffSec / 3600), "hour");
    if (abs < 86400 * 365) return rtf.format(Math.trunc(diffSec / 86400), "day");
    return rtf.format(Math.trunc(diffSec / (86400 * 365.25)), "year");
  };

  // Epoch → keep the date picker in step.
  const handleEpochChange = (val: string) => {
    setInputEpoch(val);
    const n = Number(val.trim());
    if (val.trim() !== "" && Number.isFinite(n)) {
      const d = new Date(Math.abs(n) > 100000000000 ? n : n * 1000);
      if (!isNaN(d.getTime())) setInputDate(toLocalDateTimeInput(d));
    }
  };

  // Date → epoch. datetime-local values are local time, which is how
  // new Date("YYYY-MM-DDTHH:mm") parses them.
  const handleDateChange = (val: string) => {
    setInputDate(val);
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      setInputEpoch(String(Math.floor(d.getTime() / 1000)));
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      markToolCompleted();
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Current Epoch Banner */}
      <div className="p-4 sm:p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 bg-muted/30">
        <div className="space-y-0.5">
          <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Current Unix Epoch Timestamp
          </span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono text-slate-900 dark:text-white">
            {currentEpoch ?? "—"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => currentEpoch !== null && handleEpochChange(String(currentEpoch))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            Use Current
          </button>
          <button
            onClick={() => currentEpoch !== null && handleCopy(String(currentEpoch), "live")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 transition-colors bg-muted/30"
          >
            {copiedKey === "live" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Converter Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-xl border bg-muted/30">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Convert Timestamp or Date
          </h2>

          {/* Timestamp Input */}
          <div className="space-y-1.5">
            <label htmlFor="epoch-input" className="text-sm font-medium text-foreground">
              Unix Epoch Timestamp (Seconds or Milliseconds)
            </label>
            <input
              id="epoch-input"
              type="number"
              value={inputEpoch}
              onChange={(e) => handleEpochChange(e.target.value)}
              placeholder="1741000000"
              className="w-full px-4 py-2.5 font-mono text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">— OR —</div>

          {/* Date Picker Input */}
          <div className="space-y-1.5">
            <label htmlFor="epoch-date-picker" className="text-sm font-medium text-foreground">
              Pick Human Date & Time (Local)
            </label>
            <input
              id="epoch-date-picker"
              type="datetime-local"
              value={inputDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-4 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        {/* Converted Output Breakdown */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Decoded Date & Formats
          </h3>

          {!isValidDate ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-600 font-medium">
              {trimmed === ""
                ? "Enter a Unix timestamp in seconds or milliseconds, or pick a date."
                : "That isn't a valid Unix timestamp. Use digits only, for example 1741000000."}
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
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{label}</span>
                    <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">{value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(value, key)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
                    aria-label={`Copy ${label}`}
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
