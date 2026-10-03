"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, Trash2, Code2, Sparkles, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";
import {
  ToolSection,
  Field,
  TextArea,
  SelectInput,
  ToggleRow,
  Chips,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN",
  "IS", "NULL", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN",
  "CROSS JOIN", "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
  "UNION", "UNION ALL", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "DROP TABLE", "ALTER TABLE", "ADD COLUMN", "PRIMARY KEY",
  "FOREIGN KEY", "REFERENCES", "INDEX", "VIEW", "AS", "DISTINCT", "CASE",
  "WHEN", "THEN", "ELSE", "END", "WITH", "EXISTS", "COUNT", "SUM", "AVG",
  "MIN", "MAX", "COALESCE", "CAST", "ASC", "DESC"
];

const PRESETS = [
  {
    label: "Complex Query with JOINs",
    sql: "select u.id, u.name, u.email, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.status = 'active' and u.created_at >= '2024-01-01' group by u.id, u.name, u.email having sum(o.amount) > 500 order by total_spent desc limit 50;",
  },
  {
    label: "INSERT Statement",
    sql: "insert into products (sku, name, price, stock, is_active, created_at) values ('PRD-001', 'Ergonomic Mechanical Keyboard', 129.99, 45, true, NOW()), ('PRD-002', 'Wireless Gaming Mouse', 59.50, 120, true, NOW());",
  },
  {
    label: "CTE (WITH Clause)",
    sql: "with monthly_sales as (select date_trunc('month', sale_date) as month, sum(revenue) as revenue from transactions where status = 'completed' group by 1) select month, revenue, lag(revenue) over (order by month) as prev_month_revenue, round(((revenue - lag(revenue) over (order by month)) / lag(revenue) over (order by month)) * 100, 2) as growth_pct from monthly_sales order by month desc;",
  },
  {
    label: "UPDATE with Subquery",
    sql: "update accounts set balance = balance - 100, updated_at = NOW() where id in (select user_id from subscriptions where status = 'past_due' and retries < 3);",
  },
];

function tokenizeSql(sql: string): { type: "code" | "literal" | "comment"; text: string }[] {
  const tokenRegex = /(\'(?:[^\'\\]|\\.)*\'|\"(?:[^\"\\]|\\.)*\"|`[^`]*`|\/\*[\s\S]*?\*\/|--[^\r\n]*)/g;
  const parts: { type: "code" | "literal" | "comment"; text: string }[] = [];
  let lastIndex = 0;
  let match;
  while ((match = tokenRegex.exec(sql)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "code", text: sql.slice(lastIndex, match.index) });
    }
    const token = match[0];
    const type = token.startsWith("--") || token.startsWith("/*") ? "comment" : "literal";
    parts.push({ type, text: token });
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < sql.length) {
    parts.push({ type: "code", text: sql.slice(lastIndex) });
  }
  return parts;
}

function formatSql(
  rawSql: string,
  options: {
    indent: string;
    casing: "upper" | "lower" | "preserve";
    minify: boolean;
  }
): string {
  if (!rawSql.trim()) return "";
  const tokens = tokenizeSql(rawSql);

  // 1. Minify mode
  if (options.minify) {
    let out = "";
    for (const t of tokens) {
      if (t.type === "comment") continue;
      if (t.type === "literal") {
        out += t.text;
      } else {
        let code = t.text.replace(/\s+/g, " ");
        if (options.casing !== "preserve") {
          const regex = new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi");
          code = code.replace(regex, (m) =>
            options.casing === "upper" ? m.toUpperCase() : m.toLowerCase()
          );
        }
        out += code;
      }
    }
    return out.trim();
  }

  // 2. Full Format
  // Major break keywords that start on a new line
  const majorKeywords = [
    "SELECT", "FROM", "WHERE", "HAVING", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET",
    "UNION ALL", "UNION", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
    "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN", "CROSS JOIN", "JOIN",
    "ON", "WITH"
  ];

  // Process casing on code tokens only (preserve string literals completely)
  let processed = "";
  for (const t of tokens) {
    if (t.type === "literal" || t.type === "comment") {
      processed += t.text;
    } else {
      let code = t.text.replace(/[\r\n\t]+/g, " ");
      if (options.casing !== "preserve") {
        const regex = new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi");
        code = code.replace(regex, (m) =>
          options.casing === "upper" ? m.toUpperCase() : m.toLowerCase()
        );
      }
      processed += code;
    }
  }

  // Split on major keywords outside literals
  const subTokens = tokenizeSql(processed);
  let withBreaks = "";
  const majorRegex = new RegExp(
    `\\b(${majorKeywords.map((k) => k.replace(/ /g, "\\s+")).join("|")})\\b`,
    "gi"
  );
  for (const t of subTokens) {
    if (t.type === "literal" || t.type === "comment") {
      withBreaks += t.text;
    } else {
      withBreaks += t.text.replace(majorRegex, "\n$1");
    }
  }

  // Indent lines that are not top-level clauses
  const lines = withBreaks.split("\n").map((l) => l.trim()).filter(Boolean);
  const resultLines: string[] = [];

  for (let line of lines) {
    const firstWord = line.split(" ")[0].toUpperCase();
    const isMajor = [
      "SELECT", "FROM", "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT",
      "UNION", "INSERT", "VALUES", "UPDATE", "SET", "DELETE", "WITH"
    ].includes(firstWord);

    if (isMajor) {
      resultLines.push(line);
    } else {
      resultLines.push(`${options.indent}${line}`);
    }
  }

  return resultLines.join("\n");
}

