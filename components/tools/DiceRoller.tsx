"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Dices, Minus, Plus } from "lucide-react";
import { Chips, Field, Notice, Segmented, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { markToolCompleted } from "@/lib/analytics";
import { DiceExpression, MAX_DICE, expectedValue, formatDice, parseDice, rollDice, sumDistribution, type DiceRoll } from "@/lib/random/random";
import { cn } from "@/lib/utils";

const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const PRESETS: { label: string; expr: string; help: string }[] = [
  { label: "Advantage (d20)", expr: "2d20kh1", help: "Roll two d20, keep the higher" },
  { label: "Disadvantage (d20)", expr: "2d20kl1", help: "Roll two d20, keep the lower" },
  { label: "Ability score", expr: "4d6kh3", help: "Roll four d6, drop the lowest" },
  { label: "Fireball", expr: "8d6", help: "Eight d6" },
  { label: "Percentile", expr: "d%", help: "1 to 100" },
  { label: "Exploding d6", expr: "3d6!", help: "A 6 is rolled again and added" },
  { label: "Fate / Fudge", expr: "4dF", help: "Four dice of −1, 0 or +1" },
];

/** A six-sided die drawn with pips; other dice get a numbered tile. */
function Pips({ value }: { value: number }) {
  const spots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
  };
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      {spots[value]?.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8.5" className="fill-current" />)}
    </svg>
  );
}

