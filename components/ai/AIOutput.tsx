"use client";

import React, { useMemo, useState } from "react";
import ModelStatus from "./ModelStatus";
import CopyDownloadActions from "./CopyDownloadActions";
import Markdown from "./Markdown";
import { Segmented } from "@/components/tool/kit";
import { AIProviderType } from "@/lib/ai/types";
import { countWords, diffWords } from "@/lib/ai/nlp/text";

interface AIOutputProps {
  title?: string;
  /** The text copied and saved. Also rendered, unless `children` is given. */
  result: string;
  provider: AIProviderType;
  modelUsed?: string;
  elapsedMs?: number;
  filename?: string;
  toolName?: string;
  onRegenerate?: () => void;
  /** Render `result` as Markdown (model output) or as plain text. */
  format?: "markdown" | "text";
  /** Key numbers shown above the result. */
  stats?: React.ReactNode;
  /** Shown instead of the rendered `result`. */
  children?: React.ReactNode;
  /** When given, offers a "Changes" view: a word diff against this text. */
  compareWith?: string;
  /** Extra buttons next to Copy and Save. */
  extraActions?: React.ReactNode;
}

function DiffView({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => diffWords(before, after), [before, after]);
  const changed = parts.some((p) => p.type !== "same");
  if (!changed) return <p className="text-sm text-muted-foreground">No changes: the result is identical to your text.</p>;
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
      {parts.map((p, i) =>
        p.type === "same" ? (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ) : p.type === "removed" ? (
          <del key={i} className="rounded-sm bg-destructive/10 text-muted-foreground decoration-destructive/60">
            {p.text}
          </del>
        ) : (
          <ins key={i} className="rounded-sm bg-success/15 text-foreground no-underline">
            {p.text}
          </ins>
        )
      )}
    </p>
  );
}

export default function AIOutput({
  title = "Result",
  result,
  provider,
  modelUsed,
  elapsedMs,
  filename,
  toolName,
  onRegenerate,
  format = "markdown",
  stats,
  children,
  compareWith,
  extraActions,
}: AIOutputProps) {
  const [view, setView] = useState<"result" | "changes">("result");
  if (!result && !children) return null;

  const words = countWords(result);

  return (
    <section aria-label={title} className="space-y-4 rounded-xl border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {words.toLocaleString()} words · {result.length.toLocaleString()} characters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <CopyDownloadActions content={result} filename={filename} toolName={toolName} onRegenerate={onRegenerate} />
        </div>
      </div>

      {stats}

      {compareWith !== undefined && !children && (
        <Segmented
          size="sm"
          ariaLabel="Result view"
          value={view}
          onChange={setView}
          options={[
            { value: "result", label: "Result" },
            { value: "changes", label: "Show changes" },
          ]}
        />
      )}

      <div className="border-t pt-4">
        {children ??
          (view === "changes" && compareWith !== undefined ? (
            <DiffView before={compareWith} after={result} />
          ) : format === "markdown" ? (
            <Markdown text={result} />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{result}</p>
          ))}
      </div>

      <div className="border-t pt-3">
        <ModelStatus provider={provider} modelUsed={modelUsed} elapsedMs={elapsedMs} />
      </div>
    </section>
  );
}
