"use client";

import React from "react";
import ResultCard from "@/components/ResultCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { DollarSign, Percent, TrendingUp, Info } from "lucide-react";

export default function ProfitMarginCalculator() {
  const [calcMode, setCalcMode] = usePersistentState<"cost_revenue" | "cost_margin" | "cost_markup">("margin_mode", "cost_revenue");
  const [cost, setCost] = usePersistentState<string>("margin_cost", "60");
  const [revenue, setRevenue] = usePersistentState<string>("margin_revenue", "100");
  const [targetMargin, setTargetMargin] = usePersistentState<string>("margin_target_margin", "40");
  const [targetMarkup, setTargetMarkup] = usePersistentState<string>("margin_target_markup", "66.67");

  const numCost = parseFloat(cost) || 0;

  let calculatedRevenue = 0;
  let grossProfit = 0;
  let marginPct = 0;
  let markupPct = 0;
  let marginImpossible = false;

  if (calcMode === "cost_revenue") {
    calculatedRevenue = parseFloat(revenue) || 0;
    grossProfit = calculatedRevenue - numCost;
    marginPct = calculatedRevenue !== 0 ? (grossProfit / calculatedRevenue) * 100 : 0;
    markupPct = numCost !== 0 ? (grossProfit / numCost) * 100 : 0;
  } else if (calcMode === "cost_margin") {
    const marginRatio = (parseFloat(targetMargin) || 0) / 100;
    // A margin is a share of the selling price, so it can never reach 100%.
    marginImpossible = marginRatio >= 1;
    if (marginRatio < 1) {
      calculatedRevenue = numCost / (1 - marginRatio);
      grossProfit = calculatedRevenue - numCost;
      marginPct = parseFloat(targetMargin) || 0;
      markupPct = numCost !== 0 ? (grossProfit / numCost) * 100 : 0;
    }
  } else if (calcMode === "cost_markup") {
    const markupRatio = (parseFloat(targetMarkup) || 0) / 100;
    calculatedRevenue = numCost * (1 + markupRatio);
    grossProfit = calculatedRevenue - numCost;
    marginPct = calculatedRevenue !== 0 ? (grossProfit / calculatedRevenue) * 100 : 0;
    markupPct = parseFloat(targetMarkup) || 0;
  }

  const costPercentage = calculatedRevenue > 0 ? (numCost / calculatedRevenue) * 100 : 0;
  const profitPercentage = calculatedRevenue > 0 ? (grossProfit / calculatedRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 border rounded-lg bg-muted/60">
        <button
          onClick={() => setCalcMode("cost_revenue")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            calcMode === "cost_revenue"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Cost &amp; price
        </button>
        <button
          onClick={() => setCalcMode("cost_margin")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            calcMode === "cost_margin"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Target margin
        </button>
        <button
          onClick={() => setCalcMode("cost_markup")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            calcMode === "cost_markup"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Target markup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input Card */}
        <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Enter Financial Parameters
          </h3>

          <div>
            <label className="block text-sm mb-1.5 font-medium text-foreground">
              Cost of Goods / Service (COGS)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input aria-label="Cost (COGS)"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {calcMode === "cost_revenue" && (
            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Selling Price (Revenue)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input aria-label="Selling price"
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </div>
          )}

          {calcMode === "cost_margin" && (
            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Desired Profit Margin (%)
              </label>
              <div className="relative">
                <input aria-label="Target profit margin (%)"
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-8 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )}

          {calcMode === "cost_markup" && (
            <div>
              <label className="block text-sm mb-1.5 font-medium text-foreground">
                Desired Markup (%)
              </label>
              <div className="relative">
                <input aria-label="Target markup (%)"
                  type="number"
                  value={targetMarkup}
                  onChange={(e) => setTargetMarkup(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-8 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Industry standard margins</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Retail (50%)", val: "50" },
                { label: "SaaS (80%)", val: "80" },
                { label: "Grocery (15%)", val: "15" },
                { label: "Consulting (35%)", val: "35" },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setTargetMargin(p.val);
                    if (calcMode !== "cost_margin") setCalcMode("cost_margin");
                  }}
                  type="button"
                  className="h-7 rounded-full border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="space-y-4">
          <ResultCard
            title="Gross Profit Margin"
            value={marginImpossible ? "Not possible" : `${formatNumber(marginPct, 2)}%`}
            subtitle={
              marginImpossible
                ? "A margin is profit as a share of the selling price, so it must be below 100%. For a price more than double the cost, use markup instead."
                : `Gross Profit: ${formatCurrency(grossProfit)} on ${formatCurrency(calculatedRevenue)} revenue`
            }
            details={[
              { label: "Selling Price", value: formatCurrency(calculatedRevenue) },
              { label: "Cost (COGS)", value: formatCurrency(numCost) },
              { label: "Gross Profit", value: formatCurrency(grossProfit) },
              { label: "Markup %", value: `${formatNumber(markupPct, 2)}%` },
              { label: "Profit Multiplier", value: `${(numCost > 0 ? calculatedRevenue / numCost : 0).toFixed(2)}x` },
            ]}
            highlightColor={marginPct >= 30 ? "emerald" : marginPct > 0 ? "indigo" : "rose"}
          />

          {/* Visual Distribution Bar */}
          <div className="p-4 rounded-xl border space-y-2 bg-muted/30">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Cost: {costPercentage.toFixed(1)}%</span>
              <span className="text-emerald-600 dark:text-emerald-400">Profit: {profitPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-300"
                style={{ width: `${Math.min(Math.max(costPercentage, 0), 100)}%` }}
                title={`Cost: ${costPercentage.toFixed(1)}%`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(Math.max(profitPercentage, 0), 100)}%` }}
                title={`Profit: ${profitPercentage.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Margin vs Markup Conversion Cheat Sheet */}
      <section aria-labelledby="pm-table" className="space-y-3">
        <h3 id="pm-table" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Info className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Margin vs. markup
        </h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Margin</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Equivalent markup</th>
                <th scope="col" className="hidden px-3 py-2 text-left font-medium sm:table-cell">Margin</th>
                <th scope="col" className="hidden px-3 py-2 text-left font-medium sm:table-cell">Equivalent markup</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                [{ margin: "10%", markup: "11.1%" }, { margin: "40%", markup: "66.7%" }],
                [{ margin: "20%", markup: "25.0%" }, { margin: "50%", markup: "100.0%" }],
                [{ margin: "25%", markup: "33.3%" }, { margin: "60%", markup: "150.0%" }],
                [{ margin: "33.3%", markup: "50.0%" }, { margin: "75%", markup: "300.0%" }],
              ].map(([a, b]) => (
                <tr key={a.margin} className="text-foreground">
                  <td className="px-3 py-2">{a.margin}</td>
                  <td className="px-3 py-2">{a.markup}</td>
                  <td className="hidden px-3 py-2 sm:table-cell">{b.margin}</td>
                  <td className="hidden px-3 py-2 sm:table-cell">{b.markup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
