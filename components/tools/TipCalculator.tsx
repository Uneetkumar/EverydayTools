"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, MessageSquare, Users, DollarSign, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  UnitInput,
  Segmented,
  Chips,
  StatGrid,
  Stat,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const TIP_PERCENTAGES = ["10", "15", "18", "20", "25"];
const CURRENCIES = ["$", "₹", "€", "£", "¥"];

export default function TipCalculator() {
  const [currency, setCurrency] = useState("$");
  const [billAmount, setBillAmount] = useState("120.00");
  const [tipPercent, setTipPercent] = useState("18");
  const [customTip, setCustomTip] = useState("");
  const [splitCount, setSplitCount] = useState("4");
  const [rounding, setRounding] = useState<"none" | "bill" | "person">("none");
  const [copied, setCopied] = useState(false);

  const activeTipRate = customTip ? parseFloat(customTip) || 0 : parseFloat(tipPercent) || 0;
  const numPeople = Math.max(1, parseInt(splitCount, 10) || 1);

  const results = useMemo(() => {
    const rawBill = Math.max(0, parseFloat(billAmount) || 0);
    let tipValue = (rawBill * activeTipRate) / 100;
    let totalBill = rawBill + tipValue;
    let perPerson = totalBill / numPeople;
    let tipPerPerson = tipValue / numPeople;

    if (rounding === "bill") {
      totalBill = Math.ceil(totalBill);
      tipValue = Math.max(0, totalBill - rawBill);
      perPerson = totalBill / numPeople;
      tipPerPerson = tipValue / numPeople;
    } else if (rounding === "person") {
      perPerson = Math.ceil(perPerson);
      totalBill = perPerson * numPeople;
      tipValue = Math.max(0, totalBill - rawBill);
      tipPerPerson = tipValue / numPeople;
    }

    return {
      bill: rawBill.toFixed(2),
      tip: tipValue.toFixed(2),
      total: totalBill.toFixed(2),
      perPerson: perPerson.toFixed(2),
      tipPerPerson: tipPerPerson.toFixed(2),
    };
  }, [billAmount, activeTipRate, numPeople, rounding]);

  const shareSummary = useMemo(() => {
    return `Bill Split Summary:
Total: ${currency}${results.total} (${currency}${results.bill} bill + ${currency}${results.tip} tip [${activeTipRate}%])
Split between ${numPeople} ${numPeople === 1 ? "person" : "people"}:
Each person pays: ${currency}${results.perPerson}`;
  }, [currency, results, activeTipRate, numPeople]);

  const copyShareText = () => {
    navigator.clipboard.writeText(shareSummary);
    setCopied(true);
    toast.success("WhatsApp / SMS summary copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Bill & Tip Calculator"
        description="Calculate tips, split expenses fairly among friends, round per person, and copy an instant group chat summary."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            value={currency}
            onChange={(v) => setCurrency(v)}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            ariaLabel="Currency Selector"
          />

          <Segmented
            value={rounding}
            onChange={(v) => setRounding(v as "none" | "bill" | "person")}
            options={[
              { value: "none", label: "Exact Cent" },
              { value: "bill", label: "Round Total Up" },
              { value: "person", label: "Round Per Person Up" },
            ]}
            ariaLabel="Rounding Options"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bill Amount">
            <UnitInput
              unit={currency}
              type="number"
              step="any"
              min="0"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="100.00"
              aria-label="Bill Amount"
            />
          </Field>

          <Field label="Number of People">
            <div className="flex items-center gap-2">
              <UnitInput
                unit="people"
                type="number"
                min="1"
                max="100"
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
                placeholder="1"
                aria-label="Number of People"
              />
              <div className="flex gap-1">
                {[1, 2, 4, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSplitCount(n.toString())}
                    className={`h-10 px-3 rounded-lg border text-xs font-semibold ${
                      parseInt(splitCount, 10) === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">Tip Percentage</label>
          <div className="flex flex-wrap items-center gap-2">
            <Chips
              value={customTip ? null : tipPercent}
              onChange={(val) => {
                setCustomTip("");
                setTipPercent(val);
              }}
              options={TIP_PERCENTAGES.map((p) => ({ value: p, label: `${p}%` }))}
              ariaLabel="Tip Presets"
            />

            <div className="w-28">
              <UnitInput
                unit="%"
                type="number"
                min="0"
                max="100"
                placeholder="Custom"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Calculation Breakdown">
        <StatGrid>
          <Stat
            label="Total Per Person"
            value={`${currency}${results.perPerson}`}
            tone="success"
            hint={`Includes ${currency}${results.tipPerPerson} tip`}
          />
          <Stat label="Total Bill + Tip" value={`${currency}${results.total}`} />
          <Stat label="Total Tip" value={`${currency}${results.tip}`} hint={`${activeTipRate}% tip`} />
          <Stat label="Original Bill" value={`${currency}${results.bill}`} />
        </StatGrid>

        {/* Shareable Summary Box */}
        <div className="rounded-lg border bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-primary" /> Group Chat Shareable Message
            </span>
            <Button variant="default" size="sm" onClick={copyShareText} className="h-7 text-xs gap-1.5">
              {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
              Copy WhatsApp / SMS Text
            </Button>
          </div>
          <pre className="font-mono text-xs text-foreground bg-muted/40 p-3 rounded leading-relaxed whitespace-pre-wrap">
            {shareSummary}
          </pre>
        </div>
      </ToolSection>
    </div>
  );
}
