"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, ArrowRightLeft, Code, Trash2 } from "lucide-react";
import { copyText } from "@/lib/utils/clipboard";

export default function HtmlEntityConverter() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState<string>('<div class="hero-card">\n  <h1>TabBench & "Everyday Tools" © 2026</h1>\n  <p>Price: $19.99 < $50.00 & save 50%</p>\n</div>');
  const [format, setFormat] = useState<"named" | "decimal" | "hex">("named");
  const [copied, setCopied] = useState<boolean>(false);

  const output = useMemo(() => {
    if (!input) return "";

    if (mode === "encode") {
      if (format === "named") {
        return input
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;")
          .replace(/©/g, "&copy;")
          .replace(/®/g, "&reg;")
          .replace(/™/g, "&trade;")
          .replace(/€/g, "&euro;")
          .replace(/£/g, "&pound;")
          .replace(/¥/g, "&yen;");
      } else if (format === "decimal") {
        return input.replace(/[\u00A0-\u9999<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
      } else {
        return input.replace(/[\u00A0-\u9999<>&"']/g, (c) => `&#x${c.charCodeAt(0).toString(16).toUpperCase()};`);
      }
    } else {
      // Decode
      const doc = new DOMParser().parseFromString(input, "text/html");
      return doc.documentElement.textContent || "";
    }
  }, [input, mode, format]);

  const handleCopy = () => {
    if (!output) return;
    copyText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModeSwitch = () => {
    if (mode === "encode") {
      setMode("decode");
      setInput(output || "&lt;h1&gt;TabBench &amp; Tools&lt;/h1&gt;");
    } else {
      setMode("encode");
      setInput(output || "<h1>TabBench & Tools</h1>");
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-xl border bg-muted/30">
        <div className="flex items-center gap-2">
          <button
            onClick={handleModeSwitch}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {mode === "encode" ? "Encode HTML Entities" : "Decode HTML Entities"}
          </button>
        </div>

        {mode === "encode" && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Format</span>
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
              {(["named", "decimal", "hex"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                    format === fmt
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {fmt === "named" ? "Named (&lt;)" : fmt === "decimal" ? "Decimal (&#60;)" : "Hex (&#x3C;)"}
                </button>
              ))}
            </div>
          </div>
        )}

        <button aria-label="Clear"
          onClick={() => setInput("")}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span>{mode === "encode" ? "Raw HTML / Plain Text" : "Encoded HTML String"}</span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{input.length} chars</span>
          </div>
          <textarea aria-label="HTML or text input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            placeholder="Type or paste HTML string here..."
            className="w-full p-4 font-mono resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span>{mode === "encode" ? "Escaped HTML Output" : "Decoded Plain Text Output"}</span>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs disabled:opacity-50 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Result"}
            </button>
          </div>
          <textarea aria-label="Converted output"
            readOnly
            value={output}
            rows={12}
            className="w-full p-4 font-mono resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>
    </div>
  );
}
