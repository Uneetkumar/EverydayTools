"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import ToolInput from "@/components/ui/ToolInput";
import CopyButton from "@/components/ui/CopyButton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Info } from "lucide-react";

/**
 * GST slabs in force since 22 September 2025 ("GST 2.0"): the 12% and 28%
 * slabs were folded into 5% and 18%, with 40% for luxury and sin goods. 3% is
 * the long-standing rate for gold and silver. Older rates can still be typed
 * into the custom field for pre-reform invoices.
 */
const SLABS = ["3", "5", "18", "40"];

export default function GstCalculator() {
  const [mode, setMode] = usePersistentState<"exclusive" | "inclusive">("gst_mode", "exclusive");
  const [supply, setSupply] = usePersistentState<"intra" | "inter">("gst_supply", "intra");
  const [amount, setAmount] = usePersistentState<string>("gst_amount", "1000");
  const [rate, setRate] = usePersistentState<string>("gst_rate", "18");
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  const parsedAmount = parseFloat(amount);
  const parsedRate = parseFloat(rate);
  const amountError =
    amount.trim() !== "" && (!Number.isFinite(parsedAmount) || parsedAmount < 0) ? "Enter an amount of 0 or more." : undefined;
  const rateError =
    rate.trim() === ""
      ? "Choose a rate or type one."
      : !Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100
        ? "Enter a rate between 0 and 100."
        : undefined;

  const numAmount = amountError ? 0 : Math.max(0, parsedAmount || 0);
  const numRate = rateError ? 0 : parsedRate;

  let netPrice: number;
  let grossPrice: number;
  if (mode === "exclusive") {
    netPrice = numAmount;
    grossPrice = numAmount + (numAmount * numRate) / 100;
  } else {
    grossPrice = numAmount;
    netPrice = (numAmount * 100) / (100 + numRate);
  }
  const gstAmount = grossPrice - netPrice;
  const half = gstAmount / 2;

  const money = (v: number) => `${currencySymbol}${formatNumber(v, 2)}`;
  const taxLines =
    supply === "intra"
      ? [
          { label: `CGST (${formatNumber(numRate / 2, 2)}%)`, value: money(half) },
          { label: `SGST / UTGST (${formatNumber(numRate / 2, 2)}%)`, value: money(half) },
        ]
      : [{ label: `IGST (${formatNumber(numRate, 2)}%)`, value: money(gstAmount) }];

  const resultSummary = [
    `Net price: ${money(netPrice)}`,
    ...taxLines.map((l) => `${l.label}: ${l.value}`),
    `Total GST: ${money(gstAmount)}`,
    `Invoice total: ${money(grossPrice)}`,
  ].join("\n");

  const hasInput = amount.trim() !== "" && !amountError && !rateError;

  return (
    <div className="space-y-6">
      <ToggleGroup
        type="single"
        variant="outline"
        value={mode}
        onValueChange={(v) => v && setMode(v as typeof mode)}
        aria-label="Calculation"
        className="w-full"
      >
        <ToggleGroupItem value="exclusive" className="flex-1">
          Add GST to a price
        </ToggleGroupItem>
        <ToggleGroupItem value="inclusive" className="flex-1">
          Remove GST from a total
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="grid grid-cols-1 items-start gap-6 @2xl:grid-cols-2">
        <div className="space-y-5">
          <ToolInput
                label={mode === "exclusive" ? "Price before GST" : "Total including GST"}
                id="gst-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={amount}
                prefixText={currencySymbol}
                showClear
                onClear={() => setAmount("")}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1000"
                error={amountError}
              />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Currency symbol</span>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={currencySymbol}
              onValueChange={(v) => v && setCurrencySymbol(v)}
              aria-label="Currency symbol"
            >
              {["₹", "$", "€", "£"].map((cur) => (
                <ToggleGroupItem key={cur} value={cur} className="px-2.5">
                  {cur}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <fieldset className="space-y-2">
            <legend className="type-label text-foreground">GST rate</legend>
            <ToggleGroup
              type="single"
              variant="outline"
              value={SLABS.includes(rate) ? rate : ""}
              onValueChange={(v) => v && setRate(v)}
              aria-label="GST rate"
              className="grid w-full grid-cols-4"
            >
              {SLABS.map((slab) => (
                <ToggleGroupItem key={slab} value={slab}>
                  {slab}%
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToolInput
              label="Or type a rate"
              id="gst-custom-rate"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="any"
              value={rate}
              suffixText="%"
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 18"
              error={rateError}
            />
            <p className="flex gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Rates from 22 September 2025: 5%, 18% and 40%, and 3% on gold and silver. For invoices before that
                date, type 12% or 28% if they applied.
              </span>
            </p>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="type-label text-foreground">Type of sale</legend>
            <ToggleGroup
              type="single"
              variant="outline"
              value={supply}
              onValueChange={(v) => v && setSupply(v as typeof supply)}
              aria-label="Type of sale"
              className="w-full"
            >
              <ToggleGroupItem value="intra" className="flex-1">
                Within a state
              </ToggleGroupItem>
              <ToggleGroupItem value="inter" className="flex-1">
                Between states
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {supply === "intra"
                ? "Split equally into CGST and SGST (UTGST in union territories)."
                : "Charged as a single IGST, as on imports and interstate sales."}
            </p>
          </fieldset>
        </div>

        <div className="space-y-3">
          <ResultCard
            title={mode === "exclusive" ? "Invoice total with GST" : "Price before GST"}
            value={hasInput ? money(mode === "exclusive" ? grossPrice : netPrice) : "—"}
            subtitle={
              hasInput
                ? `GST of ${money(gstAmount)} at ${formatNumber(numRate, 2)}%`
                : "Enter an amount and a rate to see the result."
            }
            copyText={resultSummary}
            details={
              hasInput
                ? [
                    { label: "Price before GST", value: money(netPrice) },
                    ...taxLines,
                    { label: "Invoice total", value: money(grossPrice) },
                  ]
                : []
            }
            highlightColor="emerald"
          />
          {hasInput && (
            <div className="flex justify-end">
              <CopyButton text={resultSummary} label="Copy tax breakdown" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
