"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "ghost" | "solid";
}

export default function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "",
  size = "md",
  variant = "ghost",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text || copied) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`inline-flex items-center space-x-1.5 font-semibold transition rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isSmall ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      } ${
        variant === "solid"
          ? copied
            ? "bg-emerald-500 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          : copied
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
      } ${className}`}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
    >
      {copied ? (
        <Check className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
      ) : (
        <Copy className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
