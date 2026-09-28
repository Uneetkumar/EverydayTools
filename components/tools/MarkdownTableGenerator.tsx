"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Table as TableIcon, Code } from "lucide-react";
import { copyText } from "@/lib/utils/clipboard";

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
    copyText(markdownOutput);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = () => {
    copyText(htmlOutput);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Table Editor */}
      <div className="p-5 rounded-xl border space-y-4 bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm text-slate-900 dark:text-white flex items-center gap-1.5 font-semibold">
            <TableIcon className="w-4 h-4 text-muted-foreground" />
            Interactive Table Grid
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={addColumn}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors bg-muted/30"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" /> Add Column
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors bg-muted/30"
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
                        aria-label={`Header, column ${i + 1}`}
                        value={h}
                        onChange={(e) => handleHeaderChange(i, e.target.value)}
                        className="w-full px-2 py-1 rounded text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                        className="p-1 rounded hover:text-rose-500 text-slate-500 dark:text-slate-400 shrink-0"
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
                        aria-label={`Row ${rIdx + 1}, column ${cIdx + 1}`}
                        value={cell}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        className="w-full px-2 py-1 rounded border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <button aria-label="Delete row"
                      onClick={() => removeRow(rIdx)}
                      className="text-slate-500 dark:text-slate-400 hover:text-rose-500 p-1"
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
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span>Markdown Code</span>
            <button
              onClick={handleCopyMd}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMd ? "Copied" : "Copy Markdown"}
            </button>
          </div>
          <textarea aria-label="Markdown output"
            readOnly
            value={markdownOutput}
            rows={8}
            className="w-full p-4 font-mono resize-none text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* HTML Table Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span>HTML &lt;table&gt; Code</span>
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedHtml ? "Copied" : "Copy HTML"}
            </button>
          </div>
          <textarea aria-label="HTML output"
            readOnly
            value={htmlOutput}
            rows={8}
            className="w-full p-4 font-mono resize-none text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>
    </div>
  );
}
