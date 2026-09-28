"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, File, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSizeMB?: number;
  title?: string;
  subtitle?: string;
  supportedFormatsText?: string;
  isProcessing?: boolean;
  processingProgress?: number;
  className?: string;
  selectedFile?: File | null;
  onClear?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * The shared file picker: drop a file or activate it with a click, Enter or
 * Space. Oversized files are rejected here with a message, before any tool
 * code tries to read them.
 */
export default function DropZone({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  accept,
  maxSizeMB = 25,
  title = "Drop a file here or choose one",
  subtitle = "Processed in your browser. Nothing is uploaded.",
  supportedFormatsText,
  isProcessing = false,
  processingProgress,
  className = "",
  selectedFile,
  onClear,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandle = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setErrorMessage(null);

      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > maxBytes) {
          setErrorMessage(`"${file.name}" is ${formatBytes(file.size)}. The limit here is ${maxSizeMB} MB.`);
          return;
        }
        validFiles.push(file);
      }

      if (multiple && onFilesSelect) {
        onFilesSelect(validFiles);
      } else if (validFiles[0]) {
        onFileSelect(validFiles[0]);
      }
    },
    [maxSizeMB, multiple, onFileSelect, onFilesSelect]
  );

  const open = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    validateAndHandle(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndHandle(e.target.files);
    // Reset so the same file can be chosen again after clearing.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {selectedFile ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-foreground">
              <File className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(selectedFile.size)}
                {selectedFile.type ? ` · ${selectedFile.type}` : ""}
              </p>
            </div>
          </div>

          {onClear && !isProcessing && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClear} aria-label={`Remove ${selectedFile.name}`}>
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={`${title}. ${supportedFormatsText ?? ""}`.trim()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            isDragOver ? "border-primary bg-brand-subtle/60" : "border-input bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            tabIndex={-1}
          />
          <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-subtle text-brand-subtle-foreground">
            <UploadCloud className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{subtitle}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {supportedFormatsText ? `${supportedFormatsText} · ` : ""}Up to {maxSizeMB} MB
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-1.5 pt-1" role="status">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Processing…</span>
            {processingProgress !== undefined && <span className="tabular-nums">{Math.round(processingProgress)}%</span>}
          </div>
          <Progress
            value={processingProgress ?? 100}
            className={processingProgress === undefined ? "animate-pulse" : undefined}
          />
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
