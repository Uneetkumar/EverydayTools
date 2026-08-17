"use client";

import React from "react";
import ResultCard from "@/components/ResultCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Receipt, Percent, Tag } from "lucide-react";

export default function GstCalculator() {
  const [mode, setMode] = usePersistentState<"exclusive" | "inclusive">("gst_mode", "exclusive");
  const [amount, setAmount] = usePersistentState<string>("gst_amount", "1000");
  const [rate, setRate] = usePersistentState<string>("gst_rate", "18");

  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(rate) || 0;

  let netPrice = 0;
  let gstAmount = 0;
  let grossPrice = 0;
  let cgst = 0;
  let sgst = 0;

  if (mode === "exclusive") {
    // Adding GST
    netPrice = numAmount;
    gstAmount = (numAmount * numRate) / 100;
    grossPrice = netPrice + gstAmount;
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  } else {
    // Removing GST (Inclusive)
    grossPrice = numAmount;
    netPrice = (numAmount * 100) / (100 + numRate);
    gstAmount = grossPrice - netPrice;
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  }

  return (
    <div className="space-y-6">
      {/* Mode Switches */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMode("exclusive")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            mode === "exclusive"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Add GST (Exclusive)
        </button>
        <button
          onClick={() => setMode("inclusive")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            mode === "inclusive"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Remove GST (Inclusive)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input parameters */}
        <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {mode === "exclusive" ? "Base Price (Before Tax)" : "Total Price (Including Tax)"}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GST Tax Slab (%)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {["5", "12", "18", "28"].map((slab) => (
                <button
                  key={slab}
                  onClick={() => setRate(slab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    rate === slab
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {slab}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultCard
            title={mode === "exclusive" ? "Total Price (with GST)" : "Net Price (without GST)"}
            value={formatCurrency(mode === "exclusive" ? grossPrice : netPrice)}
            subtitle={`GST Tax Amount: ${formatCurrency(gstAmount)} at ${numRate}%`}
            details={[
              { label: "Net / Base Price", value: formatCurrency(netPrice) },
              { label: "CGST (Central Tax)", value: formatCurrency(cgst) },
              { label: "SGST (State Tax)", value: formatCurrency(sgst) },
              { label: "Total Invoice Amount", value: formatCurrency(grossPrice) },
            ]}
            highlightColor="emerald"
          />
        </div>
      </div>
    </div>
  );
}