function Die({ value, sides, dropped, exploded, rolling }: { value: number; sides: number | "F"; dropped: boolean; exploded: boolean; rolling: boolean }) {
  const pips = sides === 6 && value >= 1 && value <= 6;
  const fate = sides === "F";
  return (
    <div
      title={exploded ? "Extra die from an exploding roll" : dropped ? "Dropped (not counted)" : undefined}
      className={cn(
        "relative grid size-14 place-items-center rounded-xl border bg-background text-foreground shadow-soft transition-all",
        rolling && "animate-pulse",
        dropped && "opacity-40",
        exploded && "border-primary/60",
        pips ? "p-2.5" : "text-xl font-semibold tabular-nums"
      )}
    >
      {pips ? <Pips value={value} /> : fate ? (value === 0 ? "○" : value > 0 ? "+" : "−") : value}
      {dropped && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-foreground/60" aria-hidden="true" />}
      <span className="sr-only">{dropped ? `${value} (dropped)` : value}</span>
    </div>
  );
}

function Distribution({ count, sides, rolled }: { count: number; sides: number; rolled: number | null }) {
  const dist = useMemo(() => sumDistribution(count, sides), [count, sides]);
  const max = Math.max(...dist.map((d) => d.probability));
  return (
    <div>
      <div className="flex h-28 items-end gap-px" role="img" aria-label={`Chance of each total when rolling ${count}d${sides}. Most likely: ${dist.reduce((a, b) => (b.probability > a.probability ? b : a)).total}.`}>
        {dist.map((d) => (
          <div key={d.total} className="group relative flex-1" style={{ height: `${Math.max(2, (d.probability / max) * 100)}%` }} title={`${d.total}: ${(d.probability * 100).toFixed(d.probability < 0.01 ? 2 : 1)}%`}>
            <div className={cn("size-full rounded-t-sm", d.total === rolled ? "bg-primary" : "bg-primary/30")} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{dist[0].total}</span>
        <span>{dist[dist.length - 1].total}</span>
      </div>
    </div>
  );
}

export default function DiceRoller() {
  const id = useId();
  const [mode, setMode] = useState<"simple" | "notation">("simple");
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [modifier, setModifier] = useState(0);
  const [notation, setNotation] = useState("2d6+3");
  const [roll, setRoll] = useState<DiceRoll | null>(null);
  const [rolled, setRolled] = useState<DiceExpression | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{ expr: string; total: number }[]>([]);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), 0);
    return () => {
      clearTimeout(t);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const simpleExpr = `${count}d${sides}${modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ""}`;
  const parsed = useMemo(() => parseDice(mode === "simple" ? simpleExpr : notation), [mode, simpleExpr, notation]);

  const doRoll = (exprText?: string) => {
    const p = exprText ? parseDice(exprText) : parsed;
    if (!p.ok || rolling) return;
    if (exprText) {
      setMode("notation");
      setNotation(exprText);
    }
    const result = rollDice(p.expr);
    setRolled(p.expr);
    setRolling(true);
    const finish = () => {
      setRoll(result);
      setRolling(false);
      setHistory((h) => [{ expr: p.canonical, total: result.total }, ...h].slice(0, 12));
      markToolCompleted();
    };
    if (reduced) finish();
    else timer.current = window.setTimeout(finish, 450);
  };

  const single = rolled && rolled.terms.length === 1 && !rolled.terms[0].keep && !rolled.terms[0].exploding && rolled.terms[0].sides !== "F" && rolled.terms[0].sign === 1 ? rolled.terms[0] : null;
  const mean = rolled ? expectedValue(rolled) : null;

  return (
    <div className="space-y-8">
      <ToolSection title="Choose your dice">
        <Segmented ariaLabel="Mode" value={mode} onChange={setMode} options={[{ value: "simple", label: "Pick dice" }, { value: "notation", label: "Dice notation" }]} />
        {mode === "simple" ? (
          <div className="space-y-4">
            <Field label="Die">
              <Chips ariaLabel="Die type" value={`d${sides}`} onChange={(v) => setSides(Number(v.slice(1)))} options={DIE_TYPES.map((d) => ({ value: `d${d}`, label: `d${d}` }))} />
            </Field>
            <div className="flex flex-wrap items-end gap-6">
              <Field label="How many dice">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label="One fewer die" onClick={() => setCount((c) => Math.max(1, c - 1))}>
                    <Minus aria-hidden="true" />
                  </Button>
                  <span className="w-10 text-center text-lg font-semibold tabular-nums" aria-live="polite">{count}</span>
                  <Button type="button" variant="outline" size="icon" aria-label="One more die" onClick={() => setCount((c) => Math.min(MAX_DICE, c + 1))}>
                    <Plus aria-hidden="true" />
                  </Button>
                </div>
              </Field>
              <Field label="Modifier">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label="Decrease modifier" onClick={() => setModifier((m) => m - 1)}>
                    <Minus aria-hidden="true" />
                  </Button>
                  <span className="w-10 text-center text-lg font-semibold tabular-nums" aria-live="polite">{modifier > 0 ? `+${modifier}` : modifier}</span>
                  <Button type="button" variant="outline" size="icon" aria-label="Increase modifier" onClick={() => setModifier((m) => m + 1)}>
                    <Plus aria-hidden="true" />
                  </Button>
                </div>
              </Field>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Dice notation" htmlFor={`${id}-n`} hint="NdS+M — for example 2d6+3. Also kh/kl (keep highest/lowest), ! (exploding), d% and dF.">
              <TextInput id={`${id}-n`} value={notation} onChange={(e) => setNotation(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doRoll()} placeholder="2d6+3" spellCheck={false} autoCapitalize="off" className="font-mono" aria-invalid={!parsed.ok && notation.trim() !== ""} />
            </Field>
            {!parsed.ok && notation.trim() && <Notice tone="error">{parsed.error}</Notice>}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Presets</span>
              {PRESETS.map((p) => (
                <button key={p.expr} type="button" title={p.help} onClick={() => doRoll(p.expr)} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="lg" onClick={() => doRoll()} disabled={!parsed.ok || rolling} className="min-w-40">
            <Dices aria-hidden="true" /> Roll {parsed.ok ? parsed.canonical : ""}
          </Button>
        </div>
      </ToolSection>

      {(roll || rolling) && (
        <>
          <ToolDivider />
          <ToolSection title="Result">
            {roll && (
              <div className="text-center" role="status" aria-live="polite">
                <p className="text-6xl font-semibold tracking-tight tabular-nums text-foreground">{rolling ? "…" : roll.total}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rolled ? formatDice(rolled) : ""} · range {roll.min}–{roll.max ?? "∞"}
                  {mean !== null ? ` · average ${Number.isInteger(mean) ? mean : mean.toFixed(1)}` : ""}
                </p>
              </div>
            )}
            <div className="space-y-3">
              {(roll?.groups ?? (rolled ? rolled.terms.map((t) => ({ term: t, rolls: Array.from({ length: t.count }, () => ({ value: 0, dropped: false, exploded: false })), subtotal: 0 })) : [])).map((g, gi) => (
                <div key={gi} className="flex flex-wrap items-center gap-2">
                  {g.rolls.map((r, i) => (
                    <Die key={i} value={rolling ? Math.max(1, (i * 7 + gi * 3) % (typeof g.term.sides === "number" ? g.term.sides : 3)) : r.value} sides={g.term.sides} dropped={!rolling && r.dropped} exploded={!rolling && r.exploded} rolling={rolling} />
                  ))}
                  {!rolling && g.term.count > 0 && (
                    <span className="ml-1 text-sm text-muted-foreground tabular-nums">
                      {g.term.count}d{g.term.sides}
                      {g.term.keep ? ` keep ${g.term.keep.mode === "high" ? "highest" : "lowest"} ${g.term.keep.n}` : ""}: {g.subtotal >= 0 && gi > 0 ? "+" : ""}
                      {g.subtotal}
                    </span>
                  )}
                </div>
              ))}
              {!rolling && roll && roll.modifier !== 0 && <p className="text-sm text-muted-foreground tabular-nums">Modifier: {roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier}</p>}
            </div>
            {!rolling && single && typeof single.sides === "number" && single.count <= 12 && single.sides <= 30 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-semibold text-foreground">How likely each total is</h4>
                <Distribution count={single.count} sides={single.sides} rolled={roll ? roll.total - (roll.modifier || 0) : null} />
                <p className="text-xs text-muted-foreground">Bars show the exact probability of each total for {single.count}d{single.sides}; the dark one is what you rolled.{single.count > 1 ? " Middle totals are far more likely than the extremes." : " Every face is equally likely."}</p>
              </div>
            )}
          </ToolSection>
        </>
      )}

      {history.length > 0 && (
        <ToolSection title="Recent rolls" actions={<Button type="button" variant="ghost" size="sm" onClick={() => setHistory([])}>Clear</Button>}>
          <ol className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <li key={i} className="rounded-lg border bg-background px-2.5 py-1 text-sm tabular-nums">
                <span className="font-mono text-xs text-muted-foreground">{h.expr}</span> <span className="font-semibold text-foreground">{h.total}</span>
              </li>
            ))}
          </ol>
        </ToolSection>
      )}
    </div>
  );
}
