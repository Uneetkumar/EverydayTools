import {
  renderOgImage,
  clampForOg,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og-template";
import { TOOL_CATEGORIES, getToolsByCategory } from "@/lib/tools/registry";

// Required with `output: export` — one PNG per category, rendered at build time.
export const dynamic = "force-static";

export const alt = "TabBench category";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOL_CATEGORIES.filter(
    (cat) => getToolsByCategory(cat.id).length > 0
  ).map((cat) => ({ category: cat.id }));
}

export default async function CategoryOpengraphImage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = TOOL_CATEGORIES.find((c) => c.id === category);
  const count = getToolsByCategory(category).length;

  return renderOgImage({
    eyebrow: "tabbench · category",
    title: meta?.name ?? "Free Online Tools",
    subtitle: clampForOg(
      meta?.description ?? "Fast, free and private browser tools.",
      110
    ),
    footer: `${count} free tool${count === 1 ? "" : "s"} · No signup · Runs in your browser`,
  });
}
