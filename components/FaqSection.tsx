"use client";

import React, { useState } from "react";
import { ToolFaq } from "@/lib/tools/registry";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FaqSectionProps {
  faqs: ToolFaq[];
}

export default function FaqSection({ faqs }: FaqSectionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  if (!faqs || faqs.length === 0) return null;

  const toggle = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <HelpCircle className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
