"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, History, Link2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/tool/code-block";
import { Chips, Field, Notice, Segmented, TextArea, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Highlighted, MAX_MARKS } from "@/components/regex/highlight";
import { Button } from "@/components/ui/button";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { CHEAT_SHEET } from "@/lib/regex/cheatsheet";
import { FLAG_INFO, captureGroups, explain, toLiteral } from "@/lib/regex/explain";
import { LANGUAGES, detectForeignSyntax, explainRegexError, generateCode, portabilityNotes, type Language } from "@/lib/regex/flavors";
import { COMMON_PATTERNS, MAX_MATCHES, createRunner, type RunResult } from "@/lib/regex/run";
import { cn } from "@/lib/utils";

const DEFAULT_PATTERN = COMMON_PATTERNS[0];
const FLAG_ORDER = "dgimsuvy";

type View = "highlight" | "list" | "replace" | "split";
interface Saved {
  pattern: string;
  flags: string;
}

export default function RegexTester() {
  const id = useId();
  const patternRef = useRef<HTMLInputElement>(null);
  const [pattern, setPattern, , restored] = usePersistentState<string>("regex-pattern", DEFAULT_PATTERN.pattern);
  const [flags, setFlags] = usePersistentState<string>("regex-flags", DEFAULT_PATTERN.flags);
  const [history, setHistory, clearHistory] = usePersistentState<Saved[]>("regex-history", []);
  const [text, setText] = useState(DEFAULT_PATTERN.sample);
  const [replacement, setReplacement] = useState("");
  const [view, setView] = useState<View>("highlight");
  const [result, setResult] = useState<RunResult | null>(null);
  const [showExplain, setShowExplain] = useState(true);
  const [lang, setLang] = useState<Language>("javascript");
  const [supportsV, setSupportsV] = useState(false);
  const runner = useRef<ReturnType<typeof createRunner> | null>(null);

  useEffect(() => {
    runner.current = createRunner(1500);
    const t = setTimeout(() => {
      try {
        new RegExp("a", "v");
        setSupportsV(true);
      } catch {
        setSupportsV(false);
      }
    }, 0);
    return () => {
      clearTimeout(t);
      runner.current?.dispose();
    };
  }, []);

  // A shared link (…#p=…&f=gi) opens with that pattern. It is applied once the saved pattern has been restored, so the link wins.
  useEffect(() => {
    if (!restored) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const p = params.get("p");
      if (p !== null && p.length <= 2000) {
        setPattern(p);
        setFlags((params.get("f") ?? "").replace(/[^dgimsuvy]/g, ""));
      }
    }, 0);
    return () => clearTimeout(t);
    // Read the hash once, right after restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

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

  const ok = result?.ok ? result : null;

  // Remember a pattern once it has been left alone for a moment and works.
  useEffect(() => {
    if (!ok || !pattern || pattern.length < 3) return;
    const t = window.setTimeout(() => {
      setHistory((h) => [{ pattern, flags }, ...h.filter((x) => !(x.pattern === pattern && x.flags === flags))].slice(0, 8));
    }, 2500);
    return () => window.clearTimeout(t);
    // Keyed on the pattern and flags only; the result object changes on every keystroke in the test text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, flags, !!ok]);

  const names = useMemo(() => captureGroups(pattern), [pattern]);
  const lines = useMemo(() => (pattern ? explain(pattern, flags) : []), [pattern, flags]);
  const foreign = useMemo(() => (pattern ? detectForeignSyntax(pattern, flags) : []), [pattern, flags]);
  const errorHint = result && !result.ok && !result.timeout ? explainRegexError(result.error, pattern) : null;
  const code = useMemo(() => (pattern ? generateCode(lang, pattern, flags, text.split("\n")[0].slice(0, 60)) : null), [pattern, flags, lang, text]);
  const portability = useMemo(() => (pattern ? portabilityNotes(pattern) : []), [pattern]);
  const activePreset = COMMON_PATTERNS.find((p) => p.pattern === pattern)?.id ?? null;

  const flagList = FLAG_INFO.concat(supportsV ? [{ flag: "v", name: "unicode sets", help: "Stricter Unicode mode with set operations. Replaces u" }] : []).sort((a, b) => FLAG_ORDER.indexOf(a.flag) - FLAG_ORDER.indexOf(b.flag));
  const toggleFlag = (f: string) => {
    let next = flags.includes(f) ? flags.replace(f, "") : flags + f;
    // u and v cannot be used together.
    if (!flags.includes(f) && f === "v") next = next.replace("u", "");
    if (!flags.includes(f) && f === "u") next = next.replace("v", "");
    setFlags([...next].sort((a, b) => FLAG_ORDER.indexOf(a) - FLAG_ORDER.indexOf(b)).join(""));
  };

  const usePreset = (presetId: string) => {
    const p = COMMON_PATTERNS.find((x) => x.id === presetId)!;
    setPattern(p.pattern);
    setFlags(p.flags);
    setText(p.sample);
  };

  const insert = (token: string, caret?: number) => {
    const el = patternRef.current;
    const start = el?.selectionStart ?? pattern.length;
    const end = el?.selectionEnd ?? pattern.length;
    setPattern(pattern.slice(0, start) + token + pattern.slice(end));
    const pos = start + (caret ?? token.length);
    window.requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const copy = async (value: string, what: string) => {
    if (await copyText(value)) toast.success(`${what} copied`);
  };

  const shareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#p=${encodeURIComponent(pattern)}&f=${flags}`;
    return copy(url, "Link");
  };

  const groupLabel = (i: number) => (names[i] ? `${i + 1} · ${names[i]}` : String(i + 1));
  const matchesText = ok ? ok.matches.map((m) => m.text).join("\n") : "";

  return (
    <div className="space-y-8">
      <ToolSection
        title="Regular expression"
        actions={
          <Link href="/tools/regex-builder" className="text-sm text-link hover:underline">
            Not sure how to write it? Build it step by step
          </Link>
        }
      >
        <div className={cn("flex h-12 items-center rounded-lg border bg-background font-mono text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30", result && !result.ok && !result.timeout && "border-destructive")}>
          <span className="pl-3 text-muted-foreground select-none">/</span>
          <input
            ref={patternRef}
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
          {flagList.map((f) => {
            const on = flags.includes(f.flag);
            return (
              <button key={f.flag} type="button" aria-pressed={on} title={f.help} onClick={() => toggleFlag(f.flag)} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50", on ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <span className="font-mono">{f.flag}</span> · {f.name}
              </button>
            );
          })}
        </div>
        {result && !result.ok && result.timeout && (
          <Notice tone="warning">
            This pattern took too long on this text and was stopped. It probably backtracks catastrophically — nested repeats like (a+)+ or (\w|\d)* can take exponential time. Make the inner part more specific, or remove one of the repeats.
          </Notice>
        )}
        {result && !result.ok && !result.timeout && (
          <Notice tone="error">
            {result.error}
            {errorHint && <span className="mt-1 block text-muted-foreground">{errorHint}</span>}
          </Notice>
        )}
        {foreign.map((issue) => (
          <Notice key={issue.id} tone="warning">
            <span className="block">{issue.message}</span>
            {issue.fix && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="mt-2"
                onClick={() => {
                  setPattern(issue.fix!.pattern);
                  setFlags(issue.fix!.flags);
                }}
              >
                <Wand2 aria-hidden="true" /> {issue.fix.label}
              </Button>
            )}
          </Notice>
        ))}
      </ToolSection>

      <ToolSection title="Common patterns" description="Starting points with sample text. The sample data is made up.">
        <Chips ariaLabel="Common patterns" value={activePreset} onChange={usePreset} options={COMMON_PATTERNS.map((p) => ({ value: p.id, label: p.label }))} />
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <History className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Recent</span>
            {history.slice(0, 5).map((h) => (
              <button key={`${h.pattern}/${h.flags}`} type="button" title={`/${h.pattern}/${h.flags}`} onClick={() => { setPattern(h.pattern); setFlags(h.flags); }} className="max-w-48 truncate rounded-full border bg-background px-2.5 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-muted">
                {h.pattern}
              </button>
            ))}
            <button type="button" onClick={clearHistory} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Clear
            </button>
          </div>
        )}
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
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => copy(matchesText, "Matches")}>
                  <Copy aria-hidden="true" /> Copy matches
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => copy(JSON.stringify(ok.matches.map((m) => ({ match: m.text, index: m.start, groups: m.groups.map((g) => g.value ?? null) })), null, 2), "JSON")}>
                  Copy as JSON
                </Button>
              </div>
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
                                  <dd className="font-mono text-xs break-all text-foreground">{g.value === undefined ? <span className="text-muted-foreground">(not matched)</span> : g.value || <span className="text-muted-foreground">(empty)</span>}</dd>
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
            </>
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
              <p className="text-xs text-muted-foreground">As text.split(pattern): the pieces between matches. Captured groups are included as pieces of their own.</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to split.</p>
          ))}
      </ToolSection>

      {lines.length > 0 && (
        <div>
          <button type="button" aria-expanded={showExplain} onClick={() => setShowExplain((v) => !v)} className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
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

      <details className="group rounded-lg border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          Quick reference
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-5 border-t p-3.5">
          <p className="text-xs text-muted-foreground">Select an item to insert it into the pattern at the cursor.</p>
          {CHEAT_SHEET.map((g) => (
            <div key={g.title}>
              <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</h4>
              <ul className="mt-2 grid gap-1.5 @md:grid-cols-2">
                {g.items.map((it) => (
                  <li key={it.token}>
                    <button type="button" onClick={() => insert(it.insert ?? it.token, it.caret)} className="flex w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50">
                      <code className="min-w-16 shrink-0 font-mono text-sm font-semibold text-primary">{it.token}</code>
                      <span className="text-sm text-foreground">{it.meaning}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      {pattern && code && (
        <ToolSection
          title="Use it in your language"
          description="Tested here with JavaScript's engine. Other languages mostly agree but differ in places, listed under the code."
          actions={
            <Button type="button" variant="outline" size="sm" onClick={shareLink}>
              <Link2 aria-hidden="true" /> Copy link to this pattern
            </Button>
          }
        >
          <Segmented size="sm" ariaLabel="Language" value={lang} onChange={setLang} options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))} />
          <CodeBlock label={`${LANGUAGES.find((l) => l.id === lang)!.label} · ${LANGUAGES.find((l) => l.id === lang)!.engine}`} code={code.code} maxHeight="20rem" />
          {code.notes.map((n) => (
            <Notice key={n} tone="info">
              {n}
            </Notice>
          ))}
          {lang === "javascript" && <p className="text-xs text-muted-foreground">Literal form: <code className="font-mono">{toLiteral(pattern, flags)}</code></p>}
          {portability.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[30rem] text-left text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Your pattern uses</th>
                    {LANGUAGES.map((l) => (
                      <th key={l.id} scope="col" className="px-2 py-2 text-center font-medium">
                        {l.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {portability.map((r) => (
                    <tr key={r.feature}>
                      <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">
                        {r.feature}
                      </th>
                      {LANGUAGES.map((l) => (
                        <td key={l.id} className={cn("px-2 py-2 text-center", r.support[l.id] === "yes" ? "text-success" : r.support[l.id] === "no" ? "text-destructive" : "text-warning")}>
                          {r.support[l.id] === "yes" ? "Yes" : r.support[l.id] === "no" ? "No" : "Limited"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ToolSection>
      )}
    </div>
  );
}
