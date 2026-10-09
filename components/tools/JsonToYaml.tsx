"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, ArrowRightLeft, Trash2, FileCode } from "lucide-react";
import { toast } from "sonner";
import { CORE_SCHEMA, dump, loadAll } from "js-yaml";
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

// js-yaml rather than a hand-written parser: the old one turned block
// scalars (`run: |` in CI files) into {} and round-tripped "" as null.
// CORE_SCHEMA is YAML 1.2's: no Date objects from timestamps, and "yes"/"no"
// stay strings. dump() still quotes YAML 1.1 booleans ("on", "yes") so older
// parsers read them back as strings.
function jsonToYaml(obj: unknown, indent: number): string {
  return dump(obj, { indent, lineWidth: -1, noRefs: true, schema: CORE_SCHEMA }).trimEnd();
}

/** One document → that value; a multi-document stream (---) → an array. */
function yamlToJson(yamlStr: string): unknown {
  const docs = loadAll(yamlStr, undefined, { schema: CORE_SCHEMA });
  if (docs.length === 0) return {};
  return docs.length === 1 ? docs[0] : docs;
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
