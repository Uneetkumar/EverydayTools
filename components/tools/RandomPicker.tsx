"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Shuffle, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Chips, Field, Notice, Segmented, TextArea, TextInput, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { markToolCompleted } from "@/lib/analytics";
import { randomBelow, randomFloat, sample, shuffle } from "@/lib/random/random";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";

type Mode = "wheel" | "winners" | "teams";

const SAMPLE = "Aarav\nMeera\nKabir\nIsha\nRohan\nAnanya\nVivaan\nSara";
const MAX_ENTRIES = 500;
const SPIN_MS = 4200;

const QUICK: { label: string; text: string }[] = [
  { label: "Numbers 1–10", text: Array.from({ length: 10 }, (_, i) => i + 1).join("\n") },
  { label: "Yes / No / Maybe", text: "Yes\nNo\nMaybe" },
  { label: "What's for dinner?", text: "Pizza\nBiryani\nPasta\nDosa\nBurgers\nSalad\nNoodles\nSushi" },
  { label: "Sample names", text: SAMPLE },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function Wheel({ entries, rotation, spinning, animate }: { entries: string[]; rotation: number; spinning: boolean; animate: boolean }) {
  const n = entries.length;
  const step = 360 / Math.max(n, 1);
  const showLabels = n <= 36;
  const fontSize = n <= 8 ? 15 : n <= 16 ? 12 : n <= 24 ? 10 : 8;
  const maxChars = n <= 8 ? 16 : n <= 16 ? 14 : 12;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1" aria-hidden="true">
        <svg width="26" height="30" viewBox="0 0 26 30">
          <path d="M13 28 2 4h22z" className="fill-foreground stroke-background" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <svg viewBox="0 0 200 200" className="size-full text-foreground" role="img" aria-label={`Wheel with ${n} entries`} style={{ transform: `rotate(${rotation}deg)`, transition: spinning && animate ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.6, 0.12, 1)` : "none" }}>
        <circle cx="100" cy="100" r="98" className="fill-card stroke-border" strokeWidth="1.5" />
        {n === 1 ? (
          <circle cx="100" cy="100" r="96" fill="hsl(210 55% 55% / 0.25)" />
        ) : (
          entries.map((_, i) => {
            const [x1, y1] = polar(100, 100, 96, i * step);
            const [x2, y2] = polar(100, 100, 96, (i + 1) * step);
            return <path key={i} d={`M100 100 L${x1} ${y1} A96 96 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2}z`} fill={`hsl(${Math.round((i * 360) / n + 200) % 360} 55% 55% / ${i % 2 ? 0.26 : 0.16})`} stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.5" />;
          })
        )}
        {showLabels &&
          entries.map((label, i) => {
            const mid = (i + 0.5) * step;
            const [x, y] = polar(100, 100, 62, mid);
            const text = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
            return (
              <text key={i} x={x} y={y} fontSize={fontSize} textAnchor="middle" dominantBaseline="middle" fill="currentColor" transform={`rotate(${mid - 90} ${x} ${y})`} className="select-none">
                {text}
              </text>
            );
          })}
        <circle cx="100" cy="100" r="9" className="fill-background stroke-border" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export default function RandomPicker() {
  const id = useId();
  const [text, setText] = usePersistentState<string>("picker-entries", SAMPLE);
  const [mode, setMode] = useState<Mode>("wheel");
  const [removeWinner, setRemoveWinner] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnersCount, setWinnersCount] = useState("1");
  const [drawn, setDrawn] = useState<string[] | null>(null);
  const [teamsBy, setTeamsBy] = useState<"teams" | "size">("teams");
  const [teamsValue, setTeamsValue] = useState("2");
  const [teams, setTeams] = useState<string[][] | null>(null);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), 0);
    return () => {
      clearTimeout(t);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const { entries, duplicates, tooMany } = useMemo(() => {
    const all = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const e of all) {
      const k = e.toLowerCase();
      if (seen.has(k)) dupes.add(e);
      else seen.add(k);
    }
    return { entries: all.slice(0, MAX_ENTRIES), duplicates: [...dupes], tooMany: all.length > MAX_ENTRIES };
  }, [text]);

  const removeAt = (index: number) => {
    const lines = text.split("\n");
    let seen = -1;
    setText(
      lines
        .filter((l) => {
          if (l.trim() === "") return true;
          seen++;
          return seen !== index;
        })
        .join("\n")
    );
  };

  const spin = () => {
    if (spinning || entries.length < 1) return;
    const n = entries.length;
    const w = randomBelow(n);
    const step = 360 / n;
    // Land somewhere inside the winning slice, not always dead centre.
    const within = (randomFloat() - 0.5) * 0.7;
    const desired = (((360 - (w + 0.5 + within) * step) % 360) + 360) % 360;
    const base = Math.floor(rotation / 360) * 360;
    setWinner(null);
    setSpinning(true);
    setRotation(base + 360 * 6 + desired);
    const finish = () => {
      setSpinning(false);
      setWinner(entries[w]);
      markToolCompleted();
      if (removeWinner) timer.current = window.setTimeout(() => removeAt(w), 1400);
    };
    timer.current = window.setTimeout(finish, reduced ? 50 : SPIN_MS + 100);
  };

  const draw = () => {
    const n = Math.max(1, Math.min(entries.length, Math.floor(Number(winnersCount)) || 1));
    const picked = sample(entries, n);
    setDrawn(picked);
    markToolCompleted();
  };

  const makeTeams = () => {
    const v = Math.max(1, Math.floor(Number(teamsValue)) || 1);
    const count = teamsBy === "teams" ? Math.min(v, entries.length) : Math.max(1, Math.ceil(entries.length / v));
    const mixed = shuffle(entries);
    const out: string[][] = Array.from({ length: count }, () => []);
    mixed.forEach((name, i) => out[i % count].push(name));
    setTeams(out);
    markToolCompleted();
  };

  const copy = async (value: string) => {
    if (await copyText(value)) toast.success("Copied");
  };

  return (
    <div className="space-y-8">
      <ToolSection title="Names or options" description="One per line. Saved in this browser only, for a few days.">
        <Field label="Entries" htmlFor={`${id}-entries`}>
          <TextArea id={`${id}-entries`} rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Type or paste names,\none per line"} spellCheck={false} />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick fill</span>
          {QUICK.map((q) => (
            <button key={q.label} type="button" onClick={() => setText(q.text)} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted">
              {q.label}
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setText(shuffle(text.split("\n").filter((l) => l.trim())).join("\n"))} disabled={entries.length < 2}>
            <Shuffle aria-hidden="true" /> Shuffle order
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
          {duplicates.length > 0 ? ` · repeated: ${duplicates.slice(0, 3).join(", ")}${duplicates.length > 3 ? "…" : ""} (repeats get extra chances)` : ""}
        </p>
        {tooMany && <Notice tone="warning">Only the first {MAX_ENTRIES} entries are used.</Notice>}
      </ToolSection>

      <ToolDivider />

      <Segmented ariaLabel="What do you want to do?" value={mode} onChange={setMode} options={[{ value: "wheel", label: "Spin the wheel" }, { value: "winners", label: "Draw winners" }, { value: "teams", label: "Make teams" }]} />

      {mode === "wheel" && (
        <ToolSection title="Wheel">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add at least one entry to spin the wheel.</p>
          ) : (
            <>
              <Wheel entries={entries} rotation={rotation} spinning={spinning} animate={!reduced} />
              <div className="text-center" role="status" aria-live="polite">
                {spinning ? <p className="text-lg text-muted-foreground">Spinning…</p> : winner !== null ? <p className="text-3xl font-semibold break-words text-foreground">{winner}</p> : <p className="text-sm text-muted-foreground">Press Spin</p>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button type="button" size="lg" onClick={spin} disabled={spinning} className="min-w-40">
                  <Trophy aria-hidden="true" /> Spin
                </Button>
              </div>
              <ToggleRow id={`${id}-remove`} label="Remove the winner after each spin" description="Each entry can win once, like drawing names from a hat." checked={removeWinner} onCheckedChange={setRemoveWinner} className="mx-auto max-w-md" />
            </>
          )}
        </ToolSection>
      )}

      {mode === "winners" && (
        <ToolSection title="Draw winners" description="Each entry can win at most once. Every possible set of winners is equally likely.">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="How many winners" htmlFor={`${id}-w`}>
              <TextInput id={`${id}-w`} inputMode="numeric" value={winnersCount} onChange={(e) => setWinnersCount(e.target.value)} className="w-28 tabular-nums" />
            </Field>
            <Button type="button" size="lg" onClick={draw} disabled={entries.length === 0}>
              <Trophy aria-hidden="true" /> Draw
            </Button>
          </div>
          {Number(winnersCount) > entries.length && entries.length > 0 && <Notice tone="info">There are only {entries.length} entries, so at most {entries.length} can be drawn.</Notice>}
          {drawn && (
            <div className="space-y-3" role="status" aria-live="polite">
              <ol className="divide-y rounded-lg border">
                {drawn.map((d, i) => (
                  <li key={`${d}-${i}`} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="grid size-7 place-items-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-foreground tabular-nums">{i + 1}</span>
                    <span className="text-base font-medium break-words text-foreground">{d}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => copy(drawn.join("\n"))}>
                  Copy winners
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setText(text.split("\n").filter((l) => !drawn.includes(l.trim())).join("\n"))}>
                  Remove them from the list
                </Button>
              </div>
            </div>
          )}
        </ToolSection>
      )}

      {mode === "teams" && (
        <ToolSection title="Make teams" description="Entries are shuffled and dealt out evenly; team sizes differ by at most one.">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Split by">
              <Chips ariaLabel="Split by" value={teamsBy} onChange={setTeamsBy} options={[{ value: "teams", label: "Number of teams" }, { value: "size", label: "People per team" }]} />
            </Field>
            <Field label={teamsBy === "teams" ? "Teams" : "People per team"} htmlFor={`${id}-t`}>
              <TextInput id={`${id}-t`} inputMode="numeric" value={teamsValue} onChange={(e) => setTeamsValue(e.target.value)} className="w-28 tabular-nums" />
            </Field>
            <Button type="button" size="lg" onClick={makeTeams} disabled={entries.length < 2}>
              <Users aria-hidden="true" /> Make teams
            </Button>
          </div>
          {teams && (
            <div className="space-y-3" role="status" aria-live="polite">
              <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
                {teams.map((t, i) => (
                  <div key={i} className={cn("rounded-lg border bg-background p-3.5")}>
                    <h4 className="text-sm font-semibold text-foreground">
                      Team {i + 1} <span className="font-normal text-muted-foreground">· {t.length}</span>
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {t.map((m, j) => (
                        <li key={`${m}-${j}`} className="break-words">{m}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => copy(teams.map((t, i) => `Team ${i + 1}: ${t.join(", ")}`).join("\n"))}>
                Copy teams
              </Button>
            </div>
          )}
        </ToolSection>
      )}
    </div>
  );
}
