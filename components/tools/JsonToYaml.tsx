"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, ArrowRightLeft, Trash2, FileCode } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";
import {
  ToolSection,
  Field,
  TextArea,
  Segmented,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const PRESETS = [
  {
    label: "Docker Compose",
    json: JSON.stringify(
      {
        version: "3.8",
        services: {
          web: {
            image: "nginx:alpine",
            ports: ["80:80", "443:443"],
            restart: "always",
            environment: {
              NODE_ENV: "production",
              PORT: 80,
            },
            volumes: ["./html:/usr/share/nginx/html:ro"],
          },
          db: {
            image: "postgres:16-alpine",
            environment: {
              POSTGRES_DB: "tabbench_db",
              POSTGRES_USER: "admin",
            },
          },
        },
      },
      null,
      2
    ),
  },
  {
    label: "Kubernetes Pod",
    json: JSON.stringify(
      {
        apiVersion: "v1",
        kind: "Pod",
        metadata: {
          name: "nginx-demo",
          labels: { app: "web", env: "prod" },
        },
        spec: {
          containers: [
            {
              name: "nginx",
              image: "nginx:1.25",
              ports: [{ containerPort: 80 }],
              resources: {
                limits: { memory: "256Mi", cpu: "500m" },
              },
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    label: "GitHub Actions",
    json: JSON.stringify(
      {
        name: "CI Pipeline",
        on: ["push", "pull_request"],
        jobs: {
          build: {
            "runs-on": "ubuntu-latest",
            steps: [
              { uses: "actions/checkout@v4" },
              { name: "Setup Node.js", uses: "actions/setup-node@v4", with: { "node-version": 20 } },
              { run: "npm ci" },
              { run: "npm test" },
            ],
          },
        },
      },
      null,
      2
    ),
  },
];

// Clean Pure JS JSON -> YAML serializer
function jsonToYaml(obj: any, indent = 2, currentIndent = 0): string {
  const pad = " ".repeat(currentIndent);

  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "boolean" || typeof obj === "number") return String(obj);
  if (typeof obj === "string") {
    if (obj.includes("\n")) {
      const lines = obj.split("\n").map((l) => pad + "  " + l).join("\n");
      return "|\n" + lines;
    }
    if (/[:#\[\]{}*,]|^\s|\s$|^(true|false|null|[0-9]+(\.[0-9]+)?)$/i.test(obj)) {
      return JSON.stringify(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj
      .map((item) => {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          const innerYaml = jsonToYaml(item, indent, currentIndent + indent);
          const trimmed = innerYaml.trim();
          const firstNewline = trimmed.indexOf("\n");
          if (firstNewline !== -1) {
            const firstLine = trimmed.slice(0, firstNewline);
            const rest = trimmed.slice(firstNewline + 1);
            return `${pad}- ${firstLine}\n${rest}`;
          }
          return `${pad}- ${trimmed}`;
        }
        return `${pad}- ${jsonToYaml(item, indent, currentIndent + indent)}`;
      })
      .join("\n");
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    return keys
      .map((key) => {
        const val = obj[key];
        const safeKey = /[:\s]/.test(key) ? JSON.stringify(key) : key;
        if (typeof val === "object" && val !== null && Object.keys(val).length > 0) {
          return `${pad}${safeKey}:\n${jsonToYaml(val, indent, currentIndent + indent)}`;
        }
        return `${pad}${safeKey}: ${jsonToYaml(val, indent, currentIndent + indent)}`;
      })
      .join("\n");
  }

  return String(obj);
}

// Clean Lightweight YAML -> JSON parser
function yamlToJson(yamlStr: string): any {
  const lines = yamlStr.split(/\r?\n/);

  const parseScalar = (val: string): any => {
    val = val.trim();
    if (!val || val === "null" || val === "~") return null;
    if (val === "true" || val === "True" || val === "yes" || val === "Yes") return true;
    if (val === "false" || val === "False" || val === "no" || val === "No") return false;
    if (/^-?\d+$/.test(val)) return parseInt(val, 10);
    if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
    if (val.startsWith("\"") && val.endsWith("\"")) {
      try {
        return JSON.parse(val);
      } catch {
        return val.slice(1, -1);
      }
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      return val.slice(1, -1).replace(/''/g, "'");
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        return JSON.parse(val);
      } catch {
        return val.slice(1, -1).split(",").map((s) => parseScalar(s.trim()));
      }
    }
    if (val.startsWith("{") && val.endsWith("}")) {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const cleaned: { indent: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = raw.search(/\S/);
    cleaned.push({ indent, text: trimmed });
  }

  if (cleaned.length === 0) return {};

  let idx = 0;

  function parseBlock(minIndent: number): any {
    if (idx >= cleaned.length) return null;
    const first = cleaned[idx];
    if (first.indent < minIndent) return null;

    if (first.text.startsWith("- ")) {
      const arr: any[] = [];
      const seqIndent = first.indent;
      while (idx < cleaned.length && cleaned[idx].indent === seqIndent && cleaned[idx].text.startsWith("- ")) {
        const itemLine = cleaned[idx];
        const content = itemLine.text.slice(2).trim();
        idx++;

        if (content.includes(":") && !content.startsWith("\"") && !content.startsWith("'")) {
          const colonIdx = content.indexOf(":");
          const k = content.slice(0, colonIdx).trim().replace(/^["']|["']$/g, "");
          const vStr = content.slice(colonIdx + 1).trim();
          const obj: Record<string, any> = {};
          if (vStr === "" || vStr === "|" || vStr === ">") {
            obj[k] = parseBlock(seqIndent + 1);
          } else {
            obj[k] = parseScalar(vStr);
          }
          while (idx < cleaned.length && cleaned[idx].indent > seqIndent && !cleaned[idx].text.startsWith("- ")) {
            const propLine = cleaned[idx];
            if (propLine.text.includes(":")) {
              const cIdx = propLine.text.indexOf(":");
              const pk = propLine.text.slice(0, cIdx).trim().replace(/^["']|["']$/g, "");
              const pvStr = propLine.text.slice(cIdx + 1).trim();
              idx++;
              if (pvStr === "" || pvStr === "|" || pvStr === ">") {
                obj[pk] = parseBlock(propLine.indent + 1);
              } else {
                obj[pk] = parseScalar(pvStr);
              }
            } else {
              idx++;
            }
          }
          arr.push(obj);
        } else if (content === "" || content === "|" || content === ">") {
          arr.push(parseBlock(seqIndent + 1));
        } else {
          arr.push(parseScalar(content));
        }
      }
      return arr;
    } else {
      const map: Record<string, any> = {};
      const mapIndent = first.indent;
      while (idx < cleaned.length && cleaned[idx].indent === mapIndent && !cleaned[idx].text.startsWith("- ")) {
        const line = cleaned[idx];
        const colonIdx = line.text.indexOf(":");
        if (colonIdx === -1) {
          idx++;
          continue;
        }
        const key = line.text.slice(0, colonIdx).trim().replace(/^["']|["']$/g, "");
        const valStr = line.text.slice(colonIdx + 1).trim();
        idx++;

        if (valStr === "" || valStr === "|" || valStr === ">") {
          if (idx < cleaned.length && cleaned[idx].indent > mapIndent) {
            map[key] = parseBlock(cleaned[idx].indent);
          } else {
            map[key] = valStr === "|" || valStr === ">" ? "" : {};
          }
        } else {
          map[key] = parseScalar(valStr);
        }
      }
      return map;
    }
  }

  const result = parseBlock(0);
  return result ?? {};
}

export default function JsonToYaml() {
  const [direction, setDirection] = useState<"json-to-yaml" | "yaml-to-json">("json-to-yaml");
  const [inputText, setInputText] = useState(PRESETS[0].json);
  const [indentSize, setIndentSize] = useState<2 | 4>(2);
  const [copied, setCopied] = useState(false);

  const conversion = useMemo(() => {
    if (!inputText.trim()) return { output: "", error: null };
    try {
      if (direction === "json-to-yaml") {
        const parsedJson = JSON.parse(inputText);
        const yaml = jsonToYaml(parsedJson, indentSize);
        return { output: yaml, error: null };
      } else {
        const jsonObj = yamlToJson(inputText);
        const jsonFormatted = JSON.stringify(jsonObj, null, indentSize);
        return { output: jsonFormatted, error: null };
      }
    } catch (err: unknown) {
      return { output: "", error: err instanceof Error ? err.message : "Syntax parsing error" };
    }
  }, [inputText, direction, indentSize]);

  const copyResult = () => {
    if (!conversion.output) return;
    navigator.clipboard.writeText(conversion.output);
    setCopied(true);
    toast.success("Converted result copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!conversion.output) return;
    const isYaml = direction === "json-to-yaml";
    const blob = new Blob([conversion.output], {
      type: isYaml ? "text/yaml;charset=utf-8" : "application/json;charset=utf-8",
    });
    downloadBlob(blob, isYaml ? "document.yaml" : "document.json");
  };

  const swapDirection = () => {
    if (conversion.output) {
      setInputText(conversion.output);
    }
    setDirection((d) => (d === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml"));
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="JSON ↔ YAML Converter"
        description="Convert instantly between JSON and YAML syntax. Everything is computed offline in your browser."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips
            value={null}
            onChange={(val) => {
              const p = PRESETS.find((x) => x.label === val);
              if (p) {
                setDirection("json-to-yaml");
                setInputText(p.json);
              }
            }}
            options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
            ariaLabel="Presets"
          />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={swapDirection}>
              <ArrowRightLeft className="size-3.5 mr-1.5" /> Swap Direction
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Segmented
            value={direction}
            onChange={(v) => setDirection(v as "json-to-yaml" | "yaml-to-json")}
            options={[
              { value: "json-to-yaml", label: "JSON → YAML" },
              { value: "yaml-to-json", label: "YAML → JSON" },
            ]}
            ariaLabel="Conversion Direction"
          />

          <Segmented
            value={indentSize.toString()}
            onChange={(v) => setIndentSize(parseInt(v, 10) as 2 | 4)}
            options={[
              { value: "2", label: "2 Spaces" },
              { value: "4", label: "4 Spaces" },
            ]}
            ariaLabel="Indentation"
          />
        </div>
      </ToolSection>

      <ToolDivider />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {direction === "json-to-yaml" ? "Input JSON" : "Input YAML"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputText("")}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3 mr-1" /> Clear
            </Button>
          </div>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={direction === "json-to-yaml" ? '{\n  "key": "value"\n}' : "key: value"}
            className="font-mono text-xs leading-relaxed min-h-80"
            aria-label="Input Payload"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {direction === "json-to-yaml" ? "Output YAML" : "Output JSON"}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
                disabled={!conversion.output}
                className="h-7 text-xs"
              >
                {copied ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                disabled={!conversion.output}
                className="h-7 text-xs"
              >
                <Download className="size-3 mr-1" /> Download
              </Button>
            </div>
          </div>
          <TextArea
            value={conversion.output}
            readOnly
            placeholder="Converted output will appear here..."
            className="font-mono text-xs leading-relaxed min-h-80 bg-muted/30"
            aria-label="Converted Output"
          />
        </div>
      </div>

      {conversion.error && <Notice tone="error">{conversion.error}</Notice>}
    </div>
  );
}
