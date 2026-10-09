"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Sparkles, Terminal, FileCode, Wand2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  TextArea,
  Chips,
  ToggleRow,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface PromptTemplate {
  label: string;
  role: string;
  context: string;
  objective: string;
  rules: string;
  thinking: string;
  examples: string;
  outputFormat: string;
}

const TEMPLATES: PromptTemplate[] = [
  {
    label: "Senior Code Reviewer",
    role: "You are an elite Principal Software Engineer conducting strict, security-focused code reviews.",
    context: "Reviewing pull requests for high-throughput, latency-critical production microservices.",
    objective: "Identify race conditions, memory leaks, security vulnerabilities (OWASP Top 10), and algorithmic complexity bottlenecks.",
    rules: "- Be concise and direct without pleasantries.\n- Always point out the exact line and failure condition.\n- Provide a drop-in code fix for every identified bug.\n- Categorize issues by severity: [FATAL], [WARNING], [NIT].",
    thinking: "Before outputting your review, analyze the code in <scratchpad> tags: trace variables, verify error paths, and evaluate time/space complexity.",
    examples: "Input: function getUser(id) { return db.query(`SELECT * FROM users WHERE id = '${id}'`); }\n\nOutput:\n[FATAL] SQL Injection Vulnerability: user-supplied input is directly concatenated into the SQL statement.\nFix: Use parameterized prepared statements: `db.query('SELECT * FROM users WHERE id = $1', [id])`.",
    outputFormat: "Markdown with severity tags and replacement code blocks.",
  },
  {
    label: "Data Extraction & Normalization",
    role: "You are an automated ETL data processing engine.",
    context: "Extracting entities, transaction values, and dates from unstructured customer emails and invoices.",
    objective: "Parse all invoices, amounts, dates, and vendor names into strict, valid JSON.",
    rules: "- Output ONLY valid RFC 8259 JSON.\n- Do NOT include markdown code fences or conversational text.\n- If a field is missing, set its value to null.\n- All dates must be in ISO 8601 (YYYY-MM-DD) format.",
    thinking: "Verify that all currency values are normalized to numeric floats before emitting the final JSON payload.",
    examples: "Input: 'Invoice #1042 from Acme Corp on May 12 2024 for $450.00 USD'\nOutput: {\"invoice_number\": \"1042\", \"vendor\": \"Acme Corp\", \"date\": \"2024-05-12\", \"amount\": 450.0, \"currency\": \"USD\"}",
    outputFormat: "Raw JSON Object matching the specified schema.",
  },
  {
    label: "Technical Docs Writer",
    role: "You are a Lead Developer Advocate and Technical Writer.",
    context: "Writing developer documentation for a public REST and WebSocket API.",
    objective: "Produce crystal-clear, developer-first documentation with prerequisites, curl commands, and request/response payloads.",
    rules: "- Use active voice and concise phrasing.\n- Include working copy-pasteable curl examples.\n- Explain all HTTP error response codes (400, 401, 429).",
    thinking: "Outline the reader's journey from authentication to the first successful 200 OK response.",
    examples: "curl -X POST https://api.tabbench.com/v1/tools -H 'Authorization: Bearer <TOKEN>'",
    outputFormat: "GitHub-flavored Markdown with headers, tables, and code snippets.",
  },
];

