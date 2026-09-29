"use client";

import React from "react";
import { Cloud, Cpu } from "lucide-react";
import { AIProviderType } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

interface AIProviderSelectorProps {
  provider: AIProviderType;
  onChange: (provider: AIProviderType) => void;
  disabled?: boolean;
  /** What the on-device engine does for this tool, in a few words. */
  localHint?: string;
  /** What the cloud model does for this tool, in a few words. */
  cloudHint?: string;
}

/**
 * Engine choice as a compact two-option switch, with one line under it that
 * says what the chosen engine does and where the text goes, because that —
 * not a model name — is the actual choice. Kept to one row so the text box
 * and the Run button stay on the first screen.
 */
export default function AIProviderSelector({
  provider,
  onChange,
  disabled,
  localHint = "Instant. Your text stays in this browser.",
  cloudHint = "Google Gemini. Your text is sent to Google.",
}: AIProviderSelectorProps) {
  const options = [
    { value: "local" as const, label: "On-device", icon: Cpu },
    { value: "gemini" as const, label: "Cloud AI", icon: Cloud },
  ];

  const move = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = provider === "local" ? "gemini" : "local";
    onChange(next);
    (e.currentTarget.parentElement?.querySelector(`[data-value="${next}"]`) as HTMLElement | null)?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div role="radiogroup" aria-label="AI engine" className="inline-flex rounded-lg border bg-muted/40 p-0.5">
        {options.map(({ value, label, icon: Icon }) => {
          const selected = provider === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              data-value={value}
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(value)}
              onKeyDown={move}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "bg-background text-foreground shadow-xs dark:bg-input/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {provider === "local" ? localHint : cloudHint}
      </p>
    </div>
  );
}
