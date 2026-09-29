"use client";

import React, { useMemo, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Check, Copy, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented, ToolSection } from "@/components/tool/kit";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";

type Alignment = "left" | "center" | "right";

const SAMPLE_HEADERS = ["Format", "Best for", "Transparency", "Typical size"];
const SAMPLE_ALIGN: Alignment[] = ["left", "left", "center", "right"];
const SAMPLE_ROWS = [
  ["JPG", "Photos", "No", "200 KB"],
  ["PNG", "Screenshots, logos", "Yes", "600 KB"],
  ["WebP", "Web images", "Yes", "120 KB"],
  ["SVG", "Icons, illustrations", "Yes", "8 KB"],
];

/** A pipe would end the cell and a line break the row, so both are escaped. */
const mdCell = (s: string) => s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>").trim();
const htmlText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>");

const ALIGN_ICON = { left: AlignLeft, center: AlignCenter, right: AlignRight } as const;
const NEXT_ALIGN: Record<Alignment, Alignment> = { left: "center", center: "right", right: "left" };

const cellClass =
  "h-9 w-full min-w-28 rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-input focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/50";

export default function MarkdownTableGenerator() {
  const [headers, setHeaders] = useState<string[]>(SAMPLE_HEADERS);
  const [alignments, setAlignments] = useState<Alignment[]>(SAMPLE_ALIGN);
  const [rows, setRows] = useState<string[][]>(SAMPLE_ROWS);
  const [output, setOutput] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => {
    const cols = headers.length;
    const cells = [headers, ...rows].map((r) => Array.from({ length: cols }, (_, i) => mdCell(r[i] ?? "")));
    // Pad columns to a common width so the raw Markdown is readable too.
    const widths = Array.from({ length: cols }, (_, i) => Math.max(3, ...cells.map((r) => r[i].length)));
    const line = (r: string[]) =>
      `| ${r.map((c, i) => (alignments[i] === "right" ? c.padStart(widths[i]) : c.padEnd(widths[i]))).join(" | ")} |`;
    const sep = `| ${alignments
      .map((a, i) => {
        const dashes = "-".repeat(Math.max(3, widths[i] - (a === "center" ? 2 : a === "right" ? 1 : 0)));
        return a === "center" ? `:${dashes}:` : a === "right" ? `${dashes}:` : dashes;
      })
      .join(" | ")} |`;
    return [line(cells[0]), sep, ...cells.slice(1).map(line)].join("\n");
  }, [headers, alignments, rows]);

  const html = useMemo(() => {
    // style="text-align" rather than the align attribute, which HTML5 dropped.
    const style = (i: number) => (alignments[i] === "left" ? "" : ` style="text-align: ${alignments[i]}"`);
    const ths = headers.map((h, i) => `      <th${style(i)}>${htmlText(h)}</th>`).join("\n");
    const trs = rows
      .map((r) => `    <tr>\n${headers.map((_, i) => `      <td${style(i)}>${htmlText(r[i] ?? "")}</td>`).join("\n")}\n    </tr>`)
      .join("\n");
    return `<table>\n  <thead>\n    <tr>\n${ths}\n    </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>`;
  }, [headers, alignments, rows]);

  const code = output === "markdown" ? markdown : html;

  const setCell = (r: number, c: number, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)));

  const addColumn = () => {
    setHeaders((h) => [...h, `Column ${h.length + 1}`]);
    setAlignments((a) => [...a, "left"]);
    setRows((rs) => rs.map((r) => [...r, ""]));
  };
  const removeColumn = (c: number) => {
    if (headers.length <= 1) return;
    setHeaders((h) => h.filter((_, i) => i !== c));
    setAlignments((a) => a.filter((_, i) => i !== c));
    setRows((rs) => rs.map((r) => r.filter((_, i) => i !== c)));
  };
  const addRow = () => setRows((rs) => [...rs, Array(headers.length).fill("")]);
  const removeRow = (r: number) => rows.length > 1 && setRows((rs) => rs.filter((_, i) => i !== r));

  /**
   * Pasting a block copied from Excel or Google Sheets (tab-separated) into a
   * cell fills the grid from that cell, adding rows and columns as needed.
   * Row -1 is the header row.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    e.preventDefault();
    const grid = text.replace(/\r/g, "").replace(/\n$/, "").split("\n").map((l) => l.split("\t"));
    const needCols = Math.max(headers.length, startCol + Math.max(...grid.map((r) => r.length)));
    const newHeaders = [...headers, ...Array.from({ length: needCols - headers.length }, (_, i) => `Column ${headers.length + i + 1}`)];
    const newAlign = [...alignments, ...Array<Alignment>(needCols - alignments.length).fill("left")];
    let newRows = rows.map((r) => [...r, ...Array(needCols - r.length).fill("")]);
    grid.forEach((line, gi) => {
      const r = startRow + gi;
      line.forEach((value, gj) => {
        const c = startCol + gj;
        if (r === -1) newHeaders[c] = value.trim();
        else {
          while (newRows.length <= r) newRows = [...newRows, Array(needCols).fill("")];
          newRows[r][c] = value.trim();
        }
      });
    });
    setHeaders(newHeaders);
    setAlignments(newAlign);
    setRows(newRows);
    toast.success(`Pasted ${grid.length} row${grid.length === 1 ? "" : "s"} × ${Math.max(...grid.map((r) => r.length))} columns`);
  };

  const clearAll = () => {
    setHeaders(["Column 1", "Column 2", "Column 3"]);
    setAlignments(["left", "left", "left"]);
    setRows([
      ["", "", ""],
      ["", "", ""],
    ]);
  };

  const handleCopy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Table"
        description="Type into the cells, or paste a block of cells from Excel or Google Sheets into any cell."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={addColumn}>
              <Plus aria-hidden="true" /> Column
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus aria-hidden="true" /> Row
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                {headers.map((h, c) => {
                  const Icon = ALIGN_ICON[alignments[c]];
                  return (
                    <th key={c} scope="col" className="border-r p-1.5 text-left font-normal last:border-r-0">
                      <div className="flex items-center gap-0.5">
                        <input
                          value={h}
                          aria-label={`Heading of column ${c + 1}`}
                          onChange={(e) => setHeaders((hs) => hs.map((v, i) => (i === c ? e.target.value : v)))}
                          onPaste={(e) => handlePaste(e, -1, c)}
                          className={cn(cellClass, "font-semibold")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setAlignments((a) => a.map((v, i) => (i === c ? NEXT_ALIGN[v] : v)))}
                          aria-label={`Column ${c + 1} aligned ${alignments[c]}. Change alignment`}
                          title={`Aligned ${alignments[c]}`}
                        >
                          <Icon aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeColumn(c)}
                          disabled={headers.length <= 1}
                          aria-label={`Delete column ${c + 1}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X aria-hidden="true" />
                        </Button>
                      </div>
                    </th>
                  );
                })}
                <th className="w-9" aria-hidden="true" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, r) => (
                <tr key={r}>
                  {headers.map((_, c) => (
                    <td key={c} className="border-r p-1.5 last:border-r-0">
                      <input
                        value={row[c] ?? ""}
                        aria-label={`Row ${r + 1}, ${headers[c] || `column ${c + 1}`}`}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        onPaste={(e) => handlePaste(e, r, c)}
                        className={cn(cellClass, alignments[c] === "center" && "text-center", alignments[c] === "right" && "text-right tabular-nums")}
                      />
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeRow(r)}
                      disabled={rows.length <= 1}
                      aria-label={`Delete row ${r + 1}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ToolSection>

      <ToolSection
        title="Code"
        actions={
          <>
            <Segmented
              size="sm"
              ariaLabel="Output format"
              value={output}
              onChange={setOutput}
              options={[
                { value: "markdown", label: "Markdown" },
                { value: "html", label: "HTML" },
              ]}
            />
            <Button type="button" size="sm" onClick={handleCopy}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copied" : `Copy ${output === "markdown" ? "Markdown" : "HTML"}`}
            </Button>
          </>
        }
      >
        <pre
          aria-label={`${output === "markdown" ? "Markdown" : "HTML"} output`}
          className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground"
        >
          <code>{code}</code>
        </pre>
      </ToolSection>
    </div>
  );
}
