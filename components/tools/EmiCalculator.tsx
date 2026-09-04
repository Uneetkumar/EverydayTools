"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import ToolInput from "@/components/ui/ToolInput";
import CopyButton from "@/components/ui/CopyButton";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Landmark } from "lucide-react";

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = usePersistentState<string>("emi_loan_amount", "100000");
  const [interestRate, setInterestRate] = usePersistentState<string>("emi_interest_rate", "8.5");
  const [tenureYears, setTenureYears] = usePersistentState<string>("emi_tenure_years", "10");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const P = Math.max(0, parseFloat(loanAmount) || 0);
  const annualR = Math.max(0, parseFloat(interestRate) || 0);
  const years = Math.max(0.1, parseFloat(tenureYears) || 0);

  const N = Math.round(years * 12);
  const R = annualR / 12 / 100;

  let monthlyEmi = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (P > 0 && R > 0 && N > 0) {
    const factor = Math.pow(1 + R, N);
    monthlyEmi = (P * R * factor) / (factor - 1);
    totalPayment = monthlyEmi * N;
    totalInterest = totalPayment - P;
  } else if (P > 0 && N > 0 && R === 0) {
    monthlyEmi = P / N;
    totalPayment = P;
    totalInterest = 0;
  }

  const principalPct = totalPayment > 0 ? (P / totalPayment) * 100 : 100;
  const interestPct = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  const summaryText = `Monthly EMI: ${currencySymbol}${formatNumber(monthlyEmi, 2)} | Principal: ${currencySymbol}${formatNumber(P, 2)} | Total Interest: ${currencySymbol}${formatNumber(totalInterest, 2)} | Total Payable: ${currencySymbol}${formatNumber(totalPayment, 2)} (${years} years)`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Loan Controls */}
        <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Loan Parameters</span>
            </h3>
            <div className="flex items-center gap-1 text-xs">
              {["$", "₹", "€", "£"].map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrencySymbol(cur)}
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition ${
                    currencySymbol === cur
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          <ToolInput
            label="Principal Loan Amount"
            type="number"
            min={0}
            step="any"
            value={loanAmount}
            prefixText={currencySymbol}
            showClear={true}
            onClear={() => setLoanAmount("")}
            onChange={(e) => setLoanAmount(e.target.value)}
            placeholder="e.g. 100000"
          />

          <ToolInput
            label="Annual Interest Rate (% p.a.)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={interestRate}
            suffixText="%"
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="e.g. 8.5"
          />

          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Loan Tenure</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {years} {years === 1 ? "Year" : "Years"} ({N} Months)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={years}
              onChange={(e) => setTenureYears(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 yr</span>
              <span>10 yrs</span>
              <span>20 yrs</span>
              <span>30 yrs</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultCard
            title="Monthly Loan EMI"
            value={`${currencySymbol}${formatNumber(monthlyEmi, 2)}`}
            subtitle={`Total interest over ${years} years: ${currencySymbol}${formatNumber(totalInterest, 2)}`}
            details={[
              { label: "Principal Amount", value: `${currencySymbol}${formatNumber(P, 2)}` },
              { label: "Total Interest Payable", value: `${currencySymbol}${formatNumber(totalInterest, 2)}` },
              { label: "Total Amount Payable", value: `${currencySymbol}${formatNumber(totalPayment, 2)}` },
              { label: "Tenure (Total Months)", value: `${N} months` },
            ]}
            highlightColor="indigo"
          />

          {/* Visual Distribution Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Principal: {principalPct.toFixed(1)}%
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Interest: {interestPct.toFixed(1)}%
              </span>
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

          <div className="flex justify-end">
            <CopyButton text={summaryText} label="Copy EMI Summary" />
          </div>
        </div>
      </div>
    </div>
  );
}

