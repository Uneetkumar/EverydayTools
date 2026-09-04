"use client";

import React, { useRef } from "react";
import { Trash2, Copy, Sparkles, Upload } from "lucide-react";

interface AIInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  sampleText?: string;
  sampleLabel?: string;
  maxChars?: number;
  disabled?: boolean;
  minRows?: number;
}

export default function AIInput({
  value,
  onChange,
  placeholder = "Paste or type your text here...",
  sampleText,
  sampleLabel = "Load Sample",
  maxChars = 4000,
  disabled,
  minRows = 6,
}: AIInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = value.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-2">
      {/* Input Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-medium">
          <span>{wordCount} words</span>
          <span>&bull;</span>
          <span className={charCount > maxChars ? "text-rose-500 font-bold" : ""}>
            {charCount} / {maxChars} chars
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {sampleText && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(sampleText)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer disabled:opacity-50"
            >
              {sampleLabel}
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
            title="Upload text file (.txt, .md, .json)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv,.js,.ts"
            onChange={handleFileUpload}
            className="hidden"
          />

          {value && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={minRows}
        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-y font-sans disabled:opacity-60"
      />
    </div>
  );
}
