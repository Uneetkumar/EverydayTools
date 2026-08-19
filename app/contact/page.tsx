import type { Metadata } from "next";
import { constructPageMetadata } from "@/lib/seo/metadata";
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
    "Get in touch with the TabBench team about a bug, a tool request, feedback, or a partnership enquiry. We read every message.",
  path: "/contact",
  keywords: ["contact tabbench", "report a bug", "request a tool", "support"],
});

export default function ContactPage() {
  return <ContactForm />;
}
