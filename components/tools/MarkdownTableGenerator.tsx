"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Table as TableIcon, Code } from "lucide-react";

type Alignment = "left" | "center" | "right";

export default function MarkdownTableGenerator() {
  const [headers, setHeaders] = useState<string[]>(["Feature", "Basic Plan", "Pro Plan", "Enterprise"]);
  const [alignments, setAlignments] = useState<Alignment[]>(["left", "center", "center", "center"]);
  const [rows, setRows] = useState<string[][]>([
    ["Tools Included", "10 Tools", "All 50+ Tools", "Custom Tools"],
    ["Client-Side Privacy", "Yes", "Yes", "Yes"],
    ["Export Formats", "PNG, JPG", "All Formats", "Custom Exports"],
    ["Support", "Community", "Priority Email", "24/7 Dedicated"],
  ]);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  // Generate Markdown table string
  const markdownOutput = useMemo(() => {
    if (headers.length === 0) return "";

    const formatRow = (cols: string[]) => `| ${cols.map((c) => c || " ").join(" | ")} |`;

    const separatorRow = `| ${alignments
      .map((a) => {
        if (a === "center") return ":---:";
        if (a === "right") return "---:";
        return "---";
      })
      .join(" | ")} |`;

    const dataRows = rows.map((r) => formatRow(r)).join("\n");

    return `${formatRow(headers)}\n${separatorRow}\n${dataRows}`;
  }, [headers, alignments, rows]);

  // Generate HTML table string
  const htmlOutput = useMemo(() => {
    if (headers.length === 0) return "";
    const ths = headers
      .map((h, i) => `    <th align="${alignments[i]}">${h}</th>`)
      .join("\n");
    const trs = rows
      .map(
        (r) =>
          `  <tr>\n${r
            .map((c, i) => `    <td align="${alignments[i]}">${c}</td>`)
            .join("\n")}\n  </tr>`
      )
      .join("\n");

    return `<table>\n  <thead>\n  <tr>\n${ths}\n  </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>`;
  }, [headers, alignments, rows]);

  const handleHeaderChange = (idx: number, val: string) => {
    const updated = [...headers];
    updated[idx] = val;
    setHeaders(updated);
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const updated = rows.map((row, i) => (i === rIdx ? [...row] : row));
    updated[rIdx][cIdx] = val;
    setRows(updated);
  };

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setAlignments([...alignments, "left"]);
    setRows(rows.map((r) => [...r, ""]));
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIdx));
    setAlignments(alignments.filter((_, i) => i !== colIdx));
    setRows(rows.map((r) => r.filter((_, i) => i !== colIdx)));
  };

  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill("")]);
  };

  const removeRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== rowIdx));
  };

  const toggleAlignment = (colIdx: number) => {
    const nextAlign: Record<Alignment, Alignment> = {
      left: "center",
      center: "right",
      right: "left",
    };
    const updated = [...alignments];
    updated[colIdx] = nextAlign[updated[colIdx]];
    setAlignments(updated);
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdownOutput);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlOutput);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Table Editor */}
      <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Interactive Table Grid
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={addColumn}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" /> Add Column
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" /> Add Row
            </button>
          </div>
        </div>

        {/* Scrollable Table Grid */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 min-w-[130px]">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleHeaderChange(i, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => toggleAlignment(i)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 shrink-0"
                        title={`Align: ${alignments[i]}`}
                      >
                        {alignments[i] === "left" && <AlignLeft className="w-3 h-3" />}
                        {alignments[i] === "center" && <AlignCenter className="w-3 h-3" />}
                        {alignments[i] === "right" && <AlignRight className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => removeColumn(i)}
                        className="p-1 rounded hover:text-rose-500 text-slate-400 shrink-0"
                        title="Delete column"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-10 p-2 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-xs text-slate-800 dark:text-slate-200"
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeRow(rIdx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Markdown Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Markdown Code</span>
            <button
              onClick={handleCopyMd}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMd ? "Copied" : "Copy Markdown"}
            </button>
          </div>
          <textarea
            readOnly
            value={markdownOutput}
            rows={8}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* HTML Table Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>HTML &lt;table&gt; Code</span>
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedHtml ? "Copied" : "Copy HTML"}
            </button>
          </div>
          <textarea
            readOnly
            value={htmlOutput}
            rows={8}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>
      </div>
    </div>
  );
}
