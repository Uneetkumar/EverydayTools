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
 * Engine choice as a two-option radio group. Each option states what the
 * engine does and where the text goes, because that — not a model name — is
 * the actual choice.
 */
export default function AIProviderSelector({
  provider,
  onChange,
  disabled,
  localHint = "Instant. Your text stays in this browser.",
  cloudHint = "Google Gemini. Your text is sent to Google.",
}: AIProviderSelectorProps) {
  const options = [
    { value: "local" as const, label: "On-device", hint: localHint, icon: Cpu },
    { value: "gemini" as const, label: "Cloud AI", hint: cloudHint, icon: Cloud },
  ];

  const move = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = provider === "local" ? "gemini" : "local";
    onChange(next);
    (e.currentTarget.parentElement?.querySelector(`[data-value="${next}"]`) as HTMLElement | null)?.focus();
  };

  return (
    <div role="radiogroup" aria-label="AI engine" className="grid gap-2 @xl:grid-cols-2">
      {options.map(({ value, label, hint, icon: Icon }) => {
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
              "flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              selected ? "border-primary/50 bg-brand-subtle" : "bg-background hover:bg-muted dark:bg-input/20 dark:hover:bg-input/40"
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn("mt-0.5 size-4 shrink-0", selected ? "text-brand-subtle-foreground" : "text-muted-foreground")}
            />
            <span className="min-w-0">
              <span className={cn("block text-sm font-medium", selected ? "text-brand-subtle-foreground" : "text-foreground")}>
                {label}
              </span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
