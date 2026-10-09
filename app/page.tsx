import Link from "next/link";
import { ArrowRight, Cloud, Cpu, Lock, UserX } from "lucide-react";
import {
  HIDDEN_GEM_SLUGS,
  NEW_TOOL_SLUGS,
  TOOL_CATEGORIES,
  getAllTools,
  getPopularTools,
  getToolsByCategory,
  getToolsBySlugs,
} from "@/lib/tools/registry";
import { GUIDES } from "@/lib/guides/content";
import AdSlot from "@/components/AdSlot";
import { ToolCard } from "@/components/tool/tool-card";
import { CategoryCard } from "@/components/tool/category-card";
import { HeroSearch } from "@/components/home/hero-search";
import { YourTools } from "@/components/home/your-tools";
import { ToolVisual } from "@/components/tool/tool-visual";
import { InstallAppButton } from "@/components/layout/install-app-button";
import { buildMetadata, routeSocialImage } from "@/lib/seo/metadata";
import { SEO_CONFIG } from "@/lib/seo/config";

export const metadata = buildMetadata({
  title: "TabBench – Free Online Calculators, PDF & Image Tools",
  description: SEO_CONFIG.description,
  path: "/",
  socialImage: routeSocialImage("/", "TabBench — free online tools that run in your browser"),
});

/**
 * Homepage: a place to start a task, not a catalogue.
 *
 * Server-rendered. The previous page was a single client component that
 * shipped the entire tool registry to the browser and rendered all 81 tool
 * cards; that is what /tools is for. Here the path is: search → popular →
 * categories → a few discoveries → why TabBench.
 */

const EXAMPLE_TASKS: Array<{ label: string; slug: string }> = [
  { label: "Compress an image", slug: "image-compressor" },
  { label: "Calculate GST", slug: "gst-calculator" },
  { label: "Format JSON", slug: "json-formatter" },
  { label: "Merge PDFs", slug: "pdf-merge" },
  { label: "Summarize text", slug: "ai-text-summarizer" },
];

const FEATURED_GUIDES = [
  "compress-image-to-50kb",
  "how-to-calculate-percentage-increase-and-decrease",
  "complete-guide-to-json-formatting-and-validation",
  "how-to-convert-pdf-to-word-without-losing-formatting",
  "gst-calculation-guide-inclusive-vs-exclusive",
  "voice-typing-in-hindi",
];

