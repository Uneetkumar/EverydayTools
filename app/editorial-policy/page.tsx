import React from "react";
import { constructPageMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CheckCircle2, BookOpen, ShieldAlert, Cpu } from "lucide-react";

export const metadata = constructPageMetadata({
  title: "Editorial & Mathematical Accuracy Policy",
  description: "How EverydayTools researches, reviews, tests, and verifies mathematical formulas, calculation accuracy, and editorial content.",
  path: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ name: "Editorial & Accuracy Policy" }]} />

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Editorial & Mathematical Accuracy Policy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Our standards for formula verification, continuous testing, AI assistance ethics, and people-first technical accuracy.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Formula Verification & Mathematical Precision</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every calculator formula published on EverydayTools is cross-verified against standard academic, financial, and mathematical definitions. We document the explicit formulas, assumptions, step-by-step examples, and edge-case boundaries (e.g., division by zero, leap years, negative percentages) on every tool page so users can verify our working logic.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Responsible AI & Editorial Workflow</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            In accordance with Google Search quality standards and modern publishing best practices, we do not publish low-quality, mass-generated AI text. Where AI tooling is used for research and drafting assistance, every piece of content undergoes rigorous human review, empirical testing, and original structuring with real code examples and diagrammatic illustrations.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Correction & Errata Policy</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            If an inaccuracy, edge-case failure, or formula discrepancy is detected or reported by our community, our engineering team immediately audits the calculator logic and issues a revision with regression tests.
          </p>
        </div>
      </div>
    </div>
  );
}
