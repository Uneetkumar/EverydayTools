"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, Plus, Trash2, Code2, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";
import {
  ToolSection,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ToggleRow,
  Chips,
  Segmented,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface SchemaParam {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enumValues: string;
}

interface ToolTemplate {
  label: string;
  name: string;
  description: string;
  params: SchemaParam[];
}

const TEMPLATES: ToolTemplate[] = [
  {
    label: "Get Weather",
    name: "get_current_weather",
    description: "Get the current weather and forecast for a given geographic location.",
    params: [
      {
        id: "1",
        name: "location",
        type: "string",
        description: "City and country or state, e.g. 'San Francisco, CA' or 'Tokyo, Japan'",
        required: true,
        enumValues: "",
      },
      {
        id: "2",
        name: "unit",
        type: "string",
        description: "Temperature unit system",
        required: false,
        enumValues: "celsius, fahrenheit",
      },
    ],
  },
  {
    label: "Query Database",
    name: "execute_sql_query",
    description: "Execute a read-only SQL query against the analytics database.",
    params: [
      {
        id: "1",
        name: "sql_query",
        type: "string",
        description: "Parameterized SELECT query statement to execute",
        required: true,
        enumValues: "",
      },
      {
        id: "2",
        name: "limit",
        type: "number",
        description: "Maximum number of rows to return (default 100)",
        required: false,
        enumValues: "",
      },
    ],
  },
  {
    label: "Send Email",
    name: "send_email_notification",
    description: "Send an email alert to one or more recipients with markdown content.",
    params: [
      {
        id: "1",
        name: "recipient_email",
        type: "string",
        description: "Valid destination email address",
        required: true,
        enumValues: "",
      },
      {
        id: "2",
        name: "subject",
        type: "string",
        description: "Subject title of the email",
        required: true,
        enumValues: "",
      },
      {
        id: "3",
        name: "body_markdown",
        type: "string",
        description: "Email message body in markdown format",
        required: true,
        enumValues: "",
      },
    ],
  },
];

export default function JsonSchemaForAi() {
  const [toolName, setToolName] = useState(TEMPLATES[0].name);
  const [toolDescription, setToolDescription] = useState(TEMPLATES[0].description);
  const [params, setParams] = useState<SchemaParam[]>(TEMPLATES[0].params);
  const [strictMode, setStrictMode] = useState(true);
  const [outputTab, setOutputTab] = useState<"openai" | "anthropic" | "typescript">("openai");
  const [copied, setCopied] = useState(false);

  const addParam = () => {
    setParams((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 7),
        name: `param_${prev.length + 1}`,
        type: "string",
        description: "",
        required: true,
        enumValues: "",
      },
    ]);
  };

  const removeParam = (id: string) => {
    setParams((prev) => prev.filter((p) => p.id !== id));
  };

  const updateParam = (id: string, patch: Partial<SchemaParam>) => {
    setParams((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  // Build JSON Schema object
  const propertiesObj: Record<string, any> = {};
  const requiredList: string[] = [];

  for (const p of params) {
    if (!p.name.trim()) continue;
    const cleanName = p.name.trim().replace(/\s+/g, "_");
    // OpenAI strict mode requires every property to be listed in `required`;
    // an optional one is expressed as nullable instead of being dropped.
    const nullable = strictMode && !p.required;
    const propSchema: any = {
      type: nullable ? [p.type, "null"] : p.type,
      description: p.description || undefined,
    };

    // Strict mode rejects an array without `items` and an object without
    // `properties` / `additionalProperties: false`.
    if (p.type === "array") propSchema.items = { type: "string" };
    if (p.type === "object") {
      propSchema.properties = {};
      propSchema.required = [];
      propSchema.additionalProperties = false;
    }

    if (p.enumValues.trim()) {
      const values = p.enumValues.split(",").map((s) => s.trim()).filter(Boolean);
      propSchema.enum = p.type === "number" ? values.map(Number).filter((n) => !Number.isNaN(n)) : values;
      if (nullable) propSchema.enum.push(null);
    }

    propertiesObj[cleanName] = propSchema;
    if (strictMode || p.required) {
      requiredList.push(cleanName);
    }
  }

  const parametersSchema: Record<string, any> = {
    type: "object",
    properties: propertiesObj,
    required: requiredList,
  };

  if (strictMode) {
    parametersSchema.additionalProperties = false;
  }

  // OpenAI format
  const openAiDefinition = useMemo(() => {
    return {
      type: "function",
      function: {
        name: toolName.trim(),
        description: toolDescription.trim(),
        strict: strictMode ? true : undefined,
        parameters: parametersSchema,
      },
    };
  }, [toolName, toolDescription, strictMode, parametersSchema]);

  // Anthropic format
  const anthropicDefinition = useMemo(() => {
    return {
      name: toolName.trim(),
      description: toolDescription.trim(),
      input_schema: parametersSchema,
    };
  }, [toolName, toolDescription, parametersSchema]);

  // TypeScript definition
  const typeScriptDefinition = useMemo(() => {
    const lines = [
      `/** ${toolDescription} */`,
      `export interface ${toolName
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("")}Params {`,
    ];

    for (const p of params) {
      if (!p.name.trim()) continue;
      const opt = p.required || strictMode ? "" : "?";
      let tsType = p.type as string;
      if (tsType === "array") tsType = "string[]";
      if (tsType === "object") tsType = "Record<string, never>";
      if (p.enumValues.trim()) {
        tsType = p.enumValues
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (p.type === "number" ? s : `"${s}"`))
          .join(" | ");
      }
      if (strictMode && !p.required) tsType = `${tsType} | null`;
      lines.push(`  /** ${p.description || p.name} */`);
      lines.push(`  ${p.name.trim()}${opt}: ${tsType};`);
    }
    lines.push("}");
    return lines.join("\n");
  }, [toolName, toolDescription, params, strictMode]);

  const outputCode = useMemo(() => {
    if (outputTab === "openai") return JSON.stringify(openAiDefinition, null, 2);
    if (outputTab === "anthropic") return JSON.stringify(anthropicDefinition, null, 2);
    return typeScriptDefinition;
  }, [outputTab, openAiDefinition, anthropicDefinition, typeScriptDefinition]);

  const copyResult = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success("AI tool definition copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const isTs = outputTab === "typescript";
    const blob = new Blob([outputCode], {
      type: isTs ? "text/typescript;charset=utf-8" : "application/json;charset=utf-8",
    });
    downloadBlob(blob, isTs ? `${toolName}.ts` : `${toolName}.json`);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="AI Function Calling & Tool JSON Schema Builder"
        description="Define a tool's parameters once and get the JSON for OpenAI function calling (with strict Structured Outputs rules applied when Strict is on), Anthropic tool use, and a matching TypeScript interface."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const t = TEMPLATES.find((x) => x.label === val);
            if (t) {
              setToolName(t.name);
              setToolDescription(t.description);
              setParams(t.params);
            }
          }}
          options={TEMPLATES.map((t) => ({ value: t.label, label: t.label }))}
          ariaLabel="Tool Templates"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tool / Function Name" hint="snake_case, e.g. search_database">
            <TextInput
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="get_weather"
              className="font-mono text-xs"
            />
          </Field>

          <Field label="Tool Description" hint="Crucial for the LLM to know WHEN to invoke this tool">
            <TextInput
              value={toolDescription}
              onChange={(e) => setToolDescription(e.target.value)}
              placeholder="Retrieves the current weather forecast..."
              className="text-xs"
            />
          </Field>
        </div>

        <ToggleRow
          id="strict-mode"
          label="Enable OpenAI Strict Mode (Structured Outputs)"
          description="Sets additionalProperties: false and ensures all parameters are strictly typed in required"
          checked={strictMode}
          onCheckedChange={setStrictMode}
        />
      </ToolSection>

      <ToolDivider />

      {/* Parameter List */}
      <ToolSection
        title="Function Parameters"
        description="Define each argument expected by the LLM function call."
        actions={
          <Button variant="outline" size="sm" onClick={addParam} className="h-7 text-xs">
            <Plus className="size-3 mr-1" /> Add Parameter
          </Button>
        }
      >
        <div className="space-y-3">
          {params.map((p, idx) => (
            <div
              key={p.id}
              className="grid gap-3 rounded-lg border bg-card p-3 shadow-soft sm:grid-cols-12 items-center"
            >
              <div className="sm:col-span-3">
                <label className="text-[10px] text-muted-foreground block mb-0.5">Param Name</label>
                <TextInput
                  value={p.name}
                  onChange={(e) => updateParam(p.id, { name: e.target.value })}
                  placeholder="location"
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted-foreground block mb-0.5">Type</label>
                <SelectInput
                  value={p.type}
                  onChange={(e) => updateParam(p.id, { type: e.target.value as any })}
                  className="h-8 text-xs"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                </SelectInput>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] text-muted-foreground block mb-0.5">Description</label>
                <TextInput
                  value={p.description}
                  onChange={(e) => updateParam(p.id, { description: e.target.value })}
                  placeholder="City and state..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted-foreground block mb-0.5">Enum Choices</label>
                <TextInput
                  value={p.enumValues}
                  onChange={(e) => updateParam(p.id, { enumValues: e.target.value })}
                  placeholder="opt1, opt2"
                  className="h-8 text-xs"
                />
              </div>

              <div className="sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeParam(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove parameter"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ToolSection>

      <ToolDivider />

      {/* Generated Code Output */}
      <ToolSection title="Generated Tool Schema">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              value={outputTab}
              onChange={(v) => setOutputTab(v as "openai" | "anthropic" | "typescript")}
              options={[
                { value: "openai", label: "OpenAI Tools" },
                { value: "anthropic", label: "Anthropic Claude" },
                { value: "typescript", label: "TypeScript Types" },
              ]}
              ariaLabel="Schema Output Format"
            />

            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={copyResult} className="h-7 text-xs">
                {copied ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
                Copy Schema
              </Button>
              <Button variant="outline" size="sm" onClick={downloadFile} className="h-7 text-xs">
                <Download className="size-3 mr-1" /> Download
              </Button>
            </div>
          </div>

          <TextArea
            value={outputCode}
            readOnly
            className="font-mono text-xs leading-relaxed min-h-80 bg-muted/30"
            aria-label="Generated Tool Schema Output"
          />
        </div>
      </ToolSection>
    </div>
  );
}
