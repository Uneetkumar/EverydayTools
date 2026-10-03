"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Plus, Trash2, Eye, EyeOff, Layers, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  UnitInput,
  ToggleRow,
  Chips,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface ShadowLayer {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
  visible: boolean;
}

const PRESETS = [
  {
    label: "Subtle Card",
    layers: [
      { id: "1", x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 0.1, inset: false, visible: true },
      { id: "2", x: 0, y: 1, blur: 2, spread: -1, color: "#000000", opacity: 0.1, inset: false, visible: true },
    ],
  },
  {
    label: "Floating Elevation",
    layers: [
      { id: "1", x: 0, y: 10, blur: 25, spread: -5, color: "#000000", opacity: 0.12, inset: false, visible: true },
      { id: "2", x: 0, y: 8, blur: 10, spread: -6, color: "#000000", opacity: 0.08, inset: false, visible: true },
    ],
  },
  {
    label: "Neon Cyan Glow",
    layers: [
      { id: "1", x: 0, y: 0, blur: 10, spread: 2, color: "#06b6d4", opacity: 0.8, inset: false, visible: true },
      { id: "2", x: 0, y: 0, blur: 25, spread: 8, color: "#0891b2", opacity: 0.5, inset: false, visible: true },
      { id: "3", x: 0, y: 0, blur: 50, spread: 15, color: "#0e7490", opacity: 0.3, inset: false, visible: true },
    ],
  },
  {
    label: "Neumorphic Soft",
    layers: [
      { id: "1", x: -6, y: -6, blur: 16, spread: 0, color: "#ffffff", opacity: 0.8, inset: false, visible: true },
      { id: "2", x: 6, y: 6, blur: 16, spread: 0, color: "#a3b1c6", opacity: 0.4, inset: false, visible: true },
    ],
  },
  {
    label: "Dual Rim Highlight",
    layers: [
      { id: "1", x: 0, y: 0, blur: 0, spread: 1, color: "#3b82f6", opacity: 0.7, inset: false, visible: true },
      { id: "2", x: 0, y: 4, blur: 14, spread: 2, color: "#1d4ed8", opacity: 0.25, inset: false, visible: true },
    ],
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

export default function BoxShadowGenerator() {
  const [layers, setLayers] = useState<ShadowLayer[]>(PRESETS[1].layers);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [borderRadius, setBorderRadius] = useState(16);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeLayer = layers[activeLayerIndex] || layers[0];

  const updateActiveLayer = (patch: Partial<ShadowLayer>) => {
    setLayers((prev) =>
      prev.map((l, idx) => (idx === activeLayerIndex ? { ...l, ...patch } : l))
    );
  };

  const addLayer = () => {
    if (layers.length >= 5) {
      toast.error("Maximum 5 shadow layers allowed");
      return;
    }
    const newLayer: ShadowLayer = {
      id: Math.random().toString(36).slice(2, 7),
      x: 0,
      y: 4,
      blur: 12,
      spread: 0,
      color: "#000000",
      opacity: 0.15,
      inset: false,
      visible: true,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerIndex(layers.length);
  };

  const removeLayer = (idx: number) => {
    if (layers.length <= 1) {
      toast.error("You must have at least one layer");
      return;
    }
    setLayers((prev) => prev.filter((_, i) => i !== idx));
    setActiveLayerIndex(Math.max(0, idx - 1));
  };

  // Build CSS box-shadow string
  const cssShadowValue = useMemo(() => {
    const visible = layers.filter((l) => l.visible);
    if (visible.length === 0) return "none";
    return visible
      .map((l) => {
        const rgba = hexToRgba(l.color, l.opacity);
        return `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${rgba}`;
      })
      .join(", ");
  }, [layers]);

  const tailwindValue = useMemo(() => {
    const compact = cssShadowValue.replace(/\s+/g, "_");
    return `shadow-[${compact}]`;
  }, [cssShadowValue]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="CSS Box Shadow Generator"
        description="Craft multi-layer smooth shadows with live preview, Tailwind arbitrary values, and elevation presets."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const p = PRESETS.find((x) => x.label === val);
            if (p) {
              setLayers(p.layers);
              setActiveLayerIndex(0);
            }
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
          ariaLabel="Box Shadow Presets"
        />
      </ToolSection>

      {/* Interactive Preview Canvas */}
      <div
        className={`relative flex min-h-[300px] items-center justify-center rounded-xl border p-8 transition-colors ${
          darkCanvas ? "bg-zinc-950" : "bg-zinc-100 dark:bg-zinc-900"
        }`}
      >
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setDarkCanvas((d) => !d)}
            aria-label="Toggle dark background"
            className="bg-background/80 backdrop-blur"
          >
            {darkCanvas ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
        </div>

        {/* The Preview Card */}
        <div
          style={{
            boxShadow: cssShadowValue,
            borderRadius: `${borderRadius}px`,
          }}
          className="flex size-56 flex-col items-center justify-center bg-card p-6 text-center transition-all select-none border border-border/40"
        >
          <Layers className="size-8 text-primary mb-2 opacity-80" />
          <p className="text-sm font-semibold text-foreground">Interactive Card</p>
          <p className="text-xs text-muted-foreground mt-1">
            {layers.filter((l) => l.visible).length} shadow layers active
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Layer Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Layers ({layers.length}/5)
            </span>
            <Button variant="outline" size="sm" onClick={addLayer} className="h-7 text-xs">
              <Plus className="size-3 mr-1" /> Add Layer
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {layers.map((l, idx) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setActiveLayerIndex(idx)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeLayerIndex === idx
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>Layer {idx + 1}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setLayers((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, visible: !item.visible } : item))
                    );
                  }}
                  className="opacity-70 hover:opacity-100"
                >
                  {l.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                </span>
                {layers.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(idx);
                    }}
                    className="opacity-60 hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeLayer && (
            <div className="space-y-3 rounded-lg border bg-card p-4 shadow-soft">
              <div className="grid grid-cols-2 gap-3">
                <Field label={`X Offset: ${activeLayer.x}px`}>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={activeLayer.x}
                    onChange={(e) => updateActiveLayer({ x: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label={`Y Offset: ${activeLayer.y}px`}>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={activeLayer.y}
                    onChange={(e) => updateActiveLayer({ y: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`Blur Radius: ${activeLayer.blur}px`}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeLayer.blur}
                    onChange={(e) => updateActiveLayer({ blur: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label={`Spread Radius: ${activeLayer.spread}px`}>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={activeLayer.spread}
                    onChange={(e) => updateActiveLayer({ spread: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Shadow Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeLayer.color}
                      onChange={(e) => updateActiveLayer({ color: e.target.value })}
                      className="size-8 cursor-pointer rounded border p-0.5"
                    />
                    <TextInput
                      value={activeLayer.color}
                      onChange={(e) => updateActiveLayer({ color: e.target.value })}
                      className="font-mono uppercase h-8 text-xs"
                    />
                  </div>
                </Field>
                <Field label={`Opacity: ${Math.round(activeLayer.opacity * 100)}%`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={activeLayer.opacity}
                    onChange={(e) => updateActiveLayer({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-primary pt-2"
                  />
                </Field>
              </div>

              <div className="pt-2">
                <ToggleRow
                  id="layer-inset"
                  label="Inset Shadow (Inner)"
                  description="Cast shadow inside the border frame"
                  checked={activeLayer.inset}
                  onCheckedChange={(checked) => updateActiveLayer({ inset: checked })}
                />
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card p-3">
            <Field label={`Card Border Radius: ${borderRadius}px`}>
              <input
                type="range"
                min="0"
                max="60"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </Field>
          </div>
        </div>

        {/* Code Outputs */}
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated Code
          </span>

          <div className="space-y-3">
            {[
              {
                label: "CSS box-shadow",
                code: `box-shadow: ${cssShadowValue};`,
                key: "css",
              },
              {
                label: "Tailwind CSS Arbitrary Class",
                code: tailwindValue,
                key: "tw",
              },
              {
                label: "React Style Object",
                code: `style={{ boxShadow: '${cssShadowValue}' }}`,
                key: "react",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-lg border bg-card p-3 shadow-soft space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(item.code, item.key)}
                    className="h-6 text-xs"
                  >
                    {copiedKey === item.key ? (
                      <Check className="size-3 text-success mr-1" />
                    ) : (
                      <Copy className="size-3 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="font-mono text-xs text-foreground bg-muted/40 p-2 rounded break-all">
                  {item.code}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
