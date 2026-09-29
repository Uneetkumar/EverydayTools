import { serializeJsonLd } from "@/lib/seo/jsonld";

/**
 * Renders structured data. Server-rendered, so it is in the static HTML
 * crawlers fetch; `serializeJsonLd` escapes it so data cannot break out of
 * the script tag. Pass an array to emit several blocks; null entries are
 * skipped.
 */
export function JsonLd({ data }: { data: unknown }) {
  const blocks = (Array.isArray(data) ? data : [data]).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }} />
      ))}
    </>
  );
}
