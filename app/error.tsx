"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Wrench } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging while keeping UI clean
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          An unexpected error occurred while loading this page. You can try reloading or return to the tool directory.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>

          <Link
            href="/tools"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Wrench className="h-4 w-4" /> Browse all tools
          </Link>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Home className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
