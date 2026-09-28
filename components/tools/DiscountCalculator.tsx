"use client";

import React from "react";
import ResultCard from "@/components/ResultCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Tag, Sparkles, ShoppingBag } from "lucide-react";

export default function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = usePersistentState<string>("discount_price", "80");
  const [discountPercent, setDiscountPercent] = usePersistentState<string>("discount_pct", "25");
  const [extraCoupon, setExtraCoupon] = usePersistentState<string>("discount_coupon", "0");

  const orig = Math.max(0, parseFloat(originalPrice) || 0);
  const rawDisc = parseFloat(discountPercent) || 0;
  const rawExtra = parseFloat(extraCoupon) || 0;
  // A discount above 100% would mean the shop pays you; clamp and say so.
  const outOfRange = rawDisc < 0 || rawDisc > 100 || rawExtra < 0 || rawExtra > 100;
  const disc = Math.min(100, Math.max(0, rawDisc));
  const extra = Math.min(100, Math.max(0, rawExtra));

  const firstDiscounted = orig * (1 - disc / 100);
  const finalPrice = firstDiscounted * (1 - extra / 100);
  const totalSavings = orig - finalPrice;
  const totalEffectiveDiscountPct = orig > 0 ? (totalSavings / orig) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Controls */}
        <div className="space-y-4 p-5 rounded-xl border bg-muted/30">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Pricing & Discount Info
          </h3>

          <div>
            <label className="block text-sm mb-1.5 font-medium text-foreground">
              Original Price (MSRP)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <input aria-label="Original price"
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5 font-medium text-foreground">
              Discount (%)
            </label>
            <div className="relative">
              <input aria-label="Discount percentage"
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-8 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {["10", "15", "20", "25", "30", "50", "70"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDiscountPercent(d)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  {d}% Off
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5 font-medium text-foreground">
              Extra Stackable Coupon (%) (Optional)
            </label>
            <div className="relative">
              <input aria-label="Extra coupon percentage (optional)"
                type="number"
                value={extraCoupon}
                onChange={(e) => setExtraCoupon(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 pr-8 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="space-y-4">
          <ResultCard
            title="Final Sale Price"
            value={formatCurrency(finalPrice)}
            subtitle={
              outOfRange
                ? "Discounts must be between 0% and 100%; the values have been limited to that range."
                : `You save ${formatCurrency(totalSavings)} (${totalEffectiveDiscountPct.toFixed(1)}% total discount)`
            }
            details={[
              { label: "Original Price", value: formatCurrency(orig) },
              { label: "Total Saved", value: formatCurrency(totalSavings) },
              { label: "Effective Discount", value: `${totalEffectiveDiscountPct.toFixed(1)}%` },
            ]}
            highlightColor="emerald"
          />
        </div>
      </div>
    </div>
  );
}
