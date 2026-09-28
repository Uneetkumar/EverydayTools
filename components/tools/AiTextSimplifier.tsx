"use client";

import React, { useMemo, useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { useAiTask } from "@/components/ai/useAiTask";
import { Stat, StatGrid } from "@/components/tool/kit";
import { countWords, easeLabel, readability } from "@/lib/ai/nlp/text";

const SAMPLE_TEXT = `Notwithstanding the aforementioned stipulations, the contractor shall endeavor to expeditiously facilitate the dissemination of all relevant documentation subsequent to the verification of compliance. In the event that extraneous impediments transpire, the party shall implement remedial measures to mitigate deleterious repercussions; failure to do so may result in termination of the agreement.`;

export default function AiTextSimplifier() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const ai = useAiTask("simplify");

  const handleRun = () => ai.run(input, undefined, "Paste some text to simplify.");

  const out = ai.output;
  // Measured for whichever engine produced the result, the same way.
  const before = useMemo(() => (out ? readability(out.input) : null), [out]);
  const after = useMemo(() => (out ? readability(out.result) : null), [out]);
  const live = useMemo(() => readability(input), [input]);

  const trend = (a: number, b: number, higherIsBetter: boolean) =>
    b === a ? undefined : (b > a) === higherIsBetter ? ("success" as const) : ("warning" as const);

  return (
    <div className="space-y-6">
      <AIWorkspace
        provider={ai.provider}
        onProviderChange={ai.setProvider}
        localHint="Swaps jargon and wordy phrases for plain words. Private and instant."
        cloudHint="Rewrites in plain English with Google Gemini. Text is sent to Google."
        streamingText={ai.partial}
        busy={ai.busy}
        onRun={handleRun}
        runLabel="Simplify"
        error={ai.error}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste legal, technical or official text…"
          sampleText={SAMPLE_TEXT}
          disabled={ai.busy}
        />
        {input.trim() && (
          <p className="text-xs text-muted-foreground">
            Reading ease now: <span className="font-medium text-foreground tabular-nums">{live.ease}</span> ({easeLabel(live.ease).toLowerCase()}),
            grade {live.grade}. Plain English is 60 or higher.
          </p>
        )}
      </AIWorkspace>

      {out && before && after && (
        <AIOutput
          title="Plain-English version"
          result={out.result}
          provider={out.provider}
          modelUsed={out.modelUsed}
          elapsedMs={out.elapsedMs}
          filename="simplified.txt"
          toolName="ai-text-simplifier"
          onRegenerate={handleRun}
          format="text"
          compareWith={out.input}
          stats={
            <div className="space-y-3">
              <StatGrid>
                <Stat
                  label="Reading ease"
                  value={`${before.ease} → ${after.ease}`}
                  hint={easeLabel(after.ease)}
                  tone={trend(before.ease, after.ease, true)}
                />
                <Stat label="School grade" value={`${before.grade} → ${after.grade}`} tone={trend(before.grade, after.grade, false)} />
                <Stat label="Words" value={`${countWords(out.input)} → ${after.words}`} />
                <Stat label="Long sentences" value={after.longSentences.length} hint="Over 25 words" />
              </StatGrid>
              {after.longSentences.length > 0 && (
                <div className="rounded-lg border bg-muted/30 px-3.5 py-3 text-sm">
                  <p className="font-medium text-foreground">Still long: consider splitting</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted-foreground">
                    {after.longSentences.slice(0, 4).map((s, i) => (
                      <li key={i}>
                        {s.length > 160 ? `${s.slice(0, 157)}…` : s} <span className="tabular-nums">({countWords(s)} words)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
