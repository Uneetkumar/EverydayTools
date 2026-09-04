"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import ToolButton from "./ToolButton";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onReset?: () => void;
  className?: string;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  onReset,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-slate-800 dark:text-slate-200 ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {title}
          </h4>
          <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5 leading-relaxed">
            {message}
          </p>

          {(onRetry || onReset) && (
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <ToolButton
                  variant="destructive"
                  size="sm"
                  onClick={onRetry}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                >
                  {retryLabel}
                </ToolButton>
              )}
              {onReset && (
                <ToolButton
                  variant="subtle"
                  size="sm"
                  onClick={onReset}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Reset
                </ToolButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
