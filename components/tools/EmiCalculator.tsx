"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, DollarSign, Calendar, Percent } from "lucide-react";

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState<string>("100000");
  const [interestRate, setInterestRate] = useState<string>("8.5");
  const [tenureYears, setTenureYears] = useState<string>("10");

  const P = parseFloat(loanAmount) || 0;
  const annualR = parseFloat(interestRate) || 0;
  const years = parseFloat(tenureYears) || 0;

  const N = years * 12; // Total monthly installments
  const R = annualR / 12 / 100; // Monthly interest rate

  let monthlyEmi = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (P > 0 && R > 0 && N > 0) {
    const factor = Math.pow(1 + R, N);
    monthlyEmi = (P * R * factor) / (factor - 1);
    totalPayment = monthlyEmi * N;
    totalInterest = totalPayment - P;
  }

  const principalPct = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
  const interestPct = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Loan Controls */}
        <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Loan Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Loan Amount (Principal)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Interest Rate (% p.a.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white pr-8"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Loan Tenure (Years)</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{years} Years ({N} Months)</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={years}
              onChange={(e) => setTenureYears(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultCard
            title="Monthly Loan EMI"
            value={formatCurrency(monthlyEmi)}
            subtitle={`Total interest over ${years} years: ${formatCurrency(totalInterest)}`}
            details={[
              { label: "Principal Amount", value: formatCurrency(P) },
              { label: "Total Interest", value: formatCurrency(totalInterest) },
              { label: "Total Amount Payable", value: formatCurrency(totalPayment) },
              { label: "Tenure (Months)", value: `${N} months` },
            ]}
            highlightColor="indigo"
          />

          {/* Visual Distribution Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-blue-600 dark:text-blue-400">Principal: {principalPct.toFixed(1)}%</span>
              <span className="text-amber-600 dark:text-amber-400">Interest: {interestPct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${principalPct}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${interestPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
