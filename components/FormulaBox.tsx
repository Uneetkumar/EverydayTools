import React from "react";
import { ToolFormula } from "@/lib/tools/registry";
import { BookOpen, CheckCircle2 } from "lucide-react";

interface FormulaBoxProps {
  formulas: ToolFormula[];
}

export default function FormulaBox({ formulas }: FormulaBoxProps) {
  if (!formulas || formulas.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Formulas & Mathematical Logic
        </h2>
      </div>

      <div className="space-y-6">
        {formulas.map((formula, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {formula.name}
              </h3>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                Formula {idx + 1}
              </span>
            </div>

            <div className="my-2.5 p-3 rounded-lg bg-slate-900 text-slate-100 dark:bg-black/80 font-mono text-sm overflow-x-auto shadow-inner">
              <code>{formula.expression}</code>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
              {formula.explanation}
            </p>

            <div className="flex items-start space-x-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/40">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-medium">Example: </span>
                <span>{formula.example}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
