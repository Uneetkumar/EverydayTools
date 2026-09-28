"use client";

import React, { forwardRef } from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixText?: string;
  suffixText?: string;
  onClear?: () => void;
  showClear?: boolean;
}

export const ToolInput = forwardRef<HTMLInputElement, ToolInputProps>(
  (
    {
      label,
      helperText,
      error,
      prefixText,
      suffixText,
      onClear,
      showClear,
      className = "",
      id,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hasValue = value !== undefined && value !== "" && value !== null;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={inputId} className="block type-label text-foreground">
              {label}
            </label>
            {helperText && !error && (
              <span className="text-xs text-muted-foreground">{helperText}</span>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative flex h-10 items-center rounded-lg border border-input bg-background transition-colors dark:bg-input/30",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
          )}
        >
          {prefixText && (
            <span className="pl-3 pr-1 text-sm text-muted-foreground select-none">{prefixText}</span>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              "h-full w-full min-w-0 rounded-lg bg-transparent px-3 text-base text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              prefixText && "pl-1",
              (suffixText || showClear) && "pr-9",
              className
            )}
            {...props}
          />

          {showClear && hasValue && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={label ? `Clear ${label}` : "Clear input"}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}

          {suffixText && !showClear && (
            <span className="pl-1 pr-3 text-sm text-muted-foreground select-none">{suffixText}</span>
          )}
        </div>

        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

ToolInput.displayName = "ToolInput";
export default ToolInput;
