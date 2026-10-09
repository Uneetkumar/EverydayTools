"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Sparkles, Sliders, Palette } from "lucide-react";
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

const PRESETS = [
  {
    label: "Frosted Glass Card",
    blur: 16,
    bgOpacity: 0.25,
    bgColor: "#ffffff",
    borderWidth: 1,
    borderOpacity: 0.35,
    borderColor: "#ffffff",
    borderRadius: 20,
    saturation: 180,
  },
  {
    label: "Dark HUD Cyberpunk",
    blur: 24,
    bgOpacity: 0.4,
    bgColor: "#0f172a",
    borderWidth: 1,
    borderOpacity: 0.4,
    borderColor: "#06b6d4",
    borderRadius: 16,
    saturation: 200,
  },
  {
    label: "Ultra Minimal Rim",
    blur: 8,
    bgOpacity: 0.1,
    bgColor: "#ffffff",
    borderWidth: 1,
    borderOpacity: 0.2,
    borderColor: "#ffffff",
    borderRadius: 12,
    saturation: 120,
  },
  {
    label: "Deep Obsidian Glass",
    blur: 20,
    bgOpacity: 0.6,
    bgColor: "#000000",
    borderWidth: 1,
    borderOpacity: 0.15,
    borderColor: "#ffffff",
    borderRadius: 24,
    saturation: 150,
  },
];

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export default function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(PRESETS[0].blur);
  const [bgOpacity, setBgOpacity] = useState(PRESETS[0].bgOpacity);
  const [bgColor, setBgColor] = useState(PRESETS[0].bgColor);
  const [borderWidth, setBorderWidth] = useState(PRESETS[0].borderWidth);
  const [borderOpacity, setBorderOpacity] = useState(PRESETS[0].borderOpacity);
  const [borderColor, setBorderColor] = useState(PRESETS[0].borderColor);
  const [borderRadius, setBorderRadius] = useState(PRESETS[0].borderRadius);
  const [saturation, setSaturation] = useState(PRESETS[0].saturation);
  const [bgScene, setBgScene] = useState<"gradient" | "shapes" | "neon">("gradient");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const backgroundRgba = useMemo(() => hexToRgba(bgColor, bgOpacity), [bgColor, bgOpacity]);
  const borderRgba = useMemo(() => hexToRgba(borderColor, borderOpacity), [borderColor, borderOpacity]);

  const cssCode = useMemo(() => {
    return [
      `background: ${backgroundRgba};`,
      `backdrop-filter: blur(${blur}px) saturate(${saturation}%);`,
      `-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);`,
      borderWidth > 0 ? `border: ${borderWidth}px solid ${borderRgba};` : "",
      `border-radius: ${borderRadius}px;`,
      `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [backgroundRgba, borderRgba, blur, saturation, borderWidth, borderRadius]);

  const tailwindCode = useMemo(() => {
    // Tailwind splits classes on whitespace, so spaces inside an arbitrary
    // value must be underscores: bg-[rgba(255,_255,_255,_0.15)].
    const arb = (v: string) => v.replace(/\s+/g, "_");
    return [
      `backdrop-blur-[${blur}px]`,
      `backdrop-saturate-[${saturation}%]`,
      `bg-[${arb(backgroundRgba)}]`,
      borderWidth > 0 ? `border-[${borderWidth}px] border-[${arb(borderRgba)}]` : "",
      `rounded-[${borderRadius}px]`,
      "shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]",
    ]
      .filter(Boolean)
      .join(" ");
  }, [blur, saturation, backgroundRgba, borderWidth, borderRgba, borderRadius]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="CSS Frosted Glass / Glassmorphism Generator"
        description="Design modern frosted glass UI cards with backdrop filters, border reflections, and live visual scenes."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips
            value={null}
            onChange={(val) => {
              const p = PRESETS.find((x) => x.label === val);
              if (p) {
                setBlur(p.blur);
                setBgOpacity(p.bgOpacity);
                setBgColor(p.bgColor);
                setBorderWidth(p.borderWidth);
                setBorderOpacity(p.borderOpacity);
                setBorderColor(p.borderColor);
                setBorderRadius(p.borderRadius);
                setSaturation(p.saturation);
              }
            }}
            options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
            ariaLabel="Glass Presets"
          />

          <Segmented
            value={bgScene}
            onChange={(v) => setBgScene(v as "gradient" | "shapes" | "neon")}
            options={[
              { value: "gradient", label: "Gradient Scene" },
              { value: "shapes", label: "Geometric Shapes" },
              { value: "neon", label: "Neon Glow" },
            ]}
            ariaLabel="Background Scene"
          />
        </div>
      </ToolSection>

      {/* Live Preview Canvas with Background scene */}
      <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-xl border p-8 select-none">
        {/* Dynamic Backgrounds */}
        {bgScene === "gradient" && (
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-700" />
        )}

        {bgScene === "shapes" && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <div className="size-48 rounded-full bg-amber-500 blur-xl opacity-70 -translate-x-20 -translate-y-10" />
            <div className="size-56 rounded-full bg-emerald-500 blur-xl opacity-70 translate-x-20 translate-y-10" />
            <div className="size-40 rounded-full bg-cyan-500 blur-lg opacity-80" />
          </div>
        )}

        {bgScene === "neon" && (
          <div className="absolute inset-0 bg-zinc-950 flex items-center justify-around">
            <div className="h-64 w-32 bg-fuchsia-600 rounded-3xl blur-2xl opacity-60 animate-pulse" />
            <div className="h-64 w-32 bg-cyan-500 rounded-3xl blur-2xl opacity-60" />
          </div>
        )}

        {/* The Glass Card */}
        <div
          style={{
            background: backgroundRgba,
            backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
            border: borderWidth > 0 ? `${borderWidth}px solid ${borderRgba}` : "none",
            borderRadius: `${borderRadius}px`,
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          }}
          className="relative z-10 w-full max-w-sm p-6 text-foreground transition-all"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-5 text-white/90 drop-shadow" />
            <span className="font-semibold tracking-wide text-white drop-shadow">Frosted Glass</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed drop-shadow-sm">
            Everything underneath this card blurs and saturates with GPU-accelerated backdrop-filter styling.
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-white/90">
            <span className="font-mono bg-white/20 px-2 py-0.5 rounded backdrop-blur">
              blur({blur}px)
            </span>
            <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/30 text-white hover:bg-white/40 border-0">
              Interactive
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4 rounded-lg border bg-card p-4 shadow-soft">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Styling Controls
          </span>

          <div className="grid grid-cols-2 gap-4">
            <Field label={`Backdrop Blur: ${blur}px`}>
              <input
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </Field>

            <Field label={`Saturation: ${saturation}%`}>
              <input
                type="range"
                min="50"
                max="250"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Background Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="size-8 cursor-pointer rounded border p-0.5"
                />
                <TextInput
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="font-mono uppercase h-8 text-xs"
                />
              </div>
            </Field>

            <Field label={`Opacity: ${Math.round(bgOpacity * 100)}%`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                className="w-full accent-primary pt-2"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Border Highlight Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="size-8 cursor-pointer rounded border p-0.5"
                />
                <TextInput
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="font-mono uppercase h-8 text-xs"
                />
              </div>
            </Field>

            <Field label={`Border Opacity: ${Math.round(borderOpacity * 100)}%`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={borderOpacity}
                onChange={(e) => setBorderOpacity(parseFloat(e.target.value))}
                className="w-full accent-primary pt-2"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={`Border Width: ${borderWidth}px`}>
              <input
                type="range"
                min="0"
                max="5"
                value={borderWidth}
                onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </Field>

            <Field label={`Corner Radius: ${borderRadius}px`}>
              <input
                type="range"
                min="0"
                max="40"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </Field>
          </div>
        </div>

        {/* Code Output */}
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated Code
          </span>

          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-3 shadow-soft space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pure CSS</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(cssCode, "css")}
                  className="h-6 text-xs"
                >
                  {copiedKey === "css" ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                  Copy
                </Button>
              </div>
              <pre className="font-mono text-xs text-foreground bg-muted/40 p-2.5 rounded overflow-x-auto">
                {cssCode}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-3 shadow-soft space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Tailwind CSS Classes</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(tailwindCode, "tw")}
                  className="h-6 text-xs"
                >
                  {copiedKey === "tw" ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                  Copy
                </Button>
              </div>
              <p className="font-mono text-xs text-foreground bg-muted/40 p-2 rounded break-all">
                {tailwindCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
