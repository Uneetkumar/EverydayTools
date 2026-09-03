"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Calculator, TrendingUp, DollarSign, Target, PieChart } from "lucide-react";

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = usePersistentState<string>("be_fixed", "50000");
  const [variableCostPerUnit, setVariableCostPerUnit] = usePersistentState<string>("be_var", "30");
  const [sellingPricePerUnit, setSellingPricePerUnit] = usePersistentState<string>("be_price", "80");
  const [expectedUnits, setExpectedUnits] = usePersistentState<string>("be_expected", "1500");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  const FC = Math.max(0, parseFloat(fixedCosts) || 0);
  const VC = Math.max(0, parseFloat(variableCostPerUnit) || 0);
  const P = Math.max(0, parseFloat(sellingPricePerUnit) || 0);
  const Q = Math.max(0, parseFloat(expectedUnits) || 0);

  // Contribution Margin per Unit = Price - Variable Cost
  const contributionMargin = Math.max(0, P - VC);
  const cmRatio = P > 0 ? (contributionMargin / P) * 100 : 0;

  // Break-Even Units = Fixed Costs / CM per unit
  const breakEvenUnits = contributionMargin > 0 ? Math.ceil(FC / contributionMargin) : 0;
  const breakEvenRevenue = breakEvenUnits * P;

  // Expected Volume Projections
  const totalRevenue = Q * P;
  const totalCost = FC + Q * VC;
  const netProfit = totalRevenue - totalCost;
  const isProfitable = netProfit >= 0;
  const roiPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Parameters */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Cost & Pricing Metrics
            </h2>
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              {["₹", "$", "€", "£"].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setCurrencySymbol(sym)}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    currencySymbol === sym
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Fixed Costs */}
          <div className="space-y-1.5">
            <label htmlFor="be-fixed-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total Fixed Costs (Rent, Salaries, Software)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="be-fixed-input"
                type="number"
                min="0"
                step="1000"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Variable Cost per Unit */}
            <div className="space-y-1.5">
              <label htmlFor="be-var-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Variable Cost / Unit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  id="be-var-input"
                  type="number"
                  min="0"
                  step="1"
                  value={variableCostPerUnit}
                  onChange={(e) => setVariableCostPerUnit(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="30"
                />
              </div>
            </div>

            {/* Selling Price per Unit */}
            <div className="space-y-1.5">
              <label htmlFor="be-price-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selling Price / Unit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  id="be-price-input"
                  type="number"
                  min="0"
                  step="1"
                  value={sellingPricePerUnit}
                  onChange={(e) => setSellingPricePerUnit(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="80"
                />
              </div>
            </div>
          </div>

          {/* Expected Sales Volume */}
          <div className="space-y-1.5">
            <label htmlFor="be-units-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Expected Sales Volume (Units)
            </label>
            <input
              id="be-units-input"
              type="number"
              min="0"
              step="50"
              value={expectedUnits}
              onChange={(e) => setExpectedUnits(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="1500"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Break-Even Target (Units to Sell)"
            value={`${formatNumber(breakEvenUnits)} Units`}
            subtitle={`Break-even Revenue: ${currencySymbol}${formatNumber(Math.round(breakEvenRevenue))} (${currencySymbol}${FC} Fixed Costs / ${currencySymbol}${contributionMargin} Unit Margin)`}
            highlightColor="emerald"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unit Contribution Margin</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {currencySymbol} {formatNumber(contributionMargin)}
              </p>
              <span className="text-[11px] text-slate-400">Margin Ratio: {cmRatio.toFixed(1)}%</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Projected Net Profit/Loss</span>
              <p className={`text-lg font-bold mt-1 ${isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {isProfitable ? "+" : ""}{currencySymbol} {formatNumber(Math.round(netProfit))}
              </p>
              <span className={`text-[11px] font-semibold ${isProfitable ? "text-emerald-500" : "text-rose-500"}`}>
                ROI: {roiPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Unit Target Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Sales vs Break-Even Target</span>
              <span>{Q >= breakEvenUnits ? "Target Reached 🎉" : `${breakEvenUnits - Q} more units needed`}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`transition-all duration-300 ${Q >= breakEvenUnits ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${breakEvenUnits > 0 ? Math.min(100, (Q / breakEvenUnits) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
