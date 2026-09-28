import type { Metadata } from "next";
import Link from "next/link";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { ProsePage } from "@/components/layout/prose-page";
import { EDITORIAL_EMAIL, SUPPORT_EMAIL } from "@/lib/contact";
import ContactForm from "./ContactForm";

/**
 * The form is interactive, so it lives in its own client component. A route
 * marked "use client" cannot export `metadata`, which is why this page
 * previously inherited the site default and shipped a title identical to the
 * homepage — a duplicate-title issue across two indexable URLs.
 */
export const metadata: Metadata = constructPageMetadata({
  title: "Contact & Support",
  description:
    "Report a bug or a wrong result, or ask for a new tool. How to reach TabBench, and what to include so we can help quickly.",
  path: "/contact",
  keywords: ["contact tabbench", "report a bug", "request a tool", "support"],
});

export default function ContactPage() {
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Contact & Support", path: "/contact" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProsePage
        breadcrumb="Contact & Support"
        title="Contact TabBench"
        lead="Found a bug, got a result that looks wrong, or need a tool we don't have yet? Tell us — every message is read, and requests decide much of what gets built next."
      >
        <ContactForm />

        <h2 id="email">Prefer to email directly?</h2>
        <ul>
          <li>
            <strong>Bugs, tool requests and anything else:</strong>{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </li>
          <li>
            <strong>A calculation or formula that looks wrong:</strong>{" "}
            <a href={`mailto:${EDITORIAL_EMAIL}`}>{EDITORIAL_EMAIL}</a>
          </li>
        </ul>

        <h2 id="help-us">What helps us fix things quickly</h2>
        <h3>If a result looks wrong</h3>
        <p>
          Send the exact values you entered, the result TabBench gave, and the result you expected — plus where the
          expected figure came from (a bank statement, a tax notice, a textbook). Most discrepancies turn out to be
          a difference in convention, such as whether GST is added to or included in a price, and the inputs let us
          tell that apart from a real bug quickly.
        </p>
        <h3>If a tool doesn&apos;t work</h3>
        <p>
          Tell us the tool, your browser and device (for example &ldquo;Safari on iPhone&rdquo;), and what happened.
          For file tools, describe the file — its type, size and, for PDFs, the page count. Please don&apos;t send
          the file itself if it contains anything personal.
        </p>
        <h3>If you want a new tool</h3>
        <p>
          Describe the task rather than the tool: &ldquo;I need to get a scanned form under 200 KB for a government
          portal&rdquo; tells us more than &ldquo;add a PDF compressor&rdquo;. It is also worth checking{" "}
          <Link href="/tools">the full tool list</Link> first — the tool may exist under a different name.
        </p>

        <h2 id="privacy">Privacy questions</h2>
        <p>
          The <Link href="/privacy">privacy policy</Link> explains what the site stores and what it never receives,
          and has a button that erases everything TabBench has saved in your browser.
        </p>
      </ProsePage>
    </>
  );
}
