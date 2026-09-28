"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { addDays, addMonths, daysBetween, parseISODate, toISODate, useTodayISO } from "@/lib/utils/date";
import { Calendar, Clock, Plus, Minus, ArrowRight } from "lucide-react";

export default function DateDifferenceCalculator() {
  const [mode, setMode] = useState<"between" | "add_subtract">("between");

  // Mode 1: Between two dates. Empty (null) means "today" / "today + 30",
  // resolved after mount so the prerendered page does not carry the build date.
  const today = useTodayISO();
  const todayDate = parseISODate(today);
  const [startOverride, setStartDate] = useState<string | null>(null);
  const [endOverride, setEndDate] = useState<string | null>(null);
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(false);
  const startDate = startOverride ?? today;
  const endDate = endOverride ?? (todayDate ? toISODate(addDays(todayDate, 30)) : "");

  // Mode 2: Add / Subtract
  const [baseOverride, setBaseDate] = useState<string | null>(null);
  const baseDate = baseOverride ?? today;
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState<string>("30");
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  // Calculations for Mode 1
  const d1 = parseISODate(startDate);
  const d2 = parseISODate(endDate);

  let totalDays = d1 && d2 ? daysBetween(d1, d2) : 0;
  if (includeEndDate && d1 && d2) totalDays += totalDays >= 0 ? 1 : -1;

  // Business days (Monday–Friday) in the range, both ends included.
  let businessDays = 0;
  if (d1 && d2) {
    let cur = d1 < d2 ? d1 : d2;
    const target = d1 < d2 ? d2 : d1;
    while (cur <= target) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
      cur = addDays(cur, 1);
    }
  }

  const weeks = Math.floor(Math.abs(totalDays) / 7);
  const remainingDaysInWeek = Math.abs(totalDays) % 7;
  const approxMonths = (Math.abs(totalDays) / 30.4375).toFixed(1);

  // Calculations for Mode 2
  const base = parseISODate(baseDate);
  const numAmount = parseInt(amount, 10) || 0;
  const factor = operation === "add" ? 1 : -1;
  const calcBase: Date | null = !base
    ? null
    : unit === "days"
      ? addDays(base, numAmount * factor)
      : unit === "weeks"
        ? addDays(base, numAmount * 7 * factor)
        : unit === "months"
          ? addMonths(base, numAmount * factor)
          : addMonths(base, numAmount * 12 * factor);

  const formattedTargetDate = calcBase
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
      <div className="flex flex-wrap gap-2 p-1.5 border rounded-lg bg-muted/60">
        <button
          onClick={() => setMode("between")}
          className={`flex-1 min-w-[150px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === "between"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Days Between Two Dates
        </button>
        <button
          onClick={() => setMode("add_subtract")}
          className={`flex-1 min-w-[150px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === "add_subtract"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Add / Subtract from Date
        </button>
      </div>

      {mode === "between" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Select Start & End Dates
            </h3>

            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Start Date
              </label>
              <input aria-label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                End Date
              </label>
              <input aria-label="End date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <label className="flex items-center space-x-2 text-sm cursor-pointer pt-1 font-medium text-foreground">
              <input
                type="checkbox"
                checked={includeEndDate}
                onChange={(e) => setIncludeEndDate(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include end date in calculation (+1 day)</span>
            </label>

            {/* Presets */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Common horizons</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (d1) setEndDate(toISODate(addDays(d1, 30)));
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition"
                >
                  +30 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (d1) setEndDate(toISODate(addDays(d1, 90)));
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition"
                >
                  +90 Days (Quarter)
                </button>
                <button
                  onClick={() => {
                    const year = new Date().getFullYear();
                    setEndDate(`${year}-12-31`);
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition"
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
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Add or Subtract Time
            </h3>

            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Starting Date
              </label>
              <input aria-label="Starting date"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Operation
                </label>
                <select aria-label="Add or subtract"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as "add" | "subtract")}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="add">+ Add</option>
                  <option value="subtract">- Subtract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Quantity
                </label>
                <input aria-label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Time Unit
              </label>
              <select aria-label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as "days" | "weeks" | "months" | "years")}
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                { label: "Day of Week", value: calcBase ? calcBase.toLocaleDateString("en-US", { weekday: "long" }) : "—" },
                { label: "ISO Format", value: calcBase ? toISODate(calcBase) : "—" },
                { label: "Day of Year", value: calcBase ? daysBetween(new Date(calcBase.getFullYear(), 0, 1), calcBase) + 1 : "—" },
              ]}
              highlightColor="emerald"
            />
          </div>
        </div>
      )}
    </div>
  );
}
