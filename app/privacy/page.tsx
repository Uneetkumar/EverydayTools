import React from "react";
import { constructPageMetadata } from "@/lib/seo/metadata";
import Breadcrumbs from "@/components/Breadcrumbs";
import ClearLocalData from "@/components/ClearLocalData";

export const metadata = constructPageMetadata({
  title: "Privacy Policy - What We Store & What We Never See",
  description: "Your files are processed in your browser and never uploaded. Read exactly what is saved on your own device, for how long, and how to erase it.",
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
            At TabBench, we believe in radical privacy. The core utilities—including calculators, text formatting, code formatters, and date utilities—execute exclusively in your web browser&apos;s memory using client-side JavaScript.
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

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. What is stored on your device
          </h2>
          <p>
            Some features save data in your own browser so that the site
            remembers your work between visits. None of it is transmitted to us
            or to anyone else &mdash; it is written to your device and stays
            there. We cannot read any of it.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Interface preferences</strong> &mdash; theme choice and
              per-tool settings such as your preferred QR margin or error
              correction level. Kept until you clear them.
            </li>
            <li>
              <strong>Recently used tools</strong> &mdash; the names of the last
              four tools you opened, so they are quick to return to. Kept until
              you clear them.
            </li>
            <li>
              <strong>Recent output files</strong> &mdash; the last three files
              each tool produced for you, stored in your browser&apos;s
              IndexedDB so you can download them again without redoing the
              work. <strong>These are deleted automatically after seven
              days.</strong> Files over 25&nbsp;MB are never saved.
            </li>
          </ul>
          <p>
            That last item is worth being explicit about: if you crop an
            identity document or split a bank statement, the resulting file sits
            in this browser&apos;s storage for up to a week. It is never
            uploaded, but it is on your disk. Every tool that saves files shows
            a &ldquo;Your recent files&rdquo; panel with per-file delete, and
            you can erase everything at once below.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Erasing your local data
          </h2>
          <ClearLocalData />
        </section>
      </div>
    </div>
  );
}
