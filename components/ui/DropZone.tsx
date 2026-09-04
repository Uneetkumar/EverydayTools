"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from "lucide-react";

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

export default function DropZone({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  accept,
  maxSizeMB = 25,
  title = "Drop your file here or click to browse",
  subtitle = "Fast and 100% private in your browser",
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
          setErrorMessage(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    validateAndHandle(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndHandle(e.target.files);
    // Reset so same file can be re-selected if cleared
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {selectedFile ? (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 backdrop-blur-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <File className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {selectedFile.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &bull; {selectedFile.type || "Document"}
              </div>
            </div>
          </div>

          {onClear && !isProcessing && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition cursor-pointer text-center ${
            isDragOver
              ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[1.01]"
              : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {title}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-3">
            {subtitle}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Browse Files
            </span>
            {supportedFormatsText && (
              <span className="text-[11px] text-slate-400">
                {supportedFormatsText} &bull; Up to {maxSizeMB}MB
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Processing...</span>
            {processingProgress !== undefined && (
              <span>{Math.round(processingProgress)}%</span>
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full bg-blue-600 transition-all duration-200 rounded-full ${
                processingProgress === undefined ? "animate-pulse w-full" : ""
              }`}
              style={
                processingProgress !== undefined
                  ? { width: `${processingProgress}%` }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Error Callout */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
