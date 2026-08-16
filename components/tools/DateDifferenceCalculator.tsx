"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { Calendar, Clock, Plus, Minus, ArrowRight } from "lucide-react";

export default function DateDifferenceCalculator() {
  const [mode, setMode] = useState<"between" | "add_subtract">("between");

  // Mode 1: Between two dates
  const todayStr = new Date().toISOString().split("T")[0];
  const nextMonthDate = new Date();
  nextMonthDate.setDate(nextMonthDate.getDate() + 30);
  const nextMonthStr = nextMonthDate.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(nextMonthStr);
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(false);

  // Mode 2: Add / Subtract
  const [baseDate, setBaseDate] = useState<string>(todayStr);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState<string>("30");
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  // Calculations for Mode 1
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);

  const diffTime = d2.getTime() - d1.getTime();
  let totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (includeEndDate && totalDays >= 0) totalDays += 1;

  // Calculate business days
  let businessDays = 0;
  if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
    const cur = new Date(Math.min(d1.getTime(), d2.getTime()));
    const target = new Date(Math.max(d1.getTime(), d2.getTime()));
    while (cur <= target) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  const weeks = Math.floor(Math.abs(totalDays) / 7);
  const remainingDaysInWeek = Math.abs(totalDays) % 7;
  const approxMonths = (Math.abs(totalDays) / 30.4375).toFixed(1);

  // Calculations for Mode 2
  const calcBase = new Date(baseDate);
  const numAmount = parseInt(amount, 10) || 0;
  const factor = operation === "add" ? 1 : -1;

  if (!isNaN(calcBase.getTime())) {
    if (unit === "days") calcBase.setDate(calcBase.getDate() + numAmount * factor);
    else if (unit === "weeks") calcBase.setDate(calcBase.getDate() + numAmount * 7 * factor);
    else if (unit === "months") calcBase.setMonth(calcBase.getMonth() + numAmount * factor);
    else if (unit === "years") calcBase.setFullYear(calcBase.getFullYear() + numAmount * factor);
  }

  const formattedTargetDate = !isNaN(calcBase.getTime())
    ? calcBase.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Invalid Date";

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMode("between")}
          className={`flex-1 min-w-[150px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === "between"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Days Between Two Dates
        </button>
        <button
          onClick={() => setMode("add_subtract")}
          className={`flex-1 min-w-[150px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === "add_subtract"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Add / Subtract from Date
        </button>
      </div>

      {mode === "between" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Select Start & End Dates
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeEndDate}
                onChange={(e) => setIncludeEndDate(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include end date in calculation (+1 day)</span>
            </label>

            {/* Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Common Horizons:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + 30);
                    setEndDate(d.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition"
                >
                  +30 Days
                </button>
                <button
                  onClick={() => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + 90);
                    setEndDate(d.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition"
                >
                  +90 Days (Quarter)
                </button>
                <button
                  onClick={() => {
                    const year = new Date().getFullYear();
                    setEndDate(`${year}-12-31`);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition"
                >
                  End of Year
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Duration"
              value={formatNumber(Math.abs(totalDays), 0)}
              unit="Days"
              subtitle={`Equivalent to ${weeks} weeks and ${remainingDaysInWeek} days (~${approxMonths} months)`}
              details={[
                { label: "Working / Business Days", value: `${businessDays} days` },
                { label: "Weekend Days", value: `${Math.max(0, Math.abs(totalDays) - businessDays)} days` },
                { label: "Hours", value: `${formatNumber(Math.abs(totalDays) * 24, 0)} hrs` },
              ]}
              highlightColor="indigo"
              showConfetti={true}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Add or Subtract Time
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Starting Date
              </label>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Operation
                </label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as "add" | "subtract")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="add">+ Add</option>
                  <option value="subtract">- Subtract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Time Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as "days" | "weeks" | "months" | "years")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Calculated Date"
              value={formattedTargetDate}
              subtitle={`${operation === "add" ? "Added" : "Subtracted"} ${amount} ${unit} from ${baseDate}`}
              details={[
                { label: "Day of Week", value: !isNaN(calcBase.getTime()) ? calcBase.toLocaleDateString("en-US", { weekday: "long" }) : "" },
                { label: "ISO Format", value: !isNaN(calcBase.getTime()) ? calcBase.toISOString().split("T")[0] : "" },
                { label: "Day of Year", value: !isNaN(calcBase.getTime()) ? Math.ceil((calcBase.getTime() - new Date(calcBase.getFullYear(), 0, 1).getTime()) / 86400000) : "" },
              ]}
              highlightColor="emerald"
            />
          </div>
        </div>
      )}
    </div>
  );
}
