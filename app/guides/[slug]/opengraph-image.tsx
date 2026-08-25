import {
  renderOgImage,
  clampForOg,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og-template";
import { GUIDES } from "@/lib/guides/content";

// Required with `output: export` — one PNG per guide, rendered at build time.
export const dynamic = "force-static";

export const alt = "TabBench guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuideOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);

  return renderOgImage({
    eyebrow: "tabbench · guide",
    title: clampForOg(guide?.title ?? "How-to guide", 62),
    subtitle: clampForOg(
      guide?.metaDescription ?? "Step-by-step, with the tool that does the job.",
      110
    ),
    footer: "Step-by-step · Free · Runs entirely in your browser",
  });
}
