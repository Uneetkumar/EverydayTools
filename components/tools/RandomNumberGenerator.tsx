"use client";

import React, { useId, useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/tool/code-block";
import { Chips, Field, Notice, Segmented, Stat, StatGrid, TextInput, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { markToolCompleted } from "@/lib/analytics";
import { randomDecimal, randomInt, uniqueInts } from "@/lib/random/random";
import { copyText } from "@/lib/utils/clipboard";

interface Settings {
  min: string;
  max: string;
  count: string;
  unique: boolean;
  decimals: string;
  sort: "none" | "asc" | "desc";
  pad: string;
  separator: "comma" | "space" | "newline";
}

const DEFAULTS: Settings = { min: "1", max: "100", count: "1", unique: false, decimals: "0", sort: "none", pad: "0", separator: "comma" };

const PRESETS: { id: string; label: string; s: Partial<Settings> }[] = [
  { id: "1-10", label: "1 to 10", s: { min: "1", max: "10", count: "1", unique: false, decimals: "0", pad: "0" } },
  { id: "1-100", label: "1 to 100", s: { min: "1", max: "100", count: "1", unique: false, decimals: "0", pad: "0" } },
  { id: "lotto", label: "Pick 6 of 49", s: { min: "1", max: "49", count: "6", unique: true, decimals: "0", sort: "asc", pad: "0" } },
  { id: "pin", label: "4-digit PIN", s: { min: "0", max: "9999", count: "1", unique: false, decimals: "0", pad: "4" } },
  { id: "otp", label: "6-digit code", s: { min: "0", max: "999999", count: "1", unique: false, decimals: "0", pad: "6" } },
  { id: "unit", label: "0 to 1 decimal", s: { min: "0", max: "1", count: "1", unique: false, decimals: "4", pad: "0" } },
];

const SEP = { comma: ", ", space: " ", newline: "\n" } as const;

function parse(s: Settings): { ok: true; min: number; max: number; count: number; decimals: number; pad: number } | { ok: false; error: string } {
  const min = Number(s.min);
  const max = Number(s.max);
  const count = Math.floor(Number(s.count));
  const decimals = Math.floor(Number(s.decimals));
  const pad = Math.floor(Number(s.pad)) || 0;
  if (s.min.trim() === "" || s.max.trim() === "" || !Number.isFinite(min) || !Number.isFinite(max)) return { ok: false, error: "Enter a lowest and a highest number." };
  if (min > max) return { ok: false, error: "The lowest number is bigger than the highest. Swap them." };
  if (!Number.isFinite(count) || count < 1 || count > 10000) return { ok: false, error: "Ask for between 1 and 10,000 numbers." };
  if (!Number.isFinite(decimals) || decimals < 0 || decimals > 10) return { ok: false, error: "Decimal places must be from 0 to 10." };
  if (decimals === 0 && (!Number.isSafeInteger(min) || !Number.isSafeInteger(max))) return { ok: false, error: "For whole numbers, use values within ±9,007,199,254,740,991." };
  if (decimals === 0 && !Number.isInteger(min)) return { ok: false, error: "Whole-number ranges need whole-number limits. Raise the decimal places to use fractions." };
  if (s.unique) {
    const size = decimals === 0 ? max - min + 1 : Math.floor(max * 10 ** decimals) - Math.ceil(min * 10 ** decimals) + 1;
    if (count > size) return { ok: false, error: `Only ${size.toLocaleString()} different values exist in that range, so ${count.toLocaleString()} unique numbers are not possible.` };
  }
  return { ok: true, min, max, count, decimals, pad };
}

function generate(p: Extract<ReturnType<typeof parse>, { ok: true }>, s: Settings): number[] {
  let out: number[];
  if (p.decimals === 0) out = s.unique ? uniqueInts(p.count, p.min, p.max) : Array.from({ length: p.count }, () => randomInt(p.min, p.max));
  else if (s.unique) {
    const f = 10 ** p.decimals;
    out = uniqueInts(p.count, Math.ceil(p.min * f), Math.floor(p.max * f)).map((n) => n / f);
  } else out = Array.from({ length: p.count }, () => randomDecimal(p.min, p.max, p.decimals));
  if (s.sort === "asc") out.sort((a, b) => a - b);
  if (s.sort === "desc") out.sort((a, b) => b - a);
  return out;
}

export default function RandomNumberGenerator() {
  const id = useId();
  const [s, setS] = usePersistentState<Settings>("rng-settings", DEFAULTS);
  const [values, setValues] = useState<number[] | null>(null);
  const check = useMemo(() => parse(s), [s]);

  const format = (n: number) => {
    const digits = check.ok ? check.decimals : 0;
    const body = Math.abs(n).toFixed(digits);
    // Leading zeros only make sense for whole numbers, such as PINs and codes.
    return `${n < 0 ? "-" : ""}${check.ok && check.pad > 0 && digits === 0 ? body.padStart(check.pad, "0") : body}`;
  };

  const run = () => {
    if (!check.ok) return;
    setValues(generate(check, s));
    markToolCompleted();
  };

  const text = values ? values.map(format).join(SEP[s.separator]) : "";
  const stats = useMemo(() => {
    if (!values || values.length < 2) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return { sum, mean: sum / values.length, lo: Math.min(...values), hi: Math.max(...values) };
  }, [values]);

  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });
  const activePreset = PRESETS.find((p) => Object.entries(p.s).every(([k, v]) => s[k as keyof Settings] === v))?.id ?? null;

  return (
    <div className="space-y-8">
      <ToolSection title="Range">
        <Chips ariaLabel="Presets" value={activePreset} onChange={(pid) => setS({ ...DEFAULTS, ...PRESETS.find((p) => p.id === pid)!.s })} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        <div className="grid gap-4 @md:grid-cols-3">
          <Field label="Lowest" htmlFor={`${id}-min`}>
            <TextInput id={`${id}-min`} inputMode="decimal" value={s.min} onChange={(e) => set({ min: e.target.value })} className="tabular-nums" />
          </Field>
          <Field label="Highest" htmlFor={`${id}-max`}>
            <TextInput id={`${id}-max`} inputMode="decimal" value={s.max} onChange={(e) => set({ max: e.target.value })} className="tabular-nums" />
          </Field>
          <Field label="How many" htmlFor={`${id}-count`} hint="Up to 10,000.">
            <TextInput id={`${id}-count`} inputMode="numeric" value={s.count} onChange={(e) => set({ count: e.target.value })} className="tabular-nums" />
          </Field>
        </div>
        <div className="grid gap-x-8 gap-y-4 @md:grid-cols-2">
          <ToggleRow id={`${id}-unique`} label="No repeats" description="Each number appears at most once, like drawing balls from a bag." checked={s.unique} onCheckedChange={(unique) => set({ unique })} />
          <Field label="Decimal places" htmlFor={`${id}-dec`} hint="0 gives whole numbers.">
            <TextInput id={`${id}-dec`} inputMode="numeric" value={s.decimals} onChange={(e) => set({ decimals: e.target.value })} className="w-28 tabular-nums" />
          </Field>
          <Field label="Order">
            <Segmented size="sm" ariaLabel="Sort order" value={s.sort} onChange={(sort) => set({ sort })} options={[{ value: "none", label: "As drawn" }, { value: "asc", label: "Low → high" }, { value: "desc", label: "High → low" }]} />
          </Field>
          <Field label="Pad with leading zeros to" htmlFor={`${id}-pad`} hint="For PINs and codes: 4 turns 7 into 0007.">
            <TextInput id={`${id}-pad`} inputMode="numeric" value={s.pad} onChange={(e) => set({ pad: e.target.value })} className="w-28 tabular-nums" />
          </Field>
        </div>
        {!check.ok && (s.min || s.max) && <Notice tone="warning">{check.error}</Notice>}
        <Button type="button" size="lg" onClick={run} disabled={!check.ok} className="min-w-44">
          <Shuffle aria-hidden="true" /> Generate
        </Button>
      </ToolSection>

      {values && (
        <>
          <ToolDivider />
          <ToolSection
            title={values.length === 1 ? "Your number" : `${values.length.toLocaleString()} numbers`}
            actions={
              <Segmented size="sm" ariaLabel="Separator" value={s.separator} onChange={(separator) => set({ separator })} options={[{ value: "comma", label: "Comma" }, { value: "space", label: "Space" }, { value: "newline", label: "Lines" }]} />
            }
          >
            {values.length === 1 ? (
              <p className="py-2 text-center text-6xl font-semibold tracking-tight tabular-nums text-foreground" role="status" aria-live="polite">
                {format(values[0])}
              </p>
            ) : (
              <CodeBlock label="Numbers" code={text} wrap maxHeight="18rem" />
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (await copyText(text)) toast.success("Copied");
                }}
              >
                Copy {values.length === 1 ? "number" : "all"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={run} disabled={!check.ok}>
                Generate again
              </Button>
            </div>
            {stats && (
              <StatGrid>
                <Stat label="Smallest" value={format(stats.lo)} />
                <Stat label="Largest" value={format(stats.hi)} />
                <Stat label="Sum" value={Number(stats.sum.toFixed(6)).toLocaleString()} />
                <Stat label="Average" value={Number(stats.mean.toFixed(4)).toLocaleString()} />
              </StatGrid>
            )}
          </ToolSection>
        </>
      )}
    </div>
  );
}
