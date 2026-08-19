import React from "react";
import { constructPageMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ShieldCheck, Zap, Award, CheckCircle2 } from "lucide-react";

export const metadata = constructPageMetadata({
  title: "About Us - Our Mission & Accuracy Standards",
  description: "Learn about TabBench: our commitment to zero-latency, client-side privacy, mathematically verified formulas, and helpful free utilities.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ name: "About Us" }]} />

      <div className="space-y-4 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About TabBench
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          TabBench was built to provide fast, reliable, zero-latency browser utilities that solve everyday mathematical, textual, and technical problems without clutter, forced logins, or intrusive data tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Zero-Latency Speed</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All calculations run directly in your browser without server round-trip delays, providing instant real-time feedback.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Privacy First</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your numbers, text documents, and code payloads never leave your computer. We do not store or transmit your private inputs.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Formulas & Clarity</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every tool is accompanied by explicit mathematical formulas, definitions, and real-world examples to explain how the math works.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Engineering Principles</h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
          <li className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <span><strong>No barrier to utility:</strong> Instant access to every calculator and formatter without requiring user registration.</span>
          </li>
          <li className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <span><strong>Accessible & Responsive:</strong> Optimized for all devices, screen sizes, and keyboard navigation.</span>
          </li>
          <li className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <span><strong>Continuous Verification:</strong> Regular testing for edge-case accuracy and mathematical precision.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
