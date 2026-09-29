"use client";

import React from "react";
import { Field } from "@/components/tool/kit";
import { readColor, toHex, type Rgba } from "@/lib/color/color";
import { cn } from "@/lib/utils";

/**
 * A colour typed in any CSS syntax (#hex, rgb(), hsl(), oklch(), names),
 * with a native picker beside it. `onColor` gets the parsed colour, or null
 * while the text can't be read.
 */
export function ColorField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (text: string) => void;
  hint?: React.ReactNode;
}) {
  const color: Rgba | null = readColor(value);
  const invalid = value.trim() !== "" && !color;
  return (
    <Field label={label} htmlFor={id} error={invalid ? "Not a colour this tool can read. Try #2563eb, rgb(37 99 235), hsl(221 83% 53%) or oklch(55% 0.2 263)." : undefined} hint={hint}>
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-lg border border-input bg-background pr-1.5 pl-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          invalid && "border-destructive"
        )}
      >
        <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/15 dark:ring-white/20">
          <span className="sr-only">Pick a colour</span>
          <span className="absolute inset-0 bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-[length:10px_10px]" aria-hidden="true" />
          <span className="absolute inset-0" style={{ background: color ? `rgb(${color.r * 255} ${color.g * 255} ${color.b * 255} / ${color.a})` : "transparent" }} aria-hidden="true" />
          <input
            type="color"
            value={color ? toHex(color, false).toLowerCase() : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-base text-foreground outline-none md:text-sm"
        />
      </div>
    </Field>
  );
}
