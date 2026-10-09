"use client";

import React from "react";
import ResultCard from "@/components/ResultCard";
import ToolInput from "@/components/ui/ToolInput";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { salaryBreakdown, type TaxRegime } from "@/lib/finance/india-salary";
import { Info } from "lucide-react";

// Indian digit grouping: ₹1,20,000 rather than ₹120,000.
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

export default function SalaryCalculator() {
  const [ctc, setCtc] = usePersistentState<string>("sal_ctc", "1200000");
  const [bonusPercentage, setBonusPercentage] = usePersistentState<string>("sal_bonus", "10");
  // Older saved state stored PF as a boolean; both shapes are accepted.
  const [pfSetting, setPfSetting] = usePersistentState<boolean | "full" | "capped" | "none">("sal_pf", "full");
  const [taxRegime, setTaxRegime] = usePersistentState<TaxRegime>("sal_regime", "new");
  const [pt, setPt] = usePersistentState<string>("sal_pt", "2400");

  const pf = pfSetting === true ? "full" : pfSetting === false ? "none" : pfSetting;

  const ctcNum = parseFloat(ctc);
  const bonusNum = parseFloat(bonusPercentage);
  const ptNum = parseFloat(pt);
  const ctcError = ctc.trim() !== "" && (!Number.isFinite(ctcNum) || ctcNum < 0) ? "Enter your annual CTC in rupees." : undefined;
  const bonusError =
    bonusPercentage.trim() !== "" && (!Number.isFinite(bonusNum) || bonusNum < 0 || bonusNum > 100)
      ? "Enter a percentage between 0 and 100."
      : undefined;

  const hasInput = ctc.trim() !== "" && !ctcError && ctcNum > 0;
  const b = salaryBreakdown({
    ctc: hasInput ? ctcNum : 0,
    variablePct: bonusError ? 0 : bonusNum || 0,
    regime: taxRegime,
    pf,
    professionalTax: Number.isFinite(ptNum) ? ptNum : 0,
  });

  const rows: { label: string; value: number; minus?: boolean; strong?: boolean }[] = [
    { label: "Basic salary (50% of fixed pay)", value: b.basic },
    { label: "House rent allowance (40% of basic)", value: b.hra },
    { label: "Special allowance", value: b.special },
    { label: "Fixed gross salary", value: b.fixedGross, strong: true },
    { label: "Variable pay / bonus", value: b.variable },
    { label: "Employee PF", value: b.employeePf, minus: true },
    { label: "Professional tax", value: b.professionalTax, minus: true },
    { label: `Income tax incl. cess (${taxRegime} regime)`, value: b.tax, minus: true },
    { label: "Annual take-home", value: b.annualTakeHome, strong: true },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-6 @3xl:grid-cols-2">
      <div className="space-y-5">
        <ToolInput
          label="Annual CTC"
          id="sal-ctc-input"
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          value={ctc}
          prefixText="₹"
          showClear
          onClear={() => setCtc("")}
          onChange={(e) => setCtc(e.target.value)}
          placeholder="e.g. 1200000"
          helperText={hasInput ? `${formatNumber(ctcNum / 100000, 2)} lakh` : undefined}
          error={ctcError}
        />
        <ToolInput
          label="Variable pay / bonus (% of CTC)"
          id="sal-bonus-input"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={1}
          value={bonusPercentage}
          suffixText="%"
          onChange={(e) => setBonusPercentage(e.target.value)}
          placeholder="e.g. 10"
          error={bonusError}
        />

        <fieldset className="space-y-2">
          <legend className="type-label text-foreground">Tax regime</legend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={taxRegime}
            onValueChange={(v) => v && setTaxRegime(v as TaxRegime)}
            aria-label="Tax regime"
            className="w-full"
          >
            <ToggleGroupItem value="new" className="flex-1">New regime</ToggleGroupItem>
            <ToggleGroupItem value="old" className="flex-1">Old regime</ToggleGroupItem>
          </ToggleGroup>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="type-label text-foreground">Provident Fund</legend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={pf}
            onValueChange={(v) => v && setPfSetting(v as "full" | "capped" | "none")}
            aria-label="Provident Fund"
            className="w-full"
          >
            <ToggleGroupItem value="full" className="h-auto min-h-8 flex-1 shrink py-1 leading-tight whitespace-normal">12% of basic</ToggleGroupItem>
            <ToggleGroupItem value="capped" className="h-auto min-h-8 flex-1 shrink py-1 leading-tight whitespace-normal">₹1,800 / month</ToggleGroupItem>
            <ToggleGroupItem value="none" className="h-auto min-h-8 flex-1 shrink py-1 leading-tight whitespace-normal">No PF</ToggleGroupItem>
          </ToggleGroup>
        </fieldset>

        <ToolInput
          label="Professional tax per year"
          id="sal-pt-input"
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          value={pt}
          prefixText="₹"
          onChange={(e) => setPt(e.target.value)}
          helperText="₹0 in states without it"
        />

        <p className="flex gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            FY 2026-27 rates (Budget 2026 kept the 2025-26 slabs). New regime: no tax up to ₹12 lakh of taxable income, ₹75,000 standard deduction.
            Old regime: ₹50,000 standard deduction, and PF counted under 80C; HRA exemption and other deductions
            are not included. An estimate, not tax advice.
          </span>
        </p>
      </div>

      <div className="space-y-4">
        <ResultCard
          title="Monthly in-hand salary"
          value={hasInput ? inr(b.monthlyInHand) : "—"}
          subtitle={
            hasInput
              ? `Fixed pay after PF, professional tax and TDS. Variable pay adds about ${inr(b.variableTakeHome)} a year after tax.`
              : "Enter your annual CTC to see your take-home pay."
          }
          details={
            hasInput
              ? [
                  { label: "Annual take-home", value: inr(b.annualTakeHome) },
                  { label: "Income tax (year)", value: inr(b.tax) },
                  { label: "Taxable income", value: inr(b.taxableIncome) },
                ]
              : []
          }
          highlightColor="emerald"
        />

        {hasInput && (
          <div className="rounded-xl border bg-card">
            <h3 className="border-b px-4 py-3 type-h4 text-foreground">Annual breakdown</h3>
            <dl className="divide-y text-sm">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className={r.strong ? "font-medium text-foreground" : "text-muted-foreground"}>{r.label}</dt>
                  <dd
                    className={
                      "shrink-0 tabular-nums " +
                      (r.minus ? "text-destructive" : r.strong ? "font-semibold text-foreground" : "text-foreground")
                    }
                  >
                    {r.minus ? "−" : ""}
                    {inr(r.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
              CTC also includes employer PF of {inr(b.employerPf)} a year, which goes to your PF account rather than
              your bank.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
