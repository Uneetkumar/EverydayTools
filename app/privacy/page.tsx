import React from "react";
import { constructPageMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = constructPageMetadata({
  title: "Privacy Policy - Zero Client-Side Data Storage",
  description: "Read our comprehensive privacy policy. EverydayTools processes your calculations and text locally in your browser with zero data logging.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ name: "Privacy Policy" }]} />

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500">Last updated: August 16, 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Client-Side Execution Guarantee</h2>
          <p>
            At EverydayTools, we believe in radical privacy. The core utilities—including calculators, text formatting, code formatters, and date utilities—execute exclusively in your web browser&apos;s memory using client-side JavaScript.
          </p>
          <p>
            We do not transmit, intercept, log, or store the contents of your calculations, text documents, or JSON payloads on any remote servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Analytics & Performance Measurement</h2>
          <p>
            To understand overall platform health and page popularity, we use aggregated, privacy-focused analytics (such as Google Search Console and Google Analytics 4). These tools collect non-personally identifiable telemetry such as device category, browser version, country of origin, and pageviews.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Advertising & Cookies</h2>
          <p>
            We may partner with third-party advertising networks (e.g., Google AdSense, Journey, Raptive, Mediavine) to display non-intrusive advertisements that fund the free availability of our utilities. These partners may use cookies or web beacons to serve ads based on prior visits to this or other websites.
          </p>
          <p>
            Users can opt out of personalized advertising by visiting Google&apos;s Ads Settings or YourAdChoices.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Local Storage</h2>
          <p>
            We use your browser&apos;s `localStorage` solely to remember your interface preferences (such as light vs. dark theme toggle). No personal identifiers are stored.
          </p>
        </section>
      </div>
    </div>
  );
}
