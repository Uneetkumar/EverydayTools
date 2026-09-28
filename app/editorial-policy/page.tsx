import React from "react";
import Link from "next/link";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { ProsePage } from "@/components/layout/prose-page";
import { EDITORIAL_EMAIL } from "@/lib/contact";

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
      <ProsePage
        breadcrumb="Editorial & Accuracy Policy"
        title="Editorial & Accuracy Policy"
        updated="September 28, 2026"
        lead="How the tools and the writing around them are produced, what they are checked against, and what happens when something is wrong."
      >
        <h2 id="formulas">1. Formulas are shown, not hidden</h2>
        <p>
          Every calculator applies a standard, published definition — the reducing-balance formula for loan EMIs,
          compound interest with a stated compounding frequency, GST added to or removed from a price at the chosen
          rate. The formula is printed on the tool&apos;s page with a worked example, so you can check any result by
          hand rather than taking it on trust.
        </p>
        <p>The reference points used are:</p>
        <ul>
          <li>
            <strong>Loans and investments</strong> — the standard amortisation and future-value formulas used by
            banks, with the compounding assumption stated on each page.
          </li>
          <li>
            <strong>Tax calculators</strong> — the rates you choose, or the published rates they name. Tax rules
            change, so check the rate against your tax authority before filing.
          </li>
          <li>
            <strong>Units</strong> — the international definitions (for example, 1 inch = 25.4 mm exactly, from the
            1959 international yard and pound agreement).
          </li>
        </ul>

        <h2 id="limits">2. Limits are stated</h2>
        <p>
          When a tool can&apos;t do something well, its page says so plainly instead of implying otherwise. The{" "}
          <Link href="/tools/pdf-compressor">PDF inspector</Link> explains that it does not re-compress images, the{" "}
          <Link href="/tools/video-cutter">video cutter</Link> explains why cuts land on keyframes, and tools that
          send anything over the network say what and to whom.
        </p>

        <h2 id="writing">3. How the explanations are written</h2>
        <p>
          The explanations, use cases, tips and guides on each page are written for the task the tool performs: what
          people are actually trying to do, where it usually goes wrong, and what to do instead. AI assistance is used
          while drafting and coding, and everything is reviewed and tested before it is published. Pages are not
          generated in bulk from a template.
        </p>

        <h2 id="corrections">4. Corrections</h2>
        <p>
          If a result looks wrong, email{" "}
          <a href={`mailto:${EDITORIAL_EMAIL}`}>{EDITORIAL_EMAIL}</a> or use the{" "}
          <Link href="/contact">contact page</Link> with the values you entered, the result you got and the result you
          expected. Each report is reproduced first. If it is a real error, the tool and any affected explanation are
          corrected; if it comes from a different convention (for example, GST-inclusive versus GST-exclusive
          prices), the page is updated to make that convention clearer.
        </p>

        <h2 id="independence">5. Advertising is kept separate</h2>
        <p>
          TabBench is funded by ads served by Google AdSense. Advertisers do not influence which tools exist or what
          the pages say, and ads are never placed between a tool&apos;s heading and its controls or beside a download
          button.
        </p>
      </ProsePage>
    </>
  );
}
