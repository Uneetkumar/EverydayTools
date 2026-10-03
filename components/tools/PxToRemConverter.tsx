"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, ArrowRightLeft, Type, Sliders, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  UnitInput,
  Segmented,
  StatGrid,
  Stat,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const TAILWIND_SCALE = [
  { cls: "text-xs", rem: 0.75, px: 12, line: "1rem" },
  { cls: "text-sm", rem: 0.875, px: 14, line: "1.25rem" },
  { cls: "text-base", rem: 1, px: 16, line: "1.5rem" },
  { cls: "text-lg", rem: 1.125, px: 18, line: "1.75rem" },
  { cls: "text-xl", rem: 1.25, px: 20, line: "1.75rem" },
  { cls: "text-2xl", rem: 1.5, px: 24, line: "2rem" },
  { cls: "text-3xl", rem: 1.875, px: 30, line: "2.25rem" },
  { cls: "text-4xl", rem: 2.25, px: 36, line: "2.5rem" },
  { cls: "text-5xl", rem: 3, px: 48, line: "1" },
  { cls: "text-6xl", rem: 3.75, px: 60, line: "1" },
];

export default function PxToRemConverter() {
  const [rootPx, setRootPx] = useState(16);
  const [pxVal, setPxVal] = useState("24");
  const [remVal, setRemVal] = useState("1.5");

  // Fluid Typography State
  const [minVw, setMinVw] = useState(375);
  const [maxVw, setMaxVw] = useState(1280);
  const [minPx, setMinPx] = useState(16);
  const [maxPx, setMaxPx] = useState(36);
  const [sliderVw, setSliderVw] = useState(768);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handlePxChange = (val: string) => {
    setPxVal(val);
    const n = parseFloat(val);
    if (!isNaN(n)) {
      setRemVal((n / rootPx).toFixed(4).replace(/\.?0+$/, ""));
    } else {
      setRemVal("");
    }
  };

  const handleRemChange = (val: string) => {
    setRemVal(val);
    const n = parseFloat(val);
    if (!isNaN(n)) {
      setPxVal((n * rootPx).toFixed(2).replace(/\.?0+$/, ""));
    } else {
      setPxVal("");
    }
  };

  const handleRootChange = (newRoot: number) => {
    setRootPx(newRoot);
    const n = parseFloat(pxVal);
    if (!isNaN(n)) {
      setRemVal((n / newRoot).toFixed(4).replace(/\.?0+$/, ""));
    }
  };

  // Fluid Clamp Formula
  const clampResult = useMemo(() => {
    if (maxVw <= minVw) return null;
    const minRem = (minPx / rootPx).toFixed(4).replace(/\.?0+$/, "");
    const maxRem = (maxPx / rootPx).toFixed(4).replace(/\.?0+$/, "");

    // slope = (maxPx - minPx) / (maxVw - minVw)
    const slope = (maxPx - minPx) / (maxVw - minVw);
    const slopeVw = (slope * 100).toFixed(4).replace(/\.?0+$/, "");

    // intersection = (-minVw * slope + minPx) / rootPx
    const interceptPx = -minVw * slope + minPx;
    const interceptRem = (interceptPx / rootPx).toFixed(4).replace(/\.?0+$/, "");

    const sign = interceptPx >= 0 ? "+" : "-";
    const absIntercept = Math.abs(parseFloat(interceptRem));

    const cssClamp = `clamp(${minRem}rem, ${slopeVw}vw ${sign} ${absIntercept}rem, ${maxRem}rem)`;

    // Calculate current font size at slider viewport width
    const currentPx = Math.min(Math.max(minPx, minPx + slope * (sliderVw - minVw)), maxPx);

    return {
      cssClamp,
      minRem,
      maxRem,
      currentPx: currentPx.toFixed(1),
    };
  }, [minVw, maxVw, minPx, maxPx, rootPx, sliderVw]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentPxNum = parseFloat(pxVal) || 0;
  const emVal = remVal;
  const percentVal = currentPxNum ? ((currentPxNum / rootPx) * 100).toFixed(1) : "0";
  const ptVal = currentPxNum ? (currentPxNum * 0.75).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      <ToolSection
        title="PX ↔ REM Converter & Root Base"
        description="Convert pixels to rems with custom root font sizes, plus interactive CSS clamp() fluid typography."
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Root Base (1rem =):</span>
          <div className="flex gap-1.5">
            {[16, 14, 12, 10].map((base) => (
              <button
                key={base}
                type="button"
                onClick={() => handleRootChange(base)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  rootPx === base
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {base}px
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pixels (px)">
            <UnitInput
              unit="px"
              type="number"
              step="any"
              value={pxVal}
              onChange={(e) => handlePxChange(e.target.value)}
              placeholder="16"
              aria-label="Pixels"
            />
          </Field>

          <Field label="Root EM (rem)">
            <UnitInput
              unit="rem"
              type="number"
              step="any"
              value={remVal}
              onChange={(e) => handleRemChange(e.target.value)}
              placeholder="1"
              aria-label="Root EM"
            />
          </Field>
        </div>

        <StatGrid>
          <Stat label="Equivalent EM" value={`${emVal}em`} />
          <Stat label="Percentage (%)" value={`${percentVal}%`} />
          <Stat label="Points (pt)" value={`${ptVal}pt`} />
          <Stat label="Root Base" value={`${rootPx}px`} />
        </StatGrid>
      </ToolSection>

      <ToolDivider />

      {/* Fluid Typography Section */}
      <ToolSection
        title="Fluid Typography Formula (clamp)"
        description="Generate responsive text that scales smoothly between mobile and desktop screen sizes without media queries."
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Min Viewport (px)">
            <UnitInput
              unit="px"
              type="number"
              value={minVw}
              onChange={(e) => setMinVw(parseInt(e.target.value, 10) || 0)}
            />
          </Field>

          <Field label="Max Viewport (px)">
            <UnitInput
              unit="px"
              type="number"
              value={maxVw}
              onChange={(e) => setMaxVw(parseInt(e.target.value, 10) || 0)}
            />
          </Field>

          <Field label="Min Size (px)">
            <UnitInput
              unit="px"
              type="number"
              value={minPx}
              onChange={(e) => setMinPx(parseInt(e.target.value, 10) || 0)}
            />
          </Field>

          <Field label="Max Size (px)">
            <UnitInput
              unit="px"
              type="number"
              value={maxPx}
              onChange={(e) => setMaxPx(parseInt(e.target.value, 10) || 0)}
            />
          </Field>
        </div>

        {clampResult && (
          <div className="space-y-4 rounded-lg border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated CSS clamp()
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(clampResult.cssClamp, "clamp")}
                className="h-6 text-xs"
              >
                {copiedKey === "clamp" ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy Formula
              </Button>
            </div>
            <p className="font-mono text-xs text-foreground bg-muted/40 p-2.5 rounded break-all">
              font-size: {clampResult.cssClamp};
            </p>

            {/* Live Viewport Resizer Simulator */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Simulate Viewport: {sliderVw}px</span>
                <span className="font-semibold text-primary">Calculated Font: {clampResult.currentPx}px</span>
              </div>
              <input
                type="range"
                min={minVw}
                max={maxVw}
                value={sliderVw}
                onChange={(e) => setSliderVw(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />

              <div className="mt-3 rounded border bg-background p-4 text-center">
                <p
                  style={{ fontSize: `${clampResult.currentPx}px` }}
                  className="font-bold tracking-tight text-foreground transition-all truncate"
                >
                  Responsive Headline
                </p>
              </div>
            </div>
          </div>
        )}
      </ToolSection>

      {/* Tailwind Cheat Sheet */}
      <ToolSection title="Tailwind CSS Font Size Reference">
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Tailwind Class</th>
                <th className="px-3 py-2">REM</th>
                <th className="px-3 py-2">Pixels (16px base)</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TAILWIND_SCALE.map((item) => (
                <tr key={item.cls} className="hover:bg-muted/40">
                  <td className="px-3 py-1.5 font-semibold text-foreground">{item.cls}</td>
                  <td className="px-3 py-1.5">{item.rem}rem</td>
                  <td className="px-3 py-1.5">{item.px}px</td>
                  <td className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => handlePxChange(item.px.toString())}
                      className="text-primary hover:underline"
                    >
                      Use
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ToolSection>
    </div>
  );
}
