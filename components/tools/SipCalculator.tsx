"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Calculator, TrendingUp, DollarSign, Calendar, Percent, PieChart, ArrowRight } from "lucide-react";

export default function SipCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = usePersistentState<string>("sip_monthly", "10000");
  const [expectedReturn, setExpectedReturn] = usePersistentState<string>("sip_return", "12");
  const [timePeriod, setTimePeriod] = usePersistentState<string>("sip_years", "10");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  const P = Math.max(0, parseFloat(monthlyInvestment) || 0);
  const annualRate = Math.max(0, parseFloat(expectedReturn) || 0);
  const years = Math.max(0, parseFloat(timePeriod) || 0);
  const months = Math.round(years * 12);

  // i = periodic interest rate (monthly)
  const i = (annualRate / 100) / 12;

  // Formula: M = P × [((1 + i)^n - 1) / i] × (1 + i)
  let totalInvested = P * months;
  let maturityValue = 0;

  if (i > 0 && months > 0 && P > 0) {
    maturityValue = P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  } else {
    maturityValue = totalInvested;
  }

  const estimatedReturns = Math.max(0, maturityValue - totalInvested);
  const returnsPercentage = maturityValue > 0 ? (estimatedReturns / maturityValue) * 100 : 0;
  const investedPercentage = maturityValue > 0 ? (totalInvested / maturityValue) * 100 : 0;

  // Generate Year-by-Year breakdown
  const yearBreakdown = [];
  for (let yr = 1; yr <= Math.min(30, Math.ceil(years)); yr++) {
    const m = yr * 12;
    const inv = P * m;
    const mat = i > 0 ? P * ((Math.pow(1 + i, m) - 1) / i) * (1 + i) : inv;
    yearBreakdown.push({
      year: yr,
      invested: inv,
      returns: Math.max(0, mat - inv),
      total: mat,
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Panel */}
        <div className="lg:col-span-6 space-y-5 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              SIP Investment Parameters
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

          {/* Monthly Investment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sip-monthly-input" className="font-semibold text-slate-700 dark:text-slate-300">
                Monthly Investment
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {currencySymbol} {formatNumber(P)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="sip-monthly-input"
                type="number"
                min="100"
                step="500"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="10000"
              />
            </div>
            <input
              type="range"
              min="500"
              max="200000"
              step="500"
              value={P || 500}
              onChange={(e) => setMonthlyInvestment(e.target.value)}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Expected Return Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sip-return-input" className="font-semibold text-slate-700 dark:text-slate-300">
                Expected Return Rate (p.a.)
              </label>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {annualRate}%
              </span>
            </div>
            <div className="relative">
              <input
                id="sip-return-input"
                type="number"
                min="1"
                max="35"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="w-full pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                %
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={annualRate || 1}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Time Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sip-period-input" className="font-semibold text-slate-700 dark:text-slate-300">
                Investment Duration
              </label>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {years} {years === 1 ? "Year" : "Years"} ({months} Months)
              </span>
            </div>
            <div className="relative">
              <input
                id="sip-period-input"
                type="number"
                min="1"
                max="40"
                step="1"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="10"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                Years
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={years || 1}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Expected Total Maturity Value"
            value={`${currencySymbol} ${formatNumber(Math.round(maturityValue))}`}
            subtitle={`Invested ${currencySymbol}${formatNumber(Math.round(totalInvested))} + Wealth Gain ${currencySymbol}${formatNumber(Math.round(estimatedReturns))}`}
            highlightColor="indigo"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Invested Amount</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {currencySymbol} {formatNumber(Math.round(totalInvested))}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>{investedPercentage.toFixed(1)}% of total</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimated Wealth Gain</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {currencySymbol} {formatNumber(Math.round(estimatedReturns))}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{returnsPercentage.toFixed(1)}% of total</span>
              </div>
            </div>
          </div>

          {/* Visual Ratio Progress Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Investment Ratio</span>
              <span>Wealth Multiplier: {totalInvested > 0 ? (maturityValue / totalInvested).toFixed(2) : "1.00"}x</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 transition-all duration-300"
                style={{ width: `${investedPercentage}%` }}
                title={`Invested: ${investedPercentage.toFixed(1)}%`}
              />
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${returnsPercentage}%` }}
                title={`Gains: ${returnsPercentage.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Growth Table */}
      {yearBreakdown.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Annual Growth Projection
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Compound growth over {years} {years === 1 ? "year" : "years"}
            </span>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Year</th>
                  <th className="py-2.5 px-4 font-semibold">Invested Amount</th>
                  <th className="py-2.5 px-4 font-semibold">Est. Returns</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total Future Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {yearBreakdown.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">Year {row.year}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {currencySymbol} {formatNumber(Math.round(row.invested))}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      +{currencySymbol} {formatNumber(Math.round(row.returns))}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                      {currencySymbol} {formatNumber(Math.round(row.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
