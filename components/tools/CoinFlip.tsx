"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Coins, RotateCcw } from "lucide-react";
import { Field, Stat, StatGrid, TextInput, ToolDivider, ToolSection, UnitInput } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { markToolCompleted } from "@/lib/analytics";
import { randomInt } from "@/lib/random/random";
import { cn } from "@/lib/utils";

type Side = 0 | 1;

function CoinFace({ label, tone }: { label: string; tone: "a" | "b" }) {
  return (
    <div
      className={cn(
        "absolute inset-0 grid place-items-center rounded-full border-4 text-center shadow-inner [backface-visibility:hidden]",
        tone === "a" ? "border-amber-400/70 bg-amber-100 text-amber-950 dark:bg-amber-300/25 dark:text-amber-100" : "border-slate-400/60 bg-slate-200 text-slate-900 dark:bg-slate-400/25 dark:text-slate-100"
      )}
      style={tone === "b" ? { transform: "rotateY(180deg)" } : undefined}
    >
      <span className="px-4 text-lg leading-tight font-semibold break-words">{label}</span>
    </div>
  );
}

export default function CoinFlip() {
  const id = useId();
  const [labels, setLabels] = usePersistentState<[string, string]>("coin-labels", ["Heads", "Tails"]);
  const [count, setCount] = useState(1);
  const [flipping, setFlipping] = useState(false);
  const [angle, setAngle] = useState(0);
  const [side, setSide] = useState<Side | null>(null);
  const [batch, setBatch] = useState<Side[]>([]);
  const [history, setHistory] = useState<Side[]>([]);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), 0);
    return () => {
      clearTimeout(t);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const flip = () => {
    if (flipping) return;
    const n = Math.max(1, Math.min(100, Math.floor(count) || 1));
    const results = Array.from({ length: n }, () => randomInt(0, 1) as Side);
    const first = results[0];
    // Land on the chosen face: whole turns plus a half turn when it is the back side.
    setAngle((a) => {
      const base = Math.ceil(a / 360) * 360;
      return base + 1800 + (first === 1 ? 180 : 0);
    });
    const done = () => {
      setSide(first);
      setBatch(results);
      setHistory((h) => [...h, ...results].slice(-200));
      setFlipping(false);
      markToolCompleted();
    };
    if (reduced) {
      setFlipping(true);
      timer.current = window.setTimeout(done, 50);
      return;
    }
    setFlipping(true);
    timer.current = window.setTimeout(done, 1100);
  };

  const reset = () => {
    setHistory([]);
    setBatch([]);
    setSide(null);
  };

  const heads = history.filter((s) => s === 0).length;
  const tails = history.length - heads;
  let streak = 0;
  let longest = 0;
  let run = 0;
  history.forEach((s, i) => {
    run = i > 0 && history[i - 1] === s ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  if (history.length) {
    const last = history[history.length - 1];
    for (let i = history.length - 1; i >= 0 && history[i] === last; i--) streak++;
  }
  const pct = (n: number) => (history.length ? `${((n / history.length) * 100).toFixed(1)}%` : "—");
  const batchHeads = batch.filter((s) => s === 0).length;

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="grid place-items-center py-2" style={{ perspective: "900px" }}>
          <div className="relative size-44" style={{ transformStyle: "preserve-3d", transform: `rotateY(${angle}deg)`, transition: reduced ? "none" : flipping ? "transform 1s cubic-bezier(0.2, 0.7, 0.2, 1)" : "none" }} aria-hidden="true">
            <CoinFace label={labels[0] || "Heads"} tone="a" />
            <CoinFace label={labels[1] || "Tails"} tone="b" />
          </div>
        </div>
        <p className="min-h-8 text-center text-2xl font-semibold text-foreground" aria-live="polite" role="status">
          {flipping ? <span className="text-muted-foreground">Flipping…</span> : side === null ? <span className="text-base font-normal text-muted-foreground">Press Flip to toss the coin</span> : batch.length > 1 ? `${batchHeads} × ${labels[0] || "Heads"}, ${batch.length - batchHeads} × ${labels[1] || "Tails"}` : labels[side] || (side === 0 ? "Heads" : "Tails")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" size="lg" onClick={flip} disabled={flipping} className="min-w-40">
            <Coins aria-hidden="true" /> {count > 1 ? `Flip ${count} coins` : "Flip the coin"}
          </Button>
          {history.length > 0 && (
            <Button type="button" variant="outline" size="lg" onClick={reset}>
              <RotateCcw aria-hidden="true" /> Reset
            </Button>
          )}
        </div>
      </div>

      {batch.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5" aria-label={`Results of ${batch.length} coins`}>
          {batch.slice(0, 100).map((s, i) => (
            <span key={i} title={labels[s]} className={cn("grid size-7 place-items-center rounded-full border text-[11px] font-semibold", s === 0 ? "border-amber-400/70 bg-amber-100 text-amber-950 dark:bg-amber-300/25 dark:text-amber-100" : "border-slate-400/60 bg-slate-200 text-slate-900 dark:bg-slate-400/25 dark:text-slate-100")}>
              {(labels[s] || (s === 0 ? "H" : "T")).charAt(0).toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <ToolDivider />

      <ToolSection title="Options">
        <div className="grid gap-4 @md:grid-cols-3">
          <Field label="Number of coins" htmlFor={`${id}-n`} hint="Flip up to 100 at once.">
            <UnitInput id={`${id}-n`} type="number" min={1} max={100} unit="coins" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </Field>
          <Field label="Side one" htmlFor={`${id}-a`}>
            <TextInput id={`${id}-a`} value={labels[0]} maxLength={24} onChange={(e) => setLabels([e.target.value, labels[1]])} placeholder="Heads" />
          </Field>
          <Field label="Side two" htmlFor={`${id}-b`}>
            <TextInput id={`${id}-b`} value={labels[1]} maxLength={24} onChange={(e) => setLabels([labels[0], e.target.value])} placeholder="Tails" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Decide between</span>
          {[
            ["Heads", "Tails"],
            ["Yes", "No"],
            ["Go", "Stay"],
            ["Me", "You"],
          ].map(([a, b]) => (
            <button key={a} type="button" onClick={() => setLabels([a, b])} className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {a} / {b}
            </button>
          ))}
        </div>
      </ToolSection>

      {history.length > 0 && (
        <ToolSection title="This session" description="Every flip since you opened the page or pressed Reset. Short runs can look lopsided; they even out over many flips.">
          <StatGrid>
            <Stat label="Flips" value={history.length} />
            <Stat label={labels[0] || "Heads"} value={heads} hint={pct(heads)} />
            <Stat label={labels[1] || "Tails"} value={tails} hint={pct(tails)} />
            <Stat label="Longest streak" value={longest} hint={streak > 1 ? `Current: ${streak} in a row` : undefined} />
          </StatGrid>
          <div className="flex flex-wrap gap-1" aria-label="Flip history">
            {history.slice(-60).map((s, i) => (
              <span key={i} className={cn("grid size-5 place-items-center rounded-sm text-[10px] font-semibold", s === 0 ? "bg-amber-100 text-amber-950 dark:bg-amber-300/25 dark:text-amber-100" : "bg-slate-200 text-slate-900 dark:bg-slate-400/25 dark:text-slate-100")}>
                {(labels[s] || (s === 0 ? "H" : "T")).charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
        </ToolSection>
      )}
    </div>
  );
}
