import React from "react";
import Link from "next/link";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata = constructPageMetadata({
  title: "Terms of Service - TabBench",
  description:
    "The terms for using TabBench's free tools: acceptable use, your files and content, AI features, third-party services, accuracy and liability.",
  path: "/terms",
});

export default function TermsPage() {
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: "Home", path: "" },
    { name: "Terms of Service", path: "/terms" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProsePage
        breadcrumb="Terms of Service"
        title="Terms of Service"
        updated="September 28, 2026"
        lead="These terms apply when you use tabbench.com. They are written to be read: the short version is that the tools are free, provided as they are, and yours to use for anything lawful."
      >
        <h2 id="acceptance">1. Using TabBench</h2>
        <p>
          By using TabBench you agree to these terms. If you do not agree, please do not use the site. There is no
          account to create; the terms apply to anyone who visits.
        </p>

        <h2 id="service">2. The service</h2>
        <p>
          TabBench provides free online tools — calculators, converters, and file, text and developer utilities —
          along with guides that explain how to use them. Most tools run entirely in your browser. We may add,
          change or retire tools at any time, and the site may occasionally be unavailable.
        </p>

        <h2 id="advice">3. Results are informational, not professional advice</h2>
        <p>
          Calculators apply the formulas shown on their pages to the numbers you enter. Results are provided for
          general information and convenience. They are not financial, tax, legal or medical advice, and they do
          not account for circumstances the tool does not ask about.
        </p>
        <p>
          Before relying on a figure for a decision that matters — a loan, a tax filing, a salary negotiation, a
          health question — check it with a qualified professional or the official source (your lender, tax
          authority or doctor). Exchange rates are indicative market rates, not the rate a bank or card provider
          will give you.
        </p>

        <h2 id="acceptable-use">4. Acceptable use</h2>
        <p>You may use the tools for any lawful purpose. You agree not to use them to:</p>
        <ul>
          <li>
            Process files you do not have the right to use — for example, removing a watermark or copyright notice
            from someone else&apos;s work, or unlocking a document you are not authorised to open.
          </li>
          <li>Create material that is unlawful, deceptive, or infringes anyone&apos;s rights.</li>
          <li>
            Disrupt the site, probe it for vulnerabilities without permission, or send automated traffic that
            degrades it for others.
          </li>
          <li>Resell or re-host the tools as your own service.</li>
        </ul>

        <h2 id="your-content">5. Your files and content</h2>
        <p>
          You keep all rights to the files and text you use with TabBench. For tools that run in your browser,
          your content is processed on your own device and is not sent to us. You are responsible for having the
          rights to anything you process and for keeping your own copies — outputs are not stored anywhere except,
          where a tool says so, in your own browser for a limited time. The{" "}
          <Link href="/privacy">privacy policy</Link> explains exactly what is stored and how to erase it.
        </p>

        <h2 id="ai">6. AI features</h2>
        <p>
          AI tools run on your device by default. If you choose a cloud mode, the text or image you submit is sent
          to Google&apos;s Gemini service to generate the result and is subject to Google&apos;s terms. Do not
          submit confidential or personal information in cloud mode. AI output can be incomplete or wrong; review
          it before you use it.
        </p>

        <h2 id="third-parties">7. Third-party services</h2>
        <p>
          Some features depend on services we do not control: live exchange rates come from public rate providers,
          speech recognition uses your browser&apos;s built-in service, and advertising is served by Google
          AdSense. Their availability and accuracy are outside our control, and their own terms apply.
        </p>

        <h2 id="ip">8. Intellectual property</h2>
        <p>
          The site&apos;s design, code, and original text — including tool explanations and guides — belong to
          TabBench. You may link to any page and quote short passages with attribution. Please do not copy pages or
          tools wholesale.
        </p>

        <h2 id="warranty">9. No warranty</h2>
        <p>
          The tools are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any
          kind, express or implied, including accuracy, fitness for a particular purpose and uninterrupted
          availability. We work to keep them correct and fix errors when they are reported, but we cannot
          guarantee that every result is error-free.
        </p>

        <h2 id="liability">10. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, TabBench and its contributors are not liable for any direct,
          indirect, incidental or consequential loss arising from your use of, or inability to use, the site or its
          tools — including loss of data, and decisions made on the basis of a result. Keep backups of files before
          processing them.
        </p>

        <h2 id="changes">11. Changes to these terms</h2>
        <p>
          We may update these terms as the site changes. The date at the top of this page shows when they last
          changed. Continuing to use TabBench after an update means you accept the revised terms.
        </p>

        <h2 id="contact">12. Contact</h2>
        <p>
          Questions about these terms can be sent through the <Link href="/contact">contact page</Link>.
        </p>
      </ProsePage>
    </>
  );
}
