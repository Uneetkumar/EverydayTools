"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, Percent, TrendingUp, Info } from "lucide-react";

export default function ProfitMarginCalculator() {
  const [calcMode, setCalcMode] = useState<"cost_revenue" | "cost_margin" | "cost_markup">("cost_revenue");
  const [cost, setCost] = useState<string>("60");
  const [revenue, setRevenue] = useState<string>("100");
  const [targetMargin, setTargetMargin] = useState<string>("40");
  const [targetMarkup, setTargetMarkup] = useState<string>("66.67");

  const numCost = parseFloat(cost) || 0;

  let calculatedRevenue = 0;
  let grossProfit = 0;
  let marginPct = 0;
  let markupPct = 0;

  if (calcMode === "cost_revenue") {
    calculatedRevenue = parseFloat(revenue) || 0;
    grossProfit = calculatedRevenue - numCost;
    marginPct = calculatedRevenue !== 0 ? (grossProfit / calculatedRevenue) * 100 : 0;
    markupPct = numCost !== 0 ? (grossProfit / numCost) * 100 : 0;
  } else if (calcMode === "cost_margin") {
    const marginRatio = (parseFloat(targetMargin) || 0) / 100;
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
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCalcMode("cost_revenue")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            calcMode === "cost_revenue"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white"
          }`}
        >
          Cost & Selling Price
        </button>
        <button
          onClick={() => setCalcMode("cost_margin")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            calcMode === "cost_margin"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white"
          }`}
        >
          Cost & Target Margin %
        </button>
        <button
          onClick={() => setCalcMode("cost_markup")}
          className={`flex-1 min-w-[140px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            calcMode === "cost_markup"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white"
          }`}
        >
          Cost & Target Markup %
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input Card */}
        <div className="space-y-4 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Enter Financial Parameters
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Cost of Goods / Service (COGS)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {calcMode === "cost_revenue" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Selling Price (Revenue)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {calcMode === "cost_margin" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Desired Profit Margin (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          )}

          {calcMode === "cost_markup" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Desired Markup (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetMarkup}
                  onChange={(e) => setTargetMarkup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Industry Standard Margins:</span>
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
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition"
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
            value={`${formatNumber(marginPct, 2)}%`}
            subtitle={`Gross Profit: ${formatCurrency(grossProfit)} on ${formatCurrency(calculatedRevenue)} revenue`}
            details={[
              { label: "Selling Price", value: formatCurrency(calculatedRevenue) },
              { label: "Cost (COGS)", value: formatCurrency(numCost) },
              { label: "Gross Profit", value: formatCurrency(grossProfit) },
              { label: "Markup %", value: `${formatNumber(markupPct, 2)}%` },
              { label: "Profit Multiplier", value: `${(numCost > 0 ? calculatedRevenue / numCost : 0).toFixed(2)}x` },
            ]}
            highlightColor={marginPct >= 30 ? "emerald" : marginPct > 0 ? "indigo" : "rose"}
            showConfetti={marginPct >= 40}
          />

          {/* Visual Distribution Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
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
      <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          Margin vs. Markup Conversion Table
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { margin: "10%", markup: "11.1%" },
            { margin: "20%", markup: "25.0%" },
            { margin: "25%", markup: "33.3%" },
            { margin: "33.3%", markup: "50.0%" },
            { margin: "40%", markup: "66.7%" },
            { margin: "50%", markup: "100.0%" },
            { margin: "60%", markup: "150.0%" },
            { margin: "75%", markup: "300.0%" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex justify-between"
            >
              <span className="text-slate-500">Margin: <strong className="text-slate-900 dark:text-white">{item.margin}</strong></span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{item.markup}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
