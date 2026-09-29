"use client";

import React, { useId, useMemo, useState } from "react";
import { Copy, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/color/color-field";
import { TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { copyText } from "@/lib/utils/clipboard";
import { contrast, css, formats, parseColor, ratioText, readColor, rotateHue, scale, toHex, type Rgba } from "@/lib/color/color";

const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
const WHITE: Rgba = { r: 1, g: 1, b: 1, a: 1 };

const HARMONIES: { name: string; turns: number[] }[] = [
  { name: "Complementary", turns: [0, 180] },
  { name: "Analogous", turns: [-30, 0, 30] },
  { name: "Split complementary", turns: [0, 150, 210] },
  { name: "Triadic", turns: [0, 120, 240] },
];

function Swatch({ c, onPick, label }: { c: Rgba; onPick: (hex: string) => void; label?: string }) {
  const hex = toHex(c, false);
  const dark = contrast(WHITE, c) > contrast(BLACK, c);
  return (
    <button
      type="button"
      onClick={() => onPick(hex)}
      title={`Use ${hex}`}
      className="flex h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-md text-[11px] font-medium ring-1 ring-black/10 transition-transform outline-none hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50 dark:ring-white/15"
      style={{ background: hex, color: dark ? "#fff" : "#000" }}
    >
      {label && <span className="opacity-80">{label}</span>}
      <span className="font-mono">{hex}</span>
    </button>
  );
}

export default function ColorConverter() {
  const id = useId();
  const isClient = useIsClient();
  const [text, setText] = useState("#3B82F6");
  const [varName, setVarName] = useState("brand");
  const parsed = useMemo(() => (isClient ? readColor(text) : parseColor(text)), [text, isClient]);
  // Keep showing the last good colour while the text is being edited.
  const [last, setLast] = useState<Rgba>(parseColor("#3B82F6")!);
  if (parsed && (parsed.r !== last.r || parsed.g !== last.g || parsed.b !== last.b || parsed.a !== last.a)) setLast(parsed);
  const c = parsed ?? last;

  const list = useMemo(() => formats(c), [c]);
  const shades = useMemo(() => scale(c), [c]);
  const onWhite = contrast(c, WHITE);
  const onBlack = contrast(c, BLACK);
  const textOn = contrast(WHITE, c) > contrast(BLACK, c) ? "#fff" : "#000";
  const name = varName.trim().replace(/[^\w-]+/g, "-") || "color";

  const copy = async (value: string, what = "Copied") => {
    if (await copyText(value)) toast.success(what);
  };

  const random = () => {
    // Random in OKLCH so the colours are pleasant, not muddy.
    const L = 0.45 + Math.random() * 0.4;
    const C = 0.08 + Math.random() * 0.14;
    const H = Math.random() * 360;
    setText(toHex(parseColor(`oklch(${L} ${C} ${H})`)!, false));
  };

  return (
    <div className="space-y-8">
      <ToolSection
        title="Colour"
        actions={
          <Button variant="ghost" size="sm" onClick={random}>
            <Shuffle aria-hidden="true" /> Random
          </Button>
        }
      >
        <ColorField id={`${id}-c`} label="Any CSS colour" value={text} onChange={setText} hint="HEX, rgb(), hsl(), hwb(), oklch(), oklab() or a name such as tomato." />
        <div className="flex h-28 items-end justify-between rounded-xl p-4 ring-1 ring-black/10 dark:ring-white/15" style={{ background: css(c), color: textOn }}>
          <span className="font-mono text-lg font-semibold">{toHex(c)}</span>
          <span className="text-right text-xs opacity-90">
            On white {ratioText(onWhite)}:1 · on black {ratioText(onBlack)}:1
          </span>
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Formats">
        <ul className="divide-y rounded-lg border">
          {list.map((f) => (
            <li key={f.key} className="flex items-center gap-3 px-3.5 py-2">
              <span className="w-40 shrink-0 text-xs text-muted-foreground">{f.label}</span>
              <code className="min-w-0 flex-1 font-mono text-sm break-all text-foreground">{f.value}</code>
              <Button variant="ghost" size="icon-sm" aria-label={`Copy ${f.label}`} onClick={() => copy(f.value, `${f.label} copied`)}>
                <Copy aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          OKLCH is the modern CSS choice: equal steps in lightness look equal, which makes palettes and hover states easy. CMYK here is a
          screen estimate; printers use their own colour profiles.
        </p>
      </ToolSection>

      <ToolSection title="Shades and tints" description="An 11-step scale spaced evenly in OKLCH lightness, like Tailwind's 50–950.">
        <div className="flex gap-1">
          {shades.map((s) => (
            <Swatch key={s.step} c={s.color} label={String(s.step)} onPick={setText} />
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-44">
            <label htmlFor={`${id}-var`} className="mb-1.5 block text-xs text-muted-foreground">
              CSS variable name
            </label>
            <TextInput id={`${id}-var`} value={varName} onChange={(e) => setVarName(e.target.value)} spellCheck={false} className="h-9 font-mono" />
          </div>
          <Button
            variant="outline"
            onClick={() => copy(`:root {\n${shades.map((s) => `  --${name}-${s.step}: ${toHex(s.color, false).toLowerCase()};`).join("\n")}\n}`, "CSS variables copied")}
          >
            <Copy aria-hidden="true" /> Copy as CSS variables
          </Button>
          <Button variant="ghost" onClick={() => copy(`--${name}: ${toHex(c).toLowerCase()};`, "Variable copied")}>
            Copy --{name}
          </Button>
        </div>
      </ToolSection>

      <ToolSection title="Harmonies" description="Hues turned around the colour wheel in OKLCH, so each keeps the same lightness. Click one to use it.">
        <div className="grid gap-3 @lg:grid-cols-2">
          {HARMONIES.map((h) => (
            <div key={h.name} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{h.name}</p>
              <div className="flex gap-1">
                {h.turns.map((t) => (
                  <Swatch key={t} c={rotateHue(c, t)} onPick={setText} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ToolSection>
    </div>
  );
}
