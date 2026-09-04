"use client";

import React, { useState } from "react";
import { Copy, Check, Download, RotateCcw } from "lucide-react";
import { downloadBlob } from "@/lib/utils/download";

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

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const isJson = filename.endsWith(".json");
    const mimeType = isJson ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";
    downloadBlob(new Blob([content], { type: mimeType }), filename, toolName);
  };

  return (
    <div className="flex items-center gap-2">
      {onRegenerate && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRegenerate}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          title="Regenerate output"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Regenerate</span>
        </button>
      )}

      <button
        type="button"
        disabled={!content || disabled}
        onClick={handleCopy}
        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 ${
          copied
            ? "bg-emerald-600 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? "Copied!" : "Copy"}</span>
      </button>

      <button
        type="button"
        disabled={!content || disabled}
        onClick={handleDownload}
        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
        title="Download output file"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Save</span>
      </button>
    </div>
  );
}
