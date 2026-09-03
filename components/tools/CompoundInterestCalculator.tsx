"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Calculator, TrendingUp, DollarSign, Calendar, Percent, RefreshCw } from "lucide-react";

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = usePersistentState<string>("ci_principal", "50000");
  const [rate, setRate] = usePersistentState<string>("ci_rate", "8");
  const [years, setYears] = usePersistentState<string>("ci_years", "5");
  const [compoundingFreq, setCompoundingFreq] = usePersistentState<string>("ci_freq", "12"); // 12 = monthly
  const [monthlyContribution, setMonthlyContribution] = usePersistentState<string>("ci_contrib", "2000");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  const P = Math.max(0, parseFloat(principal) || 0);
  const r = Math.max(0, parseFloat(rate) || 0) / 100;
  const t = Math.max(0, parseFloat(years) || 0);
  const n = Math.max(1, parseInt(compoundingFreq, 10) || 12);
  const PMT = Math.max(0, parseFloat(monthlyContribution) || 0);

  // Future value of principal: P * (1 + r/n)^(n*t)
  const principalFV = P * Math.pow(1 + r / n, n * t);

  // Future value of monthly contributions:
  // PMT * [((1 + r/n)^(n*t) - 1) / (r/12)] (assuming monthly contributions)
  let contribFV = 0;
  let totalContributions = PMT * t * 12;

  if (PMT > 0 && t > 0) {
    if (r > 0) {
      // Periodic rate per month = r / 12
      const monthlyRate = r / 12;
      contribFV = PMT * ((Math.pow(1 + monthlyRate, t * 12) - 1) / monthlyRate);
    } else {
      contribFV = totalContributions;
    }
  }

  const totalFutureValue = principalFV + contribFV;
  const totalPrincipalInvested = P + totalContributions;
  const totalInterestEarned = Math.max(0, totalFutureValue - totalPrincipalInvested);

  const freqLabels: Record<string, string> = {
    "1": "Annually (1x/yr)",
    "2": "Semi-Annually (2x/yr)",
    "4": "Quarterly (4x/yr)",
    "12": "Monthly (12x/yr)",
    "365": "Daily (365x/yr)",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Deposit & Growth Settings
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

          {/* Initial Principal */}
          <div className="space-y-1.5">
            <label htmlFor="ci-principal-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Initial Principal Deposit
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="ci-principal-input"
                type="number"
                min="0"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Regular Monthly Contribution */}
          <div className="space-y-1.5">
            <label htmlFor="ci-contrib-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Monthly Contribution (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="ci-contrib-input"
                type="number"
                min="0"
                step="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="2000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Interest Rate */}
            <div className="space-y-1.5">
              <label htmlFor="ci-rate-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Annual Interest Rate
              </label>
              <div className="relative">
                <input
                  id="ci-rate-input"
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Time Period */}
            <div className="space-y-1.5">
              <label htmlFor="ci-years-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Time Period (Years)
              </label>
              <input
                id="ci-years-input"
                type="number"
                min="1"
                max="50"
                step="1"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="5"
              />
            </div>
          </div>

          {/* Compounding Frequency */}
          <div className="space-y-1.5">
            <label htmlFor="ci-freq-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Compounding Frequency
            </label>
            <select
              id="ci-freq-select"
              value={compoundingFreq}
              onChange={(e) => setCompoundingFreq(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {Object.entries(freqLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Total Future Value (Maturity Amount)"
            value={`${currencySymbol} ${formatNumber(Math.round(totalFutureValue))}`}
            subtitle={`Principal ${currencySymbol}${formatNumber(Math.round(totalPrincipalInvested))} + Compound Interest ${currencySymbol}${formatNumber(Math.round(totalInterestEarned))}`}
            highlightColor="indigo"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Principal Deposited</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {currencySymbol} {formatNumber(Math.round(totalPrincipalInvested))}
              </p>
              <span className="text-[11px] text-slate-400">
                Initial ({currencySymbol}{formatNumber(P)}) + Monthly ({currencySymbol}{formatNumber(totalContributions)})
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Interest Accrued</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                +{currencySymbol} {formatNumber(Math.round(totalInterestEarned))}
              </p>
              <span className="text-[11px] text-emerald-500 font-medium">
                {totalPrincipalInvested > 0 ? ((totalInterestEarned / totalPrincipalInvested) * 100).toFixed(1) : 0}% total interest gain
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Principal vs Interest</span>
              <span>Effective Annual Rate: {((Math.pow(1 + r / n, n) - 1) * 100).toFixed(2)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 transition-all duration-300"
                style={{ width: `${totalFutureValue > 0 ? (totalPrincipalInvested / totalFutureValue) * 100 : 100}%` }}
                title="Principal"
              />
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${totalFutureValue > 0 ? (totalInterestEarned / totalFutureValue) * 100 : 0}%` }}
                title="Interest"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
