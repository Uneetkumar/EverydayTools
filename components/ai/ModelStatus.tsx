"use client";

import React from "react";
import { Cloud, ShieldCheck } from "lucide-react";
import { AIProviderType } from "@/lib/ai/types";

interface ModelStatusProps {
  provider: AIProviderType;
  modelUsed?: string;
  elapsedMs?: number;
}

function formatElapsed(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export default function ModelStatus({ provider, modelUsed, elapsedMs }: ModelStatusProps) {
  const local = provider === "local";
  const Icon = local ? ShieldCheck : Cloud;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <Icon aria-hidden="true" className={local ? "size-3.5 text-success" : "size-3.5"} />
      <span className="font-medium text-foreground">
        {local ? "Processed on your device." : "Processed in the cloud."}
      </span>
      <span>
        {local
          ? "Your text did not leave this browser."
          : `Your text was sent to Google Gemini${modelUsed ? ` (${modelUsed})` : ""} to produce this result.`}
      </span>
      {elapsedMs != null && <span className="ml-auto tabular-nums">{formatElapsed(elapsedMs)}</span>}
    </p>
  );
}
