import React from "react";
import { constructPageMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = constructPageMetadata({
  title: "Terms of Service - TabBench",
  description: "Terms of service, usage guidelines, and general disclaimers for TabBench.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ name: "Terms of Service" }]} />

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500">Effective Date: August 16, 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TabBench, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Informational & Educational Use</h2>
          <p>
            Our calculators, converters, and formatters are provided for general informational, educational, and workflow assistance purposes. While we employ rigorous mathematical testing, calculations should not be treated as certified legal, tax, medical, or financial advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Intellectual Property</h2>
          <p>
            The software, design system, layout, and original explanatory guides on TabBench are the property of TabBench and protected by intellectual property laws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Limitation of Liability</h2>
          <p>
            TabBench and its contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our tools.
          </p>
        </section>
      </div>
    </div>
  );
}
