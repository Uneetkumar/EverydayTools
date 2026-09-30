import * as React from "react";
import { cn } from "@/lib/utils";

/** Highlighting stops here; counts and lists still cover every match. */
export const MAX_MARKS = 1000;

/** Test text with each match marked. Alternating tints keep neighbouring matches apart; empty matches show as a caret. */
export function Highlighted({ text, matches }: { text: string; matches: { start: number; end: number }[] }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  matches.slice(0, MAX_MARKS).forEach((m, i) => {
    if (m.start < at) return;
    if (m.start > at) parts.push(text.slice(at, m.start));
    parts.push(
      m.end === m.start ? (
        <span key={i} className="mx-px inline-block h-[1.1em] w-0.5 translate-y-[0.15em] bg-primary/60" title={`Empty match at ${m.start}`} />
      ) : (
        <mark key={i} title={`Match ${i + 1}: characters ${m.start}–${m.end}`} className={cn("rounded-sm px-px text-foreground", i % 2 ? "bg-primary/25" : "bg-primary/15")}>
          {text.slice(m.start, m.end)}
        </mark>
      )
    );
    at = m.end;
  });
  parts.push(text.slice(at));
  return <>{parts}</>;
}
