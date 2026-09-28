"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markToolCompleted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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
  copiedLabel = "Copied",
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
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to the clipboard", {
        description: "Your browser blocked clipboard access. Select the text and copy it manually.",
      });
    }
  };

  return (
    <Button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      variant={variant === "solid" ? "default" : "outline"}
      size={size === "sm" ? "xs" : "sm"}
      className={cn(copied && variant !== "solid" && "text-success", className)}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span>{copied ? copiedLabel : label}</span>
    </Button>
  );
}
