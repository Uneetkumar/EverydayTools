"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { markToolError } from "@/lib/analytics";

interface AIErrorProps {
  error: string;
  onRetry?: () => void;
  onSwitchToLocal?: () => void;
}

export default function AIError({ error, onRetry, onSwitchToLocal }: AIErrorProps) {
  useEffect(() => {
    // A fixed code only: provider messages can echo the user's text.
    if (error) markToolError("ai_failed");
  }, [error]);

  if (!error) return null;

  return (
    <Alert variant="destructive" className="px-4 py-3">
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>That didn&apos;t work</AlertTitle>
      <AlertDescription className="min-w-0">
        {/* Capped height: a provider error can be hundreds of lines of JSON,
            and burying the actions under it is worse than scrolling. */}
        <p className="max-h-32 overflow-y-auto break-words whitespace-pre-wrap">{error}</p>
        {(onSwitchToLocal || onRetry) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {onRetry && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw aria-hidden="true" />
                Try again
              </Button>
            )}
            {onSwitchToLocal && (
              <Button type="button" variant="ghost" size="sm" onClick={onSwitchToLocal}>
                Use on-device AI instead
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
