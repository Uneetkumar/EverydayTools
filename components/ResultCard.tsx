"use client";

import React, { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markToolCompleted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  title?: string;
  /**
   * Alias for `title`. Several calculators were written against this name; it
   * is accepted so both spellings work rather than forcing a rename across
   * every call site. `title` wins if both are given.
   */
  label?: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  /**
   * How the number was derived, shown in the subtitle slot. Falls back to
   * `subtitle` when not supplied.
   */
  formulaExplanation?: string;
  /**
   * Overrides what the copy button writes. Without it the card composes the
   * value, unit and details itself, which is right for simple results but
   * wrong when a calculator wants to copy a formatted breakdown.
   */
  copyText?: string;
  /** Title used by the native share sheet. Defaults to the card heading. */
  shareTitle?: string;
  details?: { label: string; value: string | number }[];
  /**
   * Semantic tone of the answer. The historical colour names are kept so no
   * call site changes: indigo is the neutral brand tone, emerald a good
   * outcome, amber a caution, rose a bad outcome.
   */
  highlightColor?: "indigo" | "emerald" | "amber" | "rose";
  /** @deprecated No longer animates; kept so existing call sites compile. */
  showConfetti?: boolean;
}

// One calm neutral surface for every result; the tone only colours the number,
// so a page of results doesn't turn into blocks of green, blue and red.
const TONES = {
  indigo: { value: "text-foreground", surface: "bg-muted/40 border-border" },
  emerald: { value: "text-success", surface: "bg-muted/40 border-border" },
  amber: { value: "text-warning", surface: "bg-muted/40 border-border" },
  rose: { value: "text-destructive", surface: "bg-muted/40 border-border" },
} as const;

/**
 * The answer block shared by the calculators: one prominent value, how it was
 * derived, a breakdown, and copy/share. The value region is a polite live
 * region so screen-reader users hear the result change as they edit inputs.
 */
export default function ResultCard({
  title,
  label,
  value,
  unit = "",
  subtitle,
  formulaExplanation,
  copyText,
  shareTitle,
  details = [],
  highlightColor = "indigo",
}: ResultCardProps) {
  const heading = title ?? label ?? "Result";
  const caption = subtitle ?? formulaExplanation;
  const tone = TONES[highlightColor] ?? TONES.indigo;
  const [copied, setCopied] = useState(false);

  const composed =
    copyText ??
    `${value}${unit ? " " + unit : ""}${
      details.length > 0 ? "\n" + details.map((d) => `${d.label}: ${d.value}`).join("\n") : ""
    }`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(composed);
      setCopied(true);
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to the clipboard", {
        description: "Your browser blocked clipboard access. Select the result and copy it manually.",
      });
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle ?? heading,
          text: `${heading}: ${value}${unit ? " " + unit : ""}`,
          url: window.location.href,
        });
        markToolCompleted();
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    await handleCopy();
    toast.success("Result copied", { description: "Paste it wherever you want to share it." });
  };

  return (
    <div className={cn("@container rounded-xl border p-5 sm:p-6", tone.surface)}>
      <div className="flex items-center justify-between gap-3">
        <p className="type-overline text-muted-foreground">{heading}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} aria-label={copied ? "Copied" : `Copy ${heading}`}>
            {copied ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleShare} aria-label={`Share ${heading}`}>
            <Share2 aria-hidden="true" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      <div className="mt-3" aria-live="polite" aria-atomic="true">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cn("text-4xl font-semibold tracking-tight tabular-nums wrap-anywhere @sm:text-5xl", tone.value)}>
            {value}
          </span>
          {unit && <span className="text-lg font-semibold text-muted-foreground @sm:text-xl">{unit}</span>}
        </p>
        {caption && <p className="mt-2 type-body-sm text-muted-foreground">{caption}</p>}
      </div>

      {details.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-2.5 border-t pt-4 @md:grid-cols-3">
          {details.map((item, idx) => (
            <div key={idx} className="min-w-0 rounded-lg border bg-card px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums wrap-anywhere text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
