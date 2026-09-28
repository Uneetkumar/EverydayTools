"use client";

import React, { useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import CopyButton from "@/components/ui/CopyButton";
import { diff, tokenizeWords } from "@/lib/text/diff";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type Row =
  | { kind: "equal"; left: string; right: string; ln: number; rn: number }
  | { kind: "delete"; left: string; ln: number }
  | { kind: "insert"; right: string; rn: number }
  | { kind: "change"; left: string; right: string; ln: number; rn: number };

/**
 * Line diff (Myers), then word-level highlighting inside lines that were
 * changed rather than wholly added or removed. A run of deletions followed by
 * a run of insertions is paired line by line into "changed" rows.
 */
function buildRows(before: string, after: string, ignoreWs: boolean, ignoreCase: boolean): Row[] {
  // Windows (CRLF) and old Mac (CR) line endings would otherwise make every
  // line differ from the same text saved on Linux or macOS.
  const a = before.replace(/\r\n?/g, "\n").split("\n");
  const b = after.replace(/\r\n?/g, "\n").split("\n");
  const norm = (s: string) => {
    let t = ignoreWs ? s.replace(/\s+/g, " ").trim() : s;
    if (ignoreCase) t = t.toLowerCase();
    return t;
  };
  const ops = diff(a, b, norm);
  const rows: Row[] = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      rows.push({ kind: "equal", left: op.a, right: op.b, ln: op.aIndex + 1, rn: op.bIndex + 1 });
      i++;
      continue;
    }
    const dels: { text: string; n: number }[] = [];
    const ins: { text: string; n: number }[] = [];
    while (i < ops.length && ops[i].type === "delete") {
      const d = ops[i] as Extract<(typeof ops)[number], { type: "delete" }>;
      dels.push({ text: d.a, n: d.aIndex + 1 });
      i++;
    }
    while (i < ops.length && ops[i].type === "insert") {
      const d = ops[i] as Extract<(typeof ops)[number], { type: "insert" }>;
      ins.push({ text: d.b, n: d.bIndex + 1 });
      i++;
    }
    const paired = Math.min(dels.length, ins.length);
    for (let p = 0; p < paired; p++) {
      rows.push({ kind: "change", left: dels[p].text, right: ins[p].text, ln: dels[p].n, rn: ins[p].n });
    }
    for (const d of dels.slice(paired)) rows.push({ kind: "delete", left: d.text, ln: d.n });
    for (const d of ins.slice(paired)) rows.push({ kind: "insert", right: d.text, rn: d.n });
  }
  return rows;
}

/** The two sides of a changed line with the words that differ marked. */
function WordDiff({ left, right, side }: { left: string; right: string; side: "left" | "right" }) {
  const ops = diff(tokenizeWords(left), tokenizeWords(right));
  return (
    <>
      {ops.map((op, i) => {
        if (op.type === "equal") return <span key={i}>{side === "left" ? op.a : op.b}</span>;
        if (op.type === "delete" && side === "left")
          return (
            <del key={i} className="rounded-sm bg-destructive/25 text-foreground no-underline">
              {op.a}
            </del>
          );
        if (op.type === "insert" && side === "right")
          return (
            <ins key={i} className="rounded-sm bg-success/25 text-foreground no-underline">
              {op.b}
            </ins>
          );
        return null;
      })}
    </>
  );
}

const Gutter = ({ n }: { n?: number }) => (
  <span className="w-9 shrink-0 pr-2 text-right text-muted-foreground/70 select-none tabular-nums">{n ?? ""}</span>
);

