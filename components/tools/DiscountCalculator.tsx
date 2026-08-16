"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Tag, Sparkles, ShoppingBag } from "lucide-react";

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState<string>("80");
  const [discountPercent, setDiscountPercent] = useState<string>("25");
  const [extraCoupon, setExtraCoupon] = useState<string>("0");

  const orig = parseFloat(originalPrice) || 0;
  const disc = parseFloat(discountPercent) || 0;
  const extra = parseFloat(extraCoupon) || 0;

  const firstDiscounted = orig * (1 - disc / 100);
  const finalPrice = firstDiscounted * (1 - extra / 100);
  const totalSavings = orig - finalPrice;
  const totalEffectiveDiscountPct = orig > 0 ? (totalSavings / orig) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Controls */}
        <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Pricing & Discount Info
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Original Price (MSRP)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discount (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white pr-8"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {["10", "15", "20", "25", "30", "50", "70"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDiscountPercent(d)}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  {d}% Off
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Extra Stackable Coupon (%) (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                value={extraCoupon}
                onChange={(e) => setExtraCoupon(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white pr-8"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="space-y-4">
          <ResultCard
            title="Final Sale Price"
            value={formatCurrency(finalPrice)}
            subtitle={`You save ${formatCurrency(totalSavings)} (${totalEffectiveDiscountPct.toFixed(1)}% total discount)`}
            details={[
              { label: "Original Price", value: formatCurrency(orig) },
              { label: "Total Saved", value: formatCurrency(totalSavings) },
              { label: "Effective Discount", value: `${totalEffectiveDiscountPct.toFixed(1)}%` },
            ]}
            highlightColor="emerald"
            showConfetti={true}
          />
        </div>
      </div>
    </div>
  );
}
