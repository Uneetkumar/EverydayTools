"use client";

import React, { useState, useMemo } from "react";
import { Check, X, Eye, RefreshCw, Sparkles, Sliders } from "lucide-react";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 0,
      g: parseInt(clean[1] + clean[1], 16) || 0,
      b: parseInt(clean[2] + clean[2], 16) || 0,
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  };
}

// Relative luminance per WCAG 2.1 specification
function getLuminance(rgb: Rgb): number {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(fg: Rgb, bg: Rgb): number {
  const lum1 = getLuminance(fg);
  const lum2 = getLuminance(bg);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Color blindness matrix transformation approximations
function simulateColorBlindness(rgb: Rgb, type: "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia"): string {
  let r = rgb.r;
  let g = rgb.g;
  let b = rgb.b;

  if (type === "protanopia") {
    r = 0.56667 * rgb.r + 0.43333 * rgb.g;
    g = 0.55833 * rgb.r + 0.44167 * rgb.g;
    b = 0.24167 * rgb.g + 0.75833 * rgb.b;
  } else if (type === "deuteranopia") {
    r = 0.625 * rgb.r + 0.375 * rgb.g;
    g = 0.7 * rgb.r + 0.3 * rgb.g;
    b = 0.3 * rgb.g + 0.7 * rgb.b;
  } else if (type === "tritanopia") {
    r = 0.95 * rgb.r + 0.05 * rgb.g;
    g = 0.43333 * rgb.g + 0.56667 * rgb.b;
    b = 0.475 * rgb.g + 0.525 * rgb.b;
  } else if (type === "achromatopsia") {
    const gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    r = gray;
    g = gray;
    b = gray;
  }

  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

export default function ContrastChecker() {
  const [fgHex, setFgHex] = useState<string>("#FFFFFF");
  const [bgHex, setBgHex] = useState<string>("#1E40AF");
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");

  const fgRgb = useMemo(() => hexToRgb(fgHex), [fgHex]);
  const bgRgb = useMemo(() => hexToRgb(bgHex), [bgHex]);

  const ratio = useMemo(() => getContrastRatio(fgRgb, bgRgb), [fgRgb, bgRgb]);

  // WCAG Compliance evaluation
  const passAANormal = ratio >= 4.5;
  const passAALarge = ratio >= 3.0;
  const passAAANormal = ratio >= 7.0;
  const passAAALarge = ratio >= 4.5;
  const passUiComponents = ratio >= 3.0;

  const handleSwap = () => {
    const temp = fgHex;
    setFgHex(bgHex);
    setBgHex(temp);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Color Pickers & Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Foreground & Background Colors
              </h2>
              <button
                onClick={handleSwap}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Swap Colors
              </button>
            </div>

            {/* Text / Foreground */}
            <div className="space-y-1.5">
              <label htmlFor="fg-color-text" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Text / Foreground Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fgHex}
                  onChange={(e) => setFgHex(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                />
                <input
                  id="fg-color-text"
                  type="text"
                  value={fgHex}
                  onChange={(e) => setFgHex(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Background */}
            <div className="space-y-1.5">
              <label htmlFor="bg-color-text" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgHex}
                  onChange={(e) => setBgHex(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                />
                <input
                  id="bg-color-text"
                  type="text"
                  value={bgHex}
                  onChange={(e) => setBgHex(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div
            className="w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col justify-center space-y-2 transition-colors min-h-[140px]"
            style={{ backgroundColor: bgHex, color: fgHex }}
          >
            <h3 className="text-lg font-bold tracking-tight">
              Sample Heading Text (Large Text)
            </h3>
            <p className="text-sm leading-relaxed">
              This is standard body copy text. Verify readability against WCAG 2.1 AA/AAA contrast guidelines.
            </p>
          </div>
        </div>

        {/* Contrast Score & Compliance Badges */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Calculated Contrast Ratio
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  passAANormal
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {passAANormal ? "WCAG AA Passed" : "Low Contrast"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {ratio.toFixed(2)}:1
              </span>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:divide-slate-800">
              {[
                { label: "AA Normal Text", req: "≥ 4.5:1", pass: passAANormal },
                { label: "AA Large Text", req: "≥ 3.0:1", pass: passAALarge },
                { label: "AAA Normal Text", req: "≥ 7.0:1", pass: passAAANormal },
                { label: "AAA Large Text", req: "≥ 4.5:1", pass: passAAALarge },
                { label: "UI Components", req: "≥ 3.0:1", pass: passUiComponents },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-slate-400">{item.req}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                        item.pass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {item.pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {item.pass ? "Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Blindness Simulation Previews */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Color Blindness Previews
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Protanopia (Red-Blind)", type: "protanopia" as const },
                { label: "Deuteranopia (Green-Blind)", type: "deuteranopia" as const },
                { label: "Tritanopia (Blue-Blind)", type: "tritanopia" as const },
                { label: "Achromatopsia (Monochrome)", type: "achromatopsia" as const },
              ].map(({ label, type }) => (
                <div
                  key={type}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold"
                  style={{
                    backgroundColor: simulateColorBlindness(bgRgb, type),
                    color: simulateColorBlindness(fgRgb, type),
                  }}
                >
                  <span className="truncate">{label}</span>
                  <span className="text-[10px] uppercase font-mono px-1 rounded bg-black/20">Preview</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
