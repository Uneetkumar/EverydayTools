"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Dices, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  Segmented,
  Chips,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
  { label: "Emerald", hex: "#10b981" },
  { label: "Indigo", hex: "#6366f1" },
  { label: "Rose", hex: "#f43f5e" },
  { label: "Amber", hex: "#f59e0b" },
  { label: "Cyan", hex: "#06b6d4" },
  { label: "Violet", hex: "#8b5cf6" },
];

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const clamped = Math.max(0, Math.min(255, Math.round(x)));
        return clamped.toString(16).padStart(2, "0");
      })
      .join("")
  );
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else if (h >= 300 && h < 360) {
    r1 = c; g1 = 0; b1 = x;
  }

  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

// Calculate relative luminance for WCAG contrast
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorPaletteGenerator() {
  const [baseHex, setBaseHex] = useState(PRESET_COLORS[0].hex);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [h, s, l] = useMemo(() => {
    try {
      const [r, g, b] = hexToRgb(baseHex);
      return rgbToHsl(r, g, b);
    } catch {
      return [160, 84, 39];
    }
  }, [baseHex]);

  // Generate full 11-step Tailwind scale (50, 100, 200... 950)
  const tailwindShades = useMemo(() => {
    const steps = [
      { name: "50", lightness: 96 },
      { name: "100", lightness: 90 },
      { name: "200", lightness: 80 },
      { name: "300", lightness: 70 },
      { name: "400", lightness: 60 },
      { name: "500", lightness: 50 },
      { name: "600", lightness: 40 },
      { name: "700", lightness: 30 },
      { name: "800", lightness: 20 },
      { name: "900", lightness: 12 },
      { name: "950", lightness: 6 },
    ];

    return steps.map(({ name, lightness }) => {
      const [r, g, b] = hslToRgb(h, s, lightness);
      const hex = rgbToHex(r, g, b);
      const contrastWhite = getContrastRatio(hex, "#ffffff");
      const contrastBlack = getContrastRatio(hex, "#000000");
      return {
        name,
        hex,
        contrastWhite: contrastWhite.toFixed(1),
        contrastBlack: contrastBlack.toFixed(1),
        bestText: contrastWhite >= 4.5 ? "#ffffff" : "#000000",
      };
    });
  }, [h, s]);

  // Harmonious Schemes
  const harmonies = useMemo(() => {
    const getHexFromH = (hue: number) => {
      const [r, g, b] = hslToRgb(hue, s, l);
      return rgbToHex(r, g, b);
    };

    return [
      { label: "Base", hex: baseHex },
      { label: "Complementary", hex: getHexFromH(h + 180) },
      { label: "Analogous 1", hex: getHexFromH(h - 30) },
      { label: "Analogous 2", hex: getHexFromH(h + 30) },
      { label: "Triadic 1", hex: getHexFromH(h + 120) },
      { label: "Triadic 2", hex: getHexFromH(h + 240) },
    ];
  }, [baseHex, h, s, l]);

  const tailwindConfigSnippet = useMemo(() => {
    const entries = tailwindShades.map((sh) => `      ${sh.name}: '${sh.hex}',`).join("\n");
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n${entries}\n        }\n      }\n    }\n  }\n}`;
  }, [tailwindShades]);

  const cssVariablesSnippet = useMemo(() => {
    return tailwindShades
      .map((sh) => `  --color-brand-${sh.name}: ${sh.hex};`)
      .join("\n");
  }, [tailwindShades]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const randomizeColor = () => {
    const randomHex =
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    setBaseHex(randomHex);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Color Palette & Tailwind Shade Generator"
        description="Generate complete 11-step design shades (50–950), harmonious palettes, and WCAG accessibility contrast scores."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips
            value={null}
            onChange={(val) => {
              const p = PRESET_COLORS.find((x) => x.label === val);
              if (p) setBaseHex(p.hex);
            }}
            options={PRESET_COLORS.map((p) => ({ value: p.label, label: p.label }))}
            ariaLabel="Preset Colors"
          />

          <Button variant="outline" size="sm" onClick={randomizeColor}>
            <Dices className="size-3.5 mr-1.5" /> Random Color
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand Base Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={baseHex}
                onChange={(e) => setBaseHex(e.target.value)}
                className="size-10 cursor-pointer rounded-lg border p-1"
              />
              <TextInput
                value={baseHex}
                onChange={(e) => setBaseHex(e.target.value)}
                className="font-mono uppercase text-sm"
                placeholder="#10b981"
              />
            </div>
          </Field>

          <Field label="HSL Values">
            <TextInput
              value={`hsl(${h}, ${s}%, ${l}%)`}
              readOnly
              className="font-mono text-sm bg-muted/40"
            />
          </Field>
        </div>
      </ToolSection>

      <ToolDivider />

      {/* 11-Step Tailwind Shade Swatches */}
      <ToolSection title="Tailwind Shade Scale (50–950)">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-2">
          {tailwindShades.map((shade) => (
            <div
              key={shade.name}
              style={{ backgroundColor: shade.hex, color: shade.bestText }}
              onClick={() => copyToClipboard(shade.hex, `shade-${shade.name}`)}
              className="flex flex-col justify-between rounded-lg p-2.5 h-24 shadow-soft cursor-pointer transition-transform hover:scale-105 select-none"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{shade.name}</span>
                {copiedKey === `shade-${shade.name}` && <Check className="size-3 text-emerald-400" />}
              </div>
              <div className="font-mono text-[10px] tracking-tight">
                <p className="font-semibold">{shade.hex}</p>
                <p className="opacity-80 text-[9px] mt-0.5">{shade.contrastWhite}:1</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Click any shade card to copy its HEX code. Ratios show WCAG contrast against white.
        </p>
      </ToolSection>

      {/* Color Harmonies */}
      <ToolSection title="Harmonious Color Scheme">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {harmonies.map((item) => (
            <div
              key={item.label}
              style={{ backgroundColor: item.hex }}
              onClick={() => copyToClipboard(item.hex, item.label)}
              className="flex flex-col justify-end rounded-lg p-3 h-28 shadow-soft cursor-pointer transition-transform hover:scale-105 select-none text-white drop-shadow"
            >
              <span className="text-xs font-semibold">{item.label}</span>
              <span className="font-mono text-xs font-bold">{item.hex}</span>
            </div>
          ))}
        </div>
      </ToolSection>

      {/* Code Export Formats */}
      <ToolSection title="Configuration Export">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border bg-card p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Tailwind Config</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(tailwindConfigSnippet, "tw_cfg")}
                className="h-6 text-xs"
              >
                {copiedKey === "tw_cfg" ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy Config
              </Button>
            </div>
            <pre className="font-mono text-xs bg-muted/40 p-2.5 rounded overflow-x-auto max-h-48 text-foreground">
              {tailwindConfigSnippet}
            </pre>
          </div>

          <div className="space-y-2 rounded-lg border bg-card p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">CSS Custom Properties</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(cssVariablesSnippet, "css_vars")}
                className="h-6 text-xs"
              >
                {copiedKey === "css_vars" ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy CSS
              </Button>
            </div>
            <pre className="font-mono text-xs bg-muted/40 p-2.5 rounded overflow-x-auto max-h-48 text-foreground">
              {cssVariablesSnippet}
            </pre>
          </div>
        </div>
      </ToolSection>
    </div>
  );
}
