"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { Percent, ArrowRightLeft, Sparkles, RefreshCw } from "lucide-react";

export default function PercentageCalculator() {
  const [tab, setTab] = useState<"percentage_of" | "what_percent" | "change" | "difference">("percentage_of");

  // Tab 1: What is X% of Y
  const [x1, setX1] = useState<string>("15");
  const [y1, setY1] = useState<string>("200");

  // Tab 2: X is what % of Y
  const [x2, setX2] = useState<string>("30");
  const [y2, setY2] = useState<string>("150");

  // Tab 3: Percent Change from X to Y
  const [x3, setX3] = useState<string>("50");
  const [y3, setY3] = useState<string>("75");

  // Tab 4: Percent Difference between X and Y
  const [x4, setX4] = useState<string>("80");
  const [y4, setY4] = useState<string>("100");

  // Calculations
  const numX1 = parseFloat(x1) || 0;
  const numY1 = parseFloat(y1) || 0;
  const result1 = (numX1 / 100) * numY1;

  const numX2 = parseFloat(x2) || 0;
  const numY2 = parseFloat(y2) || 0;
  const result2 = numY2 !== 0 ? (numX2 / numY2) * 100 : 0;

  const numX3 = parseFloat(x3) || 0;
  const numY3 = parseFloat(y3) || 0;
  const changeDiff = numY3 - numX3;
  const result3 = numX3 !== 0 ? (changeDiff / Math.abs(numX3)) * 100 : 0;
  const isIncrease = changeDiff >= 0;

  const numX4 = parseFloat(x4) || 0;
  const numY4 = parseFloat(y4) || 0;
  const avg4 = (numX4 + numY4) / 2;
  const result4 = avg4 !== 0 ? (Math.abs(numX4 - numY4) / avg4) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("percentage_of")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "percentage_of"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          X% of Y
        </button>
        <button
          onClick={() => setTab("what_percent")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "what_percent"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          X is What % of Y
        </button>
        <button
          onClick={() => setTab("change")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "change"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          % Increase / Decrease
        </button>
        <button
          onClick={() => setTab("difference")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "difference"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          % Difference
        </button>
      </div>

      {/* Tab 1: What is X% of Y */}
      {tab === "percentage_of" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              What is X% of Y?
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Percentage (X %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={x1}
                    onChange={(e) => setX1(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Value (Y)
                </label>
                <input
                  type="number"
                  value={y1}
                  onChange={(e) => setY1(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick Percent Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {["5", "10", "15", "20", "25", "50", "75"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setX1(p)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Answer"
              value={formatNumber(result1)}
              subtitle={`${numX1}% of ${formatNumber(numY1)} is equal to ${formatNumber(result1)}`}
              details={[
                { label: "Original Value", value: formatNumber(numY1) },
                { label: "Percentage", value: `${numX1}%` },
                { label: "Remaining", value: formatNumber(numY1 - result1) },
              ]}
              highlightColor="indigo"
              showConfetti={true}
            />

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation Step:</div>
              <div className="font-mono text-indigo-600 dark:text-indigo-400">
                ({numX1} ÷ 100) × {numY1} = {(numX1 / 100).toFixed(4)} × {numY1} = {formatNumber(result1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: X is What % of Y */}
      {tab === "what_percent" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              X is what percent of Y?
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Part Value (X)
                </label>
                <input
                  type="number"
                  value={x2}
                  onChange={(e) => setX2(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Whole Value (Y)
                </label>
                <input
                  type="number"
                  value={y2}
                  onChange={(e) => setY2(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Percentage Result"
              value={`${formatNumber(result2, 2)}%`}
              subtitle={`${formatNumber(numX2)} is ${formatNumber(result2, 2)}% of ${formatNumber(numY2)}`}
              details={[
                { label: "Part (Numerator)", value: formatNumber(numX2) },
                { label: "Whole (Denominator)", value: formatNumber(numY2) },
                { label: "Decimal Ratio", value: (numY2 !== 0 ? numX2 / numY2 : 0).toFixed(4) },
              ]}
              highlightColor="emerald"
            />

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation Step:</div>
              <div className="font-mono text-emerald-600 dark:text-emerald-400">
                ({numX2} ÷ {numY2}) × 100 = {formatNumber(result2, 2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: % Increase / Decrease */}
      {tab === "change" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Percentage Increase / Decrease
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Original Value (From)
                </label>
                <input
                  type="number"
                  value={x3}
                  onChange={(e) => setX3(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  New Value (To)
                </label>
                <input
                  type="number"
                  value={y3}
                  onChange={(e) => setY3(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title={isIncrease ? "Percentage Increase" : "Percentage Decrease"}
              value={`${isIncrease ? "+" : ""}${formatNumber(result3, 2)}%`}
              subtitle={`Change from ${formatNumber(numX3)} to ${formatNumber(numY3)} is an ${isIncrease ? "increase" : "decrease"} of ${formatNumber(Math.abs(result3), 2)}%`}
              details={[
                { label: "Absolute Difference", value: `${changeDiff >= 0 ? "+" : ""}${formatNumber(changeDiff)}` },
                { label: "Original Value", value: formatNumber(numX3) },
                { label: "New Value", value: formatNumber(numY3) },
              ]}
              highlightColor={isIncrease ? "emerald" : "rose"}
            />

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation Step:</div>
              <div className="font-mono text-indigo-600 dark:text-indigo-400">
                (({numY3} - {numX3}) ÷ {numX3}) × 100 = ({changeDiff} ÷ {numX3}) × 100 = {formatNumber(result3, 2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Percentage Difference */}
      {tab === "difference" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Percentage Difference Between Two Numbers
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Value A
                </label>
                <input
                  type="number"
                  value={x4}
                  onChange={(e) => setX4(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Value B
                </label>
                <input
                  type="number"
                  value={y4}
                  onChange={(e) => setY4(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Percentage Difference"
              value={`${formatNumber(result4, 2)}%`}
              subtitle={`Difference between ${formatNumber(numX4)} and ${formatNumber(numY4)} relative to their average (${formatNumber(avg4)})`}
              details={[
                { label: "Absolute Difference", value: formatNumber(Math.abs(numX4 - numY4)) },
                { label: "Average Value", value: formatNumber(avg4) },
                { label: "Ratio", value: (avg4 !== 0 ? Math.abs(numX4 - numY4) / avg4 : 0).toFixed(4) },
              ]}
              highlightColor="amber"
            />

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation Step:</div>
              <div className="font-mono text-amber-600 dark:text-amber-400">
                (|{numX4} - {numY4}| ÷ (({numX4} + {numY4}) ÷ 2)) × 100 = {formatNumber(result4, 2)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
