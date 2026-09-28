import React from "react";
import { ToolFormula } from "@/lib/tools/registry";
import { ContentSection } from "./ToolContentSections";

interface FormulaBoxProps {
  formulas: ToolFormula[];
}

/** "How it works": the formulas behind a calculator, with a worked example. */
export default function FormulaBox({ formulas }: FormulaBoxProps) {
  if (!formulas || formulas.length === 0) return null;

  return (
    <ContentSection id="formula-heading" title="How it works">
      <div className="space-y-4">
        {formulas.map((formula, idx) => (
          <div key={idx} className="rounded-xl border bg-card p-4 shadow-soft">
            <h3 className="type-h4 text-foreground">{formula.name}</h3>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted px-3 py-2.5 type-code text-foreground">
              <code>{formula.expression}</code>
            </pre>
            <p className="mt-3 type-body-sm text-muted-foreground">{formula.explanation}</p>
            <p className="mt-2 type-body-sm">
              <span className="font-medium text-foreground">Example: </span>
              <span className="text-muted-foreground">{formula.example}</span>
            </p>
          </div>
        ))}
      </div>
    </ContentSection>
  );
}