function SectionHeader({
  id,
  title,
  description,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="max-w-2xl">
        <h2 id={id} className="type-h2 text-foreground">
          {title}
        </h2>
        {description && <p className="mt-1.5 type-body-sm text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
          {linkLabel} <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const allTools = getAllTools();
  const popular = getPopularTools();
  const categories = TOOL_CATEGORIES.map((c) => ({ category: c, tools: getToolsByCategory(c.id) })).filter(
    (c) => c.tools.length > 0
  );
  // A short list: 34 "new" cards read as a tool dump, not a curated site.
  const newTools = getToolsBySlugs(NEW_TOOL_SLUGS).slice(0, 8);
  const gems = getToolsBySlugs(HIDDEN_GEM_SLUGS);
  const aiTools = getToolsByCategory("ai-tools");
  const guides = FEATURED_GUIDES.map((s) => GUIDES.find((g) => g.slug === s)).filter(
    (g): g is (typeof GUIDES)[number] => !!g
  );

  return (
    <div className="pb-8">
      {/* Hero ------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,var(--brand-subtle),transparent)]"
        />
        <div className="page-container relative py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur shadow-sm">
              <span className="flex size-2 rounded-full bg-emerald-500 shrink-0" />
              {/* Not "all tools": the speed test, currency rates, API tools
                  and cloud AI mode need a connection (see "Why TabBench"). */}
              <span className="hidden sm:inline">Installable app · Most tools work offline</span>
              <span className="sm:hidden">Installable · Offline-ready</span>
              <span className="text-muted-foreground/60 hidden sm:inline">·</span>
              <InstallAppButton variant="hero" className="h-6 px-2.5 text-xs" />
            </div>
            <p className="type-label text-muted-foreground">
              {allTools.length} free tools · No sign-up · Files stay on your device
            </p>
            <h1 className="mt-3 type-display text-foreground">
              Free online tools for everyday tasks
            </h1>
            <p className="mx-auto mt-4 max-w-2xl type-body text-muted-foreground md:text-lg">
              Calculators, PDF, image, text and developer tools that work right in
              your browser. Find the one you need in seconds.
            </p>
            <div className="mx-auto mt-8 max-w-2xl">
              <HeroSearch toolCount={allTools.length} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {EXAMPLE_TASKS.map((task) => (
                <Link
                  key={task.slug}
                  href={`/tools/${task.slug}`}
                  className="rounded-full border bg-card px-3 py-1 text-sm text-foreground shadow-soft transition-colors hover:border-foreground/20 hover:bg-accent"
                >
                  {task.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="page-container section-gap pt-10 md:pt-14">
        <YourTools />

        {/* Popular ------------------------------------------------------- */}
        <section aria-labelledby="popular-heading">
          <SectionHeader
            id="popular-heading"
            title="Popular tools"
            description="The tools people reach for most."
            href="/tools"
            linkLabel={`All ${allTools.length} tools`}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popular.map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} />
              </li>
            ))}
          </ul>
        </section>

        {/* Categories ---------------------------------------------------- */}
        <section aria-labelledby="categories-heading">
          <SectionHeader
            id="categories-heading"
            title="Browse by category"
            description="Pick an area to see everything it can do."
            href="/categories"
            linkLabel="All categories"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ category, tools }) => (
              <li key={category.id}>
                <CategoryCard
                  category={category}
                  toolCount={tools.length}
                  starters={getToolsBySlugs(category.popular).slice(0, 3)}
                />
              </li>
            ))}
          </ul>
        </section>

        <AdSlot placement="homepage-section" />

        {/* Discover ------------------------------------------------------ */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
          <section aria-labelledby="new-heading">
            <SectionHeader id="new-heading" title="New on TabBench" description="Recently added tools." />
            <ul className="grid gap-3">
              {newTools.map((t) => (
                <li key={t.slug}>
                  <ToolCard tool={t} compact />
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="gems-heading">
            <SectionHeader
              id="gems-heading"
              title="Useful tools you might not know about"
              description="Small utilities that save a surprising amount of time."
            />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {gems.map((t) => (
                <li key={t.slug}>
                  <ToolCard tool={t} compact />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* AI ------------------------------------------------------------ */}
        <section aria-labelledby="ai-heading" className="rounded-2xl border bg-card p-6 shadow-soft md:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <h2 id="ai-heading" className="type-h2 text-foreground">
                AI tools that keep your text private
              </h2>
              <p className="mt-3 type-body-sm text-muted-foreground">
                Most AI tools upload whatever you give them. These run on your own
                device by default, so a draft, a contract or a scanned document
                never leaves your browser. Where a cloud model is genuinely better —
                handwriting, tables, other scripts — it is an explicit, labelled
                choice, never the default.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Cpu aria-hidden="true" className="size-4" /> On-device by default</span>
                <span className="inline-flex items-center gap-1.5"><Cloud aria-hidden="true" className="size-4" /> Cloud mode is opt-in</span>
              </div>
              <Link
                href="/categories/ai-tools"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
              >
                All AI tools <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {aiTools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent/60"
                  >
                    <ToolVisual slug={t.slug} iconName={t.iconName} category={t.category} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{t.name}</span>
                      <span className="block text-sm text-muted-foreground">{t.tagline}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Guides -------------------------------------------------------- */}
        <section aria-labelledby="guides-heading">
          <SectionHeader
            id="guides-heading"
            title="Guides"
            description="Step-by-step answers to the problems these tools solve."
            href="/guides"
            linkLabel="All guides"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex h-full flex-col rounded-xl border bg-card p-4 shadow-soft transition-colors hover:border-foreground/15 hover:bg-accent/50"
                >
                  <span className="type-h4 text-foreground">{g.title}</span>
                  <span className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{g.metaDescription}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Why ----------------------------------------------------------- */}
        <section aria-labelledby="why-heading" className="border-t pt-12 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <h2 id="why-heading" className="type-h2 text-foreground">
                Why TabBench
              </h2>
              <p className="mt-3 type-body text-muted-foreground">
                TabBench is a set of focused tools for the small jobs that come up
                every day — for students, developers, office work and small
                businesses. Most tools do their work inside your browser, so the
                files and text you use them on are never uploaded. The few that
                need the internet say so on the page.
              </p>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  Icon: Lock,
                  title: "Private by design",
                  body: "Images, PDFs and text are processed on your device. There is no upload step to wait for and nothing stored on a server.",
                },
                {
                  Icon: UserX,
                  title: "No account, no limits",
                  body: "Every tool is free to use as often as you like. Favorites and history are kept in your browser, not in an account.",
                },
                {
                  Icon: Cpu,
                  title: "Fast on any device",
                  body: "Work happens locally, so results appear as you type or as soon as a file is read — and most tools keep working offline.",
                },
                {
                  Icon: Cloud,
                  title: "Honest about the network",
                  body: "Live exchange rates, speech recognition and the optional cloud AI mode need the internet. Those pages tell you exactly what is sent.",
                },
              ].map(({ Icon, title, body }) => (
                <div key={title}>
                  <dt className="flex items-center gap-2 type-h4 text-foreground">
                    <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                    {title}
                  </dt>
                  <dd className="mt-1.5 type-body-sm text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 shadow-soft">
              <h3 className="type-h4 text-foreground">Are the tools really free to use?</h3>
              <p className="mt-2 type-body-sm text-muted-foreground">
                Yes. All {allTools.length} tools are free for personal, commercial
                and educational use, with no usage limits. No account or card is
                ever required. The site is supported by advertising.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-soft">
              <h3 className="type-h4 text-foreground">Do you store or look at my files?</h3>
              <p className="mt-2 type-body-sm text-muted-foreground">
                No. Files you open in the image, PDF and document tools are read and
                processed by your own browser and are never sent to us. If you use
                the optional cloud AI mode, that tool&apos;s input is sent to Google&apos;s
                Gemini model and the page says so before you choose it.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
