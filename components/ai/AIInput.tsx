"use client";

import React, { useId, useRef } from "react";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/tool/kit";
import { countWords } from "@/lib/ai/nlp/text";
import { cn } from "@/lib/utils";

interface AIInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  sampleText?: string;
  sampleLabel?: string;
  maxChars?: number;
  disabled?: boolean;
  minRows?: number;
  /** Monospace, for code and JSON. */
  mono?: boolean;
  accept?: string;
  invalid?: boolean;
}

/** Text files larger than this are almost certainly not what the user meant. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export default function AIInput({
  value,
  onChange,
  label = "Your text",
  placeholder = "Paste or type your text here…",
  sampleText,
  sampleLabel = "Try an example",
  maxChars = 8000,
  disabled,
  minRows = 6,
  mono = false,
  accept = ".txt,.md,.json,.csv,.html,.xml,.log",
  invalid,
}: AIInputProps) {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const words = countWords(value);
  const over = value.length > maxChars;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("That file is too large", { description: "Open a text file under 2 MB." });
      return;
    }
    file
      .text()
      .then(onChange)
      .catch(() => toast.error("Couldn't read that file as text."));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {sampleText && (
            <Button type="button" variant="ghost" size="xs" disabled={disabled} onClick={() => onChange(sampleText)}>
              {sampleLabel}
            </Button>
          )}
          <Button type="button" variant="ghost" size="xs" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
            <FileText aria-hidden="true" />
            Open file
          </Button>
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} className="hidden" tabIndex={-1} aria-hidden="true" />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={disabled}
              onClick={() => onChange("")}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <TextArea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={minRows}
        spellCheck={!mono}
        aria-invalid={invalid || undefined}
        className={cn("resize-y", mono && "font-mono text-sm md:text-xs")}
      />

      <p className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground tabular-nums" aria-live="polite">
        <span>
          {words.toLocaleString()} words · {value.length.toLocaleString()} characters
        </span>
        {over && (
          <span className="text-warning">
            Over {maxChars.toLocaleString()} characters: long text is slower and gives a less focused result.
          </span>
        )}
      </p>
    </div>
  );
}
