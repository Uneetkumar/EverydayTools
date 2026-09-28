import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  TOOL_CATEGORIES,
  getPopularTools,
  getToolsBySlugs,
  getToolsByCategory,
} from "@/lib/tools/registry";
import { LogoMark } from "./logo";
import { InstallAppButton } from "./install-app-button";

const DEVELOPER_PICKS = ["json-formatter", "base64-converter", "jwt-decoder", "regex-tester", "uuid-generator"];

function Column({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      {/* h2: the footer is its own landmark and must not dangle under a
          page's h1/h2 outline (scripts/seo-check.mjs checks heading order). */}
      <h2 className="type-overline mb-3 text-foreground">{title}</h2>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const popular = getPopularTools().slice(0, 6);
  const developer = getToolsBySlugs(DEVELOPER_PICKS);
  const ai = getToolsByCategory("ai-tools").slice(0, 5);

  return (
    <footer className="mt-24 border-t bg-card/50">
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2 space-y-4 pr-4">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="TabBench home">
              <LogoMark />
              <span className="text-[1.0625rem] font-semibold tracking-tight">TabBench</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Everyday tools for work, study and code — calculators, PDF, image,
              text and developer utilities that run in your browser.
            </p>
            <p className="flex max-w-xs items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Files are processed on your device. Tools that need the internet
              say so on the page.
            </p>
            <InstallAppButton />
          </div>

          <Column
            title="Popular tools"
            links={popular.map((t) => ({ href: `/tools/${t.slug}`, label: t.shortName }))}
          />
          <Column
            title="Categories"
            links={[
              ...TOOL_CATEGORIES.filter((c) => getToolsByCategory(c.id).length > 0).map((c) => ({
                href: `/categories/${c.id}`,
                label: c.shortName,
              })),
            ]}
          />
          <Column
            title="Developer"
            links={developer.map((t) => ({ href: `/tools/${t.slug}`, label: t.shortName }))}
          />
          <div className="space-y-10">
            <Column
              title="AI tools"
              links={ai.map((t) => ({ href: `/tools/${t.slug}`, label: t.shortName }))}
            />
          </div>
        </div>

        <div className="mt-12 grid gap-10 border-t pt-8 md:grid-cols-[1fr_auto]">
          <nav aria-label="Company" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              ["/tools", "All tools"],
              ["/categories", "Categories"],
              ["/guides", "Guides"],
              ["/about", "About"],
              ["/editorial-policy", "Editorial policy"],
              ["/contact", "Contact"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TabBench</p>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          This site is protected by reCAPTCHA and the Google{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </div>
    </footer>
  );
}
