import React from "react";
import { ToolContent } from "@/lib/tools/content";
import type { ToolPrivacy } from "@/lib/tools/registry";

/**
 * The long-form editorial content under a tool. Server components by design —
 * this is the text search engines need in the static HTML, so none of it is
 * behind client-side state.
 *
 * Presented as a readable article (headings, paragraphs, lists) rather than a
 * stack of bordered cards with coloured icon badges: it is reference material
 * that sits after the tool, and it should read like it.
 */

export function ContentSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="type-h2 text-foreground">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ToolIntro({ intro, toolName }: { intro: string; toolName?: string }) {
  return (
    <ContentSection id="about-heading" title={toolName ? `What the ${toolName} does` : "What this tool does"}>
      <p className="type-body max-w-prose text-muted-foreground">{intro}</p>
    </ContentSection>
  );
}

/** The privacy sentence under the how-to, matched to what the tool really does. */
function privacySentence(toolName: string, privacy: ToolPrivacy, note?: string): string {
  if (privacy === "network") return note ?? `The ${toolName} needs an internet connection to work.`;
  if (privacy === "cloud-optional") {
    return `The ${toolName} runs on your device by default. If you switch to the optional cloud AI mode, your input is sent to Google's Gemini model to produce the result.`;
  }
  return `The ${toolName} runs entirely in your browser — nothing you enter is uploaded, stored, or logged.`;
}

export function HowToSection({
  howTo,
  toolName,
  privacy = "local",
  privacyNote,
}: {
  howTo: ToolContent["howTo"];
  toolName: string;
  privacy?: ToolPrivacy;
  privacyNote?: string;
}) {
  return (
    <ContentSection id="howto-heading" title={howTo.title}>
      <ol className="space-y-3">
        {howTo.steps.map((step, idx) => (
          <li key={idx} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-card text-xs font-semibold text-muted-foreground"
            >
              {idx + 1}
            </span>
            <span className="type-body text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm text-muted-foreground">
        {privacySentence(toolName, privacy, privacyNote)}
      </p>
    </ContentSection>
  );
}

export function UseCasesSection({
  useCases,
}: {
  useCases: ToolContent["useCases"];
}) {
  if (!useCases.length) return null;
  return (
    <ContentSection id="usecases-heading" title="When to use it">
      <div className="grid gap-6 sm:grid-cols-2">
        {useCases.map((useCase, idx) => (
          <div key={idx}>
            <h3 className="type-h3 text-foreground">{useCase.title}</h3>
            <p className="mt-1.5 type-body-sm text-muted-foreground">{useCase.body}</p>
          </div>
        ))}
      </div>
    </ContentSection>
  );
}

export function TipsSection({ tips }: { tips: string[] }) {
  if (!tips.length) return null;
  return (
    <ContentSection id="tips-heading" title="Good to know">
      <ul className="space-y-2.5">
        {tips.map((tip, idx) => (
          <li key={idx} className="flex gap-3 type-body text-muted-foreground">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </ContentSection>
  );
}
