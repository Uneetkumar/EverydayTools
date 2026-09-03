"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, ArrowRightLeft, FileSpreadsheet, Code, Trash2, Upload } from "lucide-react";
import { downloadBlob } from "@/lib/utils/download";

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
  const [error, setError] = useState<string | null>(null);

  const output = useMemo(() => {
    setError(null);
    if (!input.trim()) return "";
    try {
      if (mode === "json_to_csv") {
        return jsonToCsv(input, delimiter);
      } else {
        return csvToJson(input, delimiter);
      }
    } catch (e) {
      setError((e as Error).message);
      return "";
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
    navigator.clipboard.writeText(output);
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
      <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={handleModeSwitch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {mode === "json_to_csv" ? "JSON → CSV Mode" : "CSV → JSON Mode"}
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload File
            <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          {/* Delimiter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Delimiter:</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="	">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>

          <button
            onClick={() => setInput("")}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              {mode === "json_to_csv" ? <Code className="w-3.5 h-3.5 text-blue-500" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />}
              {mode === "json_to_csv" ? "Input JSON Data" : "Input CSV Text"}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {input.length} chars
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            placeholder={mode === "json_to_csv" ? "Paste JSON array or object here..." : "Paste CSV table text here..."}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              {mode === "json_to_csv" ? <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5 text-blue-500" />}
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
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={error ? `Conversion Error: ${error}` : output}
              rows={14}
              className={`w-full p-4 rounded-2xl border font-mono text-xs resize-y focus:outline-none ${
                error
                  ? "border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
