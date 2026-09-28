"use client";

import React, { useState } from "react";
import { Copy, Check, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils/download";
import { copyText } from "@/lib/utils/clipboard";
import { markToolCompleted } from "@/lib/analytics";

interface CopyDownloadActionsProps {
  content: string;
  filename?: string;
  toolName?: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export default function CopyDownloadActions({
  content,
  filename = "result.txt",
  toolName = "tabbench-ai",
  onRegenerate,
  disabled,
}: CopyDownloadActionsProps) {
  const [copied, setCopied] = useState(false);

  // copyText falls back to the legacy copy path and reports failure itself.
  const handleCopy = async () => {
    if (await copyText(content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const mimeType = filename.endsWith(".json")
      ? "application/json;charset=utf-8"
      : filename.endsWith(".md")
        ? "text/markdown;charset=utf-8"
        : "text/plain;charset=utf-8";
    downloadBlob(new Blob([content], { type: mimeType }), filename, toolName);
    markToolCompleted();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onRegenerate && (
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onRegenerate}>
          <RotateCcw aria-hidden="true" />
          Run again
        </Button>
      )}
      <Button type="button" variant="outline" size="sm" disabled={!content || disabled} onClick={handleDownload}>
        <Download aria-hidden="true" />
        Save
      </Button>
      <Button type="button" size="sm" disabled={!content || disabled} onClick={handleCopy}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
