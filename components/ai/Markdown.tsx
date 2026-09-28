import React from "react";
import { cn } from "@/lib/utils";

/**
 * A small Markdown renderer for model output: headings, paragraphs, bullet
 * and numbered lists, tables, code blocks, bold, italic, inline code and
 * links. It builds React elements rather than HTML strings, so nothing in the
 * text can inject markup; links are limited to http(s).
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${i++}`;
    if (m[1]) {
      out.push(
        <code key={k} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {m[1].slice(1, -1)}
        </code>
      );
    } else if (m[2]) {
      out.push(
        <strong key={k} className="font-semibold text-foreground">
          {renderInline(m[2].slice(2, -2), k)}
        </strong>
      );
    } else if (m[3]) {
      out.push(<em key={k}>{renderInline(m[3].slice(1, -1), k)}</em>);
    } else if (m[4]) {
      const label = m[4].slice(1, m[4].indexOf("]"));
      out.push(
        <a key={k} href={m[5]} target="_blank" rel="noopener noreferrer nofollow" className="text-link underline underline-offset-2">
          {label}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; level: number; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "table"; rows: string[][] };

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ kind: "h", level: h[1].length, text: h[2].replace(/\s*#+\s*$/, "") });
      i++;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].trim().slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      blocks.push({ kind: "table", rows });
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ""));
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ kind: "ol", items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(```|#{1,6}\s|[-*•]\s|\d+[.)]\s|\|)/.test(lines[i])
    ) {
      para.push(lines[i++].trim());
    }
    blocks.push({ kind: "p", lines: para });
  }
  return blocks;
}

export default function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parse(text);
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-foreground", className)}>
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        switch (b.kind) {
          case "h":
            return b.level <= 2 ? (
              <h4 key={k} className="pt-1 text-base font-semibold text-foreground">
                {renderInline(b.text, k)}
              </h4>
            ) : (
              <h5 key={k} className="pt-1 text-sm font-semibold text-foreground">
                {renderInline(b.text, k)}
              </h5>
            );
          case "ul":
            return (
              <ul key={k} className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
                {b.items.map((it, ii) => (
                  <li key={ii}>{renderInline(it, `${k}-${ii}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
                {b.items.map((it, ii) => (
                  <li key={ii}>{renderInline(it, `${k}-${ii}`)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre key={k} className="overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
                <code>{b.text}</code>
              </pre>
            );
          case "table": {
            const [head, ...body] = b.rows;
            return (
              <div key={k} className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  {head && (
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        {head.map((c, ci) => (
                          <th key={ci} scope="col" className="px-3 py-2 font-medium">
                            {renderInline(c, `${k}-h${ci}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y">
                    {body.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((c, ci) => (
                          <td key={ci} className="px-3 py-2 align-top">
                            {renderInline(c, `${k}-${ri}-${ci}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          default:
            return (
              <p key={k}>
                {b.lines.map((l, li) => (
                  <React.Fragment key={li}>
                    {li > 0 && <br />}
                    {renderInline(l, `${k}-${li}`)}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
