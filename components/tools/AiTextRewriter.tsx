"use client";

import React, { useState } from "react";
import AIWorkspace from "@/components/ai/AIWorkspace";
import AIInput from "@/components/ai/AIInput";
import AIOutput from "@/components/ai/AIOutput";
import { useAiTask } from "@/components/ai/useAiTask";
import { Chips, Field, Notice } from "@/components/tool/kit";
import type { RewriteResult, ToneType } from "@/lib/ai/nlp/rewriter";

const SAMPLE_TEXT = `Hey boss, I'm gonna be a bit late to the morning sync because my train got stuck. Gonna try to jump on the call from my phone if I can. Let me know if we gotta reschedule our 1-on-1 talk for later today. Thanks a lot!!`;

const TONES: { value: ToneType; label: string; description: string; local: string }[] = [
  { value: "professional", label: "Professional", description: "Polished, ready for work email", local: "Fixes slang, text-speak, filler words and !!!" },
  { value: "formal", label: "Formal", description: "No contractions or slang", local: "Also expands contractions and wordy phrases" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable", local: "Softens stiff openings and sign-offs, uses contractions" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational", local: "Everyday words, contractions, shorter phrases" },
  { value: "concise", label: "Concise", description: "Shorter, same meaning", local: "Removes filler and wordy phrases" },
  { value: "simple", label: "Simple", description: "Everyday words", local: "Replaces formal and technical words" },
];

export default function AiTextRewriter() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [tone, setTone] = useState<ToneType>("professional");
  const ai = useAiTask("rewrite");
  const toneInfo = TONES.find((t) => t.value === tone)!;

  const handleRun = () => ai.run(input, { tone }, "Paste some text to rewrite.");

  const out = ai.output;
  const local = out?.provider === "local" ? (out.metrics?.data as RewriteResult | undefined) : undefined;

  return (
    <div className="space-y-6">
      <AIWorkspace
        provider={ai.provider}
        onProviderChange={ai.setProvider}
        localHint="Safe, rule-based edits you can review. Private and instant."
        cloudHint="Rewrites the whole text with Google Gemini. Text is sent to Google."
        streamingText={ai.partial}
        busy={ai.busy}
        onRun={handleRun}
        runLabel={`Rewrite as ${toneInfo.label.toLowerCase()}`}
        error={ai.error}
        disabled={!input.trim()}
      >
        <AIInput
          value={input}
          onChange={setInput}
          placeholder="Paste an email, message or paragraph…"
          sampleText={SAMPLE_TEXT}
          disabled={ai.busy}
        />

        <Field
          label="Tone"
          hint={`${toneInfo.description}.${ai.provider === "local" ? ` On-device: ${toneInfo.local.toLowerCase()}.` : ""}`}
        >
          <Chips ariaLabel="Tone" value={tone} onChange={setTone} options={TONES.map((t) => ({ value: t.value, label: t.label }))} />
        </Field>
      </AIWorkspace>

      {out && local && local.changes.length === 0 ? (
        <Notice>
          Nothing to change on-device: none of this tone&apos;s rules apply to your text. For a full rewrite with new
          sentences, switch to Cloud AI.
        </Notice>
      ) : (
        out && (
          <AIOutput
            title="Rewritten text"
            result={out.result}
            provider={out.provider}
            modelUsed={out.modelUsed}
            elapsedMs={out.elapsedMs}
            filename="rewritten.txt"
            toolName="ai-text-rewriter"
            onRegenerate={handleRun}
            format="text"
            compareWith={out.input}
            stats={
              local ? (
                <p className="text-xs text-muted-foreground">
                  {local.changes.length} edit{local.changes.length === 1 ? "" : "s"}. Choose Show changes to review each one.
                </p>
              ) : undefined
            }
          />
        )
      )}
    </div>
  );
}
