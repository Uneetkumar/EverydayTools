import React from "react";
import { ToolFaq } from "@/lib/tools/registry";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FaqSectionProps {
  faqs: ToolFaq[];
}

/**
 * Uses native <details>/<summary> rather than React state.
 *
 * The previous accordion rendered answers only while open ({isOpen && ...}),
 * so collapsed answers were absent from the static HTML entirely. That meant
 * none of the FAQ text counted toward the page's content, and the FAQPage
 * structured data referenced text that was not on the page — a mismatch
 * Google treats as invalid. <details> keeps every answer in the DOM,
 * needs no JavaScript, and is keyboard accessible by default.
 */
export default function FaqSection({ faqs }: FaqSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm"
    >
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <HelpCircle className="w-4 h-4" />
        </div>
        <h2
          id="faq-heading"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            open={idx === 0}
            className="group rounded-xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-left text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors [&::-webkit-details-marker]:hidden">
              <h3 className="text-sm font-medium">{faq.question}</h3>
              <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-indigo-600 dark:group-open:text-indigo-400" />
            </summary>
            <div className="px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