export default function TextDiffChecker() {
  const [original, setOriginal] = useState<string>(
    "TabBench provides fast online utilities.\nRuns completely in your browser.\nNo login required."
  );
  const [modified, setModified] = useState<string>(
    "TabBench provides fast, private online utilities.\nRuns completely in your local browser.\nNo signup or login required.\nWorks offline once loaded."
  );
  const [view, setView] = useState<"split" | "unified">("split");
  // Two columns of code are unreadable on a phone; narrow screens always get
  // the unified view.
  const wide = useMediaQuery("(min-width: 640px)");
  const effectiveView = wide ? view : "unified";
  const [ignoreWs, setIgnoreWs] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);

  const rows = useMemo(
    () => buildRows(original, modified, ignoreWs, ignoreCase),
    [original, modified, ignoreWs, ignoreCase]
  );
  const added = rows.filter((r) => r.kind === "insert" || r.kind === "change").length;
  const removed = rows.filter((r) => r.kind === "delete" || r.kind === "change").length;
  const identical = rows.every((r) => r.kind === "equal");

  const unifiedText = rows
    .flatMap((r) =>
      r.kind === "equal"
        ? [`  ${r.left}`]
        : r.kind === "delete"
          ? [`- ${r.left}`]
          : r.kind === "insert"
            ? [`+ ${r.right}`]
            : [`- ${r.left}`, `+ ${r.right}`]
    )
    .join("\n");

  const lineClass = "flex min-w-0 px-2 py-1 font-mono text-xs leading-5 whitespace-pre-wrap break-words";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
        {[
          { id: "diff-original", label: "Original text", value: original, set: setOriginal, ph: "Paste the original text…" },
          { id: "diff-modified", label: "Changed text", value: modified, set: setModified, ph: "Paste the changed text…" },
        ].map((f) => (
          <div key={f.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Button type="button" variant="ghost" size="xs" onClick={() => f.set("")} disabled={!f.value}>
                Clear
              </Button>
            </div>
            <textarea
              id={f.id}
              rows={9}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.ph}
              spellCheck={false}
              className="w-full resize-y border-input bg-background p-3 font-mono outline-none focus-visible:border-ring focus-visible:ring-ring/50 md:text-xs dark:bg-input/30 text-base md:text-sm rounded-lg border text-foreground placeholder:text-muted-foreground transition-colors focus-visible:ring-3"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setOriginal(modified);
            setModified(original);
          }}
        >
          <ArrowRightLeft aria-hidden="true" /> Swap
        </Button>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={view}
          onValueChange={(v) => v && setView(v as typeof view)}
          aria-label="Diff layout"
          className="hidden sm:flex"
        >
          <ToggleGroupItem value="split">Side by side</ToggleGroupItem>
          <ToggleGroupItem value="unified">Unified</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Switch id="diff-ws" checked={ignoreWs} onCheckedChange={setIgnoreWs} />
          <Label htmlFor="diff-ws" className="font-normal">Ignore spacing</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="diff-case" checked={ignoreCase} onCheckedChange={setIgnoreCase} />
          <Label htmlFor="diff-case" className="font-normal">Ignore case</Label>
        </div>
      </div>

      <section aria-labelledby="diff-result" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="diff-result" className="type-h4 text-foreground">
            Differences
          </h3>
          {!identical && (
            <div className="flex items-center gap-3">
              <p className="text-sm tabular-nums" aria-live="polite">
                <span className="font-medium text-success">+{added} added</span>
                <span className="text-muted-foreground"> · </span>
                <span className="font-medium text-destructive">−{removed} removed</span>
              </p>
              <CopyButton text={unifiedText} label="Copy diff" size="sm" />
            </div>
          )}
        </div>

        {identical ? (
          <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-foreground" role="status">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            {original === "" && modified === ""
              ? "Paste two texts to compare them."
              : ignoreWs || ignoreCase
                ? "No differences, apart from the spacing or case you chose to ignore."
                : "The two texts are identical."}
          </p>
        ) : (
          <div className="max-h-[36rem] overflow-auto rounded-lg border bg-card">
            {effectiveView === "unified" ? (
              <div role="list">
                {rows.map((r, i) =>
                  r.kind === "equal" ? (
                    <div key={i} role="listitem" className={cn(lineClass, "text-muted-foreground")}>
                      <Gutter n={r.ln} />
                      <span className="w-4 shrink-0 select-none"> </span>
                      <span className="min-w-0">{r.left || " "}</span>
                    </div>
                  ) : (
                    <React.Fragment key={i}>
                      {(r.kind === "delete" || r.kind === "change") && (
                        <div role="listitem" className={cn(lineClass, "bg-destructive/10")}>
                          <Gutter n={r.ln} />
                          <span className="w-4 shrink-0 text-destructive select-none" aria-label="removed">−</span>
                          <span className="min-w-0">
                            {r.kind === "change" ? <WordDiff left={r.left} right={r.right} side="left" /> : r.left || " "}
                          </span>
                        </div>
                      )}
                      {(r.kind === "insert" || r.kind === "change") && (
                        <div role="listitem" className={cn(lineClass, "bg-success/10")}>
                          <Gutter n={r.rn} />
                          <span className="w-4 shrink-0 text-success select-none" aria-label="added">+</span>
                          <span className="min-w-0">
                            {r.kind === "change" ? <WordDiff left={r.left} right={r.right} side="right" /> : r.right || " "}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  )
                )}
              </div>
            ) : (
              <table className="w-full table-fixed border-collapse">
                <caption className="sr-only">Original text on the left, changed text on the right</caption>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-b-0 border-border/50">
                      <td
                        className={cn(
                          "w-1/2 border-r align-top",
                          r.kind === "delete" || r.kind === "change" ? "bg-destructive/10" : r.kind === "insert" ? "bg-muted/40" : ""
                        )}
                      >
                        {r.kind !== "insert" && (
                          <div className={cn(lineClass, r.kind === "equal" && "text-muted-foreground")}>
                            <Gutter n={r.ln} />
                            <span className="min-w-0">
                              {r.kind === "change" ? <WordDiff left={r.left} right={r.right} side="left" /> : r.left || " "}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        className={cn(
                          "w-1/2 align-top",
                          r.kind === "insert" || r.kind === "change" ? "bg-success/10" : r.kind === "delete" ? "bg-muted/40" : ""
                        )}
                      >
                        {r.kind !== "delete" && (
                          <div className={cn(lineClass, r.kind === "equal" && "text-muted-foreground")}>
                            <Gutter n={r.rn} />
                            <span className="min-w-0">
                              {r.kind === "change" ? <WordDiff left={r.left} right={r.right} side="right" /> : r.right || " "}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
