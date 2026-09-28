"use client";

import React from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Percent, ArrowRightLeft, Sparkles, RefreshCw } from "lucide-react";

export default function PercentageCalculator() {
  const [tab, setTab] = usePersistentState<"percentage_of" | "what_percent" | "change" | "difference">("pct_tab", "percentage_of");

  // Tab 1: What is X% of Y
  const [x1, setX1] = usePersistentState<string>("pct_x1", "15");
  const [y1, setY1] = usePersistentState<string>("pct_y1", "200");

  // Tab 2: X is what % of Y
  const [x2, setX2] = usePersistentState<string>("pct_x2", "30");
  const [y2, setY2] = usePersistentState<string>("pct_y2", "150");

  // Tab 3: Percent Change from X to Y
  const [x3, setX3] = usePersistentState<string>("pct_x3", "50");
  const [y3, setY3] = usePersistentState<string>("pct_y3", "75");

  // Tab 4: Percent Difference between X and Y
  const [x4, setX4] = usePersistentState<string>("pct_x4", "80");
  const [y4, setY4] = usePersistentState<string>("pct_y4", "100");

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
      <div className="flex flex-wrap gap-2 p-1.5 border rounded-lg bg-muted/60">
        <button
          onClick={() => setTab("percentage_of")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "percentage_of"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          X% of Y
        </button>
        <button
          onClick={() => setTab("what_percent")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "what_percent"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          X is What % of Y
        </button>
        <button
          onClick={() => setTab("change")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "change"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          % Increase / Decrease
        </button>
        <button
          onClick={() => setTab("difference")}
          className={`flex-1 min-w-[130px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            tab === "difference"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          % Difference
        </button>
      </div>

      {/* Tab 1: What is X% of Y */}
      {tab === "percentage_of" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              What is X% of Y?
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Percentage (X %)
                </label>
                <div className="relative">
                  <input aria-label="Percentage (X%)"
                    type="number"
                    value={x1}
                    onChange={(e) => setX1(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-8 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Total Value (Y)
                </label>
                <input aria-label="Total value (Y)"
                  type="number"
                  value={y1}
                  onChange={(e) => setY1(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>

            {/* Quick Percent Presets */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Quick presets</span>
              <div className="flex flex-wrap gap-1.5">
                {["5", "10", "15", "20", "25", "50", "75"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setX1(p)}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition"
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
            />

            <div className="p-4 rounded-xl border text-xs text-slate-500 space-y-1 bg-muted/30">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation step</div>
              <div className="font-mono text-blue-600 dark:text-blue-400">
                ({numX1} ÷ 100) × {numY1} = {(numX1 / 100).toFixed(4)} × {numY1} = {formatNumber(result1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: X is What % of Y */}
      {tab === "what_percent" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              X is what percent of Y?
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Part Value (X)
                </label>
                <input aria-label="Part value (X)"
                  type="number"
                  value={x2}
                  onChange={(e) => setX2(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Whole Value (Y)
                </label>
                <input aria-label="Whole value (Y)"
                  type="number"
                  value={y2}
                  onChange={(e) => setY2(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Percentage Result"
              value={numY2 === 0 ? "Undefined" : `${formatNumber(result2, 2)}%`}
              subtitle={
                numY2 === 0
                  ? "A percentage of zero is undefined: enter a whole (Y) other than 0."
                  : `${formatNumber(numX2)} is ${formatNumber(result2, 2)}% of ${formatNumber(numY2)}`
              }
              details={[
                { label: "Part (Numerator)", value: formatNumber(numX2) },
                { label: "Whole (Denominator)", value: formatNumber(numY2) },
                { label: "Decimal Ratio", value: (numY2 !== 0 ? numX2 / numY2 : 0).toFixed(4) },
              ]}
              highlightColor="emerald"
            />

            <div className="p-4 rounded-xl border text-xs text-slate-500 space-y-1 bg-muted/30">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation step</div>
              <div className="font-mono text-foreground">
                ({numX2} ÷ {numY2}) × 100 = {formatNumber(result2, 2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: % Increase / Decrease */}
      {tab === "change" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Percentage Increase / Decrease
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Original Value (From)
                </label>
                <input aria-label="Original value (from)"
                  type="number"
                  value={x3}
                  onChange={(e) => setX3(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  New Value (To)
                </label>
                <input aria-label="New value (to)"
                  type="number"
                  value={y3}
                  onChange={(e) => setY3(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title={isIncrease ? "Percentage Increase" : "Percentage Decrease"}
              value={numX3 === 0 ? "Undefined" : `${isIncrease ? "+" : ""}${formatNumber(result3, 2)}%`}
              subtitle={
                numX3 === 0
                  ? "A percentage change from zero is undefined: every increase from 0 is infinitely large. Compare the absolute difference instead."
                  : `Change from ${formatNumber(numX3)} to ${formatNumber(numY3)} is ${isIncrease ? "an increase" : "a decrease"} of ${formatNumber(Math.abs(result3), 2)}%`
              }
              details={[
                { label: "Absolute Difference", value: `${changeDiff >= 0 ? "+" : ""}${formatNumber(changeDiff)}` },
                { label: "Original Value", value: formatNumber(numX3) },
                { label: "New Value", value: formatNumber(numY3) },
              ]}
              highlightColor={isIncrease ? "emerald" : "rose"}
            />

            <div className="p-4 rounded-xl border text-xs text-slate-500 space-y-1 bg-muted/30">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation step</div>
              <div className="font-mono text-blue-600 dark:text-blue-400">
                (({numY3} - {numX3}) ÷ {numX3}) × 100 = ({changeDiff} ÷ {numX3}) × 100 = {formatNumber(result3, 2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Percentage Difference */}
      {tab === "difference" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Percentage Difference Between Two Numbers
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Value A
                </label>
                <input aria-label="Value A"
                  type="number"
                  value={x4}
                  onChange={(e) => setX4(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium text-foreground">
                  Value B
                </label>
                <input aria-label="Value B"
                  type="number"
                  value={y4}
                  onChange={(e) => setY4(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

            <div className="p-4 rounded-xl border text-xs text-slate-500 space-y-1 bg-muted/30">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Calculation step</div>
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