export default function SqlFormatter() {
  const [inputSql, setInputSql] = useState(PRESETS[0].sql);
  const [indentOption, setIndentOption] = useState<"2" | "4" | "tab">("2");
  const [casingOption, setCasingOption] = useState<"upper" | "lower" | "preserve">("upper");
  const [minify, setMinify] = useState(false);
  const [copied, setCopied] = useState(false);

  const indentStr = useMemo(() => {
    if (indentOption === "2") return "  ";
    if (indentOption === "4") return "    ";
    return "\t";
  }, [indentOption]);

  const formattedSql = useMemo(() => {
    return formatSql(inputSql, {
      indent: indentStr,
      casing: casingOption,
      minify,
    });
  }, [inputSql, indentStr, casingOption, minify]);

  const copyResult = () => {
    if (!formattedSql) return;
    navigator.clipboard.writeText(formattedSql);
    setCopied(true);
    toast.success("Formatted SQL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!formattedSql) return;
    const blob = new Blob([formattedSql], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, minify ? "query.min.sql" : "query.sql");
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="SQL Formatter & Query Beautifier"
        description="Format, prettify, uppercase keywords, and indent SQL statements. Supports PostgreSQL, MySQL, SQLite, and ANSI SQL."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const p = PRESETS.find((x) => x.label === val);
            if (p) setInputSql(p.sql);
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
          ariaLabel="SQL Presets"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Keyword Casing">
            <SelectInput
              value={casingOption}
              onChange={(e) => setCasingOption(e.target.value as "upper" | "lower" | "preserve")}
            >
              <option value="upper">UPPERCASE (Standard)</option>
              <option value="lower">lowercase</option>
              <option value="preserve">Preserve Original</option>
            </SelectInput>
          </Field>

          <Field label="Indentation">
            <SelectInput
              value={indentOption}
              onChange={(e) => setIndentOption(e.target.value as "2" | "4" | "tab")}
              disabled={minify}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="tab">1 Tab</option>
            </SelectInput>
          </Field>

          <div className="flex items-center pt-6">
            <ToggleRow
              id="minify-sql"
              label="Minify SQL"
              description="Strip whitespace and comments"
              checked={minify}
              onCheckedChange={setMinify}
            />
          </div>
        </div>
      </ToolSection>

      <ToolDivider />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Raw SQL Input
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputSql("")}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3 mr-1" /> Clear
            </Button>
          </div>
          <TextArea
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
            placeholder="SELECT * FROM table WHERE ..."
            className="font-mono text-xs leading-relaxed min-h-80"
            aria-label="Raw SQL Input"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {minify ? "Minified SQL" : "Formatted SQL Output"}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
                disabled={!formattedSql}
                className="h-7 text-xs"
              >
                {copied ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                disabled={!formattedSql}
                className="h-7 text-xs"
              >
                <Download className="size-3 mr-1" /> Download
              </Button>
            </div>
          </div>
          <TextArea
            value={formattedSql}
            readOnly
            placeholder="Formatted SQL output will appear here..."
            className="font-mono text-xs leading-relaxed min-h-80 bg-muted/30"
            aria-label="Formatted SQL Output"
          />
        </div>
      </div>
    </div>
  );
}
