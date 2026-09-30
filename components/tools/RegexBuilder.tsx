"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Copy, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CodeBlock } from "@/components/tool/code-block";
import { Chips, Field, Notice, Segmented, SelectInput, TextArea, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Highlighted } from "@/components/regex/highlight";
import { Button } from "@/components/ui/button";
import { usePersistentState, saveToolState } from "@/lib/hooks/usePersistentState";
import { sendToTool } from "@/lib/tools/handoff";
import { markToolCompleted } from "@/lib/analytics";
import {
  NO_QUANT,
  SET_CLASS_LABEL,
  TEMPLATES,
  addBlock,
  cloneBlocks,
  compile,
  countBlocks,
  describe,
  makeBlock,
  moveBlock,
  updateBlock,
  type Block,
  type BlockType,
  type Quant,
  type QuantKind,
  type SetClass,
} from "@/lib/regex/builder";
import { LANGUAGES, generateCode, type Language } from "@/lib/regex/flavors";
import { createRunner, type RunResult } from "@/lib/regex/run";
import { copyText } from "@/lib/utils/clipboard";
import { toConstructor } from "@/lib/regex/explain";
import { cn } from "@/lib/utils";

const PALETTE: { type: BlockType; label: string; hint: string }[] = [
  { type: "text", label: "Text", hint: "Exact characters" },
  { type: "digit", label: "Digit", hint: "0–9" },
  { type: "letter", label: "Letter", hint: "A–Z, a–z" },
  { type: "alnum", label: "Letter or digit", hint: "A–Z, a–z, 0–9" },
  { type: "word", label: "Word character", hint: "Letter, digit or _" },
  { type: "space", label: "Whitespace", hint: "Space, tab, new line" },
  { type: "any", label: "Any character", hint: "Anything but a new line" },
  { type: "set", label: "Character set", hint: "Pick from a list of characters" },
  { type: "oneof", label: "One of…", hint: "cat, dog or bird" },
  { type: "group", label: "Group", hint: "Capture a part, or repeat several blocks" },
  { type: "look", label: "Look-around", hint: "Check what comes before or after" },
  { type: "start", label: "Start", hint: "Beginning of the text" },
  { type: "end", label: "End", hint: "End of the text" },
  { type: "boundary", label: "Word boundary", hint: "Edge of a word" },
  { type: "raw", label: "Custom piece", hint: "Type a little regex yourself" },
];

const TITLE: Record<BlockType, string> = {
  text: "Text",
  digit: "Digit",
  letter: "Letter",
  alnum: "Letter or digit",
  word: "Word character",
  space: "Whitespace",
  any: "Any character",
  set: "Character set",
  oneof: "One of",
  group: "Group",
  look: "Look-around",
  start: "Start of text",
  end: "End of text",
  boundary: "Word boundary",
  raw: "Custom piece",
};

const QUANTS: { value: QuantKind; label: string }[] = [
  { value: "once", label: "exactly once" },
  { value: "optional", label: "optional (0 or 1)" },
  { value: "star", label: "zero or more" },
  { value: "plus", label: "one or more" },
  { value: "exact", label: "exactly N times" },
  { value: "min", label: "N or more times" },
  { value: "range", label: "between N and M times" },
];

const FLAGS = [
  { flag: "g", label: "Find all" },
  { flag: "i", label: "Ignore case" },
  { flag: "m", label: "Multiline" },
  { flag: "s", label: "Dot matches new line" },
];

interface Ctx {
  update: (id: string, fn: (b: Block) => Block | null) => void;
  add: (type: BlockType, parentId?: string) => void;
  move: (id: string, d: -1 | 1) => void;
}

