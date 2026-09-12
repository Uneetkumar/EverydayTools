import React from "react";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CheckCircle2, BookOpen, ShieldAlert, Cpu } from "lucide-react";

export const metadata = constructPageMetadata({
  title: "Editorial & Mathematical Accuracy Policy",
  description: "How TabBench researches, reviews, tests, and verifies mathematical formulas, calculation accuracy, and editorial content.",
  path: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Editorial Policy", path: "/editorial-policy" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
            Every calculator formula published on TabBench is cross-verified against standard academic, financial, and mathematical definitions. We document the explicit formulas, assumptions, step-by-step examples, and edge-case boundaries (e.g., division by zero, leap years, negative percentages) on every tool page so users can verify our working logic.
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Correction & Verification Protocol</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            If an inaccuracy, edge-case failure, or formula discrepancy is detected or reported by our community, our technical accuracy board immediately audits the calculator logic and issues a revision with regression tests.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Official Formula Benchmarks:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Financial Calculations:</strong> Standard reducing-balance formulas aligned with Federal Reserve and Reserve Bank of India amortization guidelines.</li>
              <li><strong>Floating-Point Math:</strong> IEEE 754 precision safeguards preventing binary floating-point rounding errors (e.g. 0.1 + 0.2 = 0.30000000000000004).</li>
              <li><strong>Unit Conversions:</strong> 1959 International Yard & Pound Agreement and National Institute of Standards and Technology (NIST) constants.</li>
            </ul>
            <p className="pt-2">
              To report a calculation bug or formula correction, email our verification team directly at{" "}
              <a href="mailto:editorial@tabbench.com" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                editorial@tabbench.com
              </a>. Corrections are investigated within 48 business hours.
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