export default function AiPromptOptimizer() {
  const [role, setRole] = useState(TEMPLATES[0].role);
  const [context, setContext] = useState(TEMPLATES[0].context);
  const [objective, setObjective] = useState(TEMPLATES[0].objective);
  const [rules, setRules] = useState(TEMPLATES[0].rules);
  const [thinking, setThinking] = useState(TEMPLATES[0].thinking);
  const [examples, setExamples] = useState(TEMPLATES[0].examples);
  const [outputFormat, setOutputFormat] = useState(TEMPLATES[0].outputFormat);
  const [includeUserInputVar, setIncludeUserInputVar] = useState(true);
  const [copied, setCopied] = useState(false);

  const fullPrompt = useMemo(() => {
    const parts: string[] = [];

    if (role.trim()) {
      parts.push(`<role>\n${role.trim()}\n</role>`);
    }

    if (context.trim()) {
      parts.push(`<context>\n${context.trim()}\n</context>`);
    }

    if (objective.trim()) {
      parts.push(`<objective>\n${objective.trim()}\n</objective>`);
    }

    if (rules.trim()) {
      parts.push(`<rules>\n${rules.trim()}\n</rules>`);
    }

    if (thinking.trim()) {
      parts.push(`<thinking_process>\n${thinking.trim()}\n</thinking_process>`);
    }

    if (examples.trim()) {
      parts.push(`<examples>\n${examples.trim()}\n</examples>`);
    }

    if (outputFormat.trim()) {
      parts.push(`<output_format>\n${outputFormat.trim()}\n</output_format>`);
    }

    if (includeUserInputVar) {
      parts.push(`<input_data>\n{{USER_INPUT}}\n</input_data>`);
    }

    return parts.join("\n\n");
  }, [role, context, objective, rules, thinking, examples, outputFormat, includeUserInputVar]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    toast.success("Structured XML prompt copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (tpl: PromptTemplate) => {
    setRole(tpl.role);
    setContext(tpl.context);
    setObjective(tpl.objective);
    setRules(tpl.rules);
    setThinking(tpl.thinking);
    setExamples(tpl.examples);
    setOutputFormat(tpl.outputFormat);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Structured Prompt Builder"
        description="Fill in the sections you need — role, context, goal, rules, reasoning steps, examples, output format — and each is wrapped in its own XML-style tag, the layout model providers recommend for long prompts. Empty sections are left out."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const t = TEMPLATES.find((x) => x.label === val);
            if (t) applyTemplate(t);
          }}
          options={TEMPLATES.map((t) => ({ value: t.label, label: t.label }))}
          ariaLabel="Agent Templates"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="<role> Persona & Expertise" hint="Who is the AI? Seniority, domain, tone">
            <TextArea
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-20"
            />
          </Field>

          <Field label="<context> Scenario Background" hint="What environment or situation is this in?">
            <TextArea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-20"
            />
          </Field>
        </div>

        <Field label="<objective> Specific Goal" hint="Exact desired accomplishment">
          <TextInput
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="text-xs"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="<rules> Strict Constraints & Negative Rules" hint="What must the AI NEVER do? Formatting limits">
            <TextArea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-28"
            />
          </Field>

          <Field label="<thinking_process> Chain of Thought (CoT)" hint="Instructions on how to reason before outputting">
            <TextArea
              value={thinking}
              onChange={(e) => setThinking(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-28"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="<examples> Few-Shot Demonstrations" hint="Input/Output pairs that guide expected format">
            <TextArea
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-24"
            />
          </Field>

          <Field label="<output_format> Output Structure" hint="JSON, Markdown, bullet points, XML tags">
            <TextArea
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="font-mono text-xs leading-relaxed min-h-24"
            />
          </Field>
        </div>

        <ToggleRow
          id="var-user-input"
          label="Include {{USER_INPUT}} Placeholder"
          description="Appends an <input_data> tag with a dynamic runtime variable"
          checked={includeUserInputVar}
          onCheckedChange={setIncludeUserInputVar}
        />
      </ToolSection>

      <ToolDivider />

      {/* Generated XML Prompt */}
      <ToolSection title="Optimized System Prompt (Ready for ChatGPT / Claude)">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Structured Prompt Output
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={copyPrompt}
              className="h-7 text-xs gap-1.5"
            >
              {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
              Copy Structured Prompt
            </Button>
          </div>
          <TextArea
            value={fullPrompt}
            readOnly
            className="font-mono text-xs leading-relaxed min-h-80 bg-muted/30"
            aria-label="Generated Prompt Output"
          />
        </div>
      </ToolSection>
    </div>
  );
}