function AddMenu({ onAdd, label = "Add a block" }: { onAdd: (t: BlockType) => void; label?: string }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SelectInput
        id={id}
        value=""
        onChange={(e) => {
          if (e.target.value) onAdd(e.target.value as BlockType);
        }}
        className="h-9 w-full max-w-xs text-sm"
      >
        <option value="">+ {label}</option>
        {PALETTE.map((p) => (
          <option key={p.type} value={p.type}>
            {p.label} — {p.hint}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}

function QuantEditor({ q, onChange }: { q: Quant; onChange: (q: Quant) => void }) {
  const id = useId();
  const needsN = q.kind === "exact" || q.kind === "min" || q.kind === "range";
  const lazyable = q.kind === "star" || q.kind === "plus" || q.kind === "min" || q.kind === "range" || q.kind === "optional";
  const numInput = (value: number | undefined, key: "n" | "m", label: string) => (
    <input
      aria-label={label}
      type="number"
      min={0}
      max={999}
      value={value ?? ""}
      onChange={(e) => onChange({ ...q, [key]: e.target.value === "" ? undefined : Math.max(0, Math.floor(Number(e.target.value))) })}
      className="h-9 w-16 rounded-lg border border-input bg-background px-2 text-center text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
    />
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        How many times
      </label>
      <SelectInput id={id} value={q.kind} onChange={(e) => { const kind = e.target.value as QuantKind; onChange({ kind, n: kind === "exact" || kind === "min" || kind === "range" ? (q.n ?? 1) : undefined, m: kind === "range" ? (q.m ?? (q.n ?? 1) + 1) : undefined, lazy: q.lazy }); }} className="h-9 w-auto text-sm">
        {QUANTS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectInput>
      {needsN && numInput(q.n, "n", q.kind === "range" ? "Minimum" : "Number of times")}
      {q.kind === "range" && (
        <>
          <span className="text-sm text-muted-foreground">and</span>
          {numInput(q.m, "m", "Maximum")}
        </>
      )}
      {lazyable && q.kind !== "optional" && (
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" checked={!!q.lazy} onChange={(e) => onChange({ ...q, lazy: e.target.checked })} className="size-4 rounded border-input accent-primary" />
          as few as possible
        </label>
      )}
    </div>
  );
}

function BlockEditor({ b, ctx, index, count, depth }: { b: Block; ctx: Ctx; index: number; count: number; depth: number }) {
  const id = useId();
  const set = (patch: Partial<Block>) => ctx.update(b.id, (x) => ({ ...x, ...patch }));
  const toggle = (label: string, checked: boolean | undefined, onChange: (v: boolean) => void) => (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="size-4 rounded border-input accent-primary" />
      {label}
    </label>
  );
  const nested = b.type === "group" || b.type === "look";

  return (
    <li className={cn("rounded-xl border bg-card", depth > 0 && "bg-muted/20")}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-sm font-semibold text-foreground">{TITLE[b.type]}</span>
        <div className="flex items-center">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${TITLE[b.type]} up`} disabled={index === 0} onClick={() => ctx.move(b.id, -1)}>
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${TITLE[b.type]} down`} disabled={index === count - 1} onClick={() => ctx.move(b.id, 1)}>
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${TITLE[b.type]}`} onClick={() => ctx.update(b.id, () => null)}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="space-y-3 p-3">
        {b.type === "text" && (
          <Field label="Match this exact text" htmlFor={`${id}-text`} hint="Special characters such as . ? ( ) are matched literally; you don't need to escape them.">
            <TextInput id={`${id}-text`} value={b.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="for example: https://" spellCheck={false} className="font-mono" />
          </Field>
        )}
        {(b.type === "digit" || b.type === "word" || b.type === "space" || b.type === "alnum") && toggle(`Match anything that is not ${b.type === "digit" ? "a digit" : b.type === "word" ? "a word character" : b.type === "space" ? "whitespace" : "a letter or digit"}`, b.negate, (negate) => set({ negate }))}
        {b.type === "letter" && (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {toggle("Letters from any alphabet (é, ñ, Hindi, Arabic…)", b.unicode, (unicode) => set({ unicode }))}
            {toggle("Match anything that is not a letter", b.negate, (negate) => set({ negate }))}
          </div>
        )}
        {b.type === "boundary" && toggle("Match where it is NOT a word boundary", b.negate, (negate) => set({ negate }))}
        {b.type === "set" && (
          <div className="space-y-3">
            <div role="group" aria-label="Characters to include" className="flex flex-wrap gap-1.5">
              {(Object.keys(SET_CLASS_LABEL) as SetClass[]).map((c) => {
                const on = b.classes?.includes(c);
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => set({ classes: on ? b.classes?.filter((x) => x !== c) : [...(b.classes ?? []), c] })} className={cn("h-7 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50", on ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    {SET_CLASS_LABEL[c]}
                  </button>
                );
              })}
            </div>
            <Field label="Other characters" htmlFor={`${id}-custom`} hint="Type them together. A hyphen between two characters makes a range: a-f matches a, b, c, d, e or f.">
              <TextInput id={`${id}-custom`} value={b.custom ?? ""} onChange={(e) => set({ custom: e.target.value })} placeholder="@#$ or a-f" spellCheck={false} className="font-mono" />
            </Field>
            {toggle("Match anything that is NOT in this set", b.negate, (negate) => set({ negate }))}
          </div>
        )}
        {b.type === "oneof" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Match any one of these</p>
            {(b.options ?? []).map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput aria-label={`Option ${i + 1}`} value={o} onChange={(e) => set({ options: (b.options ?? []).map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`option ${i + 1}`} spellCheck={false} className="font-mono" />
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove option ${i + 1}`} disabled={(b.options ?? []).length <= 1} onClick={() => set({ options: (b.options ?? []).filter((_, j) => j !== i) })}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ options: [...(b.options ?? []), ""] })}>
              <Plus aria-hidden="true" /> Add option
            </Button>
          </div>
        )}
        {b.type === "raw" && (
          <Field label="Regular expression piece" htmlFor={`${id}-raw`} hint="Anything the regex syntax allows, such as [01]\d|2[0-3]. Use it for what the other blocks can't say.">
            <TextInput id={`${id}-raw`} value={b.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="[01]\d|2[0-3]" spellCheck={false} className="font-mono" />
          </Field>
        )}
        {b.type === "look" && (
          <div className="flex flex-wrap items-center gap-3">
            <Segmented size="sm" ariaLabel="Direction" value={b.dir ?? "ahead"} onChange={(dir) => set({ dir })} options={[{ value: "ahead", label: "Followed by" }, { value: "behind", label: "Preceded by" }]} />
            {toggle("Must NOT match", b.negative, (negative) => set({ negative }))}
            <p className="basis-full text-xs text-muted-foreground">A look-around checks without consuming characters, so it never becomes part of the match itself.</p>
          </div>
        )}
        {b.type === "group" && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {toggle("Capture what it matches", b.capture, (capture) => set({ capture }))}
            {b.capture && (
              <TextInput aria-label="Group name (optional)" value={b.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="name (optional)" spellCheck={false} autoCapitalize="off" className="h-9 max-w-48 font-mono" />
            )}
          </div>
        )}

        {nested && (
          <div className="space-y-2 border-l-2 border-primary/30 pl-3">
            {(b.children?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">Empty. Add the blocks this {b.type === "group" ? "group" : "check"} contains.</p> : null}
            <BlockList blocks={b.children ?? []} ctx={ctx} depth={depth + 1} />
            <AddMenu onAdd={(t) => ctx.add(t, b.id)} label={`Add inside this ${b.type === "group" ? "group" : "check"}`} />
          </div>
        )}

        {!NO_QUANT.includes(b.type) && <QuantEditor q={b.quant} onChange={(quant) => set({ quant })} />}
      </div>
    </li>
  );
}

function BlockList({ blocks, ctx, depth }: { blocks: Block[]; ctx: Ctx; depth: number }) {
  if (!blocks.length) return null;
  return (
    <ol className="space-y-2">
      {blocks.map((b, i) => (
        <BlockEditor key={b.id} b={b} ctx={ctx} index={i} count={blocks.length} depth={depth} />
      ))}
    </ol>
  );
}

export default function RegexBuilder() {
  const id = useId();
  const router = useRouter();
  const first = TEMPLATES[0];
  const [blocks, setBlocks] = useState<Block[]>(() => first.build());
  const [flags, setFlags] = usePersistentState<string>("regex-builder-flags", first.flags);
  const [text, setText] = useState(first.sample);
  const [template, setTemplate] = useState<string | null>(first.id);
  const [lang, setLang] = useState<Language>("javascript");
  const [result, setResult] = useState<RunResult | null>(null);
  const runner = useRef<ReturnType<typeof createRunner> | null>(null);

  const compiled = useMemo(() => compile(blocks), [blocks]);
  const effectiveFlags = useMemo(() => [...new Set((flags + compiled.requiredFlags).split(""))].sort((a, b) => "gimsuy".indexOf(a) - "gimsuy".indexOf(b)).join(""), [flags, compiled.requiredFlags]);
  const pattern = compiled.pattern;
  const words = useMemo(() => describe(blocks), [blocks]);

  useEffect(() => {
    runner.current = createRunner(1500);
    return () => runner.current?.dispose();
  }, []);

  useEffect(() => {
    let live = true;
    const t = window.setTimeout(async () => {
      if (!runner.current) return;
      if (!pattern) {
        if (live) setResult(null);
        return;
      }
      const r = await runner.current.run({ pattern, flags: effectiveFlags, text, replacement: "" });
      if (live && !(r.ok === false && r.error === "superseded")) setResult(r);
    }, 120);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [pattern, effectiveFlags, text]);

  const ctx: Ctx = useMemo(
    () => ({
      update: (bid, fn) => {
        setTemplate(null);
        setBlocks((bs) => updateBlock(bs, bid, fn));
      },
      add: (type, parentId) => {
        setTemplate(null);
        setBlocks((bs) => addBlock(bs, makeBlock(type), parentId));
      },
      move: (bid, d) => setBlocks((bs) => moveBlock(bs, bid, d)),
    }),
    []
  );

  const loadTemplate = (tid: string) => {
    const t = TEMPLATES.find((x) => x.id === tid)!;
    setBlocks(cloneBlocks(t.build()));
    setFlags(t.flags);
    setText(t.sample);
    setTemplate(tid);
  };

  const toggleFlag = (f: string) => setFlags(flags.includes(f) ? flags.replace(f, "") : [...flags, f].join(""));
  const ok = result?.ok ? result : null;
  const code = useMemo(() => (pattern ? generateCode(lang, pattern, effectiveFlags, text.split("\n")[0].slice(0, 60)) : null), [pattern, effectiveFlags, lang, text]);

  const openInTester = () => {
    saveToolState("regex-pattern", pattern);
    saveToolState("regex-flags", effectiveFlags);
    sendToTool("regex-tester", { kind: "text", text }, "Regex Builder");
    router.push("/tools/regex-tester");
  };

  return (
    <div className="space-y-8">
      <ToolSection title="Start from an example" description="Pick one to see how it is put together, then change it, or clear everything and build your own.">
        <Chips ariaLabel="Examples" value={template} onChange={loadTemplate} options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} />
        {template && <p className="text-xs text-muted-foreground">{TEMPLATES.find((t) => t.id === template)?.description}</p>}
      </ToolSection>

      <div className="grid gap-8 @3xl:grid-cols-2">
        <ToolSection
          title="Blocks"
          description={blocks.length ? "Read top to bottom: the expression matches the blocks in this order." : undefined}
          actions={
            blocks.length > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setBlocks([]); setTemplate(null); }}>
                Clear all
              </Button>
            ) : undefined
          }
        >
          {blocks.length === 0 && <Notice tone="info">No blocks yet. Add the first piece of what you want to match: for example Text, Digit or Start.</Notice>}
          <BlockList blocks={blocks} ctx={ctx} depth={0} />
          <div className="flex flex-wrap items-center gap-3">
            <AddMenu onAdd={(t) => ctx.add(t)} />
            <span className="text-xs text-muted-foreground">{countBlocks(blocks)} block{countBlocks(blocks) === 1 ? "" : "s"}</span>
          </div>
        </ToolSection>

        <div className="space-y-6">
          <ToolSection title="Your regular expression">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3.5 py-3">
              <code className="min-w-0 flex-1 font-mono text-sm break-all text-foreground" aria-label="Generated pattern">
                {pattern ? `/${pattern}/${effectiveFlags}` : <span className="text-muted-foreground">Add blocks to build a pattern.</span>}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Copy regular expression"
                disabled={!pattern}
                onClick={async () => {
                  if (await copyText(`/${pattern}/${effectiveFlags}`)) toast.success("Copied");
                }}
              >
                <Copy aria-hidden="true" />
              </Button>
            </div>
            <div role="group" aria-label="Flags" className="flex flex-wrap gap-1.5">
              {FLAGS.map((f) => {
                const on = effectiveFlags.includes(f.flag);
                return (
                  <button key={f.flag} type="button" aria-pressed={on} onClick={() => toggleFlag(f.flag)} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50", on ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <span className="font-mono">{f.flag}</span> · {f.label}
                  </button>
                );
              })}
            </div>
            {compiled.requiredFlags && <p className="text-xs text-muted-foreground">The {compiled.requiredFlags} flag was added because a block needs it.</p>}
            {compiled.issues.map((i) => (
              <Notice key={i} tone="warning">
                {i}
              </Notice>
            ))}
            {result && !result.ok && !result.timeout && <Notice tone="error">{result.error}</Notice>}
            {result && !result.ok && result.timeout && <Notice tone="warning">This pattern took too long on the test text and was stopped. Make repeated parts more specific.</Notice>}
          </ToolSection>

          {words.length > 0 && (
            <ToolSection title="In plain English">
              <ol className="divide-y rounded-lg border text-sm">
                {words.map((l, i) => (
                  <li key={i} className="px-3.5 py-2 text-foreground" style={{ paddingLeft: `${0.875 + l.depth * 1.25}rem` }}>
                    {l.text}
                  </li>
                ))}
              </ol>
            </ToolSection>
          )}
        </div>
      </div>

      <ToolDivider />

      <ToolSection title="Try it" description="Edit the test text. Matches are highlighted as you build.">
        <Field label="Test text" htmlFor={`${id}-text`}>
          <TextArea id={`${id}-text`} rows={5} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="font-mono" />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground" aria-live="polite">
            {ok ? `${ok.matches.length.toLocaleString()}${ok.capped ? "+" : ""} match${ok.matches.length === 1 ? "" : "es"}${!effectiveFlags.includes("g") && ok.matches.length ? " (first only: turn on Find all)" : ""}` : "Matches"}
          </p>
          <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/30 p-3.5 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">{ok ? <Highlighted text={text} matches={ok.matches} /> : text || <span className="text-muted-foreground">Type some test text.</span>}</pre>
        </div>
        {ok && ok.matches.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {ok.matches.slice(0, 40).map((m, i) => (
              <li key={i} className="rounded-md border bg-background px-2 py-0.5 font-mono text-xs text-foreground">
                {m.text || <span className="text-muted-foreground">(empty)</span>}
              </li>
            ))}
            {ok.matches.length > 40 && <li className="px-1 py-0.5 text-xs text-muted-foreground">+{ok.matches.length - 40} more</li>}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={openInTester} disabled={!pattern}>
            <ArrowUpRight aria-hidden="true" /> Open in the Regex Tester
          </Button>
        </div>
      </ToolSection>

      {code && (
        <ToolSection title="Use it in your language" description="The same expression written for each language, with notes where they differ from JavaScript.">
          <Segmented size="sm" ariaLabel="Language" value={lang} onChange={(l) => { setLang(l); markToolCompleted(); }} options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))} />
          <CodeBlock label={`${LANGUAGES.find((l) => l.id === lang)!.label} · ${LANGUAGES.find((l) => l.id === lang)!.engine}`} code={code.code} maxHeight="20rem" />
          {code.notes.map((n) => (
            <Notice key={n} tone="info">
              {n}
            </Notice>
          ))}
          {lang === "javascript" && <CodeBlock label="Or with the RegExp constructor" code={toConstructor(pattern, effectiveFlags)} maxHeight="6rem" />}
        </ToolSection>
      )}
    </div>
  );
}
