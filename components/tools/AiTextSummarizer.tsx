"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { useAiTask } from "@/components/ai/useAiTask";
import { Field, Segmented, Stat, StatGrid } from "@/components/tool/kit";
import { countWords } from "@/lib/ai/nlp/text";
import type { SummaryResult } from "@/lib/ai/nlp/summarizer";

const SAMPLE_TEXT = `Remote work changed how many companies think about offices. Before 2020, most teams worked from a shared building five days a week, and working from home was treated as an occasional perk. During the pandemic, companies that had never allowed remote work were forced to try it, and many found that productivity held up better than expected.

The shift was not free of problems. New employees found it harder to learn by watching colleagues, and managers reported that informal conversations, where many ideas start, became rare. Some workers also struggled to separate work from home life, and reported working longer hours than before.

As a result, most large employers have settled on a hybrid model: two or three days in the office and the rest at home. Surveys suggest employees value this flexibility highly, with many saying they would consider changing jobs to keep it. Office space is being redesigned too, with fewer assigned desks and more rooms for meetings and team work, because people now come in mainly to collaborate rather than to sit alone at a desk.`;

type Length = "short" | "medium" | "detailed";
type Shape = "paragraph" | "bullets";

export default function AiTextSummarizer() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [length, setLength] = useState<Length>("medium");
  const [shape, setShape] = useState<Shape>("paragraph");
  const ai = useAiTask("summarize");

  const handleRun = () => ai.run(input, { length, bulletPoints: shape === "bullets" }, "Paste some text to summarise.");

  const out = ai.output;
  const local = out?.provider === "local" ? (out.metrics?.data as SummaryResult | undefined) : undefined;
  const inWords = out ? countWords(out.input) : 0;
  const outWords = out ? countWords(out.result) : 0;
  const tooShort = !!local && local.sentencesKept === local.sentencesTotal;

  return (
    <div className="space-y-6">
      <AIWorkspace
        provider={ai.provider}
        onProviderChange={ai.setProvider}
        localHint="Picks the key sentences from your text. Private and instant."
        cloudHint="Writes a new summary with Google Gemini. Text is sent to Google."
        streamingText={ai.partial}
        busy={ai.busy}
        onRun={handleRun}
        runLabel="Summarise"
        error={ai.error}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste an article, report, email thread or notes…"
          sampleText={SAMPLE_TEXT}
          disabled={ai.busy}
        />

        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <Field label="Length">
            <Segmented
              ariaLabel="Summary length"
              value={length}
              onChange={setLength}
              options={[
                { value: "short", label: "Short" },
                { value: "medium", label: "Medium" },
                { value: "detailed", label: "Detailed" },
              ]}
            />
          </Field>
          <Field label="Format">
            <Segmented
              ariaLabel="Summary format"
              value={shape}
              onChange={setShape}
              options={[
                { value: "paragraph", label: "Paragraph" },
                { value: "bullets", label: "Bullet points" },
              ]}
            />
          </Field>
        </div>
      </AIWorkspace>

      {out && (
        <AIOutput
          title="Summary"
          result={out.result}
          provider={out.provider}
          modelUsed={out.modelUsed}
          elapsedMs={out.elapsedMs}
          filename="summary.txt"
          toolName="ai-text-summarizer"
          onRegenerate={handleRun}
          stats={
            <div className="space-y-3">
              <StatGrid>
                <Stat label="Original" value={`${inWords.toLocaleString("en-US")} words`} />
                <Stat label="Summary" value={`${outWords.toLocaleString("en-US")} words`} />
                <Stat label="Shorter by" value={`${Math.max(0, Math.round((1 - outWords / Math.max(inWords, 1)) * 100))}%`} />
                <Stat
                  label={local ? "Sentences kept" : "Reading time saved"}
                  value={local ? `${local.sentencesKept} of ${local.sentencesTotal}` : `${Math.max(0, Math.round((inWords - outWords) / 230))} min`}
                />
              </StatGrid>
              {tooShort && (
                <p className="text-xs text-muted-foreground">
                  The text is already short, so every sentence was kept. Summaries work best on a few paragraphs or more.
                </p>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
