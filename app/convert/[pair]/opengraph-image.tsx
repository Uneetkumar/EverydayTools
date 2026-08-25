import {
  renderOgImage,
  clampForOg,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og-template";
import { CURRENCY_PAIRS } from "@/lib/currency/pairs";

// Required with `output: export` — one PNG per corridor, rendered at build time.
export const dynamic = "force-static";

export const alt = "TabBench currency converter";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const dynamicParams = false;

export function generateStaticParams() {
  return CURRENCY_PAIRS.map((p) => ({ pair: p.slug }));
}

export default async function ConvertOpengraphImage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const p = CURRENCY_PAIRS.find((x) => x.slug === pair);

  return renderOgImage({
    eyebrow: "tabbench · currency",
    title: p ? `${p.from} to ${p.to}` : "Currency Converter",
    subtitle: clampForOg(
      p ? `${p.common} — live mid-market rates, updated continuously.` : "Live mid-market exchange rates.",
      110
    ),
    footer: "Live rates · Free · No signup",
  });
}
