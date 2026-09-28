"use client";

import React, { useMemo, useState } from "react";
import { Tags } from "lucide-react";
import { toast } from "sonner";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import Markdown from "@/components/ai/Markdown";
import { useAiTask } from "@/components/ai/useAiTask";
import { Button } from "@/components/ui/button";
import { Field, Segmented, ToolSection } from "@/components/tool/kit";
import { copyText } from "@/lib/utils/clipboard";
import type { KeywordExtractionResult } from "@/lib/ai/nlp/keywords";

const SAMPLE_TEXT = `Solar panels convert sunlight into electricity using photovoltaic cells. A typical home solar system includes panels on the roof, an inverter that turns direct current into alternating current, and often a battery to store energy for the evening. The cost of solar panels has fallen sharply over the last decade, and in many countries a home solar system now pays for itself within six to eight years through lower electricity bills. Net metering lets homeowners sell surplus electricity back to the grid. Before installing solar panels, check the roof's direction and shading, local subsidies, and whether the battery storage is worth the extra cost for your electricity use.`;

interface Normalised {
  keywords: { term: string; detail?: string; count?: number; density?: number }[];
  phrases: { phrase: string; count?: number }[];
}

/** Cloud answers are asked for JSON; tolerate code fences and stray text. */
function parseCloud(text: string): Normalised | null {
  const match = text.replace(/```(?:json)?/gi, "").match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as { keywords?: { term?: string; why?: string }[]; phrases?: string[] };
    const keywords = (data.keywords ?? []).filter((k) => k && typeof k.term === "string").map((k) => ({ term: k.term!, detail: k.why }));
    const phrases = (data.phrases ?? []).filter((p): p is string => typeof p === "string").map((phrase) => ({ phrase }));
    return keywords.length ? { keywords, phrases } : null;
  } catch {
    return null;
  }
}

type Limit = "6" | "10" | "15" | "20";

export default function AiKeywordExtractor() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [limit, setLimit] = useState<Limit>("10");
  // JSON streams in as raw text; showing it half-written helps nobody.
  const ai = useAiTask("keywords", { stream: false });

  const handleRun = () => ai.run(input, { topN: Number(limit) }, "Paste some text to extract keywords from.");

  const out = ai.output;
  const parsed: Normalised | null = useMemo(() => {
    if (!out) return null;
    if (out.provider === "local") {
      const d = out.metrics?.data as KeywordExtractionResult | undefined;
      if (!d) return null;
      return {
        keywords: d.keywords.map((k) => ({ term: k.keyword, count: k.count, density: k.density })),
        phrases: d.phrases.map((p) => ({ phrase: p.phrase, count: p.count })),
      };
    }
    return parseCloud(out.result);
  }, [out]);

  const plain = parsed
    ? [`Keywords: ${parsed.keywords.map((k) => k.term).join(", ")}`, parsed.phrases.length ? `Key phrases: ${parsed.phrases.map((p) => p.phrase).join(", ")}` : ""]
        .filter(Boolean)
        .join("\n")
    : out?.result ?? "";

  const copyTags = async () => {
    if (!parsed) return;
    const tags = [...parsed.keywords.map((k) => k.term), ...parsed.phrases.map((p) => p.phrase)].join(", ");
    if (await copyText(tags)) toast.success("Copied as comma-separated tags");
  };

  return (
    <div className="space-y-6">
      <AIWorkspace
        provider={ai.provider}
        onProviderChange={ai.setProvider}
        localHint="Counts terms and finds repeated phrases. Private and instant."
        cloudHint="Picks keywords by meaning with Google Gemini. Text is sent to Google."
        busy={ai.busy}
        onRun={handleRun}
        runLabel="Extract keywords"
        error={ai.error}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste an article, product description or page copy…"
          sampleText={SAMPLE_TEXT}
          disabled={ai.busy}
        />
        <Field label="Number of keywords">
          <Segmented
            ariaLabel="Number of keywords"
            value={limit}
            onChange={setLimit}
            options={[
              { value: "6", label: "6" },
              { value: "10", label: "10" },
              { value: "15", label: "15" },
              { value: "20", label: "20" },
            ]}
          />
        </Field>
      </AIWorkspace>

      {out && (
        <AIOutput
          title="Keywords"
          result={plain}
          provider={out.provider}
          modelUsed={out.modelUsed}
          elapsedMs={out.elapsedMs}
          filename="keywords.txt"
          toolName="ai-keyword-extractor"
          onRegenerate={handleRun}
          extraActions={
            parsed ? (
              <Button type="button" variant="ghost" size="sm" onClick={copyTags}>
                <Tags aria-hidden="true" /> Copy as tags
              </Button>
            ) : undefined
          }
        >
          {parsed ? (
            <div className="space-y-6">
              <ToolSection title="Keywords" description={out.provider === "local" ? "How often each appears, and its share of all words." : undefined}>
                <ol className="flex flex-wrap gap-2">
                  {parsed.keywords.map((k, i) => (
                    <li
                      key={`${k.term}-${i}`}
                      title={k.detail}
                      className="inline-flex items-baseline gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-foreground"
                    >
                      {k.term}
                      {k.count !== undefined && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ×{k.count} · {k.density}%
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
                {out.provider === "gemini" && parsed.keywords.some((k) => k.detail) && (
                  <ul className="space-y-1.5 text-sm">
                    {parsed.keywords
                      .filter((k) => k.detail)
                      .map((k, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{k.term}</span>
                          <span className="text-muted-foreground">: {k.detail}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </ToolSection>
              {parsed.phrases.length > 0 && (
                <ToolSection title="Key phrases">
                  <ul className="divide-y rounded-lg border">
                    {parsed.phrases.map((p, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-3 px-3.5 py-2 text-sm">
                        <span className="text-foreground">{p.phrase}</span>
                        {p.count !== undefined && p.count > 1 && (
                          <span className="text-xs text-muted-foreground tabular-nums">×{p.count}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </ToolSection>
              )}
            </div>
          ) : (
            <Markdown text={out.result} />
          )}
        </AIOutput>
      )}
    </div>
  );
}
