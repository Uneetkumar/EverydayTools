"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolSection } from "@/components/tool/kit";
import { ADJUSTMENT_FIELDS, FILTERS, NEUTRAL, type Adjustments, type Look } from "@/lib/camera/filters";
import { cn } from "@/lib/utils";

/** A labelled native range input: accessible, light, and works on every phone. */
export function RangeRow({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("space-y-1", disabled && "opacity-50")}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <output htmlFor={id} className="text-xs tabular-nums text-muted-foreground">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-5 w-full accent-primary"
      />
    </div>
  );
}

export function FilterPanel({
  look,
  onChange,
  thumbs,
}: {
  look: Look;
  onChange: (look: Look) => void;
  thumbs: Record<string, string>;
}) {
  const id = React.useId();
  return (
    <ToolSection title="Filters" description="Applied live, and saved with every photo and video.">
      <div role="radiogroup" aria-label="Filter" className="grid grid-cols-5 gap-x-2 gap-y-3 @4xl:grid-cols-4">
        {FILTERS.map((f) => {
          const active = look.filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ ...look, filter: f.id, intensity: active ? look.intensity : 1 })}
              className="group min-w-0 rounded-lg text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "block aspect-square overflow-hidden rounded-lg bg-muted ring-offset-2 ring-offset-card transition-shadow",
                  active ? "ring-2 ring-primary" : "ring-1 ring-border group-hover:ring-foreground/25"
                )}
              >
                {thumbs[f.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[f.id]} alt="" className="size-full object-cover" draggable={false} />
                )}
              </span>
              <span
                className={cn(
                  "mt-1.5 block truncate text-xs",
                  active ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {f.name}
              </span>
            </button>
          );
        })}
      </div>
      <RangeRow
        id={`${id}-strength`}
        label="Strength"
        value={Math.round(look.intensity * 100)}
        min={0}
        max={100}
        display={look.filter === "original" ? "—" : `${Math.round(look.intensity * 100)}%`}
        onChange={(v) => onChange({ ...look, intensity: v / 100 })}
        disabled={look.filter === "original"}
      />
    </ToolSection>
  );
}

export function AdjustPanel({ look, onChange }: { look: Look; onChange: (look: Look) => void }) {
  const id = React.useId();
  const changed = (Object.keys(NEUTRAL) as (keyof Adjustments)[]).some((k) => look.adjust[k] !== 0);
  return (
    <ToolSection
      title="Adjust"
      description="Fine-tune on top of the filter."
      actions={
        <Button variant="ghost" size="sm" disabled={!changed} onClick={() => onChange({ ...look, adjust: NEUTRAL })}>
          <RotateCcw aria-hidden="true" /> Reset
        </Button>
      }
    >
      <div className="space-y-3.5">
        {ADJUSTMENT_FIELDS.map((f) => {
          const v = Math.round(look.adjust[f.key] * 100);
          return (
            <RangeRow
              key={f.key}
              id={`${id}-${f.key}`}
              label={f.label}
              value={v}
              min={f.min * 100}
              max={100}
              display={v > 0 && f.min < 0 ? `+${v}` : String(v)}
              onChange={(n) => onChange({ ...look, adjust: { ...look.adjust, [f.key]: n / 100 } })}
            />
          );
        })}
      </div>
    </ToolSection>
  );
}
