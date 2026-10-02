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
  const cannotBreakEven = P <= VC && FC > 0;

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
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              Cost & Pricing Metrics
            </h2>
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              {["₹", "$", "€", "£"].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setCurrencySymbol(sym)}
                  className={`h-7 min-w-7 px-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all ${
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
            <label htmlFor="be-fixed-input" className="text-sm font-medium text-foreground">
              Total Fixed Costs (Rent, Salaries, Software)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="be-fixed-input"
                type="number"
                min="0"
                step="1000"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Variable Cost per Unit */}
            <div className="space-y-1.5">
              <label htmlFor="be-var-input" className="text-sm font-medium text-foreground">
                Variable Cost / Unit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  id="be-var-input"
                  type="number"
                  min="0"
                  step="1"
                  value={variableCostPerUnit}
                  onChange={(e) => setVariableCostPerUnit(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="30"
                />
              </div>
            </div>

            {/* Selling Price per Unit */}
            <div className="space-y-1.5">
              <label htmlFor="be-price-input" className="text-sm font-medium text-foreground">
                Selling Price / Unit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  id="be-price-input"
                  type="number"
                  min="0"
                  step="1"
                  value={sellingPricePerUnit}
                  onChange={(e) => setSellingPricePerUnit(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="80"
                />
              </div>
            </div>
          </div>

          {/* Expected Sales Volume */}
          <div className="space-y-1.5">
            <label htmlFor="be-units-input" className="text-sm font-medium text-foreground">
              Expected Sales Volume (Units)
            </label>
            <input
              id="be-units-input"
              type="number"
              min="0"
              step="50"
              value={expectedUnits}
              onChange={(e) => setExpectedUnits(e.target.value)}
              className="w-full px-4 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="1500"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Break-even point (units to sell)"
            value={cannotBreakEven ? "Not reachable" : `${formatNumber(breakEvenUnits, 0)} units`}
            subtitle={
              cannotBreakEven
                ? "Each sale loses money or makes nothing: the selling price must be higher than the variable cost per unit before fixed costs can ever be covered."
                : `Break-even revenue: ${currencySymbol}${formatNumber(Math.round(breakEvenRevenue), 0)} (${currencySymbol}${formatNumber(FC, 2)} fixed costs ÷ ${currencySymbol}${formatNumber(contributionMargin, 2)} margin per unit)`
            }
            highlightColor={cannotBreakEven ? "rose" : "emerald"}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unit Contribution Margin</span>
              <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                {currencySymbol} {formatNumber(contributionMargin)}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Margin Ratio: {cmRatio.toFixed(1)}%</span>
            </div>

            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Projected Net Profit/Loss</span>
              <p className={`text-lg font-semibold mt-1 ${isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {isProfitable ? "+" : ""}{currencySymbol} {formatNumber(Math.round(netProfit))}
              </p>
              <span className={`text-xs font-semibold ${isProfitable ? "text-emerald-500" : "text-rose-500"}`}>
                ROI: {roiPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Unit Target Bar */}
          <div className="p-4 rounded-xl border space-y-2 bg-muted/30">
            <div className="flex justify-between text-sm font-medium text-foreground">
              <span>Sales vs Break-Even Target</span>
              <span>{Q >= breakEvenUnits ? "Target reached" : `${breakEvenUnits - Q} more units needed`}</span>
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
