"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

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
    track("tool_error", { reason: "page_crash", path: window.location.pathname });
  }, [error]);

  return (
    <div className="page-container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-raised">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 type-h2 text-foreground">Something went wrong</h1>
        <p className="mt-2 type-body-sm text-muted-foreground">
          This page hit an unexpected error. Nothing you entered was sent anywhere. Try again, or pick another tool.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={() => reset()}>
            <RotateCcw aria-hidden="true" /> Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tools">Browse all tools</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Back to the homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
