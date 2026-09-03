"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Calculator, Wallet, TrendingDown, Percent, ShieldCheck, DollarSign } from "lucide-react";

export default function SalaryCalculator() {
  const [ctc, setCtc] = usePersistentState<string>("sal_ctc", "1200000");
  const [bonusPercentage, setBonusPercentage] = usePersistentState<string>("sal_bonus", "10");
  const [optPf, setOptPf] = usePersistentState<boolean>("sal_pf", true);
  const [taxRegime, setTaxRegime] = usePersistentState<"new" | "old">("sal_regime", "new");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  const grossAnnual = Math.max(0, parseFloat(ctc) || 0);
  const bonusPct = Math.max(0, parseFloat(bonusPercentage) || 0) / 100;

  // Variable / Bonus component
  const annualBonus = grossAnnual * bonusPct;
  const fixedAnnualCTC = Math.max(0, grossAnnual - annualBonus);

  // Standard salary breakdown (Indian / Global generic model)
  // Basic is typically 50% of Fixed CTC
  const basicSalary = fixedAnnualCTC * 0.5;
  const hra = basicSalary * 0.4;
  const specialAllowance = Math.max(0, fixedAnnualCTC - (basicSalary + hra));

  // Employee PF (12% of basic, capped or full)
  const employeePf = optPf ? basicSalary * 0.12 : 0;
  const employerPf = optPf ? basicSalary * 0.12 : 0;

  // Standard Deduction (Indian tax law standard: ₹75,000 for new regime)
  const standardDeduction = Math.min(75000, fixedAnnualCTC);
  const taxableIncome = Math.max(0, fixedAnnualCTC - standardDeduction - (taxRegime === "old" ? employeePf : 0));

  // Simplified Tax Slab (New Tax Regime FY 2025-26 / 2026)
  // Up to 3L: 0% | 3L-7L: 5% | 7L-10L: 10% | 10L-12L: 15% | 12L-15L: 20% | Above 15L: 30%
  // Section 87A rebate for taxable income <= 7L (0 tax)
  let estimatedAnnualTax = 0;
  if (taxableIncome > 700000) {
    let rem = taxableIncome;
    if (rem > 1500000) {
      estimatedAnnualTax += (rem - 1500000) * 0.3;
      rem = 1500000;
    }
    if (rem > 1200000) {
      estimatedAnnualTax += (rem - 1200000) * 0.2;
      rem = 1200000;
    }
    if (rem > 1000000) {
      estimatedAnnualTax += (rem - 1000000) * 0.15;
      rem = 1000000;
    }
    if (rem > 700000) {
      estimatedAnnualTax += (rem - 700000) * 0.1;
      rem = 700000;
    }
    if (rem > 300000) {
      estimatedAnnualTax += (rem - 300000) * 0.05;
      rem = 300000;
    }
    // 4% health & education cess
    estimatedAnnualTax *= 1.04;
  }

  // Professional Tax (approx 2400/year)
  const professionalTax = 2400;

  // Total Annual Deductions
  const totalAnnualDeductions = employeePf + estimatedAnnualTax + professionalTax;
  const netInHandAnnual = Math.max(0, fixedAnnualCTC - totalAnnualDeductions);
  const monthlyInHand = netInHandAnnual / 12;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Settings */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Annual Compensation (CTC)
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

          {/* Annual CTC */}
          <div className="space-y-1.5">
            <label htmlFor="sal-ctc-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total Cost to Company (Annual CTC)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="sal-ctc-input"
                type="number"
                min="100000"
                step="50000"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="1200000"
              />
            </div>
          </div>

          {/* Variable / Bonus Percentage */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sal-bonus-input" className="font-semibold text-slate-700 dark:text-slate-300">
                Performance Bonus / Variable Pay
              </label>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {bonusPercentage}% ({currencySymbol}{formatNumber(Math.round(annualBonus))})
              </span>
            </div>
            <div className="relative">
              <input
                id="sal-bonus-input"
                type="number"
                min="0"
                max="50"
                step="1"
                value={bonusPercentage}
                onChange={(e) => setBonusPercentage(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="10"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                %
              </span>
            </div>
          </div>

          {/* Tax Regime & PF Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="sal-regime-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tax Regime
              </label>
              <select
                id="sal-regime-select"
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value as "new" | "old")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="new">New Tax Regime</option>
                <option value="old">Old Tax Regime</option>
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optPf}
                  onChange={(e) => setOptPf(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                Deduct Employee PF (12%)
              </label>
            </div>
          </div>
        </div>

        {/* Results Card & Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Estimated Monthly In-Hand (Take-Home) Salary"
            value={`${currencySymbol} ${formatNumber(Math.round(monthlyInHand))}`}
            subtitle={`Net Annual Take-Home: ${currencySymbol}${formatNumber(Math.round(netInHandAnnual))} / 12 months`}
            highlightColor="emerald"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monthly Gross Fixed</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {currencySymbol} {formatNumber(Math.round(fixedAnnualCTC / 12))}
              </p>
              <span className="text-[11px] text-slate-400">Excludes variable bonus</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monthly Total Deductions</span>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                -{currencySymbol} {formatNumber(Math.round(totalAnnualDeductions / 12))}
              </p>
              <span className="text-[11px] text-slate-400">TDS + PF + Professional Tax</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
              Annual Salary Structure Breakdown
            </span>
            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 pt-1">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Basic Salary (50%)</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{currencySymbol}{formatNumber(Math.round(basicSalary))}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>House Rent Allowance (HRA)</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{currencySymbol}{formatNumber(Math.round(hra))}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Special Allowance</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{currencySymbol}{formatNumber(Math.round(specialAllowance))}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                <span>Annual Employee PF</span>
                <span className="font-mono font-medium">-{currencySymbol}{formatNumber(Math.round(employeePf))}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                <span>Annual Estimated Income Tax (TDS)</span>
                <span className="font-mono font-medium">-{currencySymbol}{formatNumber(Math.round(estimatedAnnualTax))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
