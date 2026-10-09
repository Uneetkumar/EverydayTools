import React from "react";
import Link from "next/link";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/layout/prose-page";
import { TOOL_CATEGORIES, getAllTools, getToolsByCategory } from "@/lib/tools/registry";
import { GUIDES } from "@/lib/guides/content";

export const metadata = constructPageMetadata({
  title: "About TabBench – Free Tools That Run in Your Browser",
  description:
    "What TabBench is, how its tools handle your files and text, how calculations are checked, how the site is funded, and how to reach us.",
  path: "/about",
});

/**
 * Dated maintenance log, newest first. Keep it to real, user-visible changes
 * (fixes, corrected figures, rewritten pages), and add an entry when one
 * ships: a log that stops being updated is worse than none.
 */
const RECENT_CHANGES: Array<{ date: string; label: string; text: React.ReactNode }> = [
  {
    date: "2026-10-09",
    label: "9 October 2026",
    text: (
      <>
        Rewrote the explanations for 26 tools with worked examples and their real limits. Fixed the{" "}
        <Link href="/tools/sql-formatter">SQL Formatter</Link> (a <code>--</code> comment could swallow the next
        line), <Link href="/tools/docker-to-compose">Docker Run to Compose</Link> (an unrecognised flag&apos;s value
        was taken as the image name), the <Link href="/tools/json-to-yaml">JSON ↔ YAML converter</Link> (now built
        on the js-yaml library, so multi-line blocks no longer vanish) and the Tailwind output of the{" "}
        <Link href="/tools/glassmorphism-gen">Glassmorphism Generator</Link>.
      </>
    ),
  },
  {
    date: "2026-10-09",
    label: "9 October 2026",
    text: (
      <>
        Checked the <Link href="/tools/salary-calculator">salary calculator</Link> against Budget 2026: the
        income-tax slabs, standard deduction and ₹12 lakh rebate are unchanged, so it now states FY 2026-27 rates.
      </>
    ),
  },
  {
    date: "2026-10-09",
    label: "9 October 2026",
    text: (
      <>
        Fixed the <Link href="/tools/llm-token-counter">LLM Token Counter</Link>, which counted roughly twice
        the real number of tokens. Its estimate is now checked against OpenAI&apos;s tokenizer and lands within
        about 5% on English text and code, and the model list and prices are updated to the current OpenAI,
        Anthropic and Google models.
      </>
    ),
  },
  {
    date: "2026-10-09",
    label: "9 October 2026",
    text: (
      <>
        Merged the twelve separate currency-pair pages (such as dollar to rupee) into the{" "}
        <Link href="/tools/currency-converter">Currency Converter</Link>. Old links still open the converter on
        the same pair, and the useful facts from those pages, such as which currencies are pegged to the dollar,
        are now in its FAQ.
      </>
    ),
  },
  {
    date: "2026-10-04",
    label: "4 October 2026",
    text: (
      <>
        Added network and developer tools including the <Link href="/tools/subnet-calculator">Subnet
        Calculator</Link>, <Link href="/tools/chmod-calculator">chmod calculator</Link> and{" "}
        <Link href="/tools/work-hours-calc">Work Hours Calculator</Link>.
      </>
    ),
  },
];

