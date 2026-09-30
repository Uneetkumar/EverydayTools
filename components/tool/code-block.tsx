"use client";

import * as React from "react";
import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

/**
 * Read-only code or text output with a label and a copy button. Long lines
 * scroll instead of wrapping so code keeps its shape; `wrap` turns wrapping
 * on for prose-like output such as header lists.
 */
export function CodeBlock({
  code,
  label,
  className,
  maxHeight = "24rem",
  wrap = false,
  empty = "Nothing to show yet.",
}: {
  code: string;
  label?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  wrap?: boolean;
  empty?: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-muted/30", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
        <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{label}</span>
        <CopyButton text={code} size="sm" />
      </div>
      {code ? (
        <pre
          tabIndex={0}
          style={{ maxHeight }}
          className={cn("overflow-auto p-3.5 font-mono text-[13px] leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50", wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre")}
        >
          <code>{code}</code>
        </pre>
      ) : (
        <p className="p-3.5 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
