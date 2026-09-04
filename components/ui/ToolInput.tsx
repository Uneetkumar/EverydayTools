"use client";

import React, { forwardRef } from "react";
import { X, AlertCircle } from "lucide-react";

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
    const hasValue = value !== undefined && value !== "" && value !== null;

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {label}
            </label>
            {helperText && !error && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {helperText}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center rounded-xl border bg-white dark:bg-slate-900 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 border-slate-200 dark:border-slate-800">
          {prefixText && (
            <span className="pl-3.5 pr-1.5 text-xs font-medium text-slate-400 select-none">
              {prefixText}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 text-sm bg-transparent rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
              prefixText ? "pl-1.5" : ""
            } ${suffixText || showClear ? "pr-8" : ""} ${className}`}
            {...props}
          />

          {showClear && hasValue && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {suffixText && !showClear && (
            <span className="pr-3.5 pl-1.5 text-xs font-medium text-slate-400 select-none">
              {suffixText}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

ToolInput.displayName = "ToolInput";
export default ToolInput;
