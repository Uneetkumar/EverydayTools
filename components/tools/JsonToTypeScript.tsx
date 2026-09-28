"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, Code, Sparkles, Trash2 } from "lucide-react";
import { downloadBlob } from "@/lib/utils/download";
import { copyText } from "@/lib/utils/clipboard";

const SAMPLE_JSON = `{
  "userId": 104,
  "username": "alex_dev",
  "email": "alex@tabbench.com",
  "isActive": true,
  "profile": {
    "firstName": "Alex",
    "lastName": "Rivera",
    "avatarUrl": "https://tabbench.com/avatars/alex.jpg",
    "reputation": 4820
  },
  "tags": ["frontend", "react", "typescript"],
  "projects": [
    {
      "id": "proj_1",
      "name": "Utility Bench",
      "stars": 120
    }
  ]
}`;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateTs(
  obj: unknown,
  rootName = "RootObject",
  kind: "interface" | "type" = "interface",
  isReadonly = false,
  isOptional = false
): string {
  const interfaces: Record<string, string> = {};

  function parseObject(data: unknown, name: string): string {
    if (data === null) return "null";
    if (data === undefined) return "undefined";
    if (typeof data === "number") return "number";
    if (typeof data === "string") return "string";
    if (typeof data === "boolean") return "boolean";

    if (Array.isArray(data)) {
      if (data.length === 0) return "unknown[]";
      // Deduce inner element type from first element
      const innerType = parseObject(data[0], name.endsWith("s") ? name.slice(0, -1) : `${name}Item`);
      return `${innerType}[]`;
    }

    if (typeof data === "object") {
      const typeName = capitalize(name);
      const props: string[] = [];

      for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
        const propType = parseObject(val, key);
        const ro = isReadonly ? "readonly " : "";
        const opt = isOptional ? "?" : "";
        // Clean valid identifier or quote
        const validId = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        props.push(`  ${ro}${validId}${opt}: ${propType};`);
      }

      if (kind === "interface") {
        interfaces[typeName] = `export interface ${typeName} {\n${props.join("\n")}\n}`;
      } else {
        interfaces[typeName] = `export type ${typeName} = {\n${props.join("\n")}\n};`;
      }

      return typeName;
    }

    return "unknown";
  }

  parseObject(obj, rootName);

  return Object.values(interfaces).join("\n\n");
}

export default function JsonToTypeScript() {
  const [input, setInput] = useState<string>(SAMPLE_JSON);
  const [rootName, setRootName] = useState<string>("UserResponse");
  const [declarationKind, setDeclarationKind] = useState<"interface" | "type">("interface");
  const [isReadonly, setIsReadonly] = useState<boolean>(false);
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  // Derived together; setting state from inside useMemo re-renders during render.
  const { output, error } = useMemo((): { output: string; error: string | null } => {
    if (!input.trim()) return { output: "", error: null };
    try {
      const parsed = JSON.parse(input);
      return { output: generateTs(parsed, rootName || "RootObject", declarationKind, isReadonly, isOptional), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, rootName, declarationKind, isReadonly, isOptional]);

  const handleCopy = () => {
    if (!output) return;
    copyText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    downloadBlob(new Blob([output], { type: "text/typescript" }), `${rootName || "types"}.ts`);
  };

  return (
    <div className="space-y-6">
      {/* Options Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-xl border bg-muted/30">
        <div className="flex flex-wrap items-center gap-3">
          {/* Root Interface Name */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="ts-root-input" className="text-sm font-medium text-foreground">
              Root Name:
            </label>
            <input
              id="ts-root-input"
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              className="px-2.5 py-1.5 font-mono w-36 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="UserResponse"
            />
          </div>

          {/* Interface vs Type */}
          <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setDeclarationKind("interface")}
              className={`px-3 py-1 rounded-md transition-all ${
                declarationKind === "interface"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Interface
            </button>
            <button
              onClick={() => setDeclarationKind("type")}
              className={`px-3 py-1 rounded-md transition-all ${
                declarationKind === "type"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Type Alias
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isReadonly}
              onChange={(e) => setIsReadonly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            readonly
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            optional (?)
          </label>
        </div>
      </div>

      {/* Main Dual Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input JSON */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span>Input JSON Object or Array</span>
            <button
              onClick={() => setInput("")}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea aria-label="JSON input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            placeholder="Paste JSON here to generate TypeScript interfaces..."
            className="w-full p-4 font-mono resize-y text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Output TypeScript */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-muted-foreground" />
              Generated TypeScript Definitions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy TS"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs disabled:opacity-50 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Download className="w-3 h-3" />
                .ts File
              </button>
            </div>
          </div>

          <textarea aria-label="TypeScript output"
            readOnly
            value={error ? `Syntax Error: ${error}` : output}
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
  );
}
