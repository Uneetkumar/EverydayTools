"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Palette, Sparkles, RefreshCw, Eye } from "lucide-react";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): Rgb | null {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return { r, g, b };
}

function rgbToCmyk(r: number, g: number, b: number) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const k = 1 - Math.max(rN, gN, bN);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round(((1 - rN - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gN - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bN - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

export default function ColorConverter() {
  const [hexInput, setHexInput] = useState<string>("#3B82F6");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const rgb = useMemo(() => hexToRgb(hexInput) || { r: 59, g: 130, b: 246 }, [hexInput]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
  const cmyk = useMemo(() => rgbToCmyk(rgb.r, rgb.g, rgb.b), [rgb]);
  const validHex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb]);

  // Harmonies
  const complementaryHex = useMemo(() => {
    const compHsl = { ...hsl, h: (hsl.h + 180) % 360 };
    const compRgb = hslToRgb(compHsl.h, compHsl.s, compHsl.l);
    return rgbToHex(compRgb.r, compRgb.g, compRgb.b);
  }, [hsl]);

  const triadicHexes = useMemo(() => {
    const t1 = hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l);
    const t2 = hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l);
    return [rgbToHex(t1.r, t1.g, t1.b), rgbToHex(t2.r, t2.g, t2.b)];
  }, [hsl]);

  const analogousHexes = useMemo(() => {
    const a1 = hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l);
    const a2 = hslToRgb((hsl.h + 330) % 360, hsl.s, hsl.l);
    return [rgbToHex(a1.r, a1.g, a1.b), rgbToHex(a2.r, a2.g, a2.b)];
  }, [hsl]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleRandomColor = () => {
    const randomHex = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`.toUpperCase();
    setHexInput(randomHex);
  };

  // Contrast calculation with White (#FFF) and Black (#000)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const isLight = luminance > 0.5;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Color Preview & Picker */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="w-full h-44 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center p-4 transition-colors relative overflow-hidden"
            style={{ backgroundColor: validHex }}
          >
            <span
              className={`text-2xl font-extrabold tracking-wider font-mono px-3 py-1 rounded-lg backdrop-blur-md ${
                isLight ? "text-slate-900 bg-white/40" : "text-white bg-black/40"
              }`}
            >
              {validHex}
            </span>
            <span
              className={`text-xs font-semibold mt-2 ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}
            >
              rgb({rgb.r}, {rgb.g}, {rgb.b})
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="color-hex-text" className="text-xs font-bold text-slate-900 dark:text-white">
                Pick or Enter Color
              </label>
              <button
                onClick={handleRandomColor}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Random
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={validHex}
                onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                className="w-12 h-12 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
              />
              <input
                id="color-hex-text"
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                placeholder="#3B82F6"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Converted Format Cards */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Converted Values & CSS Formats
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "hex", label: "HEX Code", value: validHex },
              { key: "rgb", label: "RGB / RGBA", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
              { key: "hsl", label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
              { key: "cmyk", label: "CMYK (Print)", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
              { key: "css_var", label: "CSS Custom Property", value: `--color-accent: ${validHex};` },
              { key: "float_rgb", label: "Normalized GL (0.0-1.0)", value: `${(rgb.r / 255).toFixed(2)}, ${(rgb.g / 255).toFixed(2)}, ${(rgb.b / 255).toFixed(2)}` },
            ].map(({ key, label, value }) => (
              <div
                key={key}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
              >
                <div className="space-y-0.5 overflow-hidden">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{label}</span>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">{value}</p>
                </div>
                <button
                  onClick={() => handleCopy(value, key)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
                  title="Copy"
                >
                  {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Harmonies & Palettes */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Harmonic Color Palettes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Complementary */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Complementary</span>
            <div className="flex h-12 rounded-xl overflow-hidden shadow-inner">
              <button
                onClick={() => setHexInput(validHex)}
                style={{ backgroundColor: validHex }}
                className="flex-1 transition-transform hover:scale-105"
                title={`Base: ${validHex}`}
              />
              <button
                onClick={() => setHexInput(complementaryHex)}
                style={{ backgroundColor: complementaryHex }}
                className="flex-1 transition-transform hover:scale-105"
                title={`Complement: ${complementaryHex}`}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
              <span>{validHex}</span>
              <span>{complementaryHex}</span>
            </div>
          </div>

          {/* Analogous */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Analogous</span>
            <div className="flex h-12 rounded-xl overflow-hidden shadow-inner">
              <button
                onClick={() => setHexInput(analogousHexes[0])}
                style={{ backgroundColor: analogousHexes[0] }}
                className="flex-1"
                title={analogousHexes[0]}
              />
              <button
                onClick={() => setHexInput(validHex)}
                style={{ backgroundColor: validHex }}
                className="flex-1"
                title={validHex}
              />
              <button
                onClick={() => setHexInput(analogousHexes[1])}
                style={{ backgroundColor: analogousHexes[1] }}
                className="flex-1"
                title={analogousHexes[1]}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
              <span>{analogousHexes[0]}</span>
              <span>{validHex}</span>
              <span>{analogousHexes[1]}</span>
            </div>
          </div>

          {/* Triadic */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Triadic</span>
            <div className="flex h-12 rounded-xl overflow-hidden shadow-inner">
              <button
                onClick={() => setHexInput(validHex)}
                style={{ backgroundColor: validHex }}
                className="flex-1"
                title={validHex}
              />
              <button
                onClick={() => setHexInput(triadicHexes[0])}
                style={{ backgroundColor: triadicHexes[0] }}
                className="flex-1"
                title={triadicHexes[0]}
              />
              <button
                onClick={() => setHexInput(triadicHexes[1])}
                style={{ backgroundColor: triadicHexes[1] }}
                className="flex-1"
                title={triadicHexes[1]}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
              <span>{validHex}</span>
              <span>{triadicHexes[0]}</span>
              <span>{triadicHexes[1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
