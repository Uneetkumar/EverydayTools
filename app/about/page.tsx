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
          <Link href="/tools/pdf-compressor">PDF inspector</Link> reports what makes a PDF large rather than
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

        <h2 id="contact">Get in touch</h2>
        <p>
          Bug reports, wrong results, and ideas for new tools all go through the{" "}
          <Link href="/contact">contact page</Link>. Requests from visitors decide much of what gets built next.
        </p>
      </ProsePage>
    </>
  );
}
