"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chips, Field, Notice, Segmented, TextArea, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { FLAG_INFO, captureGroups, explain, toConstructor, toLiteral } from "@/lib/regex/explain";
import { COMMON_PATTERNS, MAX_MATCHES, createRunner, type RunResult } from "@/lib/regex/run";
import { cn } from "@/lib/utils";

const DEFAULT_PATTERN = COMMON_PATTERNS[0];
/** Highlighting stops here; the counts and lists still cover every match. */
const MAX_MARKS = 1000;

type View = "highlight" | "list" | "replace" | "split";

function Highlighted({ text, matches }: { text: string; matches: { start: number; end: number }[] }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  matches.slice(0, MAX_MARKS).forEach((m, i) => {
    if (m.start < at) return;
    if (m.start > at) parts.push(text.slice(at, m.start));
    parts.push(
      m.end === m.start ? (
        <span key={i} className="mx-px inline-block h-[1.1em] w-0.5 translate-y-[0.15em] bg-primary/60" title={`Empty match at ${m.start}`} />
      ) : (
        <mark
          key={i}
          title={`Match ${i + 1}: characters ${m.start}–${m.end}`}
          className={cn("rounded-sm px-px text-foreground", i % 2 ? "bg-primary/25" : "bg-primary/15")}
        >
          {text.slice(m.start, m.end)}
        </mark>
      )
    );
    at = m.end;
  });
  parts.push(text.slice(at));
  return <>{parts}</>;
}

