"use client";

import React, { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";
import { locateJsonError } from "@/lib/text/json-locate";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Check, CheckCircle2, Copy, Download, Trash2, AlertCircle } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";

const SAMPLE_JSON = {
  order: 10482,
  customer: { name: "Asha Rao", email: "asha@example.com" },
  items: [
    { sku: "NB-A5", name: "Notebook", qty: 2, price: 3.5 },
    { sku: "PEN-BLK", name: "Gel pen", qty: 5, price: 1.2 },
  ],
  paid: true,
  deliveredAt: null,
};

interface JsonError {
  message: string;
  line?: number;
  column?: number;
  lineText?: string;
}

/** Turn a failed parse into a line, column and plain-English expectation. */
function describeJsonError(input: string, err: unknown): JsonError {
  const raw = err instanceof Error ? err.message : "Invalid JSON.";
  const located = locateJsonError(input);
  if (!located) return { message: raw };
  const before = input.slice(0, located.offset);
  const line = before.split("\n").length;
  const column = located.offset - before.lastIndexOf("\n");
  const found = input[located.offset];
  const message = `Expected ${located.expected}${found === undefined ? "" : `, found ${JSON.stringify(found)}`}.`;
  return { message, line, column, lineText: input.split("\n")[line - 1] };
}

type Analysis =
  | { state: "empty" }
  | { state: "valid"; value: unknown; bytes: number; kind: string; count: number }
  | { state: "invalid"; error: JsonError };

function analyze(input: string): Analysis {
  if (!input.trim()) return { state: "empty" };
  try {
    const value = JSON.parse(input);
    const kind = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    const count = Array.isArray(value)
      ? value.length
      : value && typeof value === "object"
        ? Object.keys(value).length
        : 0;
    return { state: "valid", value, bytes: new Blob([input]).size, kind, count };
  } catch (err) {
    return { state: "invalid", error: describeJsonError(input, err) };
  }
}

export default function JsonFormatter() {
  const [inputJson, setInputJson] = usePersistentState<string>(
    "json_formatter_input",
    JSON.stringify(SAMPLE_JSON, null, 2)
  );
  const [indentSize, setIndentSize] = usePersistentState<"2" | "4" | "tab">("json_formatter_indent", "2");
  const [copied, setCopied] = useState(false);

  // Validation follows the text as it is typed; deferring it keeps typing
  // smooth when the document is large.
  const deferred = useDeferredValue(inputJson);
  const analysis = useMemo(() => analyze(deferred), [deferred]);

  const formatJson = (space: "2" | "4" | "tab") => {
    setIndentSize(space);
    const now = analyze(inputJson);
    if (now.state !== "valid") return;
    setInputJson(JSON.stringify(now.value, null, space === "tab" ? "\t" : Number(space)));
    markToolCompleted();
  };

  const minifyJson = () => {
    const now = analyze(inputJson);
    if (now.state !== "valid") return;
    setInputJson(JSON.stringify(now.value));
    markToolCompleted();
  };

  const loadSample = () => setInputJson(JSON.stringify(SAMPLE_JSON, null, 2));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inputJson);
      setCopied(true);
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the JSON", { description: "Select it and copy it manually, or download it." });
    }
  };

  const handleDownload = () => {
    downloadBlob(new Blob([inputJson], { type: "application/json" }), "data.json", "json-formatter");
  };

  const errorMsg = analysis.state === "invalid" ? analysis.error : null;

  return (
    <div className="space-y-6">
      {/* Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => formatJson("2")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              indentSize === "2" && !errorMsg
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            Prettify (2 Spaces)
          </button>
          <button
            onClick={() => formatJson("4")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              indentSize === "4" && !errorMsg
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            4 Spaces
          </button>
          <button
            onClick={() => formatJson("tab")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              indentSize === "tab" && !errorMsg
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            Tabs
          </button>
          <button
            onClick={minifyJson}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
          >
            Minify / Compact
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadSample}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
          >
            Load Sample
          </button>
          <button
            onClick={() => setInputJson("")}
            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            aria-label="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation status */}
      <div aria-live="polite">
        {errorMsg ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                Invalid JSON{errorMsg.line ? ` — line ${errorMsg.line}, column ${errorMsg.column}` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">{errorMsg.message}</p>
              {errorMsg.lineText !== undefined && errorMsg.column && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
                  {errorMsg.lineText}
                  {"\n"}
                  <span className="text-destructive">{" ".repeat(Math.max(0, errorMsg.column - 1))}^</span>
                </pre>
              )}
            </div>
          </div>
        ) : analysis.state === "valid" ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Valid JSON
          </p>
        ) : null}
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          rows={14}
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
          aria-label="JSON input"
          aria-invalid={errorMsg ? true : undefined}
          spellCheck={false}
          placeholder="Paste raw JSON here to format or validate..."
          className="w-full p-4 font-mono leading-relaxed text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        {/* Floating Quick Action Buttons */}
        <div className="absolute right-4 bottom-4 flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs rounded-lg transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
            aria-label="Download as a .json file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadata / Stats */}
      {analysis.state === "valid" && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <span>
            Size: <strong className="font-mono text-foreground">{analysis.bytes.toLocaleString()} bytes</strong>
          </span>
          <span>
            {analysis.kind === "array" ? "Items" : analysis.kind === "object" ? "Top-level keys" : "Type"}:{" "}
            <strong className="font-mono text-foreground">
              {analysis.kind === "array" || analysis.kind === "object" ? analysis.count : analysis.kind}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
