"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ToolButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "destructive" | "purple";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ToolButton = forwardRef<HTMLButtonElement, ToolButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs font-semibold rounded-lg gap-1.5",
      md: "px-4 py-2.5 text-xs font-bold rounded-xl gap-2",
      lg: "px-6 py-3.5 text-sm font-bold rounded-xl gap-2.5",
    }[size];

    const variantClasses = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-blue-500/20 active:scale-[0.99]",
      secondary:
        "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60",
      subtle:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
      destructive:
        "bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50",
      purple:
        "bg-purple-600 hover:bg-purple-700 text-white shadow-xs hover:shadow-purple-500/20 active:scale-[0.99]",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

ToolButton.displayName = "ToolButton";
export default ToolButton;
