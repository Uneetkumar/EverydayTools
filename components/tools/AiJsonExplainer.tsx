"use client";

import React, { useState } from "react";
import { Braces } from "lucide-react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import Markdown from "@/components/ai/Markdown";
import { useAiTask } from "@/components/ai/useAiTask";
import { Button } from "@/components/ui/button";
import { Notice, Stat, StatGrid, ToolSection } from "@/components/tool/kit";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { JsonExplanationResult, explainJsonLocally, jsonExplanationToMarkdown } from "@/lib/ai/nlp/json-explainer";
import { cn } from "@/lib/utils";

const SAMPLE_JSON = `{
  "status": "success",
  "data": {
    "user_id": "usr_94827a1b",
    "email": "alex.dev@example.com",
    "role": "admin",
    "created_at": "2025-03-14T09:26:53Z",
    "api_key": "sk_live_51Hx2b",
    "subscription": {
      "plan": "pro_annual",
      "active": true,
      "expires_at": "2027-01-01T00:00:00Z",
      "seat_count": 25
    },
    "invoices": [
      { "id": "inv_001", "amount": 4900, "currency": "INR", "paid": true },
      { "id": "inv_002", "amount": "4900", "currency": "INR", "paid": false, "note": "retry scheduled" }
    ]
  }
}`;

function Badge({ children, tone }: { children: React.ReactNode; tone?: "warning" }) {
  return (
    <span
      className={cn(
        "ml-1.5 inline-block rounded border px-1.5 text-[11px] leading-5",
        tone === "warning" ? "border-warning/40 text-warning" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

export default function AiJsonExplainer() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [analysis, setAnalysis] = useState<{ result: JsonExplanationResult; ms: number } | null>(null);
  const ai = useAiTask("explain-json");

  const handleRun = async () => {
    if (!input.trim()) {
      ai.setError("Paste some JSON to explain.");
      return;
    }
    const start = performance.now();
    const result = explainJsonLocally(input);
    setAnalysis({ result, ms: Math.round(performance.now() - start) });
    ai.setOutput(null);
    if (!result.isValid) {
      markToolError("invalid_json");
      return;
    }
    markToolCompleted();
    if (ai.provider === "gemini") await ai.run(input);
    else ai.setError(null);
  };

  const format = () => {
    try {
      setInput(JSON.stringify(JSON.parse(input), null, 2));
    } catch {
      handleRun();
    }
  };

  const r = analysis?.result;

  return (
    <div className="space-y-6">
      <AIWorkspace
        provider={ai.provider}
        onProviderChange={ai.setProvider}
        localHint="Maps every field, type and format. Private and instant."
        cloudHint="Adds a written explanation from Google Gemini. JSON is sent to Google."
        streamingText={ai.partial}
        busy={ai.busy}
        onRun={handleRun}
        runLabel="Explain JSON"
        error={ai.error}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          label="JSON"
          placeholder='Paste an API response, config file or any JSON, e.g. {"name": "value"}'
          sampleText={SAMPLE_JSON}
          disabled={ai.busy}
          mono
          minRows={12}
          maxChars={200000}
          accept=".json,.txt,.geojson"
          invalid={!!r && !r.isValid}
        />
        <Button type="button" variant="outline" size="sm" onClick={format} disabled={!input.trim() || ai.busy}>
          <Braces aria-hidden="true" /> Format JSON
        </Button>
      </AIWorkspace>

      {r && !r.isValid && (
        <Notice tone="error">
          <p className="font-medium">This isn&apos;t valid JSON{r.errorLine ? ` (line ${r.errorLine}, column ${r.errorColumn})` : ""}.</p>
          <p className="mt-0.5 text-muted-foreground">
            {r.error}. Common causes: a trailing comma, single quotes instead of double quotes, or a missing bracket.
          </p>
        </Notice>
      )}

      {r && r.isValid && (
        <AIOutput
          title="Structure"
          result={jsonExplanationToMarkdown(r) + (ai.output ? `\n\n## Explanation\n${ai.output.result}` : "")}
          provider={ai.output ? "gemini" : "local"}
          modelUsed={ai.output?.modelUsed}
          elapsedMs={ai.output?.elapsedMs ?? analysis?.ms}
          filename="json-explanation.md"
          toolName="ai-json-explainer"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-foreground">{r.overview}</p>
              <StatGrid>
                <Stat label="Field paths" value={r.totalKeys} />
                <Stat label="Nesting depth" value={r.maxDepth} />
                <Stat label="Arrays" value={r.arrays} />
                <Stat label="Root" value={r.rootType === "array" ? "List" : r.rootType === "object" ? "Object" : "Value"} />
              </StatGrid>
            </div>

            {ai.output && (
              <ToolSection title="Explanation" description="Written by Google Gemini. Check anything you rely on.">
                <Markdown text={ai.output.result} className="rounded-lg border bg-muted/20 p-4" />
              </ToolSection>
            )}

            {r.insights.length > 0 && (
              <ToolSection title="Worth knowing">
                <ul className="space-y-2">
                  {r.insights.map((note, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-foreground">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          /secret|personal/i.test(note) ? "bg-warning" : "bg-muted-foreground/50"
                        )}
                      />
                      {note}
                    </li>
                  ))}
                </ul>
              </ToolSection>
            )}

            {r.fields.length > 0 && (
              <ToolSection title="Fields" description="[] means every item of a list.">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Path</th>
                        <th scope="col" className="px-3 py-2 font-medium">Type</th>
                        <th scope="col" className="px-3 py-2 font-medium">Meaning</th>
                        <th scope="col" className="px-3 py-2 font-medium">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {r.fields.map((f) => (
                        <tr key={f.path} className="align-top">
                          <td className="px-3 py-2 font-mono text-xs break-all text-foreground">{f.path}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                            {f.type}
                            {f.format && <div className="text-foreground">{f.format}</div>}
                          </td>
                          <td className="px-3 py-2 text-foreground">
                            {f.description}
                            {f.isOptional && f.presence && (
                              <Badge>
                                in {f.presence.present} of {f.presence.total}
                              </Badge>
                            )}
                            {f.sensitive && <Badge tone="warning">secret</Badge>}
                            {f.personal && <Badge tone="warning">personal</Badge>}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs break-all text-muted-foreground">{f.sampleValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ToolSection>
            )}
          </div>
        </AIOutput>
      )}
    </div>
  );
}
