"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Clock, Calendar, Sparkles, BookOpen } from "lucide-react";

const CRON_PRESETS = [
  { label: "Every Minute", cron: "* * * * *" },
  { label: "Every 5 Minutes", cron: "*/5 * * * *" },
  { label: "Every Hour at :00", cron: "0 * * * *" },
  { label: "Every Day at Midnight (00:00)", cron: "0 0 * * *" },
  { label: "Every Day at 9:00 AM", cron: "0 9 * * *" },
  { label: "Every Monday at 9:00 AM", cron: "0 9 * * 1" },
  { label: "1st Day of Every Month at Midnight", cron: "0 0 1 * *" },
  { label: "Every Weekday (Mon-Fri) at 8:00 AM", cron: "0 8 * * 1-5" },
];

function explainCronPart(part: string, type: "minute" | "hour" | "dom" | "month" | "dow"): string {
  if (part === "*") return `every ${type === "dom" ? "day of month" : type === "dow" ? "day of week" : type}`;
  if (part.startsWith("*/")) {
    const step = part.replace("*/", "");
    return `every ${step} ${type}s`;
  }
  if (part.includes(",")) {
    return `at ${type}s: ${part}`;
  }
  if (part.includes("-")) {
    return `between ${type}s ${part}`;
  }
  if (type === "dow") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = parseInt(part, 10);
    return days[d] || `day #${part}`;
  }
  if (type === "month") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(part, 10);
    return months[m - 1] || `month #${part}`;
  }
  return `at ${type} ${part}`;
}

function explainFullCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return "Please enter a valid 5-part cron expression (e.g. 0 9 * * 1).";

  const [minute, hour, dom, month, dow] = parts;

  // Human readable sentence construction
  let desc = "Runs ";

  if (minute === "*" && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return "Runs every single minute, every hour, every day.";
  }

  if (minute.startsWith("*/") && hour === "*") {
    desc += `every ${minute.replace("*/", "")} minutes`;
  } else if (minute === "0" && hour === "*") {
    desc += "at the start of every hour";
  } else if (minute === "0" && hour !== "*" && !hour.includes(",") && !hour.includes("-") && !hour.startsWith("*/")) {
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    desc += `daily at ${h12}:00 ${ampm}`;
  } else if (minute !== "*" && hour !== "*") {
    desc += `at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  } else {
    desc += `${explainCronPart(minute, "minute")}, ${explainCronPart(hour, "hour")}`;
  }

  if (dom !== "*") {
    desc += `, on day ${dom} of the month`;
  }

  if (month !== "*") {
    desc += `, in ${explainCronPart(month, "month")}`;
  }

  if (dow !== "*") {
    if (dow === "1-5") {
      desc += ", Monday through Friday (weekdays)";
    } else if (dow === "0,6" || dow === "6,0") {
      desc += ", on weekends (Saturday & Sunday)";
    } else {
      desc += `, only on ${explainCronPart(dow, "dow")}`;
    }
  }

  return desc + ".";
}

export default function CronExplainer() {
  const [cron, setCron] = useState<string>("0 9 * * 1-5");
  const [copied, setCopied] = useState<boolean>(false);

  const parts = cron.trim().split(/\s+/);
  const isValid = parts.length === 5;
  const explanation = useMemo(() => explainFullCron(cron), [cron]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cron);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cron Expression Input & Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="cron-input" className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Cron Schedule Expression
          </label>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Cron"}
          </button>
        </div>

        <input
          id="cron-input"
          type="text"
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="0 9 * * 1-5"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-lg font-bold text-slate-900 dark:text-white text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        {/* 5-Field Breakdown Badges */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Minute", val: parts[0] || "*", range: "0-59" },
            { label: "Hour", val: parts[1] || "*", range: "0-23" },
            { label: "Day of Month", val: parts[2] || "*", range: "1-31" },
            { label: "Month", val: parts[3] || "*", range: "1-12" },
            { label: "Day of Week", val: parts[4] || "*", range: "0-6 (Sun=0)" },
          ].map((field, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5"
            >
              <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{field.val}</span>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{field.label}</p>
              <span className="text-[10px] text-slate-400 font-mono">{field.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Human Explanation Output Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Plain English Schedule Explanation
        </span>
        <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
          &ldquo;{explanation}&rdquo;
        </p>
      </div>

      {/* Common Presets Selector */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Common Schedule Presets
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {CRON_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setCron(p.cron)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all group"
            >
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {p.label}
              </span>
              <code className="text-[11px] font-mono text-slate-400 font-bold mt-1 block">{p.cron}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
