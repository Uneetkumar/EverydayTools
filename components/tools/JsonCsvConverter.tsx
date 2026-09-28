"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, ArrowRightLeft, FileSpreadsheet, Code, Trash2, Upload } from "lucide-react";
import { downloadBlob } from "@/lib/utils/download";
import { copyText } from "@/lib/utils/clipboard";

const SAMPLE_JSON = `[
  { "id": 1, "name": "Alice Johnson", "role": "Frontend Lead", "city": "San Francisco", "active": true },
  { "id": 2, "name": "Bob Smith", "role": "Backend Architect", "city": "New York", "active": false },
  { "id": 3, "name": "Charlie Brown", "role": "Product Manager", "city": "London", "active": true }
]`;

const SAMPLE_CSV = `id,name,role,city,active
1,Alice Johnson,Frontend Lead,San Francisco,true
2,Bob Smith,Backend Architect,New York,false
3,Charlie Brown,Product Manager,London,true`;

function jsonToCsv(jsonStr: string, delimiter = ","): string {
  const parsed = JSON.parse(jsonStr);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return "";

  // Extract all unique keys
  const headers = Array.from(
    new Set(arr.flatMap((obj) => (typeof obj === "object" && obj !== null ? Object.keys(obj) : [])))
  );

  const escapeCell = (val: unknown) => {
    if (val === null || val === undefined) return "";
    let str = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(delimiter);
  const dataRows = arr.map((obj) =>
    headers.map((h) => escapeCell(obj[h])).join(delimiter)
  );

  return [headerRow, ...dataRows].join("\n");
}

function csvToJson(csvStr: string, delimiter = ","): string {
  const lines = csvStr.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return "[]";

  // Parse CSV line taking quotes into account
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    return cells;
  };

  const headers = parseLine(lines[0]);
  const result = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      let val: unknown = values[idx] ?? "";
      if (val === "true") val = true;
      else if (val === "false") val = false;
      else if (val !== "" && !isNaN(Number(val))) val = Number(val);
      obj[h] = val;
    });
    return obj;
  });

  return JSON.stringify(result, null, 2);
}

export default function JsonCsvConverter() {
  const [mode, setMode] = useState<"json_to_csv" | "csv_to_json">("json_to_csv");
  const [input, setInput] = useState<string>(SAMPLE_JSON);
  const [delimiter, setDelimiter] = useState<string>(",");
  const [copied, setCopied] = useState<boolean>(false);
  // Output and error are derived together; setting state from inside useMemo
  // (as before) re-renders during render and can loop.
  const { output, error } = useMemo((): { output: string; error: string | null } => {
    if (!input.trim()) return { output: "", error: null };
    try {
      return {
        output: mode === "json_to_csv" ? jsonToCsv(input, delimiter) : csvToJson(input, delimiter),
        error: null,
      };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, mode, delimiter]);

  const handleModeSwitch = () => {
    if (mode === "json_to_csv") {
      setMode("csv_to_json");
      setInput(output || SAMPLE_CSV);
    } else {
      setMode("json_to_csv");
      setInput(output || SAMPLE_JSON);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    copyText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const filename = mode === "json_to_csv" ? "converted-data.csv" : "converted-data.json";
    const mime = mode === "json_to_csv" ? "text/csv" : "application/json";
    downloadBlob(new Blob([output], { type: mime }), filename);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      if (file.name.endsWith(".csv")) {
        setMode("csv_to_json");
      } else if (file.name.endsWith(".json")) {
        setMode("json_to_csv");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Mode & Action Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center gap-2">
          <button
            onClick={handleModeSwitch}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {mode === "json_to_csv" ? "JSON → CSV Mode" : "CSV → JSON Mode"}
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors font-medium text-foreground">
            <Upload className="w-3.5 h-3.5" />
            Upload File
            <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          {/* Delimiter */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span>Delimiter</span>
            <select aria-label="Delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="px-2 py-1 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="	">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>

          <button aria-label="Clear"
            onClick={() => setInput("")}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dual Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              {mode === "json_to_csv" ? <Code className="w-3.5 h-3.5 text-muted-foreground" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />}
              {mode === "json_to_csv" ? "Input JSON Data" : "Input CSV Text"}
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {input.length} chars
            </span>
          </div>
          <textarea aria-label="JSON input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            placeholder={mode === "json_to_csv" ? "Paste JSON array or object here..." : "Paste CSV table text here..."}
            className="w-full p-4 font-mono resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              {mode === "json_to_csv" ? <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5 text-muted-foreground" />}
              {mode === "json_to_csv" ? "Converted CSV Output" : "Converted JSON Output"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs disabled:opacity-50 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea aria-label="CSV output"
              readOnly
              value={error ? `Conversion Error: ${error}` : output}
              rows={14}
              className={`w-full p-4 font-mono resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                error
                  ? "border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  : "text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
