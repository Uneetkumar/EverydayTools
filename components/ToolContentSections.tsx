import React from "react";
import { ToolContent } from "@/lib/tools/content";
import { ListOrdered, Lightbulb, Target } from "lucide-react";

/**
 * Renders the long-form editorial content for a tool. Server component by
 * design — this is the text search engines need to see in the static HTML,
 * so none of it is behind client-side state.
 */

export function ToolIntro({ intro }: { intro: string }) {
  return (
    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
      {intro}
    </p>
  );
}

export function HowToSection({
  howTo,
  toolName,
  needsNetwork = false,
}: {
  howTo: ToolContent["howTo"];
  toolName: string;
  /** Suppresses the "nothing is uploaded" line for tools that call an API. */
  needsNetwork?: boolean;
}) {
  return (
    <section
      aria-labelledby="howto-heading"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm"
    >
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ListOrdered className="w-4 h-4" />
        </div>
        <h2
          id="howto-heading"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          {howTo.title}
        </h2>
      </div>

      <ol className="space-y-3">
        {howTo.steps.map((step, idx) => (
          <li key={idx} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white"
            >
              {idx + 1}
            </span>
            <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-500">
        {needsNetwork
          ? `The ${toolName} fetches current rates from an exchange-rate provider. The request carries no personal data — only your amounts stay on your device.`
          : `The ${toolName} runs entirely in your browser — nothing you enter is uploaded, stored, or logged.`}
      </p>
    </section>
  );
}

export function UseCasesSection({
  useCases,
}: {
  useCases: ToolContent["useCases"];
}) {
  if (!useCases.length) return null;

  return (
    <section
      aria-labelledby="usecases-heading"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm"
    >
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <h2
          id="usecases-heading"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          When to use this tool
        </h2>
      </div>

      <div className="space-y-5">
        {useCases.map((useCase, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
              {useCase.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {useCase.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TipsSection({ tips }: { tips: string[] }) {
  if (!tips.length) return null;

  return (
    <section
      aria-labelledby="tips-heading"
      className="rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/15 p-6 shadow-sm"
    >
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <h2
          id="tips-heading"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          Things worth knowing
        </h2>
      </div>

      <ul className="space-y-2.5">
        {tips.map((tip, idx) => (
          <li
            key={idx}
            className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
          >
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
