"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import ToolInput from "@/components/ui/ToolInput";
import CopyButton from "@/components/ui/CopyButton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Receipt } from "lucide-react";

export default function GstCalculator() {
  const [mode, setMode] = usePersistentState<"exclusive" | "inclusive">("gst_mode", "exclusive");
  const [amount, setAmount] = usePersistentState<string>("gst_amount", "1000");
  const [rate, setRate] = usePersistentState<string>("gst_rate", "18");
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const numAmount = Math.max(0, parseFloat(amount) || 0);
  const numRate = Math.max(0, parseFloat(rate) || 0);

  let netPrice = 0;
  let gstAmount = 0;
  let grossPrice = 0;
  let cgst = 0;
  let sgst = 0;

  if (mode === "exclusive") {
    netPrice = numAmount;
    gstAmount = (numAmount * numRate) / 100;
    grossPrice = netPrice + gstAmount;
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  } else {
    grossPrice = numAmount;
    netPrice = (numAmount * 100) / (100 + numRate);
    gstAmount = grossPrice - netPrice;
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  }

  const resultSummary = `Net Price: ${currencySymbol}${netPrice.toFixed(2)} | GST (${numRate}%): ${currencySymbol}${gstAmount.toFixed(2)} | Gross Total: ${currencySymbol}${grossPrice.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Mode Switches */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMode("exclusive")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            mode === "exclusive"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Add GST (Exclusive)
        </button>
        <button
          type="button"
          onClick={() => setMode("inclusive")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            mode === "inclusive"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Remove GST (Inclusive)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input parameters */}
        <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{mode === "exclusive" ? "Base Price (Before Tax)" : "Total Price (Including Tax)"}</span>
            </h3>
            <div className="flex items-center gap-1 text-xs">
              {["₹", "$", "€", "£"].map((cur) => (
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
            label={mode === "exclusive" ? "Initial Net Amount" : "Invoice Gross Amount"}
            type="number"
            min={0}
            step="any"
            value={amount}
            prefixText={currencySymbol}
            showClear={true}
            onClear={() => setAmount("")}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1000"
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              GST Tax Rate Slab
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["5", "12", "18", "28"].map((slab) => (
                <button
                  key={slab}
                  type="button"
                  onClick={() => setRate(slab)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    rate === slab
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {slab}%
                </button>
              ))}
            </div>

            <ToolInput
              label="Custom Tax Rate"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={rate}
              suffixText="%"
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 18"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultCard
            title={mode === "exclusive" ? "Total Price (with GST)" : "Net Price (without GST)"}
            value={`${currencySymbol}${formatNumber(mode === "exclusive" ? grossPrice : netPrice, 2)}`}
            subtitle={`GST Tax Amount: ${currencySymbol}${formatNumber(gstAmount, 2)} at ${numRate}%`}
            details={[
              { label: "Net / Base Price", value: `${currencySymbol}${formatNumber(netPrice, 2)}` },
              { label: "CGST (Central Tax)", value: `${currencySymbol}${formatNumber(cgst, 2)}` },
              { label: "SGST (State Tax)", value: `${currencySymbol}${formatNumber(sgst, 2)}` },
              { label: "Total Invoice Amount", value: `${currencySymbol}${formatNumber(grossPrice, 2)}` },
            ]}
            highlightColor="emerald"
          />

          <div className="flex justify-end">
            <CopyButton text={resultSummary} label="Copy Tax Breakdown" />
          </div>
        </div>
      </div>
    </div>
  );
}