export default function RegexTester() {
  const id = useId();
  const [pattern, setPattern] = usePersistentState<string>("regex-pattern", DEFAULT_PATTERN.pattern);
  const [flags, setFlags] = usePersistentState<string>("regex-flags", DEFAULT_PATTERN.flags);
  const [text, setText] = useState(DEFAULT_PATTERN.sample);
  const [replacement, setReplacement] = useState("");
  const [view, setView] = useState<View>("highlight");
  const [result, setResult] = useState<RunResult | null>(null);
  const [showExplain, setShowExplain] = useState(true);
  const runner = useRef<ReturnType<typeof createRunner> | null>(null);

  useEffect(() => {
    runner.current = createRunner(1500);
    return () => runner.current?.dispose();
  }, []);

  // Match in the worker whenever anything changes.
  useEffect(() => {
    let live = true;
    const t = window.setTimeout(async () => {
      if (!runner.current) return;
      if (!pattern) {
        if (live) setResult(null);
        return;
      }
      const r = await runner.current.run({ pattern, flags, text, replacement });
      if (live && !(r.ok === false && r.error === "superseded")) setResult(r);
    }, 120);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [pattern, flags, text, replacement]);

  const names = useMemo(() => captureGroups(pattern), [pattern]);
  const lines = useMemo(() => (pattern ? explain(pattern, flags) : []), [pattern, flags]);
  const ok = result?.ok ? result : null;

  const toggleFlag = (f: string) => setFlags(flags.includes(f) ? flags.replace(f, "") : [...flags, f].sort((a, b) => "gimsuy".indexOf(a) - "gimsuy".indexOf(b)).join(""));

  const usePreset = (presetId: string) => {
    const p = COMMON_PATTERNS.find((x) => x.id === presetId)!;
    setPattern(p.pattern);
    setFlags(p.flags);
    setText(p.sample);
  };

  const copy = async (value: string, what: string) => {
    if (await copyText(value)) toast.success(`${what} copied`);
  };

  const groupLabel = (i: number) => (names[i] ? `${i + 1} · ${names[i]}` : String(i + 1));

  return (
    <div className="space-y-8">
      <ToolSection title="Regular expression">
        <div
          className={cn(
            "flex h-12 items-center rounded-lg border bg-background font-mono text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
            result && !result.ok && !result.timeout && "border-destructive"
          )}
        >
          <span className="pl-3 text-muted-foreground select-none">/</span>
          <input
            id={`${id}-pattern`}
            aria-label="Pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            placeholder="[a-z]+@[a-z]+\.com"
            className="h-full min-w-0 flex-1 bg-transparent px-1 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <span className="pr-3 text-muted-foreground select-none">/{flags}</span>
        </div>
        <div role="group" aria-label="Flags" className="flex flex-wrap gap-1.5">
          {FLAG_INFO.map((f) => {
            const on = flags.includes(f.flag);
            return (
              <button
                key={f.flag}
                type="button"
                aria-pressed={on}
                title={f.help}
                onClick={() => toggleFlag(f.flag)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="font-mono">{f.flag}</span> · {f.name}
              </button>
            );
          })}
        </div>
        {result && !result.ok && result.timeout && (
          <Notice tone="warning">
            This pattern took too long on this text and was stopped. It probably backtracks catastrophically — nested repeats like (a+)+ or
            (\w|\d)* can take exponential time. Make the inner part more specific, or remove one of the repeats.
          </Notice>
        )}
        {result && !result.ok && !result.timeout && <Notice tone="error">{result.error}</Notice>}
      </ToolSection>

      <ToolSection title="Common patterns" description="Starting points with sample text. The sample data is made up.">
        <Chips ariaLabel="Common patterns" value={COMMON_PATTERNS.find((p) => p.pattern === pattern)?.id ?? null} onChange={usePreset} options={COMMON_PATTERNS.map((p) => ({ value: p.id, label: p.label }))} />
      </ToolSection>

      <Field label="Test text" htmlFor={`${id}-text`} hint="Nothing you type here is saved or sent anywhere.">
        <TextArea id={`${id}-text`} rows={6} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="font-mono" />
      </Field>

      <ToolDivider />

      <ToolSection
        title={ok ? `${ok.matches.length.toLocaleString()}${ok.capped ? "+" : ""} match${ok.matches.length === 1 ? "" : "es"}` : "Matches"}
        description={
          ok
            ? `${names.length} capture group${names.length === 1 ? "" : "s"} · ${ok.ms < 1 ? "under 1" : Math.round(ok.ms)} ms${ok.capped ? ` · listing stops at ${MAX_MATCHES.toLocaleString()}` : ""}${!flags.includes("g") && ok.matches.length ? " · only the first match, since g is off" : ""}`
            : undefined
        }
        actions={
          <Segmented
            size="sm"
            ariaLabel="Result view"
            value={view}
            onChange={setView}
            options={[
              { value: "highlight", label: "Highlight" },
              { value: "list", label: "List" },
              { value: "replace", label: "Replace" },
              { value: "split", label: "Split" },
            ]}
          />
        }
      >
        {view === "highlight" && (
          <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/30 p-3.5 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
            {ok ? <Highlighted text={text} matches={ok.matches} /> : text || <span className="text-muted-foreground">Type some test text.</span>}
          </pre>
        )}

        {view === "list" &&
          (ok && ok.matches.length ? (
            <div className="max-h-[28rem] overflow-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">#</th>
                    <th scope="col" className="px-3 py-2 font-medium">Match</th>
                    <th scope="col" className="px-3 py-2 font-medium">Position</th>
                    {names.length > 0 && <th scope="col" className="px-3 py-2 font-medium">Groups</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ok.matches.slice(0, MAX_MARKS).map((m, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2 font-mono break-all text-foreground">{m.text || <span className="text-muted-foreground">(empty)</span>}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                        {m.start}–{m.end}
                      </td>
                      {names.length > 0 && (
                        <td className="px-3 py-2">
                          <dl className="space-y-0.5">
                            {m.groups.map((g, gi) => (
                              <div key={gi} className="flex gap-2">
                                <dt className="shrink-0 text-xs text-muted-foreground">{groupLabel(gi)}</dt>
                                <dd className="font-mono text-xs break-all text-foreground">
                                  {g.value === undefined ? <span className="text-muted-foreground">(not matched)</span> : g.value || <span className="text-muted-foreground">(empty)</span>}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No matches.</p>
          ))}

        {view === "replace" && (
          <div className="space-y-4">
            <Field
              label="Replace with"
              htmlFor={`${id}-repl`}
              hint={
                <>
                  <code>$1</code> or <code>$&lt;name&gt;</code> inserts a group, <code>$&amp;</code> the whole match, <code>$$</code> a dollar sign.
                  {!flags.includes("g") && " Only the first match is replaced unless g is on."}
                </>
              }
            >
              <TextInput id={`${id}-repl`} value={replacement} onChange={(e) => setReplacement(e.target.value)} spellCheck={false} className="font-mono" placeholder="$<user> at $2" />
            </Field>
            <TextArea aria-label="Text after replacing" readOnly rows={6} value={ok ? ok.replaced : ""} className="font-mono" />
            <div className="flex justify-end">
              <Button onClick={() => ok && copy(ok.replaced, "Result")} disabled={!ok}>
                <Copy aria-hidden="true" /> Copy result
              </Button>
            </div>
          </div>
        )}

        {view === "split" &&
          (ok ? (
            <>
              <ol className="max-h-96 divide-y overflow-auto rounded-lg border">
                {ok.split.map((s, i) => (
                  <li key={i} className="flex gap-3 px-3.5 py-2 text-sm">
                    <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="min-w-0 font-mono break-all whitespace-pre-wrap text-foreground">{s === undefined ? "(group not matched)" : s || <span className="text-muted-foreground">(empty)</span>}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground">
                As text.split(pattern): the pieces between matches. Captured groups are included as pieces of their own.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to split.</p>
          ))}
      </ToolSection>

      {lines.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={showExplain}
            onClick={() => setShowExplain((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showExplain && "rotate-180")} aria-hidden="true" />
            What this pattern means
          </button>
          {showExplain && (
            <ol className="mt-3 divide-y rounded-lg border">
              {lines.map((l, i) => (
                <li key={i} className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-3 px-3.5 py-2 text-sm" style={{ paddingLeft: `${0.875 + l.depth * 1.25}rem` }}>
                  <code className="font-mono break-all text-primary">{l.token}</code>
                  <span className="text-foreground">{l.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {pattern && (
        <ToolSection title="Use it in JavaScript">
          <div className="space-y-2">
            {[toLiteral(pattern, flags), toConstructor(pattern, flags)].map((code) => (
              <div key={code} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3.5 py-2">
                <code className="min-w-0 flex-1 font-mono text-sm break-all text-foreground">{code}</code>
                <Button variant="ghost" size="icon-sm" aria-label="Copy code" onClick={() => copy(code, "Code")}>
                  <Copy aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Tested with your browser&apos;s JavaScript engine. Python, PHP and Java mostly agree, but differ on details such as look-behind and {"\\p{…}"}.
          </p>
        </ToolSection>
      )}
    </div>
  );
}