export default function AboutPage() {

  const tools = getAllTools();
  const cloud = tools.filter((t) => t.privacy === "cloud-optional");
  const network = tools.filter((t) => t.privacy === "network");
  const localCount = tools.length - cloud.length - network.length;

  return (
    <>
      <ProsePage
        path="/about"
        breadcrumb="About Us"
        title="About TabBench"
        lead={`TabBench is a collection of ${tools.length} free tools for everyday tasks — working out a percentage, shrinking a photo, merging PDFs, formatting JSON — that open instantly in your browser with no account and, for almost all of them, no upload.`}
      >
        <h2 id="who">Who builds TabBench</h2>
        <p>
          TabBench is built and maintained by Uneet Kumar. It started in August 2026 with a handful of PDF and
          image tools and has grown from requests and from gaps found while using it. Tool pages explain how each
          tool works and, where it matters, what it cannot do; calculator pages show the formula used, with a
          worked example you can check by hand.
        </p>
        <p>
          Corrections, bug reports and tool requests come to the maintainer directly through the{" "}
          <Link href="/contact">contact page</Link>, and fixes are listed under{" "}
          <a href="#changes">recent changes</a> below.
        </p>

        <h2 id="what">What you can do here</h2>
        <p>
          The tools are grouped by the job they help with. Each one has its own page explaining what it does,
          how to use it, and — for calculators — the exact formula it applies.
        </p>
        <ul>
          {TOOL_CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link href={`/categories/${c.id}`}>{c.name}</Link> ({getToolsByCategory(c.id).length} tools) —{" "}
              {c.description}
            </li>
          ))}
        </ul>
        <p>
          Alongside the tools there are {GUIDES.length} <Link href="/guides">step-by-step guides</Link> for
          common tasks, such as getting a photo under a size limit or filling in a PDF form.
        </p>

        <h2 id="how">How the tools handle your data</h2>
        <p>
          {localCount} of the {tools.length} tools run entirely in your browser: the file you choose or the text
          you type is processed on your own device and is never sent to us. It also means a large file never
          has to wait for an upload before the work starts.
        </p>
        <p>The exceptions are stated on each tool&apos;s page, and are:</p>
        <ul>
          {cloud.length > 0 && (
            <li>
              <strong>Optional cloud AI.</strong> {cloud.map((t, i) => (
                <React.Fragment key={t.slug}>
                  {i > 0 && (i === cloud.length - 1 ? " and " : ", ")}
                  <Link href={`/tools/${t.slug}`}>{t.name}</Link>
                </React.Fragment>
              ))}{" "}
              run on your device by default. If you switch one to its cloud mode, the text or image you submit is
              sent to Google Gemini to produce the result.
            </li>
          )}
          {network.map((t) => (
            <li key={t.slug}>
              <strong>
                <Link href={`/tools/${t.slug}`}>{t.name}</Link>.
              </strong>{" "}
              {t.privacyNote}
            </li>
          ))}
        </ul>
        <p>
          Your favorites, recently used tools and recent searches are remembered in this browser only. The{" "}
          <Link href="/privacy">privacy policy</Link> lists everything the site stores and has a button that
          erases all of it.
        </p>

        <h2 id="accuracy">How calculations are checked</h2>
        <p>
          Every calculator page shows the formula it uses, with a worked example you can reproduce by hand — see
          the <Link href="/tools/emi-calculator">EMI calculator</Link> or the{" "}
          <Link href="/tools/gst-calculator">GST calculator</Link>. Where a tool has a real limitation, its page
          says so: the <Link href="/tools/video-cutter">video cutter</Link> cuts on keyframes, and the{" "}
          <Link href="/tools/pdf-page-counter">PDF inspector</Link> reports what makes a PDF large rather than
          pretending to compress it.
        </p>
        <p>
          If a result looks wrong, <Link href="/contact">tell us</Link> with the inputs you used and we will check
          it and correct the tool. The <Link href="/editorial-policy">editorial policy</Link> describes how
          corrections are handled.
        </p>

        <h2 id="funding">How TabBench is paid for</h2>
        <p>
          The tools are free and there is no paid tier. The site is supported by advertising from Google AdSense.
          Ads are kept away from the tools themselves: never between a tool&apos;s title and its controls, never
          beside a download button, and never styled to look like a tool or a search result.
        </p>

        <h2 id="principles">What we won&apos;t do</h2>
        <ul>
          <li>Ask you to sign up, or put a tool behind an email address.</li>
          <li>Upload a file for a job your browser can do itself.</li>
          <li>Sell or share what you type or upload — for local tools, we never receive it in the first place.</li>
          <li>Add a fake &ldquo;processing&rdquo; delay or a countdown before a download.</li>
        </ul>

        <h2 id="changes">Recent changes</h2>
        <ul>
          {RECENT_CHANGES.map((c, i) => (
            <li key={`${c.date}-${i}`}>
              <strong>
                <time dateTime={c.date}>{c.label}</time>.
              </strong>{" "}
              {c.text}
            </li>
          ))}
        </ul>

        <h2 id="contact">Get in touch</h2>
        <p>
          Bug reports, wrong results, and ideas for new tools all go through the{" "}
          <Link href="/contact">contact page</Link>. Requests from visitors decide much of what gets built next.
        </p>
      </ProsePage>
    </>
  );
}
