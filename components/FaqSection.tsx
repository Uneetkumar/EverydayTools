import React from "react";
import { ChevronDown } from "lucide-react";
import { ToolFaq } from "@/lib/tools/registry";

interface FaqSectionProps {
  faqs: ToolFaq[];
  title?: string;
}

/**
 * Uses native <details>/<summary> rather than React state (or a Radix
 * accordion, which unmounts closed panels).
 *
 * The previous accordion rendered answers only while open ({isOpen && ...}),
 * so collapsed answers were absent from the static HTML entirely. That meant
 * none of the FAQ text counted toward the page's content, and the FAQPage
 * structured data referenced text that was not on the page — a mismatch
 * Google treats as invalid. <details> keeps every answer in the DOM,
 * needs no JavaScript, and is keyboard accessible by default.
 */
export default function FaqSection({ faqs, title = "Frequently asked questions" }: FaqSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading" className="scroll-mt-24">
      <h2 id="faq-heading" className="type-h2 text-foreground">
        {title}
      </h2>
      <div className="mt-4 divide-y rounded-xl border bg-card shadow-soft">
        {faqs.map((faq, idx) => (
          <details key={idx} open={idx === 0} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
              <h3 className="type-h4 text-foreground">{faq.question}</h3>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="px-4 pb-4 type-body-sm text-muted-foreground">{faq.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
